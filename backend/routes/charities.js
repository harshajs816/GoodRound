
const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth");

const {
  getPublicCharities,
  getAllCharities,
  createCharity,
  updateCharity,
  verifyCharity,
  updateCharityStatus,
} = require("../controllers/charityController");

const router = express.Router();

// Public directory
router.get("/", getPublicCharities);

// Admin-only routes
router.get(
  "/admin/all",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAllCharities
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles("ADMIN"),
  createCharity
);

// Fix: verify route was missing — now registered
router.patch(
  "/:id/verify",
  authenticateToken,
  authorizeRoles("ADMIN"),
  verifyCharity
);

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateCharityStatus
);

// Edit charity (name, description, urls, etc.)
router.patch(
  "/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateCharity
);

module.exports = router;
