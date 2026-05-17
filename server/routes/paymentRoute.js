import express from 'express';
import authUser from '../middlewares/authUser.js';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  requestRefund,
} from '../controllers/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', authUser, createRazorpayOrder);
paymentRouter.post('/verify', authUser, verifyRazorpayPayment);
paymentRouter.post('/refund/:orderId', authUser, requestRefund);
paymentRouter.post('/webhook', razorpayWebhook);

export default paymentRouter;
