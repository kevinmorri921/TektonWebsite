import express from 'express';
import bcrypt from 'bcryptjs';
import adminAuth from '../middleware/adminAuth.js';
import User from '../models/user.js';
import logger, { scrub } from '../logger.js';

const router = express.Router();

// Get all users (except super admin)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find(
            { email: { $ne: 'super_admin@tekton.com' } },
            { password: 0 }
        );
        logger.info('[ADMIN USERS] Fetched %d users for admin=%s', users.length, req.user?.id);
        res.json(users);
    } catch (error) {
        logger.error('[ADMIN USERS] Error fetching users: %o', error);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

// Delete user
router.delete('/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const userToDelete = await User.findById(userId);

        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToDelete.email === 'super_admin@tekton.com') {
            return res.status(403).json({ message: 'Cannot delete super admin account' });
        }

        await User.findByIdAndDelete(userId);
        logger.info('[ADMIN USERS] User deleted userId=%s by admin=%s', userId, req.user?.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// System overview
router.get('/overview', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ email: { $ne: 'super_admin@tekton.com' } });
        const recentUsers = await User.find({ email: { $ne: 'super_admin@tekton.com' } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-password');

        logger.info('[ADMIN OVERVIEW] Admin %s requested system overview', req.user?.id);
        res.json({
            totalUsers,
            recentUsers,
            systemStatus: {
                status: 'healthy',
                lastChecked: new Date(),
            },
        });
    } catch (error) {
        logger.error('[ADMIN OVERVIEW] Error fetching system overview: %o', error);
        res.status(500).json({ message: 'Error fetching system overview' });
    }
});

// Toggle user active status
router.put('/users/:userId/toggle-status', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { active } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            logger.warn('[ADMIN USERS] Toggle status - user not found userId=%s', userId);
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.email === 'super_admin@tekton.com') {
            logger.warn('[ADMIN USERS] Attempt to modify super admin status by admin=%s', req.user?.id);
            return res.status(403).json({ message: 'Cannot modify super admin status' });
        }

        user.isEnabled = active;
        await user.save();

        logger.info('[ADMIN USERS] User status toggled userId=%s by admin=%s active=%s', userId, req.user?.id, active);
        res.json({ 
            message: `User ${active ? 'activated' : 'deactivated'} successfully`,
            user: { ...user._doc, password: undefined }
        });
    } catch (error) {
        logger.error('[ADMIN USERS] Error updating user status: %o', error);
        res.status(500).json({ message: 'Error updating user status' });
    }
});

// Update user info (email, fullname, password)
router.put('/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, fullname, password } = req.body;
        
        const user = await User.findById(userId);
        if (!user) {
            logger.warn('[ADMIN USERS] Update user - not found userId=%s', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.email === 'super_admin@tekton.com') {
            logger.warn('[ADMIN USERS] Attempt to modify super admin account by admin=%s', req.user?.id);
            return res.status(403).json({ message: 'Cannot modify super admin account' });
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) return res.status(400).json({ message: 'Email already in use' });
            user.email = email;
        }

        if (fullname) user.fullname = fullname;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        logger.info('[ADMIN USERS] User updated userId=%s by admin=%s', userId, req.user?.id);
        res.json({ 
            message: 'User updated successfully',
            user: { ...user._doc, password: undefined }
        });

    } catch (error) {
        logger.error('[ADMIN USERS] Error updating user: %o', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// ⭐ NEW: Update user role (admin → encoder | researcher | admin)
router.put('/users/:userId/role', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    logger.info('🔹 Role update request: %o by admin=%s', { userId, role }, req.user?.id);

    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    // Make sure enum matches your Mongoose schema
    const allowedRoles = ["admin", "encoder", "researcher"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

        const user = await User.findById(userId);
    if (!user) {
            logger.warn('[ADMIN USERS] Role update - user not found userId=%s', userId);
            return res.status(404).json({ message: 'User not found' });
    }

    if (user.email === 'super_admin@tekton.com') {
      return res.status(403).json({ message: 'Cannot modify super admin role' });
    }

    // Update role
    user.role = role;
    user.isAdmin = role === 'admin';

    // Save with options to force update
    const savedUser = await user.save();
    logger.info('✅ Role updated successfully for userId=%s to role=%s by admin=%s', savedUser._id, role, req.user?.id);

    return res.json({
      message: `User role updated to ${role}`,
      user: { ...savedUser._doc, password: undefined }
    });

  } catch (error) {
        logger.error('[ADMIN USERS] Error updating user role: %o', error);
        res.status(500).json({ message: 'Error updating user role', error: error.message });
  }
});
export default router;
