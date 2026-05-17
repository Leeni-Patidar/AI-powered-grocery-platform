import express from 'express';
import authSeller from '../middlewares/authSeller.js';
import {
  addSubcategory,
  createCategory,
  deleteCategory,
  listCategories,
  removeSubcategory,
  updateCategory,
  updateSubcategory,
} from '../controllers/categoryController.js';

const categoryRouter = express.Router();

categoryRouter.get('/list', listCategories);
categoryRouter.post('/create', authSeller, createCategory);
categoryRouter.put('/update/:id', authSeller, updateCategory);
categoryRouter.delete('/delete/:id', authSeller, deleteCategory);
categoryRouter.post('/subcategory/add', authSeller, addSubcategory);
categoryRouter.put('/subcategory/:id', authSeller, updateSubcategory);
categoryRouter.delete('/subcategory/:id', authSeller, removeSubcategory);

export default categoryRouter;
