const express = require("express");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");
const {
  createDraw,
  getAllDraws,
  getPublicDraws,
  getDrawById,
  simulateDraw,
  publishDraw,
  updateDraw,
  cancelDraw,
  deleteDraw,
  getMyDrawEntries,
  getMyWins,
  getAllWinners,
  verifyWinner,
  markWinnerPaid,
  uploadProof,
  enterDraw,
} = require("../controllers/drawController");

const router = express.Router();

// ── Static routes FIRST (must come before /:id to avoid conflicts) ─────────

// Public
router.get("/public", getPublicDraws);

// Authenticated user — static paths
router.get("/my-entries", authenticateToken, getMyDrawEntries);
router.get("/my-wins", authenticateToken, getMyWins);

// Admin — static paths
router.get("/", authenticateToken, authorizeRoles("ADMIN"), getAllDraws);
router.post("/", authenticateToken, authorizeRoles("ADMIN"), createDraw);
router.get("/admin/winners", authenticateToken, authorizeRoles("ADMIN"), getAllWinners);
router.patch("/admin/winners/:id/verify", authenticateToken, authorizeRoles("ADMIN"), verifyWinner);
router.patch("/admin/winners/:id/pay", authenticateToken, authorizeRoles("ADMIN"), markWinnerPaid);

// ── Dynamic /:id routes AFTER all static paths ─────────────────────────────

// Authenticated user — dynamic
router.patch("/winners/:id/proof", authenticateToken, uploadProof);
router.post("/:id/enter", authenticateToken, enterDraw);

// Admin — dynamic
router.get("/:id", authenticateToken, authorizeRoles("ADMIN"), getDrawById);
router.patch("/:id", authenticateToken, authorizeRoles("ADMIN"), updateDraw);
router.post("/:id/simulate", authenticateToken, authorizeRoles("ADMIN"), simulateDraw);
router.post("/:id/publish", authenticateToken, authorizeRoles("ADMIN"), publishDraw);
router.delete("/:id", authenticateToken, authorizeRoles("ADMIN"), cancelDraw);
router.delete("/:id/permanent", authenticateToken, authorizeRoles("ADMIN"), deleteDraw);

module.exports = router;
