
const prisma = require("../lib/prisma");

// GET /api/subscriptions/plans
// Public: list active subscription plans
const getPublicPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        billingInterval: true,
        price: true,
        currency: true,
        isActive: true,
      },
      orderBy: [
        { billingInterval: "asc" },
        { price: "asc" },
      ],
    });

    return res.json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Subscription plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch subscription plans",
    });
  }
};

// GET /api/subscriptions/my
// Authenticated: current user's subscription history
const getMySubscriptions = async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.userId },
      select: {
        id: true,
        status: true,
        startsAt: true,
        endsAt: true,
        createdAt: true,
        plan: {
          select: {
            name: true,
            billingInterval: true,
            price: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      count: subscriptions.length,
      subscriptions,
    });
  } catch (error) {
    console.error("Subscription history error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch subscriptions",
    });
  }
};

// GET /api/subscriptions/admin/plans
// Admin: list all plans, including inactive ones
const getAllPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: [
        { createdAt: "desc" },
      ],
    });

    return res.json({
      success: true,
      count: plans.length,
      plans,
    });
  } catch (error) {
    console.error("Get all subscription plans error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not fetch subscription plans",
    });
  }
};

const validatePlan = (body) => {
  const { name, description, billingInterval, price, currency } = body;

  if (typeof name !== "string" || !name.trim()) {
    return "Plan name is required";
  }

  if (
    billingInterval !== "MONTHLY" &&
    billingInterval !== "YEARLY"
  ) {
    return "Billing interval must be MONTHLY or YEARLY";
  }

  if (
    price === undefined ||
    price === null ||
    price === "" ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return "Price must be a valid non-negative number";
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return "Description must be a string";
  }

  if (
    currency !== undefined &&
    (typeof currency !== "string" ||
      !/^[A-Za-z]{3}$/.test(currency.trim()))
  ) {
    return "Currency must be a 3-letter code, such as INR";
  }

  return null;
};

// POST /api/subscriptions/admin/plans
const createPlan = async (req, res) => {
  try {
    const validationError = validatePlan(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const name = req.body.name.trim();
    const billingInterval = req.body.billingInterval;
    const price = Number(req.body.price);
    const currency = (req.body.currency || "INR").trim().toUpperCase();
    const description = req.body.description?.trim() || null;

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: {
        name_billingInterval: {
          name,
          billingInterval,
        },
      },
    });

    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: "A plan with this name and billing interval already exists",
      });
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        description,
        billingInterval,
        price,
        currency,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Subscription plan created successfully",
      plan,
    });
  } catch (error) {
    console.error("Create subscription plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not create subscription plan",
    });
  }
};

// PATCH /api/subscriptions/admin/plans/:id
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, billingInterval, price, currency } = req.body;

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    const has = (key) =>
      Object.prototype.hasOwnProperty.call(req.body, key);

    const candidate = {
      name: has("name") ? name : existingPlan.name,
      description: has("description")
        ? description
        : existingPlan.description,
      billingInterval: has("billingInterval")
        ? billingInterval
        : existingPlan.billingInterval,
      price: has("price") ? price : existingPlan.price,
      currency: has("currency") ? currency : existingPlan.currency,
    };

    const validationError = validatePlan(candidate);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const normalizedName = candidate.name.trim();
    const normalizedCurrency = candidate.currency.trim().toUpperCase();

    const duplicate = await prisma.subscriptionPlan.findFirst({
      where: {
        name: normalizedName,
        billingInterval: candidate.billingInterval,
        NOT: { id },
      },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Another plan already uses this name and billing interval",
      });
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: normalizedName,
        description: candidate.description?.trim() || null,
        billingInterval: candidate.billingInterval,
        price: Number(candidate.price),
        currency: normalizedCurrency,
      },
    });

    return res.json({
      success: true,
      message: "Subscription plan updated successfully",
      plan,
    });
  } catch (error) {
    console.error("Update subscription plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update subscription plan",
    });
  }
};

// PATCH /api/subscriptions/admin/plans/:id/status
const updatePlanStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!existingPlan) {
      return res.status(404).json({
        success: false,
        message: "Subscription plan not found",
      });
    }

    const plan = await prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive },
    });

    return res.json({
      success: true,
      message: `Subscription plan ${isActive ? "activated" : "deactivated"} successfully`,
      plan,
    });
  } catch (error) {
    console.error("Update subscription plan status error:", error);

    return res.status(500).json({
      success: false,
      message: "Could not update subscription plan status",
    });
  }
};



const createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required.",
      });
    }

    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        id: planId,
        isActive: true,
      },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Membership plan not found or inactive.",
      });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: "PENDING",
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            price: true,
            currency: true,
            billingInterval: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Subscription request created. Payment is not completed yet.",
      subscription,
    });
  } catch (error) {
    console.error("Create subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create subscription.",
    });
  }
};

module.exports = {
  getPublicPlans,
  getMySubscriptions,
  getAllPlans,
  createPlan,
  updatePlan,
  updatePlanStatus,
  createSubscription
};
