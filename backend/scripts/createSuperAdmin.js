import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import connectDB from '../config/db.js';
import logger from '../logger.js';

const createSuperAdmin = async () => {
    try {
        await connectDB();
        
        const superAdminEmail = 'super_admin@tekton.com';
        
        // Check if super admin already exists
        const existingAdmin = await User.findOne({ email: superAdminEmail });
        if (existingAdmin) {
            logger.info('✅ Super admin already exists');
            process.exit(0);
        }

        // Create super admin if doesn't exist
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const superAdmin = new User({
            email: superAdminEmail,
            password: hashedPassword,
            fullname: 'Super Admin',
            isAdmin: true
        });

        await superAdmin.save();
        logger.info('✅ Super admin created successfully');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error creating super admin: %o', error);
        process.exit(1);
    }
};

createSuperAdmin();
