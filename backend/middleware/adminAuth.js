import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const adminAuth = async (req, res, next) => {
    try {
        console.log('🔒 [ADMIN AUTH] Starting admin verification');
        
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ [ADMIN AUTH] No token provided in headers');
            return res.status(401).json({ message: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        console.log('🎟️ [ADMIN AUTH] Token found in headers');
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'devSecretKey123');
        console.log('✅ [ADMIN AUTH] Token verified successfully');
        
        // Get user from database
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('❌ [ADMIN AUTH] User not found in database');
            return res.status(401).json({ message: 'User not found' });
        }
        console.log('👤 [ADMIN AUTH] Found user:', user.email);

        // Check if user is super admin
        console.log('🔍 [ADMIN AUTH] Checking admin access for:', user.email);
        if (user.email !== 'super_admin@tekton.com') {
            console.log('❌ [ADMIN AUTH] Access denied - not super admin');
            return res.status(403).json({ message: 'Admin access required' });
        }

        console.log('✅ [ADMIN AUTH] Super admin access granted for:', user.email);
        // Add user to request object
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

export default adminAuth;