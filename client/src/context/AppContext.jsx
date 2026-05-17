import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    const [wishlist, setWishlist] = useState([])
    const [recentlyViewed, setRecentlyViewed] = useState([])
    const [productFilters, setProductFilters] = useState({ categories: [], subcategories: [], brands: [] })
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

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
                setWishlist((data.user.wishlist || []).map((item) => item._id || item))
            } else {
                setUser(null)
                setCartItems({})
                setWishlist([])
                setRecentlyViewed([])
            }
        } catch (error) {
            setUser(null)
            setWishlist([])
            setRecentlyViewed([])
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

    const fetchProductFilters = async () => {
        try {
            const { data } = await axios.get('/api/product/filters')
            if (data.success) {
                setProductFilters({
                    categories: data.categories || [],
                    subcategories: data.subcategories || [],
                    brands: data.brands || [],
                })
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchWishlist = async () => {
        if (!user) return
        try {
            const { data } = await axios.get('/api/product/wishlist')
            if (data.success) {
                setWishlist((data.wishlist || []).map((item) => item._id))
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const toggleWishlist = async (productId) => {
        if (!user) {
            setShowUserLogin(true)
            return
        }

        try {
            const { data } = await axios.post('/api/product/wishlist/toggle', { productId })
            if (data.success) {
                setWishlist(data.wishlist || [])
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const fetchRecentlyViewed = async () => {
        if (!user) return
        try {
            const { data } = await axios.get('/api/product/recently-viewed')
            if (data.success) {
                setRecentlyViewed(data.products || [])
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const trackRecentlyViewed = async (productId) => {
        if (!user || !productId) return
        try {
            await axios.post('/api/product/recently-viewed', { productId })
            fetchRecentlyViewed()
        } catch (error) {
            console.log(error.message)
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
        fetchProductFilters()
        fetchSeller()
        fetchUser()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery.trim())
        }, 400)

        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        if (user) {
            fetchWishlist()
            fetchRecentlyViewed()
        } else {
            setWishlist([])
            setRecentlyViewed([])
        }
    }, [user])

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

const value = {
    navigate, user, setUser, setIsSeller, isSeller, ShowUserLogin, setShowUserLogin,
    products, productFilters, wishlist, recentlyViewed, currency, addToCart,
    updateCartItem, removeFromCart, cartItems, searchQuery, debouncedSearchQuery, setSearchQuery,
    getCartCount, getCartAmount, axios, fetchProducts, fetchWishlist,
    toggleWishlist, fetchRecentlyViewed, trackRecentlyViewed, setCartItems
}


return <AppContext.Provider value={value}>
    {children}
</AppContext.Provider>
}

export const useAppContext = () => {
    return useContext(AppContext)
}
