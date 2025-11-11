import express from 'express';
import adminAuth from '../middleware/adminAuth.js';
import User from '../models/user.js';

const router = express.Router();

// Get all users (except super admin)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find(
            { email: { $ne: 'super_admin@tekton.com' } },
            { password: 0 } // Exclude password from results
        );
        res.json(users);
    } catch (error) {
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
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// Get system overview
router.get('/overview', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ email: { $ne: 'super_admin@tekton.com' } });
        const recentUsers = await User.find({ email: { $ne: 'super_admin@tekton.com' } })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('-password');

        res.json({
            totalUsers,
            recentUsers,
            systemStatus: {
                status: 'healthy',
                lastChecked: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching system overview' });
    }
});

export default router;