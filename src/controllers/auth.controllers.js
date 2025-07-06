import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import {
  sendMail,
  forgotPasswordMailGenContent,
  emailVerificationMailGenContent,
} from "../utils/mail.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role, fullname } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw new ApiError(400, "user already exist");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour from now

  const newUser = await User.create({
    email,
    username,
    password,
    role,
    fullname,
    emailVerificationToken: token,
    emailVerificationExpiry: expiry,
  });

  await sendMail({
    email: newUser.email,
    subject: "your verification token",
    mailGenContent: emailVerificationMailGenContent(
      newUser.username,
      `${process.env.CORS_ORIGIN}/api/v1/users/verify/${token}`,
    ),
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        _id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        fullname: newUser.fullname,
      },
      "User registered successfully",
    ),
  );
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    throw new ApiError(400, "Invalid token");
  }
  const user = await User.findOne({ emailVerificationToken: token });

  if (!user) {
    throw new ApiError(400, "Invalid token");
  }

  if (user.emailVerificationExpiry < Date.now()) {
    throw new ApiError(400, "Verification token expired");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = "";
  user.emailVerificationExpiry = null;
  await user.save();
  res.status(201).json(new ApiResponse(201, {}, "User verified successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "invalid user or password");
  }
  if (!user.isEmailVerified) {
    throw new ApiError(400, "user not verified");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, "wrong password");
  }

  // Generate access token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  // Generate refresh token
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  };

  res.cookie("token", token, cookieOptions);
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  }); // 7 days

  res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      },
      "login successful",
    ),
  );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Remove refreshToken from DB
  await User.findByIdAndUpdate(req.user.id, { refreshToken: "" });

  // Clear cookies
  res.clearCookie("token");
  res.clearCookie("refreshToken");

  res.status(200).json(new ApiResponse(200, {}, "Logout successful"));
});

const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "invalid user or password");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, "wrong password");
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, "user already verified");
  }

  // Generate new token and expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour from now
  user.emailVerificationToken = token;
  user.emailVerificationExpiry = expiry;
  await user.save();

  // Send email
  await sendMail({
    email: user.email,
    subject: "Your verification token",
    mailGenContent: emailVerificationMailGenContent(
      user.username,
      `${process.env.CORS_ORIGIN}/api/v1/users/verify/${token}`,
    ),
  });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
        },
      },
      "Resent verification email",
    ),
  );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  // Find user with this refresh token
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, "Refresh token expired or invalid");
  }

  // Issue new access token
  const newAccessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  // Optionally, issue a new refresh token (token rotation)
  // const newRefreshToken = user.generateRefreshToken();
  // user.refreshToken = newRefreshToken;
  // await user.save();
  // res.cookie("refreshToken", newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.cookie("token", newAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, { token: newAccessToken }, "Access token refreshed"),
    );
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "invalid user");
  }

  // Generate random token and expiry
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = Date.now() + 60 * 60 * 1000; // 1 hour from now
  user.forgotPasswordToken = token;
  user.forgotPasswordExpiry = expiry;
  await user.save();

  await sendMail({
    email: user.email,
    subject: "Your password reset link",
    mailGenContent: forgotPasswordMailGenContent(
      user.username,
      `${process.env.CORS_ORIGIN}/api/v1/users/changePassword/${token}`,
    ),
  });

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset link sent to your email"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!token) {
    throw new ApiError(400, "Invalid token");
  }
  const user = await User.findOne({ forgotPasswordToken: token });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token");
  }
  if (user.forgotPasswordExpiry < Date.now()) {
    throw new ApiError(400, "Reset token expired");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  user.password = newPassword; // Will be hashed by pre-save hook
  user.forgotPasswordToken = "";
  user.forgotPasswordExpiry = null;
  await user.save();

  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { email, password, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "invalid user");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, "wrong password");
  }
  if (!user.isEmailVerified) {
    throw new ApiError(400, "user not verified please verify user first");
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json(new ApiResponse(200, { email }, "Password changed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {});

export {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  resendVerificationEmail,
  refreshAccessToken,
  forgotPasswordRequest,
  changeCurrentPassword,
  getCurrentUser,
  changePassword,
};
