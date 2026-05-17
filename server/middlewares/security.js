import crypto from "crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { clean as cleanXss } from "xss-clean/lib/xss.js";

const isProduction = process.env.NODE_ENV === "production";
const csrfCookieName = "XSRF-TOKEN";
const csrfHeaderName = "x-csrf-token";
const csrfSecret =
  process.env.CSRF_SECRET ||
  process.env.JWT_SECRET ||
  "development-csrf-secret-change-me";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const signToken = (nonce) =>
  crypto.createHmac("sha256", csrfSecret).update(nonce).digest("hex");

const safeCompare = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};

const createCsrfToken = () => {
  const nonce = crypto.randomBytes(32).toString("hex");
  return `${nonce}.${signToken(nonce)}`;
};

const isValidCsrfToken = (token = "") => {
  const [nonce, signature] = token.split(".");
  if (!nonce || !signature) return false;

  return safeCompare(signature, signToken(nonce));
};

const sanitizeValue = (value, sanitizer) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, sanitizer));
  }

  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.entries(value).reduce((safeObject, [key, nestedValue]) => {
      if (key.startsWith("$") || key.includes(".")) {
        return safeObject;
      }

      safeObject[key] = sanitizeValue(nestedValue, sanitizer);
      return safeObject;
    }, {});
  }

  return sanitizer(value);
};

const mongoSanitizer = (value) => value;

const xssSanitizer = (value) =>
  typeof value === "string" ? cleanXss(value) : value;

const setSanitizedQuery = (req, sanitizer) => {
  if (!req.query) return;

  Object.defineProperty(req, "query", {
    value: sanitizeValue(req.query, sanitizer),
    configurable: true,
    enumerable: true,
    writable: true,
  });
};

export const securityHeaders = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
});

export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

export const mongoSanitize = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body, mongoSanitizer);
  if (req.params) req.params = sanitizeValue(req.params, mongoSanitizer);
  setSanitizedQuery(req, mongoSanitizer);
  next();
};

export const xssProtection = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body, xssSanitizer);
  if (req.params) req.params = sanitizeValue(req.params, xssSanitizer);
  setSanitizedQuery(req, xssSanitizer);
  next();
};

export const csrfCookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? "none" : "strict",
  path: "/",
  maxAge: 60 * 60 * 1000,
};

export const csrfTokenHandler = (req, res) => {
  const token = createCsrfToken();
  res.cookie(csrfCookieName, token, csrfCookieOptions);
  return res.json({ success: true, csrfToken: token });
};

export const csrfProtection = (req, res, next) => {
  const shouldProtect =
    unsafeMethods.has(req.method) || req.path.endsWith("/logout");

  if (!shouldProtect) {
    return next();
  }

  const requestToken = req.get(csrfHeaderName);
  const cookieToken = req.cookies?.[csrfCookieName];

  if (
    requestToken &&
    cookieToken &&
    requestToken === cookieToken &&
    isValidCsrfToken(requestToken)
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    code: "CSRF_TOKEN_INVALID",
    message: "Invalid CSRF token",
  });
};
