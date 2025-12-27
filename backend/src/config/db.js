import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const MONGO_URI = process.env.NODE_ENV === 'development'
    ? process.env.MONGODB_URI
    : process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        await seedAdminUser();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const seedAdminUser = async () => {
    try {
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@banking-pos.com';
        const adminMobile = process.env.ADMIN_MOBILE || '9999999999';

        if (!adminPassword) {
            console.warn('ADMIN_PASSWORD not set in environment variables');
            return;
        }

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        const adminUser = new User({
            name: 'System Admin',
            email: adminEmail,
            mobile: adminMobile,
            password: hashedPassword,
            role: 'admin',            
            branch: 'Head Office',
            isActive: true
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        console.log(`Admin Email: ${adminEmail}`);
    } catch (error) {
        console.error('Error seeding admin user:', error.message);
    }
};

export default connectDB;