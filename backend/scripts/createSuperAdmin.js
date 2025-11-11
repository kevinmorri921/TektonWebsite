import bcrypt from 'bcryptjs';
import User from '../models/user.js';
import { connect } from '../config/db.js';

const createSuperAdmin = async () => {
    try {
        await connect();
        
        const superAdminEmail = 'super_admin@tekton.com';
        
        // Check if super admin already exists
        const existingAdmin = await User.findOne({ email: superAdminEmail });
        if (existingAdmin) {
            console.log('✅ Super admin already exists');
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
        console.log('✅ Super admin created successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating super admin:', error);
        process.exit(1);
    }
};

createSuperAdmin();
