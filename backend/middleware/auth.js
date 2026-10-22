
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");

async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is required",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured",
    });
  }

  let decoded;

  // Step 1: Verify JWT
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }

  // Step 2: Check the user's current database status and role
  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive or no longer exists",
      });
    }

    // Use current database role, not the potentially outdated JWT role
    req.user = {
      userId: user.id,
      role: user.role,
    };

    return next();
  } catch (error) {
    console.error("Authentication database error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your account",
    });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource",
      });
    }

    return next();
  };
}

module.exports = { authenticateToken, authorizeRoles };
