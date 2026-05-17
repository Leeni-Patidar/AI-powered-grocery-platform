import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";

// Place Order COD: /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, address, couponCode } = req.body;

    if (!address || items.length === 0) {
      return res.json({ success: false, message: "Invalid order details" });
    }

    // Validate items and calculate amount
    let amount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.json({ success: false, message: `Product not found: ${item.product}` });
      }

      if (!product.inStock || product.totalStock < item.quantity) {
        return res.json({ success: false, message: `Insufficient stock for ${product.name}` });
      }

      const itemPrice = product.offerPrice * item.quantity;
      amount += itemPrice;
      
      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.offerPrice
      });

      // Decrease stock
      product.totalStock -= item.quantity;
      product.isLowStock = product.totalStock <= product.lowStockThreshold;
      product.inStock = product.totalStock > 0;
      await product.save();
    }

    // Calculate tax (2%)
    const taxAmount = Math.floor(amount * 0.02);
    let finalAmount = amount + taxAmount;
    let discountAmount = 0;
    let discountPercentage = 0;
    let coupon = null;

    // Apply coupon if provided
    if (couponCode) {
      const couponRecord = await Coupon.findOne({ code: couponCode.toUpperCase() });
      
      if (!couponRecord) {
        return res.json({ success: false, message: "Invalid coupon code" });
      }

      if (!couponRecord.isActive) {
        return res.json({ success: false, message: "Coupon is inactive" });
      }

      const now = new Date();
      if (couponRecord.expiryDate < now) {
        return res.json({ success: false, message: "Coupon has expired" });
      }

      if (couponRecord.minOrderAmount && amount < couponRecord.minOrderAmount) {
        return res.json({ success: false, message: `Minimum order amount of ${couponRecord.minOrderAmount} required` });
      }

      if (couponRecord.usageLimit && couponRecord.usageCount >= couponRecord.usageLimit) {
        return res.json({ success: false, message: "Coupon usage limit reached" });
      }

      // Check if user already used this coupon
      if (couponRecord.usedBy.some(usage => usage.userId.toString() === userId)) {
        return res.json({ success: false, message: "You have already used this coupon" });
      }

      // Calculate discount
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
      coupon = couponRecord._id;

      // Update coupon usage
      couponRecord.usageCount += 1;
      couponRecord.usedBy.push({ userId });
      await couponRecord.save();

      // Add coupon to user's used coupons
      const user = await User.findById(userId);
      if (user && !user.couponsUsed.includes(coupon)) {
        user.couponsUsed.push(coupon);
        await user.save();
      }
    }

    // Create order
    const order = await Order.create({
      userId,
      items: orderItems,
      amount,
      address,
      paymentType: "COD",
      status: "Pending",
      coupon,
      discountAmount,
      discountPercentage,
      finalAmount,
      taxAmount,
      statusHistory: [{
        status: "Pending",
        timestamp: new Date(),
        notes: "Order placed successfully"
      }]
    });

    res.json({ success: true, message: "Order placed successfully", orderId: order._id });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get Orders by User ID: /api/order/user
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.body;

    const orders = await Order.find({
      userId,
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product")
      .populate("address")
      .populate("coupon")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get All Orders (for seller): /api/order/seller
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [{ paymentType: "COD" }, { isPaid: true }],
    })
      .populate("items.product")
      .populate("address")
      .populate("coupon")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Update Order Status: /api/order/update-status/:orderId
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['Pending', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    // Don't allow status change if already delivered or cancelled
    if (['Delivered', 'Cancelled'].includes(order.status)) {
      return res.json({ success: false, message: `Cannot change status of a ${order.status.toLowerCase()} order` });
    }

    // Update status
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      notes: notes || ""
    });

    await order.save();

    res.json({ 
      success: true, 
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get Order Details: /api/order/details/:orderId
export const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("address")
      .populate("coupon")
      .populate("userId", "name email");

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get Orders by Status: /api/order/by-status/:status
export const getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const validStatuses = ['Pending', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    const orders = await Order.find({ status })
      .populate("items.product")
      .populate("address")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Cancel Order: /api/order/cancel/:orderId
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (['Shipped', 'Out for Delivery', 'Delivered'].includes(order.status)) {
      return res.json({ success: false, message: `Cannot cancel a ${order.status.toLowerCase()} order` });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.totalStock += item.quantity;
        product.inStock = true;
        product.isLowStock = product.totalStock <= product.lowStockThreshold;
        await product.save();
      }
    }

    order.status = 'Cancelled';
    order.statusHistory.push({
      status: 'Cancelled',
      timestamp: new Date(),
      notes: reason || "Order cancelled by customer"
    });

    await order.save();

    res.json({ success: true, message: "Order cancelled successfully", order });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get Order Statistics: /api/order/stats
export const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });
    const packedOrders = await Order.countDocuments({ status: 'Packed' });
    const shippedOrders = await Order.countDocuments({ status: 'Shipped' });
    const outForDeliveryOrders = await Order.countDocuments({ status: 'Out for Delivery' });
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' });

    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: "$finalAmount" } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        packedOrders,
        shippedOrders,
        outForDeliveryOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
