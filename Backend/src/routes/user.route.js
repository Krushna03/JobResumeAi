import express from "express";
import { currentUser, login, logoutUser, register } from "../controller/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { verifyGoogleToken } from "../controller/google.auth.controller.js";

const router = express.Router();

router.route("/register").post(authLimiter, register);
router.route("/login").post(authLimiter, login);
router.route("/google").post(authLimiter, verifyGoogleToken);
router.route("/google/callback").get(authLimiter, verifyGoogleToken);
router.route("/me").get(verifyJWT, currentUser);
router.route("/getCurrentUser").get(verifyJWT, currentUser);
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
