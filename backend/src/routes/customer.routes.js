import express from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.model.js';
import Collection from '../models/Collection.model.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ✅ Helper function to validate ObjectId
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id);
};

// ✅ IMPORTANT: Place specific routes BEFORE parameterized routes
// GET /api/customers/search - Search customers (MOVED TO TOP)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
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
            .populate('assignedAgent', 'name')
            .select('loanId accountNumber name mobile status outstandingAmount penaltyAmount loanDetails.emiAmount nextEmiDate')
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
            message: 'Error searching customers',
            error: error.message
        });
    }
});

// GET /api/customers/stats - Get customer statistics
router.get('/stats', async (req, res) => {
    try {
        const filter = {};

        // Agents see only their assigned customers
        if (req.user.role === 'agent') {
            filter.assignedAgent = req.user._id;
        }

        const stats = await Customer.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalOutstanding: { $sum: '$outstandingAmount' },
                    totalPenalty: { $sum: '$penaltyAmount' }
                }
            }
        ]);

        const totalCustomers = await Customer.countDocuments(filter);

        // Format stats by status
        const formattedStats = {
            totalCustomers,
            active: 0,
            closed: 0,
            defaulter: 0,
            npa: 0,
            totalOutstanding: 0,
            totalPenalty: 0
        };

        stats.forEach(stat => {
            formattedStats[stat._id] = stat.count;
            formattedStats.totalOutstanding += stat.totalOutstanding;
            formattedStats.totalPenalty += stat.totalPenalty;
        });

        res.json({
            success: true,
            data: {
                stats: formattedStats
            }
        });
    } catch (error) {
        console.error('Get Customer Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer statistics',
            error: error.message
        });
    }
});

// GET /api/customers - Get customer list with filters
router.get('/', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

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
        if (search && search.trim()) {
            const searchTerm = search.trim();
            filter.$or = [
                { loanId: { $regex: searchTerm, $options: 'i' } },
                { accountNumber: { $regex: searchTerm, $options: 'i' } },
                { name: { $regex: searchTerm, $options: 'i' } },
                { mobile: { $regex: searchTerm, $options: 'i' } },
                { aadhaar: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Build sort object
        const sortField = ['name', 'createdAt', 'outstandingAmount', 'nextEmiDate'].includes(sortBy) ? sortBy : 'createdAt';
        const sort = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

        // Get customers with pagination
        const customers = await Customer.find(filter)
            .populate('assignedAgent', 'name mobile')
            .select('loanId accountNumber name mobile status outstandingAmount penaltyAmount loanDetails.emiAmount nextEmiDate createdAt')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort(sort);

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
            message: 'Error fetching customers',
            error: error.message
        });
    }
});

// POST /api/customers - Create new customer/loan account
router.post('/', authorizeRoles('admin', 'supervisor', 'agent'), async (req, res) => {
    try {
        const {
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

        // Validation
        if (!name || !mobile || !aadhaar || !loanAmount || !disbursedDate || !tenure || !interestRate || !emiAmount) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, mobile, aadhaar, loanAmount, disbursedDate, tenure, interestRate, emiAmount'
            });
        }

        // Validate assignedAgent ObjectId
        const agentId = assignedAgent || req.user._id;
        if (!isValidObjectId(agentId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid agent ID provided'
            });
        }

        // Check if mobile or aadhaar already exists
        const existingCustomer = await Customer.findOne({
            $or: [
                { mobile: mobile },
                { aadhaar: aadhaar }
            ]
        });

        if (existingCustomer) {
            const field = existingCustomer.mobile === mobile ? 'Mobile number' : 'Aadhaar number';
            return res.status(400).json({
                success: false,
                message: `${field} already exists`
            });
        }

        // Create customer (loanId and accountNumber will be auto-generated)
        const customer = await Customer.create({
            name: name.trim(),
            mobile: mobile.trim(),
            aadhaar: aadhaar.trim(),
            address: {
                street: address?.street || '',
                city: address?.city || '',
                state: address?.state || '',
                pincode: address?.pincode || ''
            },
            loanDetails: {
                loanAmount: Number(loanAmount),
                disbursedDate: new Date(disbursedDate),
                tenure: Number(tenure),
                interestRate: Number(interestRate),
                emiAmount: Number(emiAmount),
                emiFrequency: emiFrequency || 'monthly'
            },
            outstandingAmount: Number(loanAmount),
            assignedAgent: agentId
        });

        await customer.populate('assignedAgent', 'name mobile');

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
            message: 'Error creating customer',
            error: error.message
        });
    }
});

// GET /api/customers/:id - Get single customer details (MOVED AFTER POST)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }

        const customer = await Customer.findById(id)
            .populate('assignedAgent', 'name mobile');

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

        // Get collection summary for this customer
        const collectionSummary = await Collection.aggregate([
            {
                $match: {
                    customer: new mongoose.Types.ObjectId(id),
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalCollections: { $sum: 1 },
                    totalCollected: { $sum: '$collectionAmount' },
                    lastPaymentDate: { $max: '$timestamp' }
                }
            }
        ]);

        const summary = collectionSummary[0] || {
            totalCollections: 0,
            totalCollected: 0,
            lastPaymentDate: null
        };

        res.json({
            success: true,
            data: {
                customer,
                collectionSummary: summary
            }
        });
    } catch (error) {
        console.error('Get Customer Error:', error);

        // Handle CastError for invalid ObjectId
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching customer details',
            error: error.message
        });
    }
});

// PUT /api/customers/:id - Update customer details
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check access permissions
        if (req.user.role === 'agent' && customer.assignedAgent.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this customer'
            });
        }

        const {
            name,
            mobile,
            aadhaar,
            address,
            loanAmount,
            tenure,
            interestRate,
            emiAmount,
            emiFrequency,
            status,
            assignedAgent
        } = req.body;

        // Check for duplicate mobile/aadhaar (excluding current customer)
        if (mobile || aadhaar) {
            const duplicateFilter = {
                _id: { $ne: id },
                $or: []
            };

            if (mobile && mobile !== customer.mobile) {
                duplicateFilter.$or.push({ mobile: mobile });
            }
            if (aadhaar && aadhaar !== customer.aadhaar) {
                duplicateFilter.$or.push({ aadhaar: aadhaar });
            }

            if (duplicateFilter.$or.length > 0) {
                const duplicate = await Customer.findOne(duplicateFilter);
                if (duplicate) {
                    const field = duplicate.mobile === mobile ? 'Mobile number' : 'Aadhaar number';
                    return res.status(400).json({
                        success: false,
                        message: `${field} already exists`
                    });
                }
            }
        }

        // Update basic fields
        if (name) customer.name = name.trim();
        if (mobile) customer.mobile = mobile.trim();
        if (aadhaar) customer.aadhaar = aadhaar.trim();
        if (address) {
            customer.address = {
                street: address.street || customer.address.street || '',
                city: address.city || customer.address.city || '',
                state: address.state || customer.address.state || '',
                pincode: address.pincode || customer.address.pincode || ''
            };
        }

        // Update loan details
        if (loanAmount !== undefined) customer.loanDetails.loanAmount = Number(loanAmount);
        if (tenure !== undefined) customer.loanDetails.tenure = Number(tenure);
        if (interestRate !== undefined) customer.loanDetails.interestRate = Number(interestRate);
        if (emiAmount !== undefined) customer.loanDetails.emiAmount = Number(emiAmount);
        if (emiFrequency) customer.loanDetails.emiFrequency = emiFrequency;

        // Update status (admin/supervisor only)
        if (status && ['admin', 'supervisor'].includes(req.user.role)) {
            if (['active', 'closed', 'defaulter', 'npa'].includes(status)) {
                customer.status = status;
            }
        }

        // Update assigned agent (admin/supervisor only)
        if (assignedAgent && ['admin', 'supervisor'].includes(req.user.role)) {
            if (isValidObjectId(assignedAgent)) {
                customer.assignedAgent = assignedAgent;
            }
        }

        await customer.save();
        await customer.populate('assignedAgent', 'name mobile');

        res.json({
            success: true,
            message: 'Customer updated successfully',
            data: {
                customer
            }
        });
    } catch (error) {
        console.error('Update Customer Error:', error);

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

        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating customer',
            error: error.message
        });
    }
});

// GET /api/customers/:id/collections - Get customer collection history
router.get('/:id/collections', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        // Validate ObjectId
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check access
        if (req.user.role === 'agent' && customer.assignedAgent.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this customer'
            });
        }

        const collections = await Collection.find({
            customer: id,
            status: { $ne: 'voided' }
        })
            .populate('agent', 'name')
            .select('-location.coordinates')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ timestamp: -1 });

        const totalCount = await Collection.countDocuments({
            customer: id,
            status: { $ne: 'voided' }
        });

        const totalCollected = collections.reduce((sum, col) => {
            return col.status === 'completed' ? sum + col.collectionAmount : sum;
        }, 0);

        res.json({
            success: true,
            count: collections.length,
            total: totalCount,
            page: Number(page),
            totalPages: Math.ceil(totalCount / Number(limit)),
            totalCollected,
            data: {
                collections
            }
        });
    } catch (error) {
        console.error('Get Customer Collections Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer collection history',
            error: error.message
        });
    }
});

// DELETE /api/customers/:id - Delete/deactivate customer
router.delete('/:id', authorizeRoles('admin', 'supervisor'), async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }

        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if customer has outstanding amount
        if (customer.outstandingAmount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete customer with outstanding amount of ₹${customer.outstandingAmount}`
            });
        }

        // Soft delete - just mark as closed
        customer.status = 'closed';
        await customer.save();

        res.json({
            success: true,
            message: 'Customer account closed successfully'
        });
    } catch (error) {
        console.error('Delete Customer Error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid customer ID format'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting customer',
            error: error.message
        });
    }
});

export default router;
