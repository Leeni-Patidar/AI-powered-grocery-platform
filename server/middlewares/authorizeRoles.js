const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.json({ success: false, message: "Forbidden" });
  }

  next();
};

export default authorizeRoles;
