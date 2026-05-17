import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
    code: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        uppercase: true 
    },
    description: { type: String, default: "" },
    discountType: { 
        type: String, 
        enum: ['percentage', 'fixed'],
        default: 'percentage' 
    },
    discountValue: { 
        type: Number, 
        required: true,
        min: 0
    },
    minOrderAmount: { 
        type: Number, 
        default: 0 
    },
    maxDiscountAmount: { 
        type: Number,
        default: null
    },
    expiryDate: { 
        type: Date, 
        required: true 
    },
    usageLimit: { 
        type: Number, 
        default: null 
    },
    usageCount: { 
        type: Number, 
        default: 0 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
    couponType: {
        type: String,
        enum: ['general', 'referral'],
        default: 'general'
    },
    referralCode: { 
        type: String,
        default: null
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user',
        required: true
    },
    usedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        usedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ expiryDate: 1 });

const Coupon = mongoose.models.coupon || mongoose.model('coupon', couponSchema);

export default Coupon;
