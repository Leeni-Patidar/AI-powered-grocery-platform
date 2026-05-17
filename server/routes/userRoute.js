import express from 'express';
import {
  forgotPassword,
  googleLogin,
  isAuth,
  login,
  logout,
  refreshToken,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';

const userRouter = express.Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.post('/google', googleLogin);
userRouter.post('/refresh-token', refreshToken);
userRouter.post('/verify-email', verifyEmail);
userRouter.post('/resend-verification', authUser, resendVerification);
userRouter.post('/forgot-password', forgotPassword);
userRouter.post('/reset-password', resetPassword);
userRouter.get('/is-auth', authUser, isAuth);
userRouter.get('/logout', authUser, logout);

export default userRouter;
