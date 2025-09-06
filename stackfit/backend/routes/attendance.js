const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const moment = require('moment');
const supabase = require('../config/supabaseClient');
const { isAdmin } = require('../middleware/authMiddleware');

// Validation middleware
const attendanceValidation = [
    body('memberId').notEmpty().isString(),
    body('date').isISO8601().toDate(),
    body('status').isIn(['present', 'absent', 'late'])
];

// Get attendance records with filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, memberId, status } = req.query;
        
        let query = supabase
            .from('attendance')
            .select(`
                *,
                members (
                    id,
                    name,
                    email,
                    membership_type
                )
            `);

        // If both dates are provided, filter by date range
        if (startDate && endDate) {
            query = query
                .gte('date', startDate)
                .lte('date', endDate);
        }
        // If only startDate is provided, filter for that specific date
        else if (startDate) {
            query = query.eq('date', startDate);
        }
        // If only endDate is provided, filter for that specific date
        else if (endDate) {
            query = query.eq('date', endDate);
        }

        if (memberId) {
            query = query.eq('member_id', memberId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        const { data: attendance, error } = await query.order('date', { ascending: false });

        if (error) throw error;

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get today's attendance
router.get('/today', async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        
        const { data: attendance, error } = await supabase
            .from('attendance')
            .select(`
                *,
                members (
                    id,
                    name,
                    email
                )
            `)
            .eq('date', today);

        if (error) throw error;

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mark attendance for a single member
router.post('/', isAdmin, attendanceValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { memberId, date, status, notes } = req.body;

        // Check if attendance already marked
        const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('member_id', memberId)
            .eq('date', date)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Attendance already marked for this date' });
        }

        const { data: attendance, error } = await supabase
            .from('attendance')
            .insert([{
                member_id: memberId,
                date,
                status,
                notes,
                marked_by: req.user.id,
                created_at: new Date()
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Bulk mark attendance
router.post('/bulk', isAdmin, async (req, res) => {
    try {
        const { date, records } = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: 'Invalid records format' });
        }

        const attendanceRecords = records.map(record => ({
            member_id: record.memberId,
            date,
            status: record.status,
            notes: record.notes,
            marked_by: req.user.id,
            created_at: new Date()
        }));

        const { data: attendance, error } = await supabase
            .from('attendance')
            .insert(attendanceRecords)
            .select();

        if (error) throw error;

        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update attendance record
router.put('/:id', isAdmin, attendanceValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updateData = {
            ...req.body,
            updated_at: new Date(),
            updated_by: req.user.id
        };

        const { data: attendance, error } = await supabase
            .from('attendance')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get attendance statistics
router.get('/stats', async (req, res) => {
    try {
        const { startDate, endDate, memberId } = req.query;
        
        let query = supabase
            .from('attendance')
            .select(`
                status,
                count(*),
                members (
                    id,
                    name
                )
            `, { count: 'exact' });

        if (startDate && endDate) {
            query = query
                .gte('date', startDate)
                .lte('date', endDate);
        }

        if (memberId) {
            query = query.eq('member_id', memberId);
        }

        const { data: stats, error } = await query
            .group('status, members.id, members.name');

        if (error) throw error;

        // Process statistics
        const processedStats = {
            total: stats.reduce((acc, curr) => acc + curr.count, 0),
            present: stats.find(s => s.status === 'present')?.count || 0,
            absent: stats.find(s => s.status === 'absent')?.count || 0,
            late: stats.find(s => s.status === 'late')?.count || 0,
            memberWise: stats.reduce((acc, curr) => {
                const member = curr.members;
                if (!acc[member.id]) {
                    acc[member.id] = {
                        name: member.name,
                        total: 0,
                        present: 0,
                        absent: 0,
                        late: 0
                    };
                }
                acc[member.id][curr.status] = curr.count;
                acc[member.id].total += curr.count;
                return acc;
            }, {})
        };

        res.json(processedStats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;