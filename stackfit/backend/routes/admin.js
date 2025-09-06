const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const supabase = require('../config/supabaseClient');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Get dashboard statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        // Get active members count
        const { count: activeMembers } = await supabase
            .from('members')
            .select('*', { count: 'exact' })
            .eq('status', 'active');

        // Get new members this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { count: newMembersThisMonth } = await supabase
            .from('members')
            .select('*', { count: 'exact' })
            .gte('created_at', startOfMonth.toISOString());

        // Get revenue (from payments this month)
        const { data: payments } = await supabase
            .from('payments')
            .select('amount')
            .gte('payment_date', startOfMonth.toISOString());
        
        const revenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

        // Get attendance rate
        const { data: attendanceRecords } = await supabase
            .from('attendance')
            .select('status')
            .gte('date', startOfMonth.toISOString());

        const totalAttendance = attendanceRecords?.length || 0;
        const presentCount = attendanceRecords?.filter(record => record.status === 'present').length || 0;
        const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

        // Get demographics
        const { data: members } = await supabase
            .from('members')
            .select('gender')
            .eq('status', 'active');

        const male = members?.filter(m => m.gender?.toLowerCase() === 'male').length || 0;
        const female = members?.filter(m => m.gender?.toLowerCase() === 'female').length || 0;
        const total = members?.length || 0;

        res.json({
            activeMembers,
            newMembersThisMonth,
            revenue,
            attendanceRate,
            demographics: {
                male,
                female,
                total
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    }
});

// Get all membership types with active member counts
router.get('/memberships/stats', authenticateToken, async (req, res) => {
    try {
        // Get all membership types
        const { data: memberships, error } = await supabase
            .from('memberships')
            .select(`
                id,
                name,
                price,
                members!inner (id)
            `);

        if (error) throw error;

        const membershipStats = memberships.map(membership => ({
            id: membership.id,
            name: membership.name,
            price: membership.price,
            active_count: membership.members?.length || 0
        }));

        res.json(membershipStats);
    } catch (error) {
        console.error('Membership stats error:', error);
        res.status(500).json({ error: 'Failed to fetch membership statistics' });
    }
});

// Get upcoming events
router.get('/events', authenticateToken, async (req, res) => {
    try {
        const today = new Date();
        const { data: events, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', today.toISOString())
            .order('date', { ascending: true })
            .limit(10);

        if (error) throw error;

        res.json(events || []);
    } catch (error) {
        console.error('Events error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Admin Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get admin from database
        const { data: admin, error } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, admin.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: admin.id, 
                email: admin.email, 
                role: 'admin' 
            },
            process.env.JWT_SECRET || 'supersecretkey',
            { expiresIn: '24h' }
        );

        res.json({ 
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                name: admin.name
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register new admin (protected route)
router.post('/register', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if admin already exists
        const { data: existingAdmin } = await supabase
            .from('admins')
            .select('id')
            .eq('email', email)
            .single();

        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new admin
        const { data: newAdmin, error } = await supabase
            .from('admins')
            .insert([
                {
                    email,
                    password: hashedPassword,
                    name
                }
            ])
            .select('id, email, name')
            .single();

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json(newAdmin);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get admin profile
router.get('/profile', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { data: admin, error } = await supabase
            .from('admins')
            .select('id, email, name')
            .eq('id', req.user.id)
            .single();

        if (error) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        res.json(admin);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 