const express = require("express");
const router = express.Router();

const {
  loginOrSignup,
  sendOTP,
  verifyOTP,
  getCurrentUser   
} = require("../modules/user/user.controller")

console.log({
  loginOrSignup,
  sendOTP,
  verifyOTP,
  getCurrentUser
});

const authMiddleware = require("../middleware/auth.middleware");



router.post("/login", loginOrSignup);
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);



router.get("/me", authMiddleware, getCurrentUser);  

module.exports = router;