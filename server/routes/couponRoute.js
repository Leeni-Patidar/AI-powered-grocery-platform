import express from 'express';
import {
  createCoupon,
  getAllCoupons,
  getActiveCoupons,
  validateCoupon,
  updateCoupon,
  deleteCoupon,
  generateReferralCoupon,
  applyReferralCoupon
} from '../controllers/couponController.js';
import authUser from '../middlewares/authUser.js';

const couponRouter = express.Router();

// Public routes
couponRouter.post('/validate', validateCoupon);
couponRouter.get('/active', getActiveCoupons);

// User routes
couponRouter.post('/referral/generate', authUser, generateReferralCoupon);
couponRouter.post('/referral/apply', authUser, applyReferralCoupon);

// Admin routes
couponRouter.post('/create', createCoupon);
couponRouter.get('/list', getAllCoupons);
couponRouter.put('/update/:id', updateCoupon);
couponRouter.delete('/delete/:id', deleteCoupon);

export default couponRouter;
