import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  subcategories: { type: [subcategorySchema], default: [] },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

categorySchema.index({ name: 1, slug: 1 });

const Category = mongoose.models.category || mongoose.model('category', categorySchema);

export default Category;
