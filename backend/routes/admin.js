const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth");

const {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
} = require("../controllers/adminController");

const router = express.Router();

router.get(
  "/dashboard",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getDashboardStats
);

router.get(
  "/users",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAllUsers
);

router.patch(
  "/users/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateUserStatus
);

module.exports = router;