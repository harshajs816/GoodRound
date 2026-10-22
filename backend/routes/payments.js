
const express = require("express");
const { authenticateToken } = require("../middleware/auth");

const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/paymentController");

const router = express.Router();

router.post(
  "/create-order",
  authenticateToken,
  createPaymentOrder
);

router.post(
  "/verify",
  authenticateToken,
  verifyPayment
);

module.exports = router;
