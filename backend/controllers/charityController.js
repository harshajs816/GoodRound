
const prisma = require("../lib/prisma");

// GET /api/charities
// Public: verified and active charities
const getPublicCharities = async (req, res) => {
  try {
    const charities = await prisma.charity.findMany({
      where: {
        isActive: true,
        isVerified: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        websiteUrl: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json({
      success: true,
      count: charities.length,
      charities,
    });
  } catch (error) {
    console.error("Charity listing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch charities",
    });
  }
};

// GET /api/charities/admin/all
// Admin: all charities, including pending verification
const getAllCharities = async (req, res) => {
  try {
    const charities = await prisma.charity.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        websiteUrl: true,
        contactEmail: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({
      success: true,
      count: charities.length,
      charities,
    });
  } catch (error) {
    console.error("Admin charity listing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch charities",
    });
  }
};

// POST /api/charities
// Admin: create an unverified charity
const createCharity = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      imageUrl,
      websiteUrl,
      contactEmail,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof slug !== "string" ||
     !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid name, lowercase slug and description are required",
      });
    }

    for (const [field, value] of Object.entries({
      imageUrl,
      websiteUrl,
    })) {
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value !== "string") {
          return res.status(400).json({
            success: false,
            message: `${field} must be a valid HTTP or HTTPS URL`,
          });
        }

        try {
          const parsedUrl = new URL(value);

          if (!["http:", "https:"].includes(parsedUrl.protocol)) {
            throw new Error("Invalid protocol");
          }
        } catch {
          return res.status(400).json({
            success: false,
            message: `${field} must be a valid HTTP or HTTPS URL`,
          });
        }
      }
    }

    if (
      contactEmail !== undefined &&
      contactEmail !== null &&
      contactEmail !== "" &&
      (
        typeof contactEmail !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Contact email is invalid",
      });
    }

    const charity = await prisma.charity.create({
      data: {
        name: name.trim(),
        slug,
        description: description.trim(),
        imageUrl: imageUrl || null,
        websiteUrl: websiteUrl || null,
        contactEmail: contactEmail || null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        websiteUrl: true,
        contactEmail: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Charity created; admin verification is still required",
      charity,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "This charity slug already exists",
      });
    }

    console.error("Charity creation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not create charity",
    });
  }
};

// PATCH /api/charities/:id/verify
// Admin: verify a charity
const verifyCharity = async (req, res) => {
  try {
    const { id } = req.params;

    const charity = await prisma.charity.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isVerified: true,
        isActive: true,
      },
    });

    if (!charity) {
      return res.status(404).json({
        success: false,
        message: "Charity not found",
      });
    }

    if (charity.isVerified) {
      return res.json({
        success: true,
        message: "Charity is already verified",
        charity,
      });
    }

    const updatedCharity = await prisma.charity.update({
      where: { id },
      data: { isVerified: true },
      select: {
        id: true,
        name: true,
        isVerified: true,
        isActive: true,
      },
    });

    return res.json({
      success: true,
      message: "Charity verified successfully",
      charity: updatedCharity,
    });
  } catch (error) {
    console.error("Charity verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not verify charity",
    });
  }
};


const updateCharityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value",
      });
    }

    const charity = await prisma.charity.findUnique({
      where: { id },
    });

    if (!charity) {
      return res.status(404).json({
        success: false,
        message: "Charity not found",
      });
    }

    const updatedCharity = await prisma.charity.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        isVerified: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Charity ${isActive ? "activated" : "deactivated"} successfully`,
      charity: updatedCharity,
    });
  } catch (error) {
    console.error("Update charity status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update charity status",
    });
  }
};


// PATCH /api/charities/:id
// Admin: edit an existing charity's details
const updateCharity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, imageUrl, websiteUrl, contactEmail, isFeatured } = req.body;

    const existing = await prisma.charity.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ success: false, message: "Charity not found" });
    }

    // Validate slug if provided
    if (slug !== undefined && slug !== null && slug !== "") {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return res.status(400).json({ success: false, message: "Slug must be lowercase letters, numbers and hyphens only" });
      }
      // Check uniqueness
      const duplicate = await prisma.charity.findFirst({ where: { slug, NOT: { id } } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: "This charity slug already exists" });
      }
    }

    for (const [field, value] of Object.entries({ imageUrl, websiteUrl })) {
      if (value !== undefined && value !== null && value !== "") {
        try {
          const parsedUrl = new URL(value);
          if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
        } catch {
          return res.status(400).json({ success: false, message: `${field} must be a valid HTTP or HTTPS URL` });
        }
      }
    }

    const updated = await prisma.charity.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(imageUrl !== undefined ? { imageUrl: imageUrl || null } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl: websiteUrl || null } : {}),
        ...(contactEmail !== undefined ? { contactEmail: contactEmail || null } : {}),
        ...(typeof isFeatured === "boolean" ? { isFeatured } : {}),
      },
      select: {
        id: true, name: true, slug: true, description: true,
        imageUrl: true, websiteUrl: true, contactEmail: true,
        isVerified: true, isActive: true, isFeatured: true, createdAt: true,
      },
    });

    return res.json({ success: true, message: "Charity updated successfully", charity: updated });
  } catch (error) {
    console.error("Update charity error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update charity" });
  }
};

module.exports = {
  getPublicCharities,
  getAllCharities,
  createCharity,
  updateCharity,
  verifyCharity,
  updateCharityStatus,
};
