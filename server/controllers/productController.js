import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import User from "../models/User.js";

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeVariants = (variants = [], fallbackProduct) =>
  variants
    .filter((variant) => variant?.name)
    .map((variant) => ({
      name: variant.name.trim(),
      sku: variant.sku?.trim() || undefined,
      price: Number(variant.price || fallbackProduct.price),
      offerPrice: Number(variant.offerPrice || fallbackProduct.offerPrice),
      stock: Number(variant.stock || 0),
      unit: variant.unit?.trim() || undefined,
    }));

const withRating = (product) => {
  const reviews = product.reviews || [];
  const ratingCount = reviews.length;
  const ratingAverage = ratingCount
    ? reviews.reduce((total, review) => total + Number(review.rating || 0), 0) / ratingCount
    : 0;

  product.ratingCount = ratingCount;
  product.ratingAverage = Number(ratingAverage.toFixed(1));
  return product;
};

// Add Product : /api/product/add
export const addProduct = async (req, res) => {
  try {
    let productData = JSON.parse(req.body.productData);
    const images = req.files;
    productData.description = toArray(productData.description);
    productData.price = Number(productData.price);
    productData.offerPrice = Number(productData.offerPrice);
    productData.brand = productData.brand?.trim() || "Generic";
    productData.subcategory = productData.subcategory?.trim() || "";
    productData.variants = normalizeVariants(productData.variants, productData);

    let imagesUrl = await Promise.all(
      images.map(async (item) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );
 await Product.create({...productData, image:imagesUrl})
 res.json({success: true,message:"Product Added "})
}
catch(error){
    console.log(error.message);
    res.json({success: false, message: error.message})
}
}


// Get Product :/ api/product/list
export const productList = async (req, res) => {
  try {
    const { category, subcategory, brand, search, sort, page = 1, limit = 0 } = req.query;
    const filter = {};
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.max(Number(limit) || 0, 0);

    if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
    if (subcategory) filter.subcategory = new RegExp(`^${escapeRegex(subcategory)}$`, "i");
    if (brand) filter.brand = new RegExp(`^${escapeRegex(brand)}$`, "i");
    if (search) {
      filter.$or = [
        { name: new RegExp(escapeRegex(search), "i") },
        { category: new RegExp(escapeRegex(search), "i") },
        { subcategory: new RegExp(escapeRegex(search), "i") },
        { brand: new RegExp(escapeRegex(search), "i") },
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      priceLow: { offerPrice: 1 },
      priceHigh: { offerPrice: -1 },
      rating: { ratingAverage: -1, ratingCount: -1 },
      name: { name: 1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;
    const query = Product.find(filter).sort(sortBy);

    if (limitNumber > 0) {
      query.skip((pageNumber - 1) * limitNumber).limit(limitNumber);
    }

    const [products, total] = await Promise.all([
      query,
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      products,
      total,
      page: pageNumber,
      limit: limitNumber || total,
      pages: limitNumber > 0 ? Math.ceil(total / limitNumber) : 1,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


// Get single  Product :/ api/product/id
export const productById = async (req, res) => {
  try {
    const { id } = req.params.id ? req.params : req.body;
    const product = await Product.findById(id);
    res.json({ success: true, product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};


// Get single  inStock :/ api/product/stock
export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;
    await Product.findByIdAndUpdate(id, { inStock });
    res.json({ success: true, message: "Stock Updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get product filters : /api/product/filters
export const productFilters = async (req, res) => {
  try {
    const [categories, subcategories, brands] = await Promise.all([
      Product.distinct("category"),
      Product.distinct("subcategory"),
      Product.distinct("brand"),
    ]);

    res.json({
      success: true,
      categories: categories.filter(Boolean).sort(),
      subcategories: subcategories.filter(Boolean).sort(),
      brands: brands.filter(Boolean).sort(),
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Add or update review : /api/product/review
export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!productId || numericRating < 1 || numericRating > 5) {
      return res.json({ success: false, message: "Valid product and rating are required" });
    }

    const product = await Product.findById(productId);
    const user = await User.findById(req.user.id);

    if (!product || !user) {
      return res.json({ success: false, message: "Product or user not found" });
    }

    const existingReview = product.reviews.find(
      (review) => review.user.toString() === req.user.id
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = comment || "";
      existingReview.name = user.name;
    } else {
      product.reviews.push({
        user: req.user.id,
        name: user.name,
        rating: numericRating,
        comment: comment || "",
      });
    }

    withRating(product);
    await product.save();

    res.json({ success: true, message: "Review saved", product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Toggle wishlist : /api/product/wishlist/toggle
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user.id);

    if (!productId || !user) {
      return res.json({ success: false, message: "Product not found" });
    }

    const exists = user.wishlist.some((item) => item.toString() === productId);
    user.wishlist = exists
      ? user.wishlist.filter((item) => item.toString() !== productId)
      : [...user.wishlist, productId];

    await user.save();
    res.json({
      success: true,
      message: exists ? "Removed from wishlist" : "Added to wishlist",
      wishlist: user.wishlist.map((item) => item.toString()),
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get wishlist : /api/product/wishlist
export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("wishlist");
    res.json({ success: true, wishlist: user?.wishlist || [] });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Add recently viewed : /api/product/recently-viewed
export const addRecentlyViewed = async (req, res) => {
  try {
    const { productId } = req.body;
    const user = await User.findById(req.user.id);

    if (!productId || !user) {
      return res.json({ success: false, message: "Product not found" });
    }

    user.recentlyViewed = [
      { product: productId, viewedAt: new Date() },
      ...(user.recentlyViewed || []).filter((item) => item.product.toString() !== productId),
    ].slice(0, 10);

    await user.save();
    res.json({ success: true, message: "Recently viewed updated" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get recently viewed : /api/product/recently-viewed
export const getRecentlyViewed = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("recentlyViewed.product");
    const products = (user?.recentlyViewed || [])
      .map((item) => item.product)
      .filter(Boolean);

    res.json({ success: true, products });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
