import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    loanId: {
        type: String,
        required: [true, 'Loan ID is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    accountNumber: {
        type: String,
        required: [true, 'Account Number is required'],
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    mobile: {
        type: String,
        required: [true, 'Mobile number is required'],
        match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number'],
        index: true
    },
    aadhaar: {
        type: String,
        required: [true, 'Aadhaar number is required'],
        match: [/^[0-9]{12}$/, 'Please provide a valid 12-digit Aadhaar number'],
        index: true
    },
    address: {
        street: { type: String, trim: true, default: '' },
        city: { type: String, trim: true, default: '' },
        state: { type: String, trim: true, default: '' },
        pincode: { type: String, match: [/^[0-9]{6}$/, 'Invalid pincode'], default: '' }
    },
    loanDetails: {
        loanAmount: {
            type: Number,
            required: [true, 'Loan amount is required'],
            min: [1, 'Loan amount must be greater than 0']
        },
        disbursedDate: {
            type: Date,
            required: [true, 'Disbursed date is required']
        },
        tenure: {
            type: Number,
            required: [true, 'Tenure is required'],
            min: [1, 'Tenure must be at least 1 month']
        },
        interestRate: {
            type: Number,
            required: [true, 'Interest rate is required'],
            min: [0, 'Interest rate cannot be negative']
        },
        emiAmount: {
            type: Number,
            required: [true, 'EMI amount is required'],
            min: [1, 'EMI amount must be greater than 0']
        },
        emiFrequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            default: 'monthly'
        }
    },
    outstandingAmount: {
        type: Number,
        required: true,
        min: [0, 'Outstanding amount cannot be negative']
    },
    totalPaid: {
        type: Number,
        default: 0,
        min: [0, 'Total paid cannot be negative']
    },
    penaltyAmount: {
        type: Number,
        default: 0,
        min: [0, 'Penalty amount cannot be negative']
    },
    nextEmiDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'closed', 'defaulter', 'npa'],
        default: 'active'
    },
    assignedAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Assigned agent is required']
    }
}, {
    timestamps: true
});

// Calculate next EMI date before saving
customerSchema.pre('save', function (next) {
    if (this.isModified('loanDetails.emiFrequency') || !this.nextEmiDate) {
        const now = new Date();
        const nextDate = new Date(now);

        switch (this.loanDetails.emiFrequency) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;
            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;
            case 'monthly':
            default:
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
        }

        this.nextEmiDate = nextDate;
    }
    next();
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;