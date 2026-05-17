import { useEffect, useState } from "react"
import { useAppContext } from "../context/AppContext"
import { assets } from "../assets/assets"
import toast from "react-hot-toast";
import axios from 'axios';
import CouponSystem from "../components/CouponSystem";

const Cart = () => {
    const { products, currency, cartItems, removeFromCart, getCartCount, updateCArtItem, navigate, getCartAmount, user, setCartItems } = useAppContext()

    const [cartArray, setCartArray] = useState([])
    const [addresses, setAddresses] = useState([])
    const [showAddress, setShowAddress] = useState(false)
    const [selectedAddress, setSelectedAddress] = useState(null)
    const [paymentOption, setPaymentOption] = useState("COD")
    const [appliedCoupon, setAppliedCoupon] = useState(null)
    const [loading, setLoading] = useState(false)

    const getCart = () => {
        let tempArray = []
        for (const key in cartItems) {
            const product = products.find((item) => item._id === key)
            if (product) {
                product.quantity = cartItems[key]
                tempArray.push(product)
            }
        }
        setCartArray(tempArray)
    }

    const getUserAddress = async () => {
        try {
            const { data } = await axios.get('/api/address/get');
            if (data.success) {
                setAddresses(data.addresses)
                if (data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0])
                }
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const calculateTotal = () => {
        const subtotal = getCartAmount()
        const tax = Math.floor(subtotal * 0.02)
        const discount = appliedCoupon ? appliedCoupon.discount : 0
        return {
            subtotal,
            tax,
            discount,
            total: Math.max(0, subtotal + tax - discount)
        }
    }

    const loadRazorpayScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement('script')
            script.src = src
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })
    }

    const placeOrder = async () => {
        try {
            if (!selectedAddress) {
                return toast.error("Please select the Address")
            }

            if (!user) {
                return toast.error("Please login to place order")
            }

            setLoading(true)

            const items = cartArray.map(item => ({
                product: item._id,
                quantity: item.quantity
            }))

            const orderData = {
                userId: user._id,
                items,
                address: selectedAddress._id,
                ...(appliedCoupon && { couponCode: appliedCoupon.code })
            }

            if (paymentOption === "COD") {
                const { data } = await axios.post('/api/order/cod', orderData)
                if (data.success) {
                    toast.success(data.message)
                    setCartItems({})
                    setAppliedCoupon(null)
                    navigate('/my-orders')
                } else {
                    toast.error(data.message)
                }
            } else {
                const { data } = await axios.post('/api/payment/create-order', {
                    items,
                    couponCode: appliedCoupon?.code || undefined,
                })

                if (!data.success) {
                    throw new Error(data.message || 'Unable to create payment order');
                }

                const scriptLoaded = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
                if (!scriptLoaded) {
                    throw new Error('Unable to load Razorpay checkout');
                }

                const options = {
                    key: data.key,
                    amount: data.order.amount,
                    currency: data.order.currency,
                    name: 'Grocery Platform',
                    description: 'Complete payment for your grocery order',
                    order_id: data.order.id,
                    handler: async (response) => {
                        try {
                            const verifyResponse = await axios.post('/api/payment/verify', {
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                                items,
                                address: selectedAddress._id,
                                couponCode: appliedCoupon?.code || undefined,
                            });

                            if (verifyResponse.data.success) {
                                toast.success(verifyResponse.data.message);
                                setCartItems({});
                                setAppliedCoupon(null);
                                navigate('/my-orders');
                            } else {
                                toast.error(verifyResponse.data.message || 'Payment verification failed');
                            }
                        } catch (verifyError) {
                            toast.error(verifyError.response?.data?.message || verifyError.message || 'Payment verification failed');
                        } finally {
                            setLoading(false);
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                    },
                    theme: {
                        color: '#2563eb',
                    },
                    modal: {
                        ondismiss: () => {
                            setLoading(false);
                        },
                    },
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.open();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Unable to complete order');
            setLoading(false);
        }
    }

    const handleCouponApply = (coupon) => {
        setAppliedCoupon(coupon)
    }

    useEffect(() => {
        if (products.length > 0 && cartItems) {
            getCart()
        }
    }, [products, cartItems])

    useEffect(() => {
        if (user) {
            getUserAddress()
        }
    }, [user])

    const { subtotal, tax, discount, total } = calculateTotal()

    return products.length > 0 && Object.keys(cartItems).length > 0 ? (
        <div className="flex flex-col md:flex-row mt-16 px-4">
            <div className='flex-1 max-w-4xl'>
                <h1 className="text-3xl font-medium mb-6">
                    Shopping Cart <span className="text-sm text-primary">{getCartCount()} Items</span>
                </h1>

                <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 text-base font-medium pb-3">
                    <p className="text-left">Product Details</p>
                    <p className="text-center">Subtotal</p>
                    <p className="text-center">Action</p>
                </div>

                {cartArray.map((product, index) => (
                    <div key={index} className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 items-center text-sm md:text-base font-medium pt-3">
                        <div className="flex items-center md:gap-6 gap-3">
                            <div onClick={() => { navigate(`/products/${product.category.toLowerCase()}/${product._id}`); scrollTo(0, 0) }} className="cursor-pointer w-24 h-24 flex items-center justify-center border border-gray-300 rounded">
                                <img className="max-w-full h-full object-cover" src={product.image[0]} alt={product.name} />
                            </div>
                            <div>
                                <p className="hidden md:block font-semibold">{product.name}</p>
                                <div className="font-normal text-gray-500/70">
                                    <p>Weight: <span>{product.weight || "N/A"}</span></p>
                                    <div className='flex items-center'>
                                        <p>Qty:</p>
                                        <select onChange={e => updateCArtItem(product._id, Number(e.target.value))}
                                            value={cartItems[product._id]} className='outline-none'>
                                            {Array(cartItems[product._id] > 9 ? cartItems[product._id] : 9).fill('').map((_, index) => (
                                                <option key={index} value={index + 1}>{index + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center">{currency}{product.offerPrice * product.quantity}</p>
                        <button
                            onClick={() => removeFromCart(product._id)}
                            className="cursor-pointer mx-auto"
                        >
                            <img src={assets.remove_icon}
                                alt="remove" className="inline-block w-6 h-6"
                            />
                        </button>
                    </div>)
                )}

                <button
                    onClick={() => {
                        navigate("/products");
                        scrollTo(0, 0);
                    }}
                    className="group cursor-pointer flex items-center mt-8 gap-2 text-primary font-medium"
                >
                    <img className="group-hover:translate-x-1 transition"
                        src={assets.arrow_right_icon_colored}
                        alt="arrow"
                    />
                    Continue Shopping
                </button>
            </div>

            <div className="max-w-[360px] w-full bg-gray-100/40 p-5 max-md:mt-16 border border-gray-300/70 h-fit">
                <h2 className="text-xl md:text-xl font-medium">Order Summary</h2>
                <hr className="border-gray-300 my-5" />

                <div className="mb-6">
                    <p className="text-sm font-medium uppercase">Delivery Address</p>
                    <div className="relative flex justify-between items-start mt-2">
                        <p className="text-gray-500 text-xs">
                            {selectedAddress
                                ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}`
                                : "No address found"}
                        </p>
                        <button
                            onClick={() => setShowAddress(!showAddress)}
                            className="text-primary hover:underline cursor-pointer text-xs whitespace-nowrap ml-2"
                        >
                            Change
                        </button>

                        {showAddress && (
                            <div className="absolute top-12 py-1 bg-white border border-gray-300 text-sm w-full z-10">
                                {addresses.map((address, index) => (
                                    <p key={index} onClick={() => { setSelectedAddress(address); setShowAddress(false) }} className="text-gray-500 p-2 hover:bg-gray-100 cursor-pointer text-xs">
                                        {address.street},{address.city},{address.state},{address.country}
                                    </p>
                                ))}
                                <p onClick={() => navigate("/add-address")} className="text-primary text-center cursor-pointer p-2 hover:bg-primary/10 text-xs">
                                    Add address
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-sm font-medium uppercase mt-6">Payment Method</p>
                    <select onChange={e => setPaymentOption(e.target.value)} className="w-full border border-gray-300 bg-white px-3 py-2 mt-2 outline-none text-sm">
                        <option value="COD">Cash On Delivery</option>
                        <option value="Online">Online Payment</option>
                    </select>
                </div>

                {/* Coupon System */}
                <CouponSystem 
                    orderAmount={subtotal} 
                    onCouponApply={handleCouponApply}
                    currency={currency}
                />

                <hr className="border-gray-300 my-4" />

                <div className="text-gray-500 mt-4 space-y-2 text-sm">
                    <p className="flex justify-between">
                        <span>Price</span><span>{currency}{subtotal}</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Shipping Fee</span><span className="text-green-600">Free</span>
                    </p>
                    <p className="flex justify-between">
                        <span>Tax (2%)</span><span>{currency}{tax}</span>
                    </p>
                    {discount > 0 && (
                        <p className="flex justify-between text-green-600">
                            <span>Discount</span><span>-{currency}{discount}</span>
                        </p>
                    )}
                    <p className="flex justify-between text-lg font-medium mt-3 text-gray-700">
                        <span>Total Amount:</span><span>{currency}{total}</span>
                    </p>
                </div>

                <button 
                    onClick={placeOrder}
                    disabled={loading}
                    className="w-full py-3 mt-6 cursor-pointer bg-primary text-white font-medium hover:bg-primary-dull transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Processing..." : paymentOption === "COD" ? "Place Order" : "Proceed to Checkout"}
                </button>
            </div>
        </div>
    ) : (
        <div className="flex flex-col items-center justify-center mt-16 pb-16 px-4">
            <h1 className="text-2xl font-medium mb-4">Your Cart is Empty</h1>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <button
                onClick={() => {
                    navigate("/products");
                    scrollTo(0, 0);
                }}
                className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dull transition"
            >
                Continue Shopping
            </button>
        </div>
    )
}

export default Cart;