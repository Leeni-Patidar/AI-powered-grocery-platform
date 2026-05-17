import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    product: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'product'},
    quantity: {type: Number, required: true},
    price: {type: Number, required: true}
}, { _id: true });

const orderStatusHistorySchema = new mongoose.Schema({
    status: {type: String, required: true},
    timestamp: {type: Date, default: Date.now},
    notes: {type: String}
}, { _id: true });

const orderSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'user'},
    items: [orderItemSchema],
    amount: {type: Number, required: true},
    address: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'address'},
    status: {
        type: String, 
        enum: ['Pending', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
        default:'Pending'
    },
    statusHistory: [orderStatusHistorySchema],
    paymentType:{type: String, required: true }, 
    isPaid:{type:Boolean, required: true , default:false},
    paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    refundStatus: { type: String, enum: ['None', 'Requested', 'Processed', 'Failed'], default: 'None' },
    refundId: { type: String, default: '' },
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: '' },
    coupon: {type: mongoose.Schema.Types.ObjectId, ref: 'coupon'},
    discountAmount: {type: Number, default: 0},
    discountPercentage: {type: Number, default: 0},
    finalAmount: {type: Number},
    taxAmount: {type: Number, default: 0},
},{timestamps: true})

const Order = mongoose.models.order || mongoose.model('order', orderSchema)

export default Order