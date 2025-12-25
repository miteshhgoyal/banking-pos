import express from 'express';
import Customer from '../models/Customer.model.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/customers - Get customer list with filters
router.get('/', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;

        const filter = {};

        // Agents can only see their assigned customers
        if (req.user.role === 'agent') {
            filter.assignedAgent = req.user._id;
        }

        // Filter by status
        if (status && ['active', 'closed', 'defaulter', 'npa'].includes(status)) {
            filter.status = status;
        }

        // Search functionality
        if (search) {
            filter.$or = [
                { loanId: { $regex: search, $options: 'i' } },
                { accountNumber: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
                { aadhaar: { $regex: search, $options: 'i' } }
            ];
        }

        // Get customers with pagination
        const customers = await Customer.find(filter)
            .populate('assignedAgent', 'name employeeId mobile')
            .select('loanId accountNumber name mobile status outstandingAmount penaltyAmount loanDetails.emiAmount nextEmiDate')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 });

        const totalCount = await Customer.countDocuments(filter);

        res.json({
            success: true,
            count: customers.length,
            total: totalCount,
            page: Number(page),
            totalPages: Math.ceil(totalCount / Number(limit)),
            data: {
                customers
            }
        });
    } catch (error) {
        console.error('Get Customers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers'
        });
    }
});

// GET /api/customers/search - Search customers
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 3 characters'
            });
        }

        const searchQuery = q.trim();

        const filter = {
            $or: [
                { loanId: { $regex: searchQuery, $options: 'i' } },
                { accountNumber: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } },
                { mobile: { $regex: searchQuery, $options: 'i' } },
                { aadhaar: { $regex: searchQuery, $options: 'i' } }
            ]
        };

        // Agents can only search their assigned customers
        if (req.user.role === 'agent') {
            filter.assignedAgent = req.user._id;
        }

        const customers = await Customer.find(filter)
            .populate('assignedAgent', 'name employeeId')
            .select('loanId accountNumber name mobile status outstandingAmount penaltyAmount loanDetails.emiAmount')
            .limit(20)
            .sort({ name: 1 });

        res.json({
            success: true,
            count: customers.length,
            data: {
                customers
            }
        });
    } catch (error) {
        console.error('Search Customers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching customers'
        });
    }
});

// GET /api/customers/:id - Get single customer details
router.get('/:id', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id)
            .populate('assignedAgent', 'name employeeId mobile');

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if agent has access to this customer
        if (req.user.role === 'agent' && customer.assignedAgent._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this customer'
            });
        }

        res.json({
            success: true,
            data: {
                customer
            }
        });
    } catch (error) {
        console.error('Get Customer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer details'
        });
    }
});

// POST /api/customers - Create new customer/loan account
router.post('/', authorizeRoles('admin', 'supervisor'), async (req, res) => {
    try {
        const {
            loanId,
            accountNumber,
            name,
            mobile,
            aadhaar,
            address,
            loanAmount,
            disbursedDate,
            tenure,
            interestRate,
            emiAmount,
            emiFrequency,
            assignedAgent
        } = req.body;

        // Create customer
        const customer = await Customer.create({
            loanId,
            accountNumber,
            name,
            mobile,
            aadhaar,
            address: address || {},
            loanDetails: {
                loanAmount,
                disbursedDate,
                tenure,
                interestRate,
                emiAmount,
                emiFrequency: emiFrequency || 'monthly'
            },
            outstandingAmount: loanAmount,
            assignedAgent: assignedAgent || req.user._id
        });

        await customer.populate('assignedAgent', 'name employeeId');

        res.status(201).json({
            success: true,
            message: 'Customer created successfully',
            data: {
                customer
            }
        });
    } catch (error) {
        console.error('Create Customer Error:', error);

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
            message: 'Error creating customer'
        });
    }
});

export default router;