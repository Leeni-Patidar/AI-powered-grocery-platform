import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const calculateOrderAmounts = async ({ items, couponCode, userId }) => {
  let amount = 0;
  const orderItems = [];
  let coupon = null;
  let discountAmount = 0;
  let discountPercentage = 0;

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error(`Product not found: ${item.product}`);
    }
    if (!product.inStock || product.totalStock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const itemPrice = product.offerPrice * item.quantity;
    amount += itemPrice;

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      price: product.offerPrice,
    });
  }

  const taxAmount = Math.floor(amount * 0.02);
  let finalAmount = amount + taxAmount;

  if (couponCode) {
    const couponRecord = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!couponRecord || !couponRecord.isActive) {
      throw new Error('Invalid or inactive coupon code');
    }

    const now = new Date();
    if (couponRecord.expiryDate < now) {
      throw new Error('Coupon has expired');
    }

    if (couponRecord.minOrderAmount && amount < couponRecord.minOrderAmount) {
      throw new Error(`Minimum order amount of ${couponRecord.minOrderAmount} required`);
    }

    if (couponRecord.usageLimit && couponRecord.usageCount >= couponRecord.usageLimit) {
      throw new Error('Coupon usage limit reached');
    }

    if (userId && couponRecord.usedBy.some((usage) => usage.userId.toString() === userId)) {
      throw new Error('Coupon already used by this user');
    }

    if (couponRecord.discountType === 'percentage') {
      discountAmount = Math.floor((amount * couponRecord.discountValue) / 100);
      if (couponRecord.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, couponRecord.maxDiscountAmount);
      }
      discountPercentage = couponRecord.discountValue;
    } else {
      discountAmount = couponRecord.discountValue;
    }

    finalAmount = Math.max(0, finalAmount - discountAmount);
    coupon = couponRecord;
  }

  return { amount, taxAmount, finalAmount, orderItems, coupon, discountAmount, discountPercentage };
};

const verifyRazorpaySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { items, couponCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ success: false, message: 'Order items are required' });
    }

    const { finalAmount } = await calculateOrderAmounts({ items, couponCode, userId: req.user.id });
    const amountInPaise = Math.round(finalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      payment_capture: 1,
    });

    return res.json({
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      address,
      couponCode,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.json({ success: false, message: 'Payment details are required for verification' });
    }

    if (!verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
      return res.json({ success: false, message: 'Payment verification failed' });
    }

    const { amount, taxAmount, finalAmount, orderItems, coupon, discountAmount, discountPercentage } =
      await calculateOrderAmounts({ items, couponCode, userId: req.user.id });

    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      product.totalStock -= item.quantity;
      product.inStock = product.totalStock > 0;
      product.isLowStock = product.totalStock <= product.lowStockThreshold;
      await product.save();
    }

    let couponId = null;
    if (coupon) {
      coupon.usageCount += 1;
      coupon.usedBy.push({ userId: req.user.id });
      await coupon.save();
      couponId = coupon._id;

      const user = await User.findById(req.user.id);
      if (user && !user.couponsUsed.some((id) => id.toString() === couponId.toString())) {
        user.couponsUsed.push(couponId);
        await user.save();
      }
    }

    const order = await Order.create({
      userId: req.user.id,
      items: orderItems,
      amount,
      address,
      paymentType: 'Online',
      isPaid: true,
      paymentStatus: 'Paid',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      status: 'Pending',
      coupon: couponId,
      discountAmount,
      discountPercentage,
      finalAmount,
      taxAmount,
      statusHistory: [
        {
          status: 'Pending',
          timestamp: new Date(),
          notes: 'Order created after successful payment',
        },
      ],
    });

    return res.json({ success: true, message: 'Payment verified and order created successfully', order });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const signature = req.headers['x-razorpay-signature'];

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(req.rawBody.toString())
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Webhook signature mismatch' });
    }

    const event = req.body;
    const eventType = event.event;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const orderId = event.payload?.payment?.entity?.order_id;
      const paymentId = event.payload?.payment?.entity?.id;
      const razorpayOrder = await Order.findOne({ razorpayOrderId: orderId });
      if (razorpayOrder && paymentId) {
        razorpayOrder.paymentStatus = 'Paid';
        razorpayOrder.razorpayPaymentId = paymentId;
        await razorpayOrder.save();
      }
    }

    if (eventType === 'payment.failed') {
      const orderId = event.payload?.payment?.entity?.order_id;
      const razorpayOrder = await Order.findOne({ razorpayOrderId: orderId });
      if (razorpayOrder) {
        razorpayOrder.paymentStatus = 'Failed';
        await razorpayOrder.save();
      }
    }

    if (eventType === 'refund.processed') {
      const refundEntity = event.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      const razorpayOrder = await Order.findOne({ razorpayPaymentId: paymentId });
      if (razorpayOrder) {
        razorpayOrder.refundStatus = 'Processed';
        razorpayOrder.refundId = refundEntity?.id;
        razorpayOrder.refundAmount = refundEntity?.amount / 100;
        await razorpayOrder.save();
      }
    }

    return res.json({ success: true, message: 'Webhook received' });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const requestRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.json({ success: false, message: 'Not authorized to refund this order' });
    }

    if (!order.razorpayPaymentId) {
      return res.json({ success: false, message: 'Payment information not found for refund' });
    }

    if (order.refundStatus === 'Processed') {
      return res.json({ success: false, message: 'Refund already processed' });
    }

    const refundAmount = amount ? Math.round(Number(amount) * 100) : Math.round((order.finalAmount || order.amount) * 100);
    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: refundAmount,
      notes: {
        reason: reason || 'Customer requested refund',
      },
    });

    order.refundStatus = 'Requested';
    order.refundId = refund.id;
    order.refundAmount = refund.amount / 100;
    order.refundReason = reason || 'Customer requested refund';
    await order.save();

    return res.json({ success: true, message: 'Refund request submitted', refund });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
