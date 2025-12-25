import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        index: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer reference is required']
    },
    loanId: {
        type: String,
        required: [true, 'Loan ID is required'],
        index: true
    },
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Agent reference is required']
    },
    collectionAmount: {
        type: Number,
        required: [true, 'Collection amount is required'],
        min: [1, 'Collection amount must be greater than 0']
    },
    paymentMode: {
        type: String,
        enum: ['cash', 'upi', 'qr', 'card'],
        required: [true, 'Payment mode is required']
    },
    emiDue: {
        type: Number,
        required: true
    },
    penaltyPaid: {
        type: Number,
        default: 0,
        min: [0, 'Penalty paid cannot be negative']
    },
    outstandingBefore: {
        type: Number,
        required: true
    },
    outstandingAfter: {
        type: Number,
        required: true
    },
    isPartialPayment: {
        type: Boolean,
        default: false
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
        address: {
            type: String,
            default: ''
        }
    },
    deviceId: {
        type: String,
        required: [true, 'Device ID is required']
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true
    },
    receiptSent: {
        sms: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
        print: { type: Boolean, default: false }
    },
    syncedToServer: {
        type: Boolean,
        default: true
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    // NEW FIELDS FOR PHASE 2
    status: {
        type: String,
        enum: ['completed', 'voided', 'cancelled'],
        default: 'completed'
    },
    voidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    voidedAt: {
        type: Date,
        default: null
    },
    voidReason: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Create geospatial index for location queries
collectionSchema.index({ location: '2dsphere' });

// Generate transaction ID before validation
collectionSchema.pre('validate', function (next) {
    if (!this.transactionId) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        this.transactionId = `TXN${timestamp}${random}`;
    }
    next();
});

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;