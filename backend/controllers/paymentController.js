
const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../lib/prisma");

const getRazorpay = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay API keys are not configured.");
  }

  return {
    client: new Razorpay({ key_id, key_secret }),
    key_secret,
    key_id,
  };
};

// POST /api/payments/create-order
const createPaymentOrder = async (req, res) => {
  let subscription;

  try {
    const { planId } = req.body;
    const userId = req.user.userId;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required.",
      });
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      where: { id: planId, isActive: true },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found or inactive.",
      });
    }

    const amount = Math.round(Number(plan.price) * 100);
    const currency = plan.currency.toUpperCase();

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "This plan cannot be processed as a paid order.",
      });
    }

    const { client, key_id } = getRazorpay();

    // Create a pending subscription before creating the order.
    subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "PENDING",
        paymentProvider: "RAZORPAY",
      },
    });

    const order = await client.orders.create({
      amount,
      currency,
      receipt: subscription.id,
      notes: {
        subscriptionId: subscription.id,
        planId: plan.id,
        userId,
      },
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        razorpayOrderId: order.id,
        paymentAmount: amount,
        paymentCurrency: currency,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created.",
      keyId: key_id,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      subscriptionId: subscription.id,
      plan: {
        name: plan.name,
        billingInterval: plan.billingInterval,
      },
    });
  } catch (error) {
    console.error("Create payment order error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create payment order.",
    });
  }
};

// POST /api/payments/verify
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required.",
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        userId: req.user.userId,
      },
      include: { plan: true },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription for this order was not found.",
      });
    }

    const { client, key_secret } = getRazorpay();

    const expectedSignature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const provided = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      provided.length !== expected.length ||
      !crypto.timingSafeEqual(provided, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    // Verify payment status and order details with Razorpay itself.
    const payment = await client.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.amount !== subscription.paymentAmount ||
      payment.currency !== subscription.paymentCurrency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match this subscription.",
      });
    }

    // Do not activate a subscription until Razorpay confirms capture.
    if (payment.status !== "captured") {
      return res.status(409).json({
        success: false,
        message:
          "Payment has not been captured yet. Please check again shortly.",
      });
    }

    // Idempotent retry for an already verified payment.
    if (
      subscription.status === "ACTIVE" &&
      subscription.razorpayPaymentId === razorpay_payment_id
    ) {
      return res.json({
        success: true,
        message: "Payment has already been verified.",
        subscription,
      });
    }

    if (subscription.status !== "PENDING") {
      return res.status(409).json({
        success: false,
        message: "This subscription can no longer be activated.",
      });
    }

    const startsAt = new Date();
    const endsAt = new Date(startsAt);

    if (subscription.plan.billingInterval === "MONTHLY") {
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else if (subscription.plan.billingInterval === "YEARLY") {
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported membership billing interval.",
      });
    }

    const activated = await prisma.$transaction(async (tx) => {
      // Conditional update helps prevent two concurrent verifications
      // from activating the same pending subscription twice.
      const result = await tx.subscription.updateMany({
        where: {
          id: subscription.id,
          status: "PENDING",
          razorpayOrderId: razorpay_order_id,
        },
        data: {
          status: "ACTIVE",
          startsAt,
          endsAt,
          razorpayPaymentId: razorpay_payment_id,
        },
      });

      if (result.count !== 1) {
        throw new Error("SUBSCRIPTION_ALREADY_PROCESSED");
      }

      // Auto-create a CharityDonation record if user has a selected charity.
      // Default = 10% of plan price (PRD §08.1). Respect user's own percentage if higher.
      const userRecord = await tx.user.findUnique({
        where: { id: subscription.userId },
        select: { selectedCharityId: true, charityContribution: true },
      });

      if (userRecord?.selectedCharityId) {
        const planPrice = Number(subscription.plan.price);
        const contributionPct = Math.max(userRecord.charityContribution ?? 10, 10);
        const donationAmount = parseFloat(
          ((planPrice * contributionPct) / 100).toFixed(2)
        );

        await tx.charityDonation.create({
          data: {
            userId: subscription.userId,
            charityId: userRecord.selectedCharityId,
            amount: donationAmount,
            currency: subscription.plan.currency || "INR",
            status: "COMPLETED",
          },
        });
      }

      return tx.subscription.findUnique({
        where: { id: subscription.id },
        include: {
          plan: {
            select: {
              name: true,
              price: true,
              currency: true,
              billingInterval: true,
            },
          },
        },
      });
    });

    return res.json({
      success: true,
      message: "Payment verified and membership activated.",
      subscription: activated,
      charityDonationCreated: true,
    });
  } catch (error) {
    if (error.message === "SUBSCRIPTION_ALREADY_PROCESSED") {
      return res.status(409).json({
        success: false,
        message:
          "This subscription has already been processed. Refresh your memberships.",
      });
    }

    console.error("Payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment. Please retry safely.",
    });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
};
