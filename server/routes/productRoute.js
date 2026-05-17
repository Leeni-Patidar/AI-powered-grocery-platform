import express from 'express';
import upload from '../configs/multer.js';
import authSeller from '../middlewares/authSeller.js';
import authUser from '../middlewares/authUser.js';
import {
  addProduct,
  addRecentlyViewed,
  addReview,
  changeStock,
  getRecentlyViewed,
  getWishlist,
  productById,
  productFilters,
  productList,
  toggleWishlist,
} from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.post('/add', upload.array(['images']), authSeller, addProduct);
productRouter.get('/list', productList);
productRouter.get('/filters', productFilters);
productRouter.get('/id/:id', productById);
productRouter.get('/id', productById);
productRouter.post('/stock', authSeller, changeStock);
productRouter.post('/review', authUser, addReview);
productRouter.get('/wishlist', authUser, getWishlist);
productRouter.post('/wishlist/toggle', authUser, toggleWishlist);
productRouter.get('/recently-viewed', authUser, getRecentlyViewed);
productRouter.post('/recently-viewed', authUser, addRecentlyViewed);

export default productRouter;
