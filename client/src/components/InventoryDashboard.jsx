import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const InventoryDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState("");
  const [action, setAction] = useState("set");

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await axios.get("/api/inventory/dashboard");
      if (data.success) {
        setDashboard(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async () => {
    if (!selectedProduct || !newStock) {
      toast.error("Please select product and enter quantity");
      return;
    }

    try {
      const { data } = await axios.post("/api/inventory/update-stock", {
        productId: selectedProduct._id,
        quantity: parseInt(newStock),
        action: action === "set" ? "set" : action,
      });

      if (data.success) {
        toast.success("Stock updated successfully");
        setNewStock("");
        setSelectedProduct(null);
        fetchDashboard();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update stock");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-8">Inventory Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
          <p className="text-gray-600 text-sm">Total Products</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {dashboard?.totalProducts || 0}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <p className="text-gray-600 text-sm">Low Stock</p>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {dashboard?.lowStockCount || 0}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <p className="text-gray-600 text-sm">Out of Stock</p>
          <p className="text-3xl font-bold text-red-600 mt-2">
            {dashboard?.outOfStockCount || 0}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
          <p className="text-gray-600 text-sm">In Stock</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {dashboard?.totalProducts -
              (dashboard?.lowStockCount + dashboard?.outOfStockCount) || 0}
          </p>
        </div>
      </div>

      {/* Update Stock Form */}
      {selectedProduct && (
        <div className="bg-white border border-gray-300 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Update Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Product
              </label>
              <p className="mt-2 p-2 bg-gray-100 rounded">
                {selectedProduct.name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Current Stock
              </label>
              <p className="mt-2 p-2 bg-gray-100 rounded">
                {selectedProduct.totalStock}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Action
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
              >
                <option value="set">Set Stock</option>
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="Enter quantity"
                className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={updateStock}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition"
            >
              Update Stock
            </button>
            <button
              onClick={() => {
                setSelectedProduct(null);
                setNewStock("");
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Low Stock Products */}
      {dashboard?.lowStockProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-700">
            Low Stock Products ⚠️
          </h2>
          <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-yellow-50">
                  <th className="px-4 py-3 text-left font-semibold">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Stock</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Threshold
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.lowStockProducts.map((product) => (
                  <tr
                    key={product._id}
                    className="border-b hover:bg-yellow-50 transition"
                  >
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">{product.totalStock}</td>
                    <td className="px-4 py-3">{product.lowStockThreshold}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Update Stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Out of Stock Products */}
      {dashboard?.outOfStockProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-red-700">
            Out of Stock Products ❌
          </h2>
          <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-red-50">
                  <th className="px-4 py-3 text-left font-semibold">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.outOfStockProducts.map((product) => (
                  <tr key={product._id} className="border-b hover:bg-red-50">
                    <td className="px-4 py-3">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Products Inventory */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Products Inventory</h2>
        <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">Stock</th>
                <th className="px-4 py-3 text-left font-semibold">Threshold</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.allInventory.map((product) => (
                <tr
                  key={product._id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3">{product.totalStock}</td>
                  <td className="px-4 py-3">{product.lowStockThreshold}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        product.totalStock === 0
                          ? "bg-red-100 text-red-700"
                          : product.totalStock <=
                            product.lowStockThreshold
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {product.totalStock === 0
                        ? "Out of Stock"
                        : product.totalStock <=
                          product.lowStockThreshold
                        ? "Low Stock"
                        : "In Stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
