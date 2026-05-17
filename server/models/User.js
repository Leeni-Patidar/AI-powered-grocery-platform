import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/\S+@\S+\.\S+/, 'Please enter a valid email']
  },
  password: { type: String },
  googleId: { type: String },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  refreshTokens: { type: [tokenSchema], default: [] },
  cartItems: { type: Object, default: {} },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  recentlyViewed: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    viewedAt: { type: Date, default: Date.now },
  }],
}, { minimize: false });

const User = mongoose.models.user || mongoose.model('user', userSchema);

export default User;
