import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const CouponSystem = ({ orderAmount, onCouponApply, currency = "$" }) => {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post("/api/coupon/validate", {
        code: couponCode,
        orderAmount,
      });

      if (data.success) {
        setAppliedCoupon(data.coupon);
        onCouponApply({
          code: data.coupon.code,
          discount: data.coupon.discount,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue,
        });
        toast.success("Coupon applied successfully!");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to validate coupon");
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    onCouponApply(null);
    toast.success("Coupon removed");
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Apply Coupon Code</h3>

      {!appliedCoupon ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-500"
            disabled={loading}
          />
          <button
            onClick={validateCoupon}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Validating..." : "Apply"}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-300 rounded p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Code: {appliedCoupon.code}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Discount: {appliedCoupon.discountType === "percentage"
                  ? `${appliedCoupon.discountValue}%`
                  : `${currency}${appliedCoupon.discount}`}{" "}
                (Save {currency}
                {appliedCoupon.discount})
              </p>
            </div>
            <button
              onClick={removeCoupon}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponSystem;
