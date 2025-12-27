import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ✅ Helper function to validate ObjectId
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// ✅ Helper to validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// ✅ Helper to validate mobile format
const isValidMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
};

// ✅ Helper to generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            email: user.email
        },
        process.env.JWT_SECRET || 'banking-pos-secret-key-2025',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// ✅ Rate limiting tracker (in-memory - use Redis in production)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

// ✅ Helper to check rate limiting
const checkRateLimit = (identifier) => {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier);

    if (!attempts) {
        loginAttempts.set(identifier, { count: 1, firstAttempt: now, lockedUntil: null });
        return { allowed: true };
    }

    // Check if locked
    if (attempts.lockedUntil && now < attempts.lockedUntil) {
        const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
        return { allowed: false, remainingTime };
    }

    // Reset if lock expired
    if (attempts.lockedUntil && now >= attempts.lockedUntil) {
        loginAttempts.set(identifier, { count: 1, firstAttempt: now, lockedUntil: null });
        return { allowed: true };
    }

    // Increment attempts
    if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        const lockedUntil = now + LOCK_TIME;
        loginAttempts.set(identifier, { ...attempts, lockedUntil });
        return { allowed: false, remainingTime: 15 };
    }

    loginAttempts.set(identifier, { ...attempts, count: attempts.count + 1 });
    return { allowed: true, attemptsLeft: MAX_LOGIN_ATTEMPTS - attempts.count };
};

// ✅ Helper to reset rate limit
const resetRateLimit = (identifier) => {
    loginAttempts.delete(identifier);
};

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

        // Validate name length
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long'
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate mobile format
        if (!isValidMobile(mobile)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid 10-digit mobile number'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Validate role
        if (role && !['agent', 'supervisor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be: agent, supervisor, or admin'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase().trim() },
                { mobile: mobile.trim() }
            ]
        });

        if (existingUser) {
            const field = existingUser.email === email.toLowerCase().trim()
                ? 'Email'
                : 'Mobile number';
            return res.status(400).json({
                success: false,
                message: `${field} already registered`
            });
        }

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            mobile: mobile.trim(),
            password,
            role: role || 'agent',
            branch: branch.trim(),
            assignedArea: assignedArea?.trim() || null
        });

        // Generate JWT token
        const token = generateToken(user);

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

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating account. Please try again.',
            error: error.message
        });
    }
});

// POST /api/auth/login - Login user with device binding and rate limiting
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

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        const emailLower = email.toLowerCase().trim();

        // ✅ Check rate limiting
        const rateLimitResult = checkRateLimit(emailLower);
        if (!rateLimitResult.allowed) {
            return res.status(429).json({
                success: false,
                message: `Too many login attempts. Please try again after ${rateLimitResult.remainingTime} minutes.`,
                remainingTime: rateLimitResult.remainingTime,
                lockedUntil: Date.now() + (rateLimitResult.remainingTime * 60 * 1000)
            });
        }

        // Find user with password field
        const user = await User.findOne({ email: emailLower }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                attemptsLeft: rateLimitResult.attemptsLeft
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
                message: 'Invalid email or password',
                attemptsLeft: rateLimitResult.attemptsLeft
            });
        }

        // ✅ Reset rate limit on successful login
        resetRateLimit(emailLower);

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
                user.lastLogin = new Date();
                await user.save();
            }
        } else {
            // Update last login for non-agents
            user.lastLogin = new Date();
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(user);

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
                token,
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in. Please try again.',
            error: error.message
        });
    }
});

// POST /api/auth/verify-token - Verify JWT token validity
router.post('/verify-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'banking-pos-secret-key-2025'
        );

        // Check if user still exists and is active
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                valid: false
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated',
                valid: false
            });
        }

        res.json({
            success: true,
            valid: true,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired',
                valid: false,
                expired: true
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
                valid: false
            });
        }

        console.error('Verify Token Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying token',
            error: error.message
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
                    isActive: req.user.isActive,
                    createdAt: req.user.createdAt,
                    lastLogin: req.user.lastLogin
                }
            }
        });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user details',
            error: error.message
        });
    }
});

// PUT /api/auth/update-profile - Update user profile
router.put('/update-profile', authenticateToken, async (req, res) => {
    try {
        const { name, mobile, assignedArea } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update allowed fields
        if (name && name.trim().length >= 2) {
            user.name = name.trim();
        }

        if (mobile && isValidMobile(mobile)) {
            // Check if mobile already exists (excluding current user)
            const existingMobile = await User.findOne({
                mobile: mobile.trim(),
                _id: { $ne: user._id }
            });

            if (existingMobile) {
                return res.status(400).json({
                    success: false,
                    message: 'Mobile number already in use'
                });
            }

            user.mobile = mobile.trim();
        }

        if (assignedArea !== undefined) {
            user.assignedArea = assignedArea?.trim() || null;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    role: user.role,
                    branch: user.branch,
                    assignedArea: user.assignedArea
                }
            }
        });
    } catch (error) {
        console.error('Update Profile Error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Mobile number already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
});

// PUT /api/auth/change-password - Change password
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isPasswordMatch = await user.comparePassword(currentPassword);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
});

// POST /api/auth/logout - Logout user
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // You can add token blacklisting here if needed
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
});

// POST /api/auth/unbind-device - Unbind device (admin only)
router.post('/unbind-device', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.body;

        // Only admin/supervisor can unbind devices
        if (!['admin', 'supervisor'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to unbind devices'
            });
        }

        if (!userId || !isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid user ID is required'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.deviceId = null;
        await user.save();

        res.json({
            success: true,
            message: 'Device unbound successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    deviceId: user.deviceId
                }
            }
        });
    } catch (error) {
        console.error('Unbind Device Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error unbinding device',
            error: error.message
        });
    }
});

export default router;
