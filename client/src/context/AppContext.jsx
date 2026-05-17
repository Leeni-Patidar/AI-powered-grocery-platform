import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dummyProducts } from "../assets/assets";
import toast from "react-hot-toast";
import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL;

let csrfToken;
let csrfTokenRequest;

const getCsrfToken = async () => {
    if (csrfToken) return csrfToken;

    if (!csrfTokenRequest) {
        csrfTokenRequest = axios
            .get('/api/csrf-token', { skipCsrfToken: true })
            .then(({ data }) => {
                csrfToken = data.csrfToken;
                return csrfToken;
            })
            .finally(() => {
                csrfTokenRequest = null;
            });
    }

    return csrfTokenRequest;
};

axios.interceptors.request.use(async (config) => {
    if (config.skipCsrfToken) return config;

    const method = (config.method || 'get').toUpperCase();
    const url = config.url || '';
    const shouldAttachCsrf =
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || url.endsWith('/logout');

    if (shouldAttachCsrf) {
        config.headers = config.headers || {};
        config.headers['X-CSRF-Token'] = await getCsrfToken();
    }

    return config;
});

axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 403 &&
            error.response?.data?.code === 'CSRF_TOKEN_INVALID' &&
            originalRequest &&
            !originalRequest._csrfRetry
        ) {
            originalRequest._csrfRetry = true;
            csrfToken = null;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers['X-CSRF-Token'] = await getCsrfToken();
            return axios(originalRequest);
        }

        return Promise.reject(error);
    }
);

export const AppContext = createContext();
export const AppContextProvider = ({ children }) => {

    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isSeller, setIsSeller] = useState(false);
    const [ShowUserLogin, setShowUserLogin] = useState(false)
    const [products, setProducts] = useState([])
    const [cartItems, setCartItems] = useState({})
    const [searchQuery, setSearchQuery] = useState({})

    // Fetch Seller Status
    const fetchSeller = async () => {
        try {
            const { data } = await axios.get('/api/seller/is-auth');
            if (data.success) {
                setIsSeller(true)
            } else {
                setIsSeller(false)
            }
        } catch (error) {
            setIsSeller(false)
        }
    }


    // Fetch user Auth Status , user data and cart item

    const fetchUser = async () => {
        try {
            const { data } = await axios.get('/api/user/is-auth');
            if (data.success) {
                setUser(data.user)
                setCartItems(data.user.cartItems || {})
            } else {
                setUser(null)
                setCartItems({})
            }
        } catch (error) {
            setUser(null)
        }
    }

    //Fetch All Products 
    const fetchProducts = async () => {
        try {
            const { data } = await axios.get('/api/product/list')
            if (data.success) {
                setProducts(data.products)
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //Add Product to Cart
    const addToCart = (itemId) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartData[itemId] += 1;
        } else {
            cartData[itemId] = 1;
        }
        setCartItems(cartData);
        toast.success("Added to Cart")
    }

    //Update Cart Item Quantity
    const updateCartItem = (itemId, quantity) => {
        let cartData = structuredClone(cartItems);
        cartData[itemId] = quantity;
        setCartItems(cartData)
        toast.success("Cart Updated")
    }
    // remove product frm cart
    const removeFromCart = (itemId) => {
        let cartData = structuredClone(cartItems);
        if (cartData[itemId]) {
            cartItems[itemId] -= 1;
            if (cartItems[itemId] === 0) {
                delete cartData[itemId];
            }
        }
        toast.success("Removed from Cart")
        setCartItems(cartData)
    }

    // get cart item count
    const getCartCount = () => {
        let totalCount = 0;
        for (const item in cartItems) {
            totalCount += cartItems[item];
        }
        return totalCount;
    }

    //get cart total amount
    const getCartAmount = () => {
        let totalAmount = 0;
        for (const items in cartItems) {
            let itemInfo = products.find((product) => product._id === items);
            if (cartItems[items] > 0) {
                totalAmount += itemInfo.offerPrice * cartItems[items]
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }


    useEffect(() => {
        fetchProducts()
        fetchSeller()
        fetchUser()
    }, [])

    // update database cart items

    useEffect(() => {
        const updateCart = async () => {
            try {
                const { data} = await axios.post('/api/cart/update', { cartItems })
    if (!data.success) {
        toast.error(data.message)
    }
    } catch (error) {
        toast.error(error.message)
    }
}
if (user) {
    updateCart()
}
}, [cartItems])

const value = { navigate, user, setUser, setIsSeller, isSeller, ShowUserLogin, setShowUserLogin, products, currency, addToCart, updateCartItem, removeFromCart, cartItems, searchQuery, setSearchQuery, getCartCount, getCartAmount, axios, fetchProducts  , setCartItems}


return <AppContext.Provider value={value}>
    {children}
</AppContext.Provider>
}

export const useAppContext = () => {
    return useContext(AppContext)
}
