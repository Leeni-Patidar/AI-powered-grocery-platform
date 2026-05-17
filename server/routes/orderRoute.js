import express from 'express';
import authUser from '../middlewares/authUser.js';
import { 
  getAllOrders, 
  getUserOrders, 
  placeOrderCOD,
  updateOrderStatus,
  getOrderDetails,
  getOrdersByStatus,
  cancelOrder,
  getOrderStats
} from '../controllers/orderController.js';
import authSeller from '../middlewares/authSeller.js';

const orderRouter = express.Router();

// User routes
orderRouter.post('/cod', authUser, placeOrderCOD);
orderRouter.post('/user', authUser, getUserOrders);
orderRouter.get('/details/:orderId', authUser, getOrderDetails);
orderRouter.put('/cancel/:orderId', authUser, cancelOrder);

// Seller routes
orderRouter.post('/seller', authSeller, getAllOrders);
orderRouter.put('/update-status/:orderId', authSeller, updateOrderStatus);
orderRouter.get('/by-status/:status', authSeller, getOrdersByStatus);
orderRouter.get('/stats', authSeller, getOrderStats);

export default orderRouter;





