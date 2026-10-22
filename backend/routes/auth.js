
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const {authenticateToken} = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid name, email and password (minimum 8 characters) are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});


// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from environment");
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Use the same response for unknown email and wrong password.
    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      expiresIn: 3600,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});


// GET /api/auth/me — return the currently logged-in user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        selectedCharityId: true,
        charityContribution: true,
        createdAt: true,
        selectedCharity: {
          select: { id: true, name: true, slug: true, imageUrl: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "User account not found or inactive",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch user profile",
    });
  }
});

// PATCH /api/auth/profile — update charity selection and contribution %
router.patch("/profile", authenticateToken, async (req, res) => {
  try {
    const { selectedCharityId, charityContribution } = req.body;
    const updates = {};

    if (selectedCharityId !== undefined) {
      if (selectedCharityId === null) {
        updates.selectedCharityId = null;
      } else {
        const charity = await prisma.charity.findUnique({
          where: { id: selectedCharityId },
          select: { id: true, isActive: true, isVerified: true },
        });
        if (!charity || !charity.isActive || !charity.isVerified) {
          return res.status(400).json({ success: false, message: "Invalid or inactive charity" });
        }
        updates.selectedCharityId = selectedCharityId;
      }
    }

    if (charityContribution !== undefined) {
      const pct = Number(charityContribution);
      if (!Number.isInteger(pct) || pct < 10 || pct > 100) {
        return res.status(400).json({ success: false, message: "Charity contribution must be between 10 and 100 percent" });
      }
      updates.charityContribution = pct;
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updates,
      select: {
        id: true, name: true, email: true, role: true,
        selectedCharityId: true, charityContribution: true,
        selectedCharity: { select: { id: true, name: true, slug: true, imageUrl: true } },
      },
    });

    return res.json({ success: true, message: "Profile updated", user });
  } catch (error) {
    console.error("Profile update error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update profile" });
  }
});



module.exports = router;
