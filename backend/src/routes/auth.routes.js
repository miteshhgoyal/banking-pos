import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /api/auth/signup - Register new agent/user
router.post('/signup', async (req, res) => {
    try {
        const { name, email, mobile, password, role, branch, assignedArea } = req.body;

        // Validation
        if (!name || !email || !mobile || !password || !branch) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, email, mobile, password, branch'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { mobile }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email already registered'
                    : 'Mobile number already registered'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            mobile,
            password,
            role: role || 'agent',
            branch,
            assignedArea: assignedArea || null
        });

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET || 'banking-pos-secret-key-2025',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    role: user.role,
                    branch: user.branch,
                    assignedArea: user.assignedArea
                },
                token
            }
        });
    } catch (error) {
        console.error('Signup Error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating account. Please try again.'
        });
    }
});

// POST /api/auth/login - Login user with device binding
router.post('/login', async (req, res) => {
    try {
        const { email, password, deviceId } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated. Please contact administrator.'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Device binding check for agents
        if (user.role === 'agent' && deviceId) {
            if (user.deviceId && user.deviceId !== deviceId) {
                return res.status(403).json({
                    success: false,
                    message: 'This account is bound to another device. Please contact your supervisor.',
                    deviceBound: true
                });
            }

            // Bind device if not already bound
            if (!user.deviceId) {
                user.deviceId = deviceId;
                await user.save();
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET || 'banking-pos-secret-key-2025',
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    role: user.role,
                    branch: user.branch,
                    assignedArea: user.assignedArea,
                    deviceId: user.deviceId
                },
                token
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in. Please try again.'
        });
    }
});

// GET /api/auth/me - Get current logged-in user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    name: req.user.name,
                    email: req.user.email,
                    mobile: req.user.mobile,
                    role: req.user.role,
                    branch: req.user.branch,
                    assignedArea: req.user.assignedArea,
                    deviceId: req.user.deviceId,
                    isActive: req.user.isActive
                }
            }
        });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details'
        });
    }
});

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

export default router;