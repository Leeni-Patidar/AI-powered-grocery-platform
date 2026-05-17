import express from 'express';
import {
  getInventoryDashboard,
  updateStock,
  updateStockThreshold,
  getLowStockAlerts,
  getOutOfStock,
  updateVariantStock,
  bulkUpdateStock
} from '../controllers/inventoryController.js';
import authSeller from '../middlewares/authSeller.js';

const inventoryRouter = express.Router();

// Seller routes
inventoryRouter.get('/dashboard', authSeller, getInventoryDashboard);
inventoryRouter.post('/update-stock', authSeller, updateStock);
inventoryRouter.post('/update-threshold', authSeller, updateStockThreshold);
inventoryRouter.post('/update-variant-stock', authSeller, updateVariantStock);
inventoryRouter.post('/bulk-update', authSeller, bulkUpdateStock);

// Public routes
inventoryRouter.get('/low-stock-alerts', getLowStockAlerts);
inventoryRouter.get('/out-of-stock', getOutOfStock);

export default inventoryRouter;
