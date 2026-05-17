import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    expiryDate: "",
    usageLimit: null,
    couponType: "general",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data } = await axios.get("/api/coupon/list");
      if (data.success) {
        setCoupons(data.coupons);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createCoupon = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.discountValue || !formData.expiryDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data } = await axios.post("/api/coupon/create", {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount
          ? parseFloat(formData.maxDiscountAmount)
          : null,
        usageLimit: formData.usageLimit
          ? parseInt(formData.usageLimit)
          : null,
        adminId: localStorage.getItem("userId"), // Assuming userId is stored
      });

      if (data.success) {
        toast.success("Coupon created successfully");
        setFormData({
          code: "",
          description: "",
          discountType: "percentage",
          discountValue: 0,
          minOrderAmount: 0,
          maxDiscountAmount: null,
          expiryDate: "",
          usageLimit: null,
          couponType: "general",
        });
        setShowForm(false);
        fetchCoupons();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to create coupon");
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const { data } = await axios.delete(`/api/coupon/delete/${id}`);
      if (data.success) {
        toast.success("Coupon deleted successfully");
        fetchCoupons();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete coupon");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading coupons...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Coupon Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition"
        >
          {showForm ? "Cancel" : "Create Coupon"}
        </button>
      </div>

      {/* Create Coupon Form */}
      {showForm && (
        <div className="bg-white border border-gray-300 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-6">Create New Coupon</h2>
          <form onSubmit={createCoupon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="E.g., SAVE10"
                  className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Coupon Type
                </label>
                <select
                  name="couponType"
                  value={formData.couponType}
                  onChange={handleInputChange}
                  className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="referral">Referral</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="E.g., 10% off on all products"
                className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Discount Type *
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Discount Value *
                </label>
                <input
                  type="number"
                  name="discountValue"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  placeholder={
                    formData.discountType === "percentage"
                      ? "E.g., 10"
                      : "E.g., 50"
                  }
                  className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Minimum Order Amount
                </label>
                <input
                  type="number"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleInputChange}
                  placeholder="E.g., 100"
                  className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Max Discount Amount
                </label>
                <input
                  type="number"
                  name="maxDiscountAmount"
                  value={formData.maxDiscountAmount || ""}
                  onChange={handleInputChange}
                  placeholder="Leave empty for no limit"
                  className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Expiry Date *
                </label>
                <input
                  type="datetime-local"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Usage Limit
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit || ""}
                  onChange={handleInputChange}
                  placeholder="Leave empty for unlimited"
                  className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition"
            >
              Create Coupon
            </button>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="px-4 py-3 text-left font-semibold">Code</th>
              <th className="px-4 py-3 text-left font-semibold">Type</th>
              <th className="px-4 py-3 text-left font-semibold">Discount</th>
              <th className="px-4 py-3 text-left font-semibold">Min Order</th>
              <th className="px-4 py-3 text-left font-semibold">Expires</th>
              <th className="px-4 py-3 text-left font-semibold">Usage</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon._id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold">{coupon.code}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                    {coupon.discountType === "percentage" ? "%" : "$"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {coupon.discountValue}
                  {coupon.discountType === "percentage" ? "%" : "$"}
                </td>
                <td className="px-4 py-3">
                  ${coupon.minOrderAmount || "No minimum"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(coupon.expiryDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {coupon.usageCount}
                  {coupon.usageLimit ? `/${coupon.usageLimit}` : "/Unlimited"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      new Date(coupon.expiryDate) < new Date() ||
                      !coupon.isActive
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {new Date(coupon.expiryDate) < new Date()
                      ? "Expired"
                      : coupon.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deleteCoupon(coupon._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouponManagement;
