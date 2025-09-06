const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabaseClient');
const { isAdmin } = require('../middleware/authMiddleware');

// Validation middleware
const membershipValidation = [
    body('name').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('duration').isInt({ min: 1 }),
    body('price').isFloat({ min: 0 }),
    body('features').isArray(),
    body('status').isIn(['active', 'inactive'])
];

// Get all membership types
router.get('/', isAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = supabase
            .from('memberships')
            .select('*');

        if (status) {
            query = query.eq('status', status);
        }

        const { data: memberships, error } = await query.order('price', { ascending: true });

        if (error) throw error;

        res.json(memberships);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get membership type by ID
router.get('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { data: membership, error } = await supabase
            .from('memberships')
            .select(`
                *,
                members (
                    id,
                    name
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!membership) {
            return res.status(404).json({ error: 'Membership type not found' });
        }

        res.json(membership);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new membership type
router.post('/', isAdmin, membershipValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            name,
            description,
            duration,
            price,
            features,
            status = 'active'
        } = req.body;

        // Check if membership type with same name exists
        const { data: existing } = await supabase
            .from('memberships')
            .select('id')
            .eq('name', name)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'Membership type with this name already exists' });
        }

        const { data: membership, error } = await supabase
            .from('memberships')
            .insert([{
                name,
                description,
                duration,
                price,
                features,
                status,
                created_by: req.user.id,
                created_at: new Date()
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(membership);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update membership type
router.put('/:id', isAdmin, membershipValidation, async (req, res) => {
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

        // Check if new name conflicts with existing membership types
        if (updateData.name) {
            const { data: existing } = await supabase
                .from('memberships')
                .select('id')
                .eq('name', updateData.name)
                .neq('id', id)
                .single();

            if (existing) {
                return res.status(400).json({ error: 'Membership type with this name already exists' });
            }
        }

        const { data: membership, error } = await supabase
            .from('memberships')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!membership) {
            return res.status(404).json({ error: 'Membership type not found' });
        }

        res.json(membership);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete membership type
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if membership type is being used by any members
        const { data: members } = await supabase
            .from('members')
            .select('id')
            .eq('membership_type', id);

        if (members && members.length > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete membership type as it is being used by members',
                memberCount: members.length
            });
        }

        const { error } = await supabase
            .from('memberships')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ message: 'Membership type deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get membership type statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const { data: memberships, error: membershipError } = await supabase
            .from('memberships')
            .select(`
                id,
                name,
                members (
                    id,
                    status
                )
            `);

        if (membershipError) throw membershipError;

        const stats = memberships.map(membership => ({
            id: membership.id,
            name: membership.name,
            totalMembers: membership.members.length,
            activeMembers: membership.members.filter(m => m.status === 'active').length
        }));

        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
