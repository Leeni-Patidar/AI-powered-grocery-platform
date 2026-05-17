import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import 'dotenv/config';
import userRouter from './routes/userRoute.js';
import sellerRouter from './routes/sellerRoute.js';
import connectCloudinary from './configs/cloudinary.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import addressRouter from './routes/addressRoute.js';
import orderRouter from './routes/orderRoute.js';
import couponRouter from './routes/couponRoute.js';
import inventoryRouter from './routes/inventoryRoute.js';
import paymentRouter from './routes/paymentRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import {
  apiLimiter,
  csrfProtection,
  csrfTokenHandler,
  mongoSanitize,
  securityHeaders,
  xssProtection,
} from './middlewares/security.js';



const app = express();
const port = process.env.PORT || 4000;
await connectDB();
await connectCloudinary();


//Allow multiple origin
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

//Middleware configuration
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(apiLimiter);
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials:true}));
app.get('/api/csrf-token', csrfTokenHandler);
app.use(csrfProtection);
app.use(mongoSanitize);
app.use(xssProtection);

app.get('/', (req, res) => res.send("API is Working"));
app.use('/api/user',userRouter)
app.use('/api/seller',sellerRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/address',addressRouter)
app.use('/api/order', orderRouter)
app.use('/api/payment', paymentRouter)
app.use('/api/coupon', couponRouter)
app.use('/api/inventory', inventoryRouter)
app.use('/api/category', categoryRouter)

app.listen(port, ()=>{

console.log(`Server is running on http://localhost:${port}`)

});
