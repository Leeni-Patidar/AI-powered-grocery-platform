import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  hashToken,
  setAuthCookies,
  signAccessToken,
} from "../utils/authTokens.js";

const verifyAccessToken = (token) =>
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);

const refreshAccessToken = async (refreshToken) => {
  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
  if (decoded.type !== "refresh") return null;

  const user = await User.findById(decoded.id);
  const storedToken = user?.refreshTokens?.find(
    (entry) => entry.tokenHash === hashToken(refreshToken) && entry.expiresAt > new Date()
  );

  if (!user || !storedToken) return null;

  const accessToken = signAccessToken(user);
  return { user, accessToken };
};

const authUser = async (req, res, next) => {
  const accessToken = req.cookies.accessToken || req.cookies.token;
  const refreshToken = req.cookies.refreshToken;

  try {
    if (accessToken) {
      const tokenDecode = verifyAccessToken(accessToken);
      if (tokenDecode.type && tokenDecode.type !== "access") {
        return res.json({ success: false, message: "Not Authorized" });
      }

      req.user = {
        id: tokenDecode.id,
        email: tokenDecode.email,
        role: tokenDecode.role || "customer",
      };
      if (!req.body) req.body = {};
      req.body.userId = tokenDecode.id;
      return next();
    }

    if (refreshToken) {
      const refreshed = await refreshAccessToken(refreshToken);
      if (refreshed) {
        setAuthCookies(res, refreshed.accessToken, refreshToken);
        req.user = {
          id: refreshed.user._id,
          email: refreshed.user.email,
          role: refreshed.user.role,
        };
        if (!req.body) req.body = {};
        req.body.userId = refreshed.user._id.toString();
        return next();
      }
    }

    return res.json({ success: false, message: "Not Authorized" });
  } catch (error) {
    return res.json({ success: false, message: "Not Authorized" });
  }
};

export default authUser;
