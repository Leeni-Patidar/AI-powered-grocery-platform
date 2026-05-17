import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import axios from 'axios';
import toast from "react-hot-toast";
import OrderTracking from '../components/OrderTracking';

const MyOrders = () => {
  const [myOrders, setMyOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { currency, user } = useAppContext();

  const fetchMyOrders = async () => {
    try {
      const { data } = await axios.post('/api/order/user', { userId: user._id });
      if (data.success) {
        setMyOrders(data.orders);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch orders");
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyOrders();
    }
  }, [user]);

  return (
    <div className='mt-16 pb-16 px-4'>
      <div className='flex flex-col items-end w-max mb-8'>
        <p className='text-2xl font-medium uppercase'>My orders</p>
        <div className='w-16 h-0.5 bg-primary rounded-full'></div>
      </div>

      {myOrders.length === 0 ? (
        <div className='text-center py-12 text-gray-500'>
          <p className='text-lg'>No orders found</p>
          <p className='text-sm'>Start shopping to place your first order</p>
        </div>
      ) : (
        <>
          {myOrders.map((order) => (
            <div key={order._id} className='border border-gray-300 rounded-lg mb-10 p-4 py-5 max-w-4xl'>
              <div className='flex justify-between md:items-center text-gray-400 md:font-medium max-md:flex-col mb-4'>
                <span>Order Id: {order._id.slice(-8)}</span>
                <span>Payment: {order.paymentType}</span>
                <span>Total: {currency}{order.finalAmount || order.amount}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.status === 'Delivered'
                    ? 'bg-green-100 text-green-700'
                    : order.status === 'Cancelled'
                    ? 'bg-red-100 text-red-700'
                    : order.status === 'Out for Delivery'
                    ? 'bg-orange-100 text-orange-700'
                    : order.status === 'Shipped'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {order.status}
                </span>
              </div>

              {order.items.map((item, index) => (
                <div
                  key={index}
                  className={`relative bg-white text-gray-500/70 ${
                    order.items.length !== index + 1 && "border-b"
                  } border-gray-300 flex flex-col md:flex-row md:items-center justify-between p-4 md:gap-16 w-full`}
                >
                  <div className='flex items-center mb-4 md:mb-0'>
                    <div className='bg-primary/10 p-4 rounded-lg'>
                      <img src={item.product?.image?.[0]} alt='' className='w-16 h-16 object-cover' />
                    </div>
                    <div className='ml-4'>
                      <h2 className='text-xl font-medium text-gray-800'>{item.product?.name || 'Product'}</h2>
                      <p>Category: {item.product?.category || 'N/A'}</p>
                    </div>
                  </div>

                  <div className='flex flex-col justify-center md:ml-8 mb-4 md:mb-0'>
                    <p>Quantity: {item.quantity}</p>
                    <p>Price: {currency}{item.price}</p>
                    <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>

                  <p className='text-primary text-lg font-medium'>
                    {currency}{item.quantity * item.price}
                  </p>
                </div>
              ))}

              {/* Discount Info */}
              {order.discountAmount > 0 && (
                <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded'>
                  <p className='text-sm text-gray-700'>
                    Discount Applied: <span className='font-semibold text-green-600'>-{currency}{order.discountAmount}</span>
                  </p>
                </div>
              )}

              {/* Tracking Button */}
              <button
                onClick={() => setSelectedOrderId(order._id === selectedOrderId ? null : order._id)}
                className='mt-4 bg-primary text-white px-4 py-2 rounded hover:bg-primary-dull transition'
              >
                {selectedOrderId === order._id ? 'Hide Tracking' : 'View Tracking'}
              </button>

              {/* Order Tracking */}
              {selectedOrderId === order._id && (
                <div className='mt-4'>
                  <OrderTracking orderId={order._id} />
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default MyOrders;
