import Coupon from "../models/Coupon.js";
import User from "../models/User.js";

// Create Coupon (Admin): /api/coupon/create
export const createCoupon = async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscountAmount, expiryDate, usageLimit, couponType, referralCode } = req.body;

    if (!code || !discountValue || !expiryDate) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
      couponType,
      referralCode,
      createdBy: req.body.adminId,
    });

    res.json({ success: true, message: "Coupon created successfully", coupon });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get All Coupons: /api/coupon/list
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get Active Coupons: /api/coupon/active
export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: now }
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, coupons });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Validate Coupon: /api/coupon/validate
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount, userId } = req.body;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    if (!coupon.isActive) {
      return res.json({ success: false, message: "Coupon is inactive" });
    }

    const now = new Date();
    if (coupon.expiryDate < now) {
      return res.json({ success: false, message: "Coupon has expired" });
    }

    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return res.json({ success: false, message: `Minimum order amount required: ${coupon.minOrderAmount}` });
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.json({ success: false, message: "Coupon usage limit reached" });
    }

    // Check if user has already used this coupon
    if (userId && coupon.usedBy.some(usage => usage.userId.toString() === userId)) {
      return res.json({ success: false, message: "You have already used this coupon" });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    } else {
      discount = coupon.discountValue;
    }

    res.json({ 
      success: true, 
      message: "Coupon is valid",
      coupon: {
        _id: coupon._id,
        code: coupon.code,
        discount,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Update Coupon: /api/coupon/update/:id
export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });

    if (!coupon) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon updated successfully", coupon });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Delete Coupon: /api/coupon/delete/:id
export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByIdAndDelete(id);

    if (!coupon) {
      return res.json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Generate Referral Coupon: /api/coupon/referral/generate
export const generateReferralCoupon = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if user already has a referral code
    if (user.referralCode) {
      return res.json({ success: true, message: "Referral code already exists", referralCode: user.referralCode });
    }

    // Generate unique referral code
    const referralCode = `REF${user._id.toString().slice(-8).toUpperCase()}${Date.now().toString().slice(-4)}`;
    
    // Create referral coupon
    const coupon = await Coupon.create({
      code: referralCode,
      description: `Referral coupon for ${user.name}`,
      discountType: 'percentage',
      discountValue: 10,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      couponType: 'referral',
      referralCode,
      createdBy: userId,
      isActive: true
    });

    // Update user with referral code
    user.referralCode = referralCode;
    await user.save();

    res.json({ success: true, message: "Referral coupon generated", referralCode, coupon });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Apply Referral Coupon: /api/coupon/referral/apply
export const applyReferralCoupon = async (req, res) => {
  try {
    const { referralCode, newUserId } = req.body;

    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.json({ success: false, message: "Invalid referral code" });
    }

    const newUser = await User.findById(newUserId);
    if (!newUser) {
      return res.json({ success: false, message: "User not found" });
    }

    // Check if user is already referred
    if (newUser.referredBy) {
      return res.json({ success: false, message: "User already has a referrer" });
    }

    // Update new user
    newUser.referredBy = referrer._id;
    await newUser.save();

    // Add reward to referrer
    referrer.referralRewards += 100; // 100 points or currency
    await referrer.save();

    res.json({ success: true, message: "Referral coupon applied successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
