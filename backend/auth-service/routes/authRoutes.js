const express = require("express");

const {
  register,
  verifyEmail,
  resendEmailOtp,
  login,
  forgotPassword,
  resetPassword,
  me,
  updateLocation,
  getAllUsers,
  getDeliveryPartners,
  blockUserByAdmin,
  unblockUserByAdmin,
} = require("../controllers/authController");

const { protect, adminOnly, hotelOrAdminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes working",
  });
});

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-email-otp", resendEmailOtp);

router.post("/login", login);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, me);
router.put("/location", protect, updateLocation);
router.get("/delivery-partners", protect, hotelOrAdminOnly, getDeliveryPartners);

router.get("/admin/users", protect, adminOnly, getAllUsers);
router.patch("/admin/users/:userId/block", protect, adminOnly, blockUserByAdmin);
router.patch(
  "/admin/users/:userId/unblock",
  protect,
  adminOnly,
  unblockUserByAdmin,
);

module.exports = router;
