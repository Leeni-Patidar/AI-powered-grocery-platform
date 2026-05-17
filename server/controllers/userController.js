import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  clearAuthCookies,
  createRandomToken,
  hashToken,
  issueAuthSession,
  publicUser,
  setAuthCookies,
  signAccessToken,
  signRefreshToken,
} from "../utils/authTokens.js";
import { buildClientUrl, sendAuthLink, sendOtpEmail } from "../utils/mailer.js";

const emailRegex = /\S+@\S+\.\S+/;

const adminEmail = () => process.env.ADMIN_EMAIL || process.env.SELLER_EMAIL;

const createEmailVerification = async (user) => {
  const token = createRandomToken();
  user.emailVerificationToken = hashToken(token);
  user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const verificationUrl = buildClientUrl(`/verify-email?token=${token}`);
  await sendAuthLink({
    to: user.email,
    subject: "Verify your grocery account",
    url: verificationUrl,
  });

  return { token, verificationUrl };
};

const createRegistrationOtp = async (user) => {
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  user.registrationOtp = hashToken(otp);
  user.registrationOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  await sendOtpEmail({
    to: user.email,
    subject: "Your grocery registration OTP",
    otp,
  });

  return { otp };
};

const ensurePasswordLogin = (user) => user.password && user.authProvider !== "google";

const verifyGoogleIdToken = async (credential) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Google login is not configured");
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );
  const profile = await response.json();

  if (!response.ok) {
    throw new Error(profile.error_description || "Invalid Google credential");
  }

  if (profile.aud !== process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Google credential audience mismatch");
  }

  if (!profile.email_verified) {
    throw new Error("Google email is not verified");
  }

  return profile;
};

// Register User: /api/user/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name || !normalizedEmail || !password || !emailRegex.test(normalizedEmail)) {
      return res.json({ success: false, message: "Valid name, email and password are required" });
    }

    if (password.length < 6) {
      return res.json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = normalizedEmail === adminEmail() ? "admin" : "customer";
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      authProvider: "local",
      isEmailVerified: false,
    });

    const otpDetails = await createRegistrationOtp(user);
    await issueAuthSession(res, user);

    return res.json({
      success: true,
      message: "Account created. Please verify your email with the OTP sent to your inbox.",
      user: publicUser(user),
      ...(process.env.NODE_ENV !== "production" && {
        registrationOtp: otpDetails.otp,
      }),
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Login user: /api/user/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !ensurePasswordLogin(user)) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isEmailVerified) {
      return res.json({ success: false, message: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: "Invalid email or password" });
    }

    await issueAuthSession(res, user);
    return res.json({ success: true, message: "Logged In", user: publicUser(user) });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Google Login: /api/user/google
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.json({ success: false, message: "Google credential is required" });
    }

    const profile = await verifyGoogleIdToken(credential);
    const normalizedEmail = profile.email.trim().toLowerCase();
    const userRole = normalizedEmail === adminEmail() ? "admin" : "customer";

    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = await User.create({
        name: profile.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId: profile.sub,
        authProvider: "google",
        role: userRole,
        isEmailVerified: true,
      });
    } else {
      user.googleId = user.googleId || profile.sub;
      user.isEmailVerified = true;
      user.role = user.role || userRole;
      if (!user.password) user.authProvider = "google";
      await user.save();
    }

    await issueAuthSession(res, user);
    return res.json({ success: true, message: "Logged In with Google", user: publicUser(user) });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Refresh session: /api/user/refresh-token
export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.json({ success: false, message: "Refresh token missing" });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== "refresh") {
      return res.json({ success: false, message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.id);
    const tokenHash = hashToken(token);
    const storedToken = user?.refreshTokens?.find(
      (entry) => entry.tokenHash === tokenHash && entry.expiresAt > new Date()
    );

    if (!user || !storedToken) {
      clearAuthCookies(res);
      return res.json({ success: false, message: "Refresh token expired" });
    }

    user.refreshTokens = user.refreshTokens.filter((entry) => entry.tokenHash !== tokenHash);
    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    user.refreshTokens.push({
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await user.save();
    setAuthCookies(res, accessToken, newRefreshToken);

    return res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    clearAuthCookies(res);
    return res.json({ success: false, message: error.message });
  }
};

// Check Auth : /api/user/is-auth
export const isAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshTokens -emailVerificationToken -passwordResetToken");
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Logout User : /api/user/logout
export const logout = async (req, res) => {
  try {
    const refreshTokenValue = req.cookies.refreshToken;
    if (refreshTokenValue && req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { refreshTokens: { tokenHash: hashToken(refreshTokenValue) } },
      });
    }
    clearAuthCookies(res);
    return res.json({ success: true, message: "Logged Out" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Verify Email: /api/user/verify-email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.json({ success: false, message: "Verification token is required" });
    }

    let user;
    if (/^\d{6}$/.test(token)) {
      user = await User.findOne({
        registrationOtp: hashToken(token),
        registrationOtpExpires: { $gt: new Date() },
      });
    } else {
      user = await User.findOne({
        emailVerificationToken: hashToken(token),
        emailVerificationExpires: { $gt: new Date() },
      });
    }

    if (!user) {
      return res.json({ success: false, message: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.registrationOtp = undefined;
    user.registrationOtpExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Email verified", user: publicUser(user) });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Resend Verification: /api/user/resend-verification
export const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.json({ success: true, message: "Email is already verified" });
    }

    const otpDetails = await createRegistrationOtp(user);
    return res.json({
      success: true,
      message: "Verification OTP sent",
      ...(process.env.NODE_ENV !== "production" && {
        registrationOtp: otpDetails.otp,
      }),
    });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Forgot Password: /api/user/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && user.password) {
      const token = createRandomToken();
      user.passwordResetToken = hashToken(token);
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = buildClientUrl(`/reset-password?token=${token}`);
      await sendAuthLink({
        to: user.email,
        subject: "Reset your grocery account password",
        url: resetUrl,
      });

      return res.json({
        success: true,
        message: "Password reset link sent",
        ...(process.env.NODE_ENV !== "production" && { resetToken: token, resetUrl }),
      });
    }

    return res.json({ success: true, message: "Password reset link sent" });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Reset Password: /api/user/reset-password
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.json({ success: false, message: "Valid token and password are required" });
    }

    const user = await User.findOne({
      passwordResetToken: hashToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.json({ success: false, message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.authProvider = "local";
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = [];
    await user.save();
    clearAuthCookies(res);

    return res.json({ success: true, message: "Password updated. Please log in." });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};
