const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const supabase = require('../config/supabaseClient');
const { isAdmin } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Enhanced validation middleware
const memberValidation = [
    body('name').notEmpty().trim().escape()
        .withMessage('Name is required'),
    body('email').isEmail().normalizeEmail()
        .withMessage('Valid email is required'),
    body('phone').notEmpty().trim()
        .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .withMessage('Valid phone number is required'),
    body('membershipType').isUUID()
        .withMessage('Valid membership type ID is required'),
    body('startDate').isISO8601().toDate()
        .withMessage('Valid start date is required'),
    body('address').optional().trim(),
    body('emergencyContact').isObject()
        .withMessage('Emergency contact information is required'),
    body('emergencyContact.name').notEmpty().trim()
        .withMessage('Emergency contact name is required'),
    body('emergencyContact.phone').notEmpty().trim()
        .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .withMessage('Valid emergency contact phone is required'),
    body('emergencyContact.relationship').notEmpty().trim()
        .withMessage('Emergency contact relationship is required'),
    // New fields
    body('age').optional().isInt({ min: 0, max: 120 })
        .withMessage('Age must be between 0 and 120'),
    body('gender').optional().isString().trim()
        .withMessage('Gender must be a string'),
    body('dateOfBirth').optional().isISO8601().toDate()
        .withMessage('Valid date of birth is required'),
    body('medicalHistory').optional().isString().trim()
        .withMessage('Medical history must be a string')
];

// Validation for pause membership request
const pauseMembershipValidation = [
    body('startDate').isISO8601().toDate()
        .withMessage('Valid start date is required'),
    body('endDate').isISO8601().toDate()
        .withMessage('Valid end date is required'),
    body('reason').notEmpty().trim()
        .withMessage('Reason for pause is required')
];

// Public member registration validation
const registerMemberValidation = [
    body('name').notEmpty().trim().escape()
        .withMessage('Name is required'),
    body('email').isEmail().normalizeEmail()
        .withMessage('Valid email is required'),
    body('phone').notEmpty().trim()
        .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
        .withMessage('Valid phone number is required'),
    body('password').isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

// Public member registration endpoint
router.post('/register', registerMemberValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: errors.array()[0].msg });
        }

        const { name, email, phone, password } = req.body;

        // Check if email already exists
        const { data: existingMember, error: emailCheckError } = await supabase
            .from('members')
            .select('id')
            .eq('email', email)
            .single();

        if (emailCheckError && emailCheckError.code !== 'PGRST116') {
            throw emailCheckError;
        }

        if (existingMember) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create the member record
        const { data: newMember, error } = await supabase
            .from('members')
            .insert({
                name,
                email,
                phone,
                password: hashedPassword,
                status: 'pending',
                created_at: new Date(),
                updated_at: new Date()
            })
            .select()
            .single();

        if (error) throw error;

        // Return success without the password
        const { password: _, ...memberData } = newMember;
        
        res.status(201).json({
            message: 'Registration successful',
            member: memberData
        });
    } catch (err) {
        console.error('Member registration error:', err);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Get all members with pagination and filters
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search, membershipType } = req.query;
        const offset = (page - 1) * limit;

        let query = supabase
            .from('members')
            .select(`
                *,
                memberships (
                    id,
                    name,
                    duration,
                    price
                )
            `, { count: 'exact' });

        if (status) {
            // Handle multiple status values
            const statusValues = status.split(',');
            if (statusValues.length > 1) {
                query = query.in('status', statusValues);
            } else {
                query = query.eq('status', status);
            }
        }

        if (membershipType) {
            query = query.eq('membership_type', membershipType);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        const { data: members, count, error } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Enhance member data with subscription status
        const enhancedMembers = members.map(member => ({
            ...member,
            subscriptionStatus: moment().isBefore(member.end_date) ? 'active' : 'expired',
            daysRemaining: moment(member.end_date).diff(moment(), 'days')
        }));

        res.json({
            members: enhancedMembers,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalMembers: count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export members to CSV - MUST be before the :id route
router.get('/export', isAdmin, async (req, res) => {
    try {
        const { status, search, membershipType, startDate, endDate } = req.query;

        let query = supabase
            .from('members')
            .select(`
                id,
                name,
                email,
                phone,
                address,
                status,
                start_date,
                end_date,
                created_at,
                memberships (
                    name
                )
            `);

        if (status) {
            const statusValues = status.split(',');
            if (statusValues.length > 1) {
                query = query.in('status', statusValues);
            } else {
                query = query.eq('status', status);
            }
        }

        if (membershipType) {
            query = query.eq('membership_type', membershipType);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        if (startDate) {
            query = query.gte('start_date', startDate);
        }

        if (endDate) {
            query = query.lte('end_date', endDate);
        }

        const { data: members, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            throw new Error('Failed to fetch members data');
        }

        if (!members || !Array.isArray(members)) {
            throw new Error('No members data available');
        }

        // Enhance member data
        const enhancedMembers = members.map(member => ({
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            address: member.address || 'N/A',
            membership_type: member.memberships?.name || 'N/A',
            status: member.status,
            start_date: member.start_date,
            end_date: member.end_date,
            subscription_status: moment().isBefore(member.end_date) ? 'Active' : 'Expired',
            days_remaining: moment(member.end_date).diff(moment(), 'days')
        }));

        res.json({
            success: true,
            members: enhancedMembers
        });
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to export members'
        });
    }
});

// Request to pause membership
router.post('/:id/pause', isAdmin, pauseMembershipValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const { startDate, endDate, reason } = req.body;

        // Check if member exists
        const { data: member, error: memberError } = await supabase
            .from('members')
            .select('id, end_date, is_paused, status')
            .eq('id', id)
            .single();

        if (memberError || !member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Check if member is already paused
        if (member.is_paused) {
            return res.status(400).json({ error: 'Membership is already paused' });
        }

        // Check if member's status is active
        if (member.status !== 'active') {
            return res.status(400).json({ error: 'Only active memberships can be paused' });
        }

        // Validate dates
        const start = moment(startDate);
        const end = moment(endDate);
        const today = moment();

        if (start.isBefore(today)) {
            return res.status(400).json({ error: 'Start date cannot be in the past' });
        }

        if (end.isSameOrBefore(start)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        const pauseDuration = end.diff(start, 'days');
        if (pauseDuration > 90) { // Max 3 months pause
            return res.status(400).json({ error: 'Pause duration cannot exceed 90 days' });
        }

        // Calculate new end date
        const originalEndDate = moment(member.end_date);
        const newEndDate = originalEndDate.add(pauseDuration, 'days');

        // Create pause record
        const { data: pauseRecord, error: pauseError } = await supabase
            .from('membership_pauses')
            .insert([{
                member_id: id,
                start_date: start.format('YYYY-MM-DD'),
                end_date: end.format('YYYY-MM-DD'),
                reason,
                status: 'approved', // Auto-approve for now
                original_end_date: member.end_date,
                new_end_date: newEndDate.format('YYYY-MM-DD'),
                created_by: req.user.id,
                approved_by: req.user.id
            }])
            .select()
            .single();

        if (pauseError) {
            console.error('Error creating pause record:', pauseError);
            throw new Error('Failed to create pause record');
        }

        // Update member record
        const { data: updatedMember, error: updateError } = await supabase
            .from('members')
            .update({
                is_paused: true,
                current_pause_id: pauseRecord.id,
                end_date: newEndDate.format('YYYY-MM-DD'),
                updated_by: req.user.id,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating member:', updateError);
            throw new Error('Failed to update member');
        }

        res.status(201).json({
            message: 'Membership paused successfully',
            pause: pauseRecord,
            member: updatedMember
        });
    } catch (error) {
        console.error('Pause membership error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cancel membership pause
router.post('/:id/resume', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if member exists and is paused
        const { data: member, error: memberError } = await supabase
            .from('members')
            .select('id, is_paused, current_pause_id')
            .eq('id', id)
            .single();

        if (memberError || !member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        if (!member.is_paused || !member.current_pause_id) {
            return res.status(400).json({ error: 'Membership is not currently paused' });
        }

        // Get the pause record
        const { data: pauseRecord, error: pauseError } = await supabase
            .from('membership_pauses')
            .select('*')
            .eq('id', member.current_pause_id)
            .single();

        if (pauseError || !pauseRecord) {
            return res.status(404).json({ error: 'Pause record not found' });
        }

        // Update pause record status to 'cancelled'
        const { error: updatePauseError } = await supabase
            .from('membership_pauses')
            .update({
                status: 'cancelled',
                updated_at: new Date()
            })
            .eq('id', pauseRecord.id);

        if (updatePauseError) {
            console.error('Error updating pause record:', updatePauseError);
            throw new Error('Failed to update pause record');
        }

        // Restore original end date and remove pause flag
        const { data: updatedMember, error: updateMemberError } = await supabase
            .from('members')
            .update({
                is_paused: false,
                current_pause_id: null,
                end_date: pauseRecord.original_end_date,
                updated_by: req.user.id,
                updated_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateMemberError) {
            console.error('Error updating member:', updateMemberError);
            throw new Error('Failed to update member');
        }

        res.json({
            message: 'Membership resumed successfully',
            member: updatedMember
        });
    } catch (error) {
        console.error('Resume membership error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get member's pause history
router.get('/:id/pauses', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if member exists
        const { data: member, error: memberError } = await supabase
            .from('members')
            .select('id')
            .eq('id', id)
            .single();

        if (memberError || !member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Get all pause records for this member
        const { data: pauses, error: pausesError } = await supabase
            .from('membership_pauses')
            .select(`
                *,
                created_by_admin:created_by(name),
                approved_by_admin:approved_by(name)
            `)
            .eq('member_id', id)
            .order('created_at', { ascending: false });

        if (pausesError) {
            console.error('Error fetching pause records:', pausesError);
            throw new Error('Failed to fetch pause records');
        }

        res.json(pauses || []);
    } catch (error) {
        console.error('Get pause history error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get member by ID with detailed information - MUST be after /export
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: member, error } = await supabase
            .from('members')
            .select(`
                *,
                memberships (
                    id,
                    name,
                    description,
                    duration,
                    price,
                    features
                ),
                payments (
                    id,
                    amount,
                    payment_date,
                    payment_method,
                    payment_type,
                    status
                ),
                attendance (
                    id,
                    date,
                    status
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Calculate subscription status
        const today = moment();
        const endDate = moment(member.end_date);
        member.subscriptionStatus = today.isBefore(endDate) ? 'active' : 'expired';
        member.daysRemaining = endDate.diff(today, 'days');

        // Calculate attendance statistics
        if (member.attendance) {
            const totalDays = member.attendance.length;
            const presentDays = member.attendance.filter(a => a.status === 'present').length;
            member.attendanceStats = {
                totalDays,
                presentDays,
                attendancePercentage: totalDays ? (presentDays / totalDays) * 100 : 0,
                lastAttendance: member.attendance.length > 0
                    ? moment(member.attendance[0].date).format('YYYY-MM-DD')
                    : null
            };
        }

        // Calculate payment statistics
        if (member.payments) {
            member.paymentStats = {
                totalPaid: member.payments.reduce((sum, payment) =>
                    payment.status === 'completed' ? sum + payment.amount : sum, 0),
                lastPayment: member.payments.length > 0
                    ? moment(member.payments[0].payment_date).format('YYYY-MM-DD')
                    : null,
                paymentHistory: member.payments.map(payment => ({
                    ...payment,
                    payment_date: moment(payment.payment_date).format('YYYY-MM-DD')
                }))
            };
        }

        res.json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new member with subscription
router.post('/', isAdmin, memberValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            email,
            phone,
            membershipType,
            startDate,
            address,
            emergencyContact
        } = req.body;

        // Get membership details to calculate end date
        const { data: membership, error: membershipError } = await supabase
            .from('memberships')
            .select('duration, price')
            .eq('id', membershipType)
            .single();

        if (membershipError || !membership) {
            return res.status(400).json({ error: 'Invalid membership type' });
        }

        // Calculate end date based on membership duration
        const endDate = moment(startDate).add(membership.duration, 'months').format('YYYY-MM-DD');

        // Create member record
        const { data: member, error: memberError } = await supabase
            .from('members')
            .insert([{
                name,
                email,
                phone,
                membership_type: membershipType,
                start_date: startDate,
                end_date: endDate,
                address,
                emergency_contact: emergencyContact,
                status: 'pending_payment', // Changed from 'active' to indicate payment is needed
                created_by: req.user.id,
                created_at: new Date()
            }])
            .select()
            .single();

        if (memberError) throw memberError;

        res.status(201).json({
            member,
            message: 'Member created successfully. Please record their payment to activate the membership.',
            membership: {
                duration: membership.duration,
                price: membership.price
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update member
router.put('/:id', isAdmin, memberValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_by: req.user.id,
            updated_at: new Date()
        };

        // If membership type is being updated, recalculate end date
        if (updateData.membershipType && updateData.startDate) {
            const { data: membership } = await supabase
                .from('memberships')
                .select('duration')
                .eq('id', updateData.membershipType)
                .single();

            if (membership) {
                updateData.end_date = moment(updateData.startDate)
                    .add(membership.duration, 'months')
                    .format('YYYY-MM-DD');
            }
        }

        const { data: member, error } = await supabase
            .from('members')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        res.json(member);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete member
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if member has any payments or attendance records
        const { data: records } = await supabase
            .from('members')
            .select(`
                payments (id),
                attendance (id)
            `)
            .eq('id', id)
            .single();

        if (records && (records.payments?.length || records.attendance?.length)) {
            return res.status(400).json({
                error: 'Cannot delete member with existing payment or attendance records',
                hasPayments: records.payments?.length > 0,
                hasAttendance: records.attendance?.length > 0
            });
        }

        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Member deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get member's attendance history
router.get('/:id/attendance', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.query;

        let query = supabase
            .from('attendance')
            .select('*')
            .eq('member_id', id);

        if (startDate && endDate) {
            query = query
                .gte('date', startDate)
                .lte('date', endDate);
        }

        const { data: attendance, error } = await query
            .order('date', { ascending: false });

        if (error) throw error;

        // Calculate attendance statistics
        const stats = {
            totalDays: attendance.length,
            presentDays: attendance.filter(a => a.status === 'present').length,
            lateDays: attendance.filter(a => a.status === 'late').length,
            absentDays: attendance.filter(a => a.status === 'absent').length
        };

        stats.attendancePercentage = stats.totalDays
            ? ((stats.presentDays + stats.lateDays) / stats.totalDays) * 100
            : 0;

        res.json({
            attendance,
            stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get member's payment history
router.get('/:id/payments', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: payments, error } = await supabase
            .from('payments')
            .select('*')
            .eq('member_id', id)
            .order('payment_date', { ascending: false });

        if (error) throw error;

        // Calculate payment statistics
        const stats = {
            totalAmount: payments.reduce((sum, payment) =>
                payment.status === 'completed' ? sum + payment.amount : sum, 0),
            completedPayments: payments.filter(p => p.status === 'completed').length,
            pendingPayments: payments.filter(p => p.status === 'pending').length,
            lastPaymentDate: payments.length > 0 ? payments[0].payment_date : null
        };

        res.json({
            payments,
            stats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
