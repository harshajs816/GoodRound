
const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth");

const {
  getPublicCharities,
  getAllCharities,
  createCharity,
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


router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updateCharityStatus
);

module.exports = router;
