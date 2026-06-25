import UserModel from "../model/User.models.js";
import { generateAccessAndRefreshTokens } from "../utils/generateTokens.js";
import { accessTokenCookieOptions, clearAccessTokenCookieOptions } from "../utils/cookieOptions.js";

const userPublicFields = "-password -refreshToken";

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const existingUser = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const user = await UserModel.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      authProvider: "local",
    });

    const { accessToken } = await generateAccessAndRefreshTokens(user._id);
    const safeUser = await UserModel.findById(user._id).select(userPublicFields);

    return res
      .status(201)
      .cookie("accessToken", accessToken, accessTokenCookieOptions())
      .json({
        success: true,
        message: "Account created successfully.",
        data: { user: safeUser },
      });
  } catch (error) {
    console.error("register:", error);
    return res.status(500).json({
      success: false,
      message: "Could not create account. Please try again.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const valid = await user.isPasswordCorrect(password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const { accessToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await UserModel.findById(user._id).select(userPublicFields);

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessTokenCookieOptions())
      .json({
        success: true,
        message: "Signed in successfully.",
        data: { user: loggedInUser },
      });
  } catch (error) {
    console.error("login:", error);
    return res.status(500).json({
      success: false,
      message: "Could not sign in. Please try again.",
    });
  }
};

const currentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Current user",
    data: req.user,
  });
};

const logoutUser = async (req, res) => {
  try {
    await UserModel.findByIdAndUpdate(req.user?._id, { $unset: { refreshToken: 1 } });

    return res
      .status(200)
      .clearCookie("accessToken", clearAccessTokenCookieOptions())
      .json({
        success: true,
        message: "Signed out successfully.",
      });
  } catch (error) {
    console.error("logout:", error);
    return res.status(500).json({
      success: false,
      message: "Could not sign out.",
    });
  }
};

export { register, login, logoutUser, currentUser };
