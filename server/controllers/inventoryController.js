import Product from "../models/Product.js";

// Get Inventory Dashboard: /api/inventory/dashboard
export const getInventoryDashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$totalStock", "$lowStockThreshold"] }
    }).select("name totalStock lowStockThreshold");

    const outOfStockProducts = await Product.find({ totalStock: 0 }).select("name category");

    const inventory = await Product.find({}).select("name totalStock lowStockThreshold isLowStock");

    const dashboardData = {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
      outOfStockProducts,
      allInventory: inventory
    };

    res.json({ success: true, dashboardData });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Update Stock: /api/inventory/update-stock
export const updateStock = async (req, res) => {
  try {
    const { productId, quantity, action } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    let newStock;
    if (action === 'increase') {
      newStock = product.totalStock + quantity;
    } else if (action === 'decrease') {
      if (product.totalStock < quantity) {
        return res.json({ success: false, message: "Insufficient stock" });
      }
      newStock = product.totalStock - quantity;
    } else {
      newStock = quantity;
    }

    // Update stock
    product.totalStock = newStock;

    // Check if it's low stock
    product.isLowStock = newStock <= product.lowStockThreshold;

    // Update inStock status
    product.inStock = newStock > 0;

    await product.save();

    res.json({ 
      success: true, 
      message: "Stock updated successfully",
      product: {
        _id: product._id,
        name: product.name,
        totalStock: product.totalStock,
        isLowStock: product.isLowStock,
        inStock: product.inStock
      }
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Update Stock Threshold: /api/inventory/update-threshold
export const updateStockThreshold = async (req, res) => {
  try {
    const { productId, threshold } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    product.lowStockThreshold = threshold;
    product.isLowStock = product.totalStock <= threshold;

    await product.save();

    res.json({ success: true, message: "Threshold updated successfully", product });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get Low Stock Alerts: /api/inventory/low-stock-alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ["$totalStock", "$lowStockThreshold"] }
    }).select("name totalStock lowStockThreshold category");

    res.json({ success: true, lowStockProducts });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get Out of Stock: /api/inventory/out-of-stock
export const getOutOfStock = async (req, res) => {
  try {
    const outOfStockProducts = await Product.find({ totalStock: 0 }).select("name category brand");

    res.json({ success: true, outOfStockProducts });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Update Stock for Variants: /api/inventory/update-variant-stock
export const updateVariantStock = async (req, res) => {
  try {
    const { productId, variantId, quantity, action } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    const variant = product.variants.id(variantId);
    if (!variant) {
      return res.json({ success: false, message: "Variant not found" });
    }

    let newStock;
    if (action === 'increase') {
      newStock = variant.stock + quantity;
    } else if (action === 'decrease') {
      if (variant.stock < quantity) {
        return res.json({ success: false, message: "Insufficient variant stock" });
      }
      newStock = variant.stock - quantity;
    } else {
      newStock = quantity;
    }

    variant.stock = newStock;

    // Update total stock
    product.totalStock = product.variants.reduce((total, v) => total + v.stock, 0);
    product.isLowStock = product.totalStock <= product.lowStockThreshold;
    product.inStock = product.totalStock > 0;

    await product.save();

    res.json({ 
      success: true, 
      message: "Variant stock updated successfully",
      product
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Bulk Update Stock: /api/inventory/bulk-update
export const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of {productId, quantity}

    const results = [];
    for (const update of updates) {
      const product = await Product.findById(update.productId);
      if (product) {
        product.totalStock = update.quantity;
        product.isLowStock = update.quantity <= product.lowStockThreshold;
        product.inStock = update.quantity > 0;
        await product.save();
        results.push({ productId: update.productId, success: true });
      } else {
        results.push({ productId: update.productId, success: false });
      }
    }

    res.json({ success: true, message: "Bulk update completed", results });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
