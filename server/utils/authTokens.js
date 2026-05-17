import crypto from "crypto";
import jwt from "jsonwebtoken";

const isProduction = process.env.NODE_ENV === "production";
const accessCookieName = "accessToken";
const refreshCookieName = "refreshToken";

export const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "strict",
  path: "/",
  maxAge,
});

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const createRandomToken = () => crypto.randomBytes(32).toString("hex");

export const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  cartItems: user.cartItems,
  wishlist: user.wishlist || [],
  recentlyViewed: user.recentlyViewed || [],
});

export const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role, type: "access" },
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m" }
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      type: "refresh",
      jti: createRandomToken(),
    },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" }
  );

export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(accessCookieName, accessToken, cookieOptions(15 * 60 * 1000));
  res.cookie(refreshCookieName, refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
  res.cookie("token", accessToken, cookieOptions(15 * 60 * 1000));
};

export const clearAuthCookies = (res) => {
  const options = cookieOptions(0);
  res.clearCookie(accessCookieName, options);
  res.clearCookie(refreshCookieName, options);
  res.clearCookie("token", options);
};

export const attachRefreshToken = async (user, refreshToken) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.refreshTokens = [
    ...(user.refreshTokens || []).filter((token) => token.expiresAt > new Date()),
    { tokenHash: hashToken(refreshToken), expiresAt },
  ].slice(-5);
  await user.save();
};

export const issueAuthSession = async (res, user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await attachRefreshToken(user, refreshToken);
  setAuthCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
};
