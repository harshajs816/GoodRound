
const prisma = require("../lib/prisma");

async function getDashboardStats(req, res) {
  try {
    const [
      totalUsers,
      activeUsers,
      totalCharities,
      verifiedCharities,
      pendingCharities,
      activeSubscriptions,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.charity.count(),
      prisma.charity.count({ where: { isVerified: true } }),
      prisma.charity.count({ where: { isVerified: false } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalCharities,
        verifiedCharities,
        pendingCharities,
        activeSubscriptions,
      },
      recentUsers,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard statistics.",
    });
  }
}

async function getAllUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
}

async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent accidental lockout of administrator accounts.
    if (existingUser.role === "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Admin accounts cannot be changed here.",
      });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
      user,
    });
  } catch (error) {
    console.error("Update user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status.",
    });
  }
}

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserStatus,
};


