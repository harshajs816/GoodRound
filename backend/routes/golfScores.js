
const express = require("express");
const prisma = require("../lib/prisma");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Validate score date in YYYY-MM-DD format and prevent future dates
function validateScoreDate(scoreDate) {
  if (
    typeof scoreDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(scoreDate)
  ) {
    return { error: "scoreDate must use YYYY-MM-DD format" };
  }

  const parsedDate = new Date(`${scoreDate}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== scoreDate
  ) {
    return { error: "Please provide a valid calendar date" };
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (parsedDate > today) {
    return { error: "Score date cannot be in the future" };
  }

  return { date: parsedDate };
}

// POST /api/golf-scores
// Submit a golf score
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { score, scoreDate } = req.body;
    const parsedScore = Number(score);

    if (
      score === undefined ||
      score === null ||
      score === "" ||
      !Number.isInteger(parsedScore) ||
      parsedScore < 1 ||
      parsedScore > 45
    ) {
      return res.status(400).json({
        success: false,
        message: "Score must be a whole number between 1 and 45",
      });
    }

    const dateResult = validateScoreDate(scoreDate);

    if (dateResult.error) {
      return res.status(400).json({
        success: false,
        message: dateResult.error,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Active user account required",
      });
    }

    // Require an active subscription to record scores
    const activeSub = await prisma.subscription.findFirst({
      where: { userId: req.user.userId, status: "ACTIVE" },
      select: { id: true },
    });

    if (!activeSub) {
      return res.status(403).json({
        success: false,
        message: "An active membership is required to record golf scores.",
        requiresSubscription: true,
      });
    }

    const golfScore = await prisma.golfScore.create({
      data: {
        userId: req.user.userId,
        score: parsedScore,
        scoreDate: dateResult.date,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Golf score saved successfully",
      golfScore,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A score has already been recorded for this date",
      });
    }

    console.error("Golf score creation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not save golf score",
    });
  }
});

// GET /api/golf-scores/my
// Fetch the latest five scores
router.get("/my", authenticateToken, async (req, res) => {
  try {
    const golfScores = await prisma.golfScore.findMany({
      where: { userId: req.user.userId },
      orderBy: [
        { scoreDate: "desc" },
        { createdAt: "desc" },
      ],
      take: 5,
    });

    return res.json({
      success: true,
      count: golfScores.length,
      golfScores,
    });
  } catch (error) {
    console.error("Golf score retrieval error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch golf scores",
    });
  }
});

// PATCH /api/golf-scores/:id
// Edit a score belonging to the logged-in user
router.patch("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { score, scoreDate } = req.body;

    if (score === undefined && scoreDate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Provide a score or scoreDate to update",
      });
    }

    // Require active subscription
    const activeSub = await prisma.subscription.findFirst({
      where: { userId: req.user.userId, status: "ACTIVE" },
      select: { id: true },
    });

    if (!activeSub) {
      return res.status(403).json({
        success: false,
        message: "An active membership is required to edit golf scores.",
        requiresSubscription: true,
      });
    }

    const existingScore = await prisma.golfScore.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingScore) {
      return res.status(404).json({
        success: false,
        message: "Golf score not found",
      });
    }

    const updateData = {};

    if (score !== undefined) {
      const parsedScore = Number(score);

      if (
        score === null ||
        score === "" ||
        !Number.isInteger(parsedScore) ||
        parsedScore < 1 ||
        parsedScore > 45
      ) {
        return res.status(400).json({
          success: false,
          message: "Score must be a whole number between 1 and 45",
        });
      }

      updateData.score = parsedScore;
    }

    if (scoreDate !== undefined) {
      const dateResult = validateScoreDate(scoreDate);

      if (dateResult.error) {
        return res.status(400).json({
          success: false,
          message: dateResult.error,
        });
      }

      updateData.scoreDate = dateResult.date;
    }

    const updatedScore = await prisma.golfScore.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: "Golf score updated successfully",
      golfScore: updatedScore,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A score has already been recorded for this date",
      });
    }

    console.error("Golf score update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not update golf score",
    });
  }
});

// DELETE /api/golf-scores/:id
// Delete a score belonging to the logged-in user
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Require active subscription
    const activeSub = await prisma.subscription.findFirst({
      where: { userId: req.user.userId, status: "ACTIVE" },
      select: { id: true },
    });

    if (!activeSub) {
      return res.status(403).json({
        success: false,
        message: "An active membership is required to delete golf scores.",
        requiresSubscription: true,
      });
    }

    const existingScore = await prisma.golfScore.findFirst({
      where: {
        id,
        userId: req.user.userId,
      },
    });

    if (!existingScore) {
      return res.status(404).json({
        success: false,
        message: "Golf score not found",
      });
    }

    await prisma.golfScore.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Golf score deleted successfully",
    });
  } catch (error) {
    console.error("Golf score deletion error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not delete golf score",
    });
  }
});

module.exports = router;
