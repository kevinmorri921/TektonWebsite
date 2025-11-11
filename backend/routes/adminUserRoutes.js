import express from 'express';
import bcrypt from 'bcryptjs';
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

// Toggle user active status
router.put('/users/:userId/toggle-status', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { active } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.email === 'super_admin@tekton.com') {
            return res.status(403).json({ message: 'Cannot modify super admin account status' });
        }

        user.active = active;
        await user.save();

        res.json({ 
            message: `User ${active ? 'activated' : 'deactivated'} successfully`,
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ message: 'Error updating user status' });
    }
});

// Update user details
router.put('/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, fullname, password } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.email === 'super_admin@tekton.com') {
            return res.status(403).json({ message: 'Cannot modify super admin account' });
        }

        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        if (fullname) {
            user.fullname = fullname;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({ 
            message: 'User updated successfully',
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error fetching system overview' });
    }
});

// Update user details
router.put('/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { email, fullname, password } = req.body;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.email === 'super_admin@tekton.com') {
            return res.status(403).json({ message: 'Cannot modify super admin account' });
        }

        // Check if new email already exists
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        if (fullname) {
            user.fullname = fullname;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({ 
            message: 'User updated successfully',
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

export default router;