
const express = require("express");
const {
  authenticateToken,
  authorizeRoles,
} = require("../middleware/auth");

const {
  getPublicPlans,
  getMySubscriptions,
  getAllPlans,
  createPlan,
  updatePlan,
  updatePlanStatus,
} = require("../controllers/subscriptionController");

const {createSubscription} = require("../controllers/subscriptionController");

const router = express.Router();

// Public: list active plans
router.get("/plans", getPublicPlans);

// User: subscription history
router.get("/my", authenticateToken, getMySubscriptions);

// Admin: list all plans
router.get(
  "/admin/plans",
  authenticateToken,
  authorizeRoles("ADMIN"),
  getAllPlans
);

// Admin: create a plan
router.post(
    "/admin/plans",
    authenticateToken,
    authorizeRoles("ADMIN"),
    createPlan,

);

router.post("/checkout", authenticateToken, createSubscription);

// Admin: edit plan details
router.patch(
  "/admin/plans/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updatePlan
);

// Admin: activate/deactivate a plan
router.patch(
  "/admin/plans/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN"),
  updatePlanStatus
);

module.exports = router;
