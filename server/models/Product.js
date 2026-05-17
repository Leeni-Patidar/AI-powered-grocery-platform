import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  unit: { type: String },
}, { _id: true });

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  name: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: Array, required: true },
  price: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  image: { type: Array, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: "" },
  brand: { type: String, default: "Generic" },
  variants: { type: [variantSchema], default: [] },
  reviews: { type: [reviewSchema], default: [] },
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ category: 1, subcategory: 1, brand: 1 });
productSchema.index({ name: "text", category: "text", subcategory: "text", brand: "text" });

const Product = mongoose.models.product || mongoose.model('Product', productSchema);

export default Product;
