const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const supabase = require('../config/supabaseClient');
const stripe = require('../config/stripeConfig');
const { isAdmin } = require('../middleware/authMiddleware');
const emailService = require('../config/emailService');

// Validation middleware
const paymentValidation = [
    body('memberId').notEmpty().isString(),
    body('amount').isFloat({ min: 0 }),
    body('paymentDate').isISO8601().toDate(),
    body('paymentMethod').isIn(['cash', 'card', 'upi', 'bank_transfer', 'stripe']),
    body('paymentType').isIn(['membership_fee', 'registration_fee', 'other'])
];

// Create Stripe payment intent
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, memberId, membershipType } = req.body;

        // Create a payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Stripe expects amount in cents
            currency: 'usd',
            payment_method_types: ['card'],
            metadata: {
                memberId,
                membershipType,
                paymentType: 'membership_fee'
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Stripe payment intent error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook to handle Stripe events
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            const { memberId, membershipType, paymentType } = paymentIntent.metadata;

            // Record payment in database
            const { data: payment, error } = await supabase
                .from('payments')
                .insert([{
                    member_id: memberId,
                    amount: paymentIntent.amount / 100, // Convert back from cents
                    payment_date: new Date(),
                    payment_method: 'stripe',
                    payment_type: paymentType,
                    status: 'completed',
                    stripe_payment_id: paymentIntent.id,
                    created_at: new Date()
                }])
                .select()
                .single();

            if (error) throw error;

            // Update member's subscription if it's a membership payment
            if (paymentType === 'membership_fee') {
                const { data: membership } = await supabase
                    .from('members')
                    .select('end_date')
                    .eq('id', memberId)
                    .single();

                const newEndDate = moment(membership.end_date).isValid() && moment(membership.end_date).isAfter(moment()) 
                    ? moment(membership.end_date).add(1, 'month')
                    : moment().add(1, 'month');

                await supabase
                    .from('members')
                    .update({
                        end_date: newEndDate.format('YYYY-MM-DD'),
                        updated_at: new Date()
                    })
                    .eq('id', memberId);
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all payments with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, memberId, status, paymentType, search } = req.query;
        
        let query = supabase
            .from('payments')
            .select('*, members:member_id(id, name, email)');

        if (startDate && endDate) {
            query = query
                .gte('payment_date', startDate)
                .lte('payment_date', endDate);
        }

        if (memberId) {
            query = query.eq('member_id', memberId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (paymentType) {
            query = query.eq('payment_type', paymentType);
        }

        if (search) {
            query = query.or(`payment_method.ilike.%${search}%,payment_type.ilike.%${search}%`);
        }

        const { data, error } = await query.order('payment_date', { ascending: false });

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        // If there's a search term, also filter by member name/email in memory
        // since we can't search across joined tables in Supabase
        let filteredPayments = data || [];
        if (search && filteredPayments.length > 0) {
            const searchLower = search.toLowerCase();
            filteredPayments = filteredPayments.filter(payment => 
                payment.members?.name?.toLowerCase().includes(searchLower) ||
                payment.members?.email?.toLowerCase().includes(searchLower) ||
                payment.payment_method?.toLowerCase().includes(searchLower) ||
                payment.payment_type?.toLowerCase().includes(searchLower)
            );
        }

        res.json({ payments: filteredPayments });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Record new payment
router.post('/', isAdmin, paymentValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            memberId,
            amount,
            paymentDate,
            paymentMethod,
            paymentType,
            notes,
            subscriptionMonths = 1
        } = req.body;

        const { data: payment, error } = await supabase
            .from('payments')
            .insert([{
                member_id: memberId,
                amount,
                payment_date: paymentDate,
                payment_method: paymentMethod,
                payment_type: paymentType,
                notes,
                status: 'completed',
                recorded_by: req.user.id,
                created_at: new Date()
            }])
            .select()
            .single();

        if (error) throw error;

        // Update member's subscription end date and status if it's a membership payment
        if (paymentType === 'membership_fee') {
            const { data: member } = await supabase
                .from('members')
                .select('end_date, status')
                .eq('id', memberId)
                .single();

            const newEndDate = moment(member.end_date).isValid() && moment(member.end_date).isAfter(moment()) 
                ? moment(member.end_date).add(subscriptionMonths, 'months')
                : moment().add(subscriptionMonths, 'months');

            const { error: updateError } = await supabase
                .from('members')
                .update({
                    end_date: newEndDate.format('YYYY-MM-DD'),
                    status: 'active', // Update status to active when payment is recorded
                    updated_at: new Date()
                })
                .eq('id', memberId);

            if (updateError) throw updateError;
        }

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// IMPORTANT: Add specific path routes before parameter routes
// Get payment statistics
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        let query = supabase
            .from('payments')
            .select(`
                payment_type,
                payment_method,
                amount
            `);

        if (startDate && endDate) {
            query = query
                .gte('payment_date', startDate)
                .lte('payment_date', endDate);
        }

        const { data: payments, error } = await query;

        if (error) throw error;

        const stats = {
            totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
            byPaymentType: payments.reduce((acc, payment) => {
                acc[payment.payment_type] = (acc[payment.payment_type] || 0) + payment.amount;
                return acc;
            }, {}),
            byPaymentMethod: payments.reduce((acc, payment) => {
                acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
                return acc;
            }, {})
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get due payments
router.get('/due', async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        
        const { data: members, error } = await supabase
            .from('members')
            .select(`
                id,
                name,
                email,
                end_date,
                membership_type,
                payments (
                    payment_date,
                    amount,
                    payment_type
                )
            `)
            .lte('end_date', today);

        if (error) throw error;

        const duePayments = members.map(member => ({
            memberId: member.id,
            name: member.name,
            email: member.email,
            membershipType: member.membership_type,
            endDate: member.end_date,
            daysOverdue: moment(today).diff(moment(member.end_date), 'days'),
            lastPayment: member.payments.length > 0 
                ? member.payments.sort((a, b) => moment(b.payment_date).diff(moment(a.payment_date)))[0]
                : null
        }));

        res.json(duePayments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get upcoming renewals
router.get('/upcoming-renewals', async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        const thirtyDaysFromNow = moment().add(30, 'days').format('YYYY-MM-DD');
        
        const { data: members, error } = await supabase
            .from('members')
            .select(`
                id,
                name,
                email,
                end_date,
                membership_type
            `)
            .gte('end_date', today)
            .lte('end_date', thirtyDaysFromNow);

        if (error) throw error;

        const upcomingRenewals = members.map(member => ({
            memberId: member.id,
            name: member.name,
            email: member.email,
            membershipType: member.membership_type,
            endDate: member.end_date,
            daysUntilRenewal: moment(member.end_date).diff(moment(today), 'days')
        }));

        res.json(upcomingRenewals);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export payments to CSV
router.get('/export', async (req, res) => {
    try {
        // Use the same logic as the main GET route to ensure compatibility
        const { startDate, endDate, memberId, status, paymentType } = req.query;
        
        // Build the query
        let query = supabase
            .from('payments')
            .select('*, members:member_id(id, name, email)');

        // Apply filters
        if (startDate && endDate) {
            query = query
                .gte('payment_date', startDate)
                .lte('payment_date', endDate);
        }

        if (memberId) {
            query = query.eq('member_id', memberId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (paymentType) {
            query = query.eq('payment_type', paymentType);
        }

        // Execute the query with order
        const { data, error } = await query.order('payment_date', { ascending: false });

        if (error) {
            console.error('Supabase query error:', error);
            throw error;
        }

        // Transform the data if needed
        const payments = data || [];
        
        res.json({ payments });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ 
            error: error.message,
            details: error.stack,
            hint: 'Check Supabase connection and query syntax'
        });
    }
});

// Send notifications to members with due payments
router.post('/send-due-notifications', isAdmin, async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        
        // Get members with expired memberships
        const { data: overdueMembers, error: overdueError } = await supabase
            .from('members')
            .select('id, name, email, phone, end_date')
            .lte('end_date', today)
            .eq('status', 'active'); // Only active members who haven't been updated to inactive yet

        if (overdueError) throw overdueError;

        // Get members with upcoming renewals (within next 7 days)
        const sevenDaysFromNow = moment().add(7, 'days').format('YYYY-MM-DD');
        
        const { data: upcomingMembers, error: upcomingError } = await supabase
            .from('members')
            .select('id, name, email, phone, end_date')
            .gt('end_date', today)
            .lte('end_date', sevenDaysFromNow)
            .eq('status', 'active');

        if (upcomingError) throw upcomingError;

        // Send notifications
        const notificationResults = {
            overdue: {
                total: overdueMembers?.length || 0,
                sent: 0,
                failed: 0,
                members: []
            },
            upcoming: {
                total: upcomingMembers?.length || 0,
                sent: 0,
                failed: 0,
                members: []
            }
        };

        // Process overdue members
        if (overdueMembers && overdueMembers.length > 0) {
            for (const member of overdueMembers) {
                try {
                    const daysOverdue = moment(today).diff(moment(member.end_date), 'days');
                    
                    // Send email notification
                    await emailService.sendOverdueNotification(member, member.end_date, daysOverdue);
                    
                    notificationResults.overdue.sent++;
                    notificationResults.overdue.members.push({
                        id: member.id,
                        name: member.name,
                        email: member.email,
                        daysOverdue
                    });
                } catch (error) {
                    console.error(`Failed to send overdue notification to ${member.email}:`, error);
                    notificationResults.overdue.failed++;
                }
            }
        }

        // Process upcoming renewals
        if (upcomingMembers && upcomingMembers.length > 0) {
            for (const member of upcomingMembers) {
                try {
                    const daysUntilRenewal = moment(member.end_date).diff(moment(today), 'days');
                    
                    // Send email notification
                    await emailService.sendRenewalNotification(member, member.end_date, daysUntilRenewal);
                    
                    notificationResults.upcoming.sent++;
                    notificationResults.upcoming.members.push({
                        id: member.id,
                        name: member.name,
                        email: member.email,
                        daysUntilRenewal
                    });
                } catch (error) {
                    console.error(`Failed to send renewal notification to ${member.email}:`, error);
                    notificationResults.upcoming.failed++;
                }
            }
        }

        // Update notification_sent field for all members who received notifications
        const memberIdsToUpdate = [
            ...notificationResults.overdue.members.map(m => m.id),
            ...notificationResults.upcoming.members.map(m => m.id)
        ];
        
        if (memberIdsToUpdate.length > 0) {
            await supabase
                .from('members')
                .update({
                    last_notification_sent: new Date().toISOString()
                })
                .in('id', memberIdsToUpdate);
        }

        res.json({
            success: true,
            results: notificationResults
        });
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// IMPORTANT: Put parameter routes after specific routes
// Get payment by ID with detailed information
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get the payment details
        const { data: payment, error } = await supabase
            .from('payments')
            .select('*, members:member_id(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        // Get member's subscription information
        const { data: member, memberError } = await supabase
            .from('members')
            .select('start_date, end_date, membership_type')
            .eq('id', payment.member_id)
            .single();

        if (memberError) throw memberError;

        // If member doesn't have start_date, use their created_at or a fallback date
        const startDate = member.start_date 
            ? moment(member.start_date) 
            : (payment.members.created_at 
                ? moment(payment.members.created_at) 
                : moment().subtract(30, 'days'));
        
        // If member doesn't have end_date, use a date 30 days after start_date
        const endDate = member.end_date 
            ? moment(member.end_date) 
            : moment(startDate).add(30, 'days');

        // Get member's payment history
        const { data: paymentHistory, historyError } = await supabase
            .from('payments')
            .select('id, amount, payment_date, payment_method, payment_type, status')
            .eq('member_id', payment.member_id)
            .order('payment_date', { ascending: false })
            .limit(5);

        if (historyError) throw historyError;

        // Format payment history dates
        const formattedPaymentHistory = paymentHistory.map(item => ({
            ...item,
            payment_date: item.payment_date ? moment(item.payment_date).format('YYYY-MM-DD') : null
        }));

        // Calculate subscription period information
        const today = moment();
        const totalDays = endDate.diff(startDate, 'days');
        const elapsedDays = today.diff(startDate, 'days');
        const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)).toFixed(1);

        // Add membership_type to payment.members if it doesn't exist
        if (payment.members && !payment.members.membership_type && member.membership_type) {
            payment.members.membership_type = member.membership_type;
        }

        // Construct response with subscription period information
        const response = {
            ...payment,
            subscription_period: {
                start_date: startDate.format('YYYY-MM-DD'),
                end_date: endDate.format('YYYY-MM-DD'),
                total_days: totalDays,
                elapsed_days: elapsedDays,
                days_remaining: endDate.diff(today, 'days'),
                progress: parseFloat(progress),
                is_active: today.isBefore(endDate)
            },
            payment_history: formattedPaymentHistory
        };

        res.json(response);
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;