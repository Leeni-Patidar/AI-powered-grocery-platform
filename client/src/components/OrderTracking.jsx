import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const OrderTracking = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const statusSteps = [
    "Pending",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const { data } = await axios.get(`/api/order/details/${orderId}`);
        if (data.success) {
          setOrder(data.order);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.message || "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return <div className="text-center py-8">Loading order details...</div>;
  }

  if (!order) {
    return <div className="text-center py-8 text-red-600">Order not found</div>;
  }

  const currentStatusIndex = statusSteps.indexOf(order.status);

  return (
    <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
      <h2 className="text-2xl font-semibold mb-6">Order Tracking</h2>

      <div className="flex items-center justify-between mb-8">
        {statusSteps.map((step, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            {/* Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white mb-2 ${
                index <= currentStatusIndex
                  ? "bg-green-500"
                  : index === currentStatusIndex + 1
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
            >
              {index < currentStatusIndex ? "✓" : index + 1}
            </div>

            {/* Label */}
            <p
              className={`text-xs md:text-sm text-center ${
                index <= currentStatusIndex
                  ? "text-gray-700 font-medium"
                  : "text-gray-500"
              }`}
            >
              {step}
            </p>

            {/* Line connector */}
            {index < statusSteps.length - 1 && (
              <div
                className={`absolute h-1 w-12 md:w-16 mt-11 ${
                  index < currentStatusIndex ? "bg-green-500" : "bg-gray-300"
                }`}
                style={{
                  left: `calc(${(index + 1) * (100 / statusSteps.length)}% - 24px)`,
                }}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Current Status */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
        <p className="text-sm font-semibold text-gray-700">Current Status</p>
        <p className="text-lg font-bold text-blue-600 mt-1">{order.status}</p>
        {order.statusHistory && order.statusHistory.length > 0 && (
          <p className="text-xs text-gray-600 mt-2">
            Updated on{" "}
            {new Date(
              order.statusHistory[order.statusHistory.length - 1].timestamp
            ).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Status History</h3>
          <div className="space-y-3">
            {[...order.statusHistory].reverse().map((history, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3 bg-gray-50 rounded border border-gray-200"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-700">{history.status}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(history.timestamp).toLocaleString()}
                  </p>
                  {history.notes && (
                    <p className="text-sm text-gray-600 mt-1">{history.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Summary */}
      {order.items && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-3 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-700">
                    {item.product?.name || "Product"}
                  </p>
                  <p className="text-sm text-gray-600">
                    Qty: {item.quantity} × ${item.price}
                  </p>
                </div>
                <p className="font-semibold text-gray-700">
                  ${item.quantity * item.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment & Total Info */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Payment Type</p>
            <p className="font-semibold text-gray-700">{order.paymentType}</p>
          </div>
          <div>
            <p className="text-gray-600">Order Amount</p>
            <p className="font-semibold text-gray-700">${order.amount}</p>
          </div>
          {order.discountAmount > 0 && (
            <div>
              <p className="text-gray-600">Discount</p>
              <p className="font-semibold text-green-600">
                -${order.discountAmount}
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-600">Final Amount</p>
            <p className="font-semibold text-lg text-gray-800">
              ${order.finalAmount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
