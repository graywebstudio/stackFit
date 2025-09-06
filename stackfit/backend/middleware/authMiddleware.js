// middleware/authMiddleware.js 
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token.' });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
};

// New middleware for role-based access control
const hasPermission = (permissionName) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        try {
            // If admin, automatically grant all permissions
            if (req.user.role === 'admin') {
                return next();
            }

            // For other roles, check specific permissions
            const { data: permissions, error } = await supabase
                .from('role_permissions')
                .select('permissions:permission_id(name)')
                .eq('role', req.user.role)
                .contains('permissions.name', permissionName);

            if (error) {
                console.error('Permission check error:', error);
                return res.status(500).json({ error: 'Failed to verify permissions.' });
            }

            if (!permissions || permissions.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied. You do not have the required permissions.',
                    requiredPermission: permissionName
                });
            }

            next();
        } catch (error) {
            console.error('Permission middleware error:', error);
            return res.status(500).json({ error: 'Internal server error during permission check.' });
        }
    };
};

// Middleware to check multiple permissions (ANY match)
const hasAnyPermission = (permissionNames) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        try {
            // If admin, automatically grant all permissions
            if (req.user.role === 'admin') {
                return next();
            }

            // For other roles, check if they have any of the specified permissions
            const { data: permissions, error } = await supabase
                .from('role_permissions')
                .select('permissions:permission_id(name)')
                .eq('role', req.user.role);

            if (error) {
                console.error('Permission check error:', error);
                return res.status(500).json({ error: 'Failed to verify permissions.' });
            }

            if (!permissions || permissions.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied. You do not have any of the required permissions.',
                    requiredPermissions: permissionNames
                });
            }

            // Check if user has any of the required permissions
            const userPermissions = permissions.map(p => p.permissions?.name).filter(Boolean);
            const hasPermission = permissionNames.some(perm => userPermissions.includes(perm));

            if (!hasPermission) {
                return res.status(403).json({ 
                    error: 'Access denied. You do not have any of the required permissions.',
                    requiredPermissions: permissionNames,
                    userPermissions
                });
            }

            next();
        } catch (error) {
            console.error('Permission middleware error:', error);
            return res.status(500).json({ error: 'Internal server error during permission check.' });
        }
    };
};

// Middleware to check multiple permissions (ALL must match)
const hasAllPermissions = (permissionNames) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        try {
            // If admin, automatically grant all permissions
            if (req.user.role === 'admin') {
                return next();
            }

            // For other roles, check if they have all of the specified permissions
            const { data: permissions, error } = await supabase
                .from('role_permissions')
                .select('permissions:permission_id(name)')
                .eq('role', req.user.role);

            if (error) {
                console.error('Permission check error:', error);
                return res.status(500).json({ error: 'Failed to verify permissions.' });
            }

            if (!permissions || permissions.length === 0) {
                return res.status(403).json({ 
                    error: 'Access denied. You do not have all required permissions.',
                    requiredPermissions: permissionNames
                });
            }

            // Check if user has all of the required permissions
            const userPermissions = permissions.map(p => p.permissions?.name).filter(Boolean);
            const hasAllPermissions = permissionNames.every(perm => userPermissions.includes(perm));

            if (!hasAllPermissions) {
                return res.status(403).json({ 
                    error: 'Access denied. You do not have all required permissions.',
                    requiredPermissions: permissionNames,
                    userPermissions
                });
            }

            next();
        } catch (error) {
            console.error('Permission middleware error:', error);
            return res.status(500).json({ error: 'Internal server error during permission check.' });
        }
    };
};

module.exports = {
    authenticateToken,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
};