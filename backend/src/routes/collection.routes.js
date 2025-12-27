import express from 'express';
import Collection from '../models/Collection.model.js';
import Customer from '../models/Customer.model.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ⚠️ IMPORTANT: Place specific routes BEFORE parameterized routes
// GET /api/collections/stats/today - MOVED TO TOP
router.get('/stats/today', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const filter = {
            timestamp: {
                $gte: today,
                $lt: tomorrow
            },
            status: 'completed'
        };

        // Agents see only their stats
        if (req.user.role === 'agent') {
            filter.agent = req.user._id;
        }

        const stats = await Collection.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalCollections: { $sum: 1 },
                    totalAmount: { $sum: '$collectionAmount' },
                    cashAmount: {
                        $sum: { $cond: [{ $eq: ['$paymentMode', 'cash'] }, '$collectionAmount', 0] }
                    },
                    upiAmount: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$paymentMode', 'upi'] },
                                        { $eq: ['$paymentMode', 'qr'] }
                                    ]
                                },
                                '$collectionAmount',
                                0
                            ]
                        }
                    },
                    cardAmount: {
                        $sum: { $cond: [{ $eq: ['$paymentMode', 'card'] }, '$collectionAmount', 0] }
                    },
                    partialPayments: {
                        $sum: { $cond: ['$isPartialPayment', 1, 0] }
                    }
                }
            }
        ]);

        // ✅ FIX: Provide default values when no data exists
        const defaultStats = {
            totalCollections: 0,
            totalAmount: 0,
            cashAmount: 0,
            upiAmount: 0,
            cardAmount: 0,
            partialPayments: 0
        };

        res.json({
            success: true,
            data: {
                stats: stats.length > 0 ? stats[0] : defaultStats
            }
        });
    } catch (error) {
        console.error('Get Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
});

// GET /api/collections/customer/:customerId - MOVED BEFORE /:id
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findById(customerId);

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
            customer: customerId,
            status: { $ne: 'voided' } // ✅ FIX: Exclude voided transactions
        })
            .populate('agent', 'name')
            .populate('voidedBy', 'name')
            .sort({ timestamp: -1 });

        const totalCollected = collections.reduce((sum, col) => {
            return col.status === 'completed' ? sum + col.collectionAmount : sum;
        }, 0);

        res.json({
            success: true,
            count: collections.length,
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

// POST /api/collections - Record new collection
router.post('/', async (req, res) => {
    try {
        const {
            customerId,
            collectionAmount,
            paymentMode,
            latitude,
            longitude,
            address,
            deviceId,
            remarks
        } = req.body;

        // Validation
        if (!customerId || !collectionAmount || !paymentMode) {
            return res.status(400).json({
                success: false,
                message: 'Please provide customerId, collectionAmount, and paymentMode'
            });
        }

        // ✅ FIX: Support 'qr' payment mode
        if (!['cash', 'upi', 'qr', 'card'].includes(paymentMode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment mode. Must be: cash, upi, qr, or card'
            });
        }

        const customer = await Customer.findById(customerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Check if agent has access
        if (req.user.role === 'agent' && customer.assignedAgent.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not assigned to this customer'
            });
        }

        // Validate collection amount
        if (collectionAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Collection amount must be greater than 0'
            });
        }

        const totalDue = customer.outstandingAmount + customer.penaltyAmount;
        if (collectionAmount > totalDue) {
            return res.status(400).json({
                success: false,
                message: `Collection amount exceeds total due amount (₹${totalDue})`
            });
        }

        // Calculate payment breakdown
        const outstandingBefore = customer.outstandingAmount;
        const emiDue = customer.loanDetails.emiAmount;

        // Pay penalty first, then principal
        let penaltyPaid = Math.min(collectionAmount, customer.penaltyAmount);
        let principalPaid = collectionAmount - penaltyPaid;

        const outstandingAfter = Math.max(0, customer.outstandingAmount - principalPaid);
        const isPartialPayment = collectionAmount < emiDue;

        // Create collection record
        const collection = await Collection.create({
            customer: customerId,
            loanId: customer.loanId,
            agent: req.user._id,
            collectionAmount: Number(collectionAmount),
            paymentMode,
            emiDue,
            penaltyPaid,
            outstandingBefore,
            outstandingAfter,
            isPartialPayment,
            location: {
                type: 'Point',
                coordinates: [Number(longitude) || 0, Number(latitude) || 0],
                address: address || ''
            },
            deviceId: deviceId || 'UNKNOWN',
            remarks: remarks || '',
            timestamp: new Date()
        });

        // Update customer
        customer.outstandingAmount = outstandingAfter;
        customer.totalPaid += principalPaid;
        customer.penaltyAmount = Math.max(0, customer.penaltyAmount - penaltyPaid);

        // Update status
        if (customer.outstandingAmount === 0 && customer.penaltyAmount === 0) {
            customer.status = 'closed';
        }

        await customer.save();

        // Populate collection data
        await collection.populate([
            { path: 'customer', select: 'name loanId accountNumber mobile' },
            { path: 'agent', select: 'name' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Collection recorded successfully',
            data: {
                collection,
                updatedCustomer: {
                    outstandingAmount: customer.outstandingAmount,
                    totalPaid: customer.totalPaid,
                    penaltyAmount: customer.penaltyAmount,
                    status: customer.status
                }
            }
        });
    } catch (error) {
        console.error('Create Collection Error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error recording collection',
            error: error.message
        });
    }
});

// GET /api/collections - Get transaction history
router.get('/', async (req, res) => {
    try {
        const {
            customerId,
            paymentMode,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        const filter = {};

        // Agents can only see their own collections
        if (req.user.role === 'agent') {
            filter.agent = req.user._id;
        }

        if (customerId) {
            filter.customer = customerId;
        }

        if (paymentMode && ['cash', 'upi', 'qr', 'card'].includes(paymentMode)) {
            filter.paymentMode = paymentMode;
        }

        // Date range filter
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) {
                filter.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = end;
            }
        }

        // ✅ FIX: Only show completed collections by default
        filter.status = { $ne: 'voided' };

        const collections = await Collection.find(filter)
            .populate('customer', 'name loanId accountNumber mobile')
            .populate('agent', 'name')
            .select('-location.coordinates')
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .sort({ timestamp: -1 });

        const totalCount = await Collection.countDocuments(filter);

        // Calculate summary
        const summaryData = await Collection.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$collectionAmount' },
                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            count: collections.length,
            total: totalCount,
            page: Number(page),
            totalPages: Math.ceil(totalCount / Number(limit)),
            summary: summaryData.length > 0 ? summaryData[0] : { totalAmount: 0, totalTransactions: 0 },
            data: {
                collections
            }
        });
    } catch (error) {
        console.error('Get Collections Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collections',
            error: error.message
        });
    }
});

// GET /api/collections/:id - Get single collection (MOVED TO END)
router.get('/:id', async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id)
            .populate('customer', 'name loanId accountNumber mobile address')
            .populate('agent', 'name mobile')
            .populate('voidedBy', 'name');

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection record not found'
            });
        }

        // Check access
        if (req.user.role === 'agent' && collection.agent._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have access to this collection record'
            });
        }

        res.json({
            success: true,
            data: {
                collection
            }
        });
    } catch (error) {
        console.error('Get Collection Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching collection details',
            error: error.message
        });
    }
});

// PUT /api/collections/:id - Update collection (admin only)
router.put('/:id', authorizeRoles('admin', 'supervisor'), async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id);

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        if (collection.status === 'voided') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit a voided transaction'
            });
        }

        const { collectionAmount, paymentMode, remarks } = req.body;

        // Update allowed fields
        if (collectionAmount !== undefined) collection.collectionAmount = collectionAmount;
        if (paymentMode) collection.paymentMode = paymentMode;
        if (remarks !== undefined) collection.remarks = remarks;

        await collection.save();
        await collection.populate(['customer', 'agent']);

        res.json({
            success: true,
            message: 'Collection updated successfully',
            data: {
                collection
            }
        });
    } catch (error) {
        console.error('Update Collection Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating collection',
            error: error.message
        });
    }
});

// DELETE /api/collections/:id - Void transaction (admin only)
router.delete('/:id', authorizeRoles('admin', 'supervisor'), async (req, res) => {
    try {
        const collection = await Collection.findById(req.params.id).populate('customer');

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection not found'
            });
        }

        if (collection.status === 'voided') {
            return res.status(400).json({
                success: false,
                message: 'Transaction already voided'
            });
        }

        const { reason } = req.body;

        // Mark as voided
        collection.status = 'voided';
        collection.voidedBy = req.user._id;
        collection.voidedAt = new Date();
        collection.voidReason = reason || 'No reason provided';

        await collection.save();

        // Reverse the customer outstanding amount
        const customer = await Customer.findById(collection.customer._id);
        if (customer) {
            customer.outstandingAmount += (collection.collectionAmount - collection.penaltyPaid);
            customer.totalPaid -= (collection.collectionAmount - collection.penaltyPaid);
            customer.penaltyAmount += collection.penaltyPaid;

            if (customer.status === 'closed' && customer.outstandingAmount > 0) {
                customer.status = 'active';
            }

            await customer.save();
        }

        await collection.populate('voidedBy', 'name');

        res.json({
            success: true,
            message: 'Transaction voided successfully',
            data: {
                collection
            }
        });
    } catch (error) {
        console.error('Void Collection Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error voiding transaction',
            error: error.message
        });
    }
});

// PUT /api/collections/:id/receipt - Update receipt delivery status
router.put('/:id/receipt', async (req, res) => {
    try {
        const { sms, whatsapp, print } = req.body;

        const updateFields = {};
        if (sms !== undefined) updateFields['receiptSent.sms'] = Boolean(sms);
        if (whatsapp !== undefined) updateFields['receiptSent.whatsapp'] = Boolean(whatsapp);
        if (print !== undefined) updateFields['receiptSent.print'] = Boolean(print);

        const collection = await Collection.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true }
        ).populate('customer agent');

        if (!collection) {
            return res.status(404).json({
                success: false,
                message: 'Collection record not found'
            });
        }

        res.json({
            success: true,
            message: 'Receipt status updated',
            data: {
                collection
            }
        });
    } catch (error) {
        console.error('Update Receipt Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating receipt status',
            error: error.message
        });
    }
});

export default router;
