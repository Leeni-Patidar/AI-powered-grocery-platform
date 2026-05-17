import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const OrderManagementPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState(null);

  const validStatuses = [
    "Pending",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
    "Cancelled",
  ];

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      let url = "/api/order/seller";
      if (statusFilter !== "all") {
        url = `/api/order/by-status/${statusFilter}`;
      }

      const { data } = await axios.post(url);
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get("/api/order/stats");
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      const { data } = await axios.put(
        `/api/order/update-status/${selectedOrder._id}`,
        {
          status: newStatus,
          notes,
        }
      );

      if (data.success) {
        toast.success("Order status updated successfully");
        setNewStatus("");
        setNotes("");
        setSelectedOrder(null);
        fetchOrders();
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-8">Order Management</h1>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-8">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm">Total</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {stats.totalOrders}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-2">
              {stats.pendingOrders}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm">Packed</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {stats.packedOrders}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm">Shipped</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">
              {stats.shippedOrders}
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm">Out for Delivery</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {stats.outForDeliveryOrders}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm">Delivered</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {stats.deliveredOrders}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
            <p className="text-gray-600 text-sm">Cancelled</p>
            <p className="text-2xl font-bold text-red-600 mt-2">
              {stats.cancelledOrders}
            </p>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded font-medium transition ${
            statusFilter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All Orders
        </button>
        {validStatuses.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded font-medium transition ${
              statusFilter === status
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Update Status Form */}
      {selectedOrder && (
        <div className="bg-white border border-gray-300 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Order ID
              </label>
              <p className="mt-2 p-2 bg-gray-100 rounded">
                {selectedOrder._id}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                Current Status
              </label>
              <p className="mt-2 p-2 bg-gray-100 rounded">
                {selectedOrder.status}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">
                New Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500"
              >
                <option value="">Select new status</option>
                {validStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this status change"
              className="w-full mt-2 p-2 border border-gray-300 rounded outline-none focus:border-blue-500 h-20"
            />
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={updateOrderStatus}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium transition"
            >
              Update Status
            </button>
            <button
              onClick={() => {
                setSelectedOrder(null);
                setNewStatus("");
                setNotes("");
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto bg-white border border-gray-300 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-100">
              <th className="px-4 py-3 text-left font-semibold">Order ID</th>
              <th className="px-4 py-3 text-left font-semibold">Customer</th>
              <th className="px-4 py-3 text-left font-semibold">Items</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order._id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3 font-semibold">
                  {order._id.slice(-8)}
                </td>
                <td className="px-4 py-3">
                  {order.userId?.name || "N/A"}
                  <br />
                  <span className="text-xs text-gray-600">
                    {order.userId?.email || ""}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {order.items?.length || 0} items
                </td>
                <td className="px-4 py-3 font-semibold">
                  ${order.finalAmount || order.amount}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status === "Cancelled"
                        ? "bg-red-100 text-red-700"
                        : order.status === "Out for Delivery"
                        ? "bg-orange-100 text-orange-700"
                        : order.status === "Shipped"
                        ? "bg-blue-100 text-blue-700"
                        : order.status === "Packed"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setNewStatus(order.status);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-600">
          No orders found for the selected status.
        </div>
      )}
    </div>
  );
};

export default OrderManagementPage;
