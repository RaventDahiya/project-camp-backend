import jwt from "jsonwebtoken";

export const isLoggedIn = async (req, res, next) => {
  try {
    console.log("Cookies:", req.cookies);
    let token = req.cookies?.token;
    //console.log("token found", token ? "yes" : "no");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication fail: No token",
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    //console.log("decoded:", decoded);
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Authentication fail: Invalid or expired token",
    });
  }
};
