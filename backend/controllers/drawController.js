const prisma = require("../lib/prisma");

// ─── Prize pool distribution constants ────────────────────────────────────
const POOL_SHARE_FROM_SUBSCRIPTION = 0.5; // 50% of each subscription goes to prize pool
const JACKPOT_SHARE = 0.40;               // 5-number match = 40%
const FOUR_MATCH_SHARE = 0.35;            // 4-number match = 35%
const THREE_MATCH_SHARE = 0.25;           // 3-number match = 25%

// Numbers drawn per draw: 5
const DRAW_COUNT = 5;
const MIN_NUM = 1;
const MAX_NUM = 45;

// ─── Helper: pick unique random numbers ───────────────────────────────────
function randomNumbers(count, min, max) {
  const pool = [];
  for (let i = min; i <= max; i++) pool.push(i);
  const result = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * (pool.length - i));
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

// ─── Helper: pick numbers weighted by score frequency ─────────────────────
async function algorithmicNumbers(drawMonth, drawYear) {
  // Gather scores from the relevant calendar month
  const monthStart = new Date(drawYear, drawMonth - 1, 1);
  const monthEnd = new Date(drawYear, drawMonth, 0, 23, 59, 59, 999);

  const scores = await prisma.golfScore.findMany({
    where: { scoreDate: { gte: monthStart, lte: monthEnd } },
    select: { score: true },
  });

  // Build frequency map (score 1-45)
  const freq = {};
  for (let i = MIN_NUM; i <= MAX_NUM; i++) freq[i] = 1; // base weight 1
  for (const { score } of scores) {
    if (score >= MIN_NUM && score <= MAX_NUM) freq[score] = (freq[score] || 1) + 2;
  }

  // Weighted random sampling without replacement
  const chosen = [];
  const remaining = { ...freq };

  for (let i = 0; i < DRAW_COUNT; i++) {
    const total = Object.values(remaining).reduce((a, b) => a + b, 0);
    let rand = Math.random() * total;
    for (const [num, weight] of Object.entries(remaining)) {
      rand -= weight;
      if (rand <= 0) {
        chosen.push(Number(num));
        delete remaining[num];
        break;
      }
    }
  }

  return chosen.length === DRAW_COUNT ? chosen : randomNumbers(DRAW_COUNT, MIN_NUM, MAX_NUM);
}

// ─── Helper: calculate prize pools based on active subscribers ─────────────
async function calculatePrizePools(carryOverJackpot = 0) {
  const activeCount = await prisma.subscription.count({ where: { status: "ACTIVE" } });

  // Using hardcoded average plan price as approximation
  const avgPlanPrice = await prisma.subscriptionPlan.aggregate({
    _avg: { price: true },
    where: { isActive: true },
  });

  const avgPrice = Number(avgPlanPrice._avg.price) || 499;
  const totalPool = activeCount * avgPrice * POOL_SHARE_FROM_SUBSCRIPTION + Number(carryOverJackpot);

  return {
    totalPrizePool: totalPool,
    jackpotPool: totalPool * JACKPOT_SHARE,
    fourMatchPool: totalPool * FOUR_MATCH_SHARE,
    threeMatchPool: totalPool * THREE_MATCH_SHARE,
    activeSubscribers: activeCount,
  };
};

// ─── Helper: match type from intersection size ─────────────────────────────
function matchType(entryNumbers, drawnNumbers) {
  const drawnSet = new Set(drawnNumbers);
  const matches = entryNumbers.filter((n) => drawnSet.has(n)).length;
  if (matches === 5) return "FIVE_MATCH";
  if (matches === 4) return "FOUR_MATCH";
  if (matches === 3) return "THREE_MATCH";
  return null;
}

// ─── POST /api/draws — Admin: create a new draw ────────────────────────────
const createDraw = async (req, res) => {
  try {
    const { title, drawMonth, drawYear, drawType, totalPrizePool } = req.body;

    if (!title || !drawMonth || !drawYear) {
      return res.status(400).json({ success: false, message: "title, drawMonth and drawYear are required" });
    }

    const month = Number(drawMonth);
    const year = Number(drawYear);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ success: false, message: "drawMonth must be 1–12" });
    }
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return res.status(400).json({ success: false, message: "drawYear must be a valid year" });
    }

    // Prize pool must be provided and positive
    const pool = Number(totalPrizePool);
    if (!totalPrizePool || isNaN(pool) || pool <= 0) {
      return res.status(400).json({ success: false, message: "totalPrizePool must be a positive amount (e.g. 10000)" });
    }

    const type = drawType === "ALGORITHMIC" ? "ALGORITHMIC" : "RANDOM";

    // Split the admin-entered total prize pool per PRD: 40% jackpot, 35% four-match, 25% three-match
    const jackpotPool   = pool * JACKPOT_SHARE;
    const fourMatchPool = pool * FOUR_MATCH_SHARE;
    const threeMatchPool = pool * THREE_MATCH_SHARE;

    const draw = await prisma.draw.create({
      data: {
        title: title.trim(),
        drawMonth: month,
        drawYear: year,
        drawType: type,
        totalPrizePool: pool,
        jackpotPool,
        fourMatchPool,
        threeMatchPool,
        drawnNumbers: [],
      },
    });

    return res.status(201).json({ success: true, message: "Draw created", draw });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ success: false, message: "A draw for this month/year already exists" });
    }
    console.error("Create draw error:", error.message);
    return res.status(500).json({ success: false, message: "Could not create draw" });
  }
};

// ─── GET /api/draws — Admin: list all draws ────────────────────────────────
const getAllDraws = async (req, res) => {
  try {
    const draws = await prisma.draw.findMany({
      orderBy: [{ drawYear: "desc" }, { drawMonth: "desc" }],
      include: {
        _count: { select: { entries: true, wins: true } },
      },
    });
    return res.json({ success: true, draws });
  } catch (error) {
    console.error("Get draws error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch draws" });
  }
};

// ─── GET /api/draws/public — Public/User: active + published draws ────────
const getPublicDraws = async (req, res) => {
  try {
    const draws = await prisma.draw.findMany({
      where: {
        status: { in: ["OPEN", "DRAFT", "SIMULATED", "PUBLISHED"] },
      },
      orderBy: [{ drawYear: "desc" }, { drawMonth: "desc" }],
      select: {
        id: true, title: true, drawMonth: true, drawYear: true,
        drawType: true, status: true, totalPrizePool: true,
        jackpotPool: true, fourMatchPool: true, threeMatchPool: true,
        drawnNumbers: true, publishedAt: true,
      },
    });
    return res.json({ success: true, draws });
  } catch (error) {
    console.error("Public draws error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch draws" });
  }
};

// ─── GET /api/draws/:id — Admin: single draw detail ───────────────────────
const getDrawById = async (req, res) => {
  try {
    const draw = await prisma.draw.findUnique({
      where: { id: req.params.id },
      include: {
        entries: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        wins: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });

    return res.json({ success: true, draw });
  } catch (error) {
    console.error("Get draw error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch draw" });
  }
};

// ─── POST /api/draws/:id/simulate — Admin: run simulation ─────────────────
const simulateDraw = async (req, res) => {
  try {
    const draw = await prisma.draw.findUnique({
      where: { id: req.params.id },
      include: {
        entries: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });
    if (draw.status === "PUBLISHED" || draw.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Cannot simulate a published or cancelled draw" });
    }

    // Generate numbers based on draw type
    const drawnNumbers = draw.drawType === "ALGORITHMIC"
      ? await algorithmicNumbers(draw.drawMonth, draw.drawYear)
      : randomNumbers(DRAW_COUNT, MIN_NUM, MAX_NUM);

    // Simulate winners
    const winnersByTier = { FIVE_MATCH: [], FOUR_MATCH: [], THREE_MATCH: [] };

    for (const entry of draw.entries) {
      const type = matchType(entry.numbers, drawnNumbers);
      if (type) winnersByTier[type].push({ userId: entry.userId, name: entry.user.name, numbers: entry.numbers });
    }

    const poolShares = {
      FIVE_MATCH: Number(draw.jackpotPool),
      FOUR_MATCH: Number(draw.fourMatchPool),
      THREE_MATCH: Number(draw.threeMatchPool),
    };

    const simulationData = {
      drawnNumbers,
      winnersByTier,
      prizePerWinner: {
        FIVE_MATCH: winnersByTier.FIVE_MATCH.length > 0
          ? poolShares.FIVE_MATCH / winnersByTier.FIVE_MATCH.length : 0,
        FOUR_MATCH: winnersByTier.FOUR_MATCH.length > 0
          ? poolShares.FOUR_MATCH / winnersByTier.FOUR_MATCH.length : 0,
        THREE_MATCH: winnersByTier.THREE_MATCH.length > 0
          ? poolShares.THREE_MATCH / winnersByTier.THREE_MATCH.length : 0,
      },
      totalEntries: draw.entries.length,
      simulatedAt: new Date().toISOString(),
    };

    const updated = await prisma.draw.update({
      where: { id: draw.id },
      data: { drawnNumbers, simulationData, status: "SIMULATED" },
    });

    return res.json({ success: true, message: "Simulation complete", draw: updated, simulationData });
  } catch (error) {
    console.error("Simulate draw error:", error.message);
    return res.status(500).json({ success: false, message: "Could not simulate draw" });
  }
};

// ─── POST /api/draws/:id/publish — Admin: publish draw & create winners ───
const publishDraw = async (req, res) => {
  try {
    const draw = await prisma.draw.findUnique({
      where: { id: req.params.id },
      include: {
        entries: true,
        wins: true,
      },
    });

    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });
    if (draw.status === "PUBLISHED") return res.status(400).json({ success: false, message: "Draw already published" });
    if (draw.status === "CANCELLED") return res.status(400).json({ success: false, message: "Cannot publish a cancelled draw" });
    if (!draw.simulationData) return res.status(400).json({ success: false, message: "Run a simulation before publishing" });

    // Use the simulated drawn numbers
    const drawnNumbers = draw.drawnNumbers;

    // Calculate winnings and create DrawWin records in a transaction
    await prisma.$transaction(async (tx) => {
      const poolShares = {
        FIVE_MATCH: Number(draw.jackpotPool),
        FOUR_MATCH: Number(draw.fourMatchPool),
        THREE_MATCH: Number(draw.threeMatchPool),
      };

      const winnersByTier = { FIVE_MATCH: [], FOUR_MATCH: [], THREE_MATCH: [] };

      for (const entry of draw.entries) {
        const type = matchType(entry.numbers, drawnNumbers);
        if (type) winnersByTier[type].push(entry.userId);
      }

      const winsToCreate = [];

      for (const [tier, userIds] of Object.entries(winnersByTier)) {
        if (userIds.length === 0) continue;
        const prizePerWinner = poolShares[tier] / userIds.length;

        for (const userId of userIds) {
          winsToCreate.push({
            drawId: draw.id,
            userId,
            matchType: tier,
            prizeAmount: prizePerWinner,
            payoutStatus: "PENDING",
          });
        }
      }

      if (winsToCreate.length > 0) {
        await tx.drawWin.createMany({ data: winsToCreate });
      }

      // Handle jackpot rollover: if no 5-match winner, jackpot carries forward (stored in simulationData)
      const jackpotRolledOver = winnersByTier.FIVE_MATCH.length === 0;

      await tx.draw.update({
        where: { id: draw.id },
        data: {
          status: "PUBLISHED",
          publishedAt: new Date(),
          simulationData: {
            ...(draw.simulationData || {}),
            jackpotRolledOver,
            publishedAt: new Date().toISOString(),
          },
        },
      });
    });

    return res.json({ success: true, message: "Draw published successfully" });
  } catch (error) {
    console.error("Publish draw error:", error.message);
    return res.status(500).json({ success: false, message: "Could not publish draw" });
  }
};

// ─── PATCH /api/draws/:id — Admin: update draw config ─────────────────────
const updateDraw = async (req, res) => {
  try {
    const { title, drawType, totalPrizePool, status } = req.body;
    const draw = await prisma.draw.findUnique({ where: { id: req.params.id } });
    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });
    if (draw.status === "PUBLISHED" || draw.status === "CANCELLED") {
      return res.status(400).json({ success: false, message: "Cannot edit a published or cancelled draw" });
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (drawType) updateData.drawType = drawType === "ALGORITHMIC" ? "ALGORITHMIC" : "RANDOM";

    // Allow admin to open/revert draw status
    if (status !== undefined) {
      const allowedTransitions = {
        DRAFT: ["OPEN"],
        OPEN: ["DRAFT"],
        SIMULATED: ["OPEN", "DRAFT"],
      };
      if (!allowedTransitions[draw.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${draw.status} to ${status}`,
        });
      }
      updateData.status = status;
    }

    // Recalculate tier pools if prize pool is being updated
    if (totalPrizePool !== undefined) {
      const pool = Number(totalPrizePool);
      if (isNaN(pool) || pool <= 0) {
        return res.status(400).json({ success: false, message: "totalPrizePool must be a positive amount" });
      }
      updateData.totalPrizePool = pool;
      updateData.jackpotPool    = pool * JACKPOT_SHARE;
      updateData.fourMatchPool  = pool * FOUR_MATCH_SHARE;
      updateData.threeMatchPool = pool * THREE_MATCH_SHARE;
    }

    const updated = await prisma.draw.update({
      where: { id: req.params.id },
      data: updateData,
    });

    return res.json({ success: true, message: "Draw updated", draw: updated });
  } catch (error) {
    console.error("Update draw error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update draw" });
  }
};

// ─── DELETE /api/draws/:id — Admin: cancel draw (soft) ────────────────────
const cancelDraw = async (req, res) => {
  try {
    const draw = await prisma.draw.findUnique({ where: { id: req.params.id } });
    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });
    if (draw.status === "PUBLISHED") return res.status(400).json({ success: false, message: "Cannot cancel a published draw" });

    await prisma.draw.update({ where: { id: req.params.id }, data: { status: "CANCELLED" } });
    return res.json({ success: true, message: "Draw cancelled" });
  } catch (error) {
    console.error("Cancel draw error:", error.message);
    return res.status(500).json({ success: false, message: "Could not cancel draw" });
  }
};

// ─── DELETE /api/draws/:id/permanent — Admin: permanently delete a draw ────
const deleteDraw = async (req, res) => {
  try {
    const draw = await prisma.draw.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { wins: true } } },
    });

    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });

    // Block deletion if it has paid/verified winners — financial record
    if (draw._count.wins > 0) {
      const activeWins = await prisma.drawWin.count({
        where: {
          drawId: draw.id,
          payoutStatus: { in: ["VERIFIED", "PAID"] },
        },
      });
      if (activeWins > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete a draw that has verified or paid winners.",
        });
      }
    }

    // Cascade deletes entries and pending wins via DB relation
    await prisma.draw.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: "Draw permanently deleted" });
  } catch (error) {
    console.error("Delete draw error:", error.message);
    return res.status(500).json({ success: false, message: "Could not delete draw" });
  }
};

// ─── GET /api/draws/my-entries — User: their draw entries ─────────────────
const getMyDrawEntries = async (req, res) => {
  try {
    const entries = await prisma.drawEntry.findMany({
      where: { userId: req.user.userId },
      include: {
        draw: {
          select: {
            id: true, title: true, drawMonth: true, drawYear: true,
            status: true, drawnNumbers: true, publishedAt: true,
            totalPrizePool: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, entries });
  } catch (error) {
    console.error("My draw entries error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch draw entries" });
  }
};

// ─── GET /api/draws/my-wins — User: their wins ────────────────────────────
const getMyWins = async (req, res) => {
  try {
    const wins = await prisma.drawWin.findMany({
      where: { userId: req.user.userId },
      include: {
        draw: {
          select: {
            id: true, title: true, drawMonth: true, drawYear: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, wins });
  } catch (error) {
    console.error("My wins error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch wins" });
  }
};

// ─── GET /api/draws/admin/winners — Admin: all winners ────────────────────
const getAllWinners = async (req, res) => {
  try {
    const wins = await prisma.drawWin.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        draw: { select: { id: true, title: true, drawMonth: true, drawYear: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, wins });
  } catch (error) {
    console.error("Get all winners error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch winners" });
  }
};

// ─── PATCH /api/draws/admin/winners/:id/verify — Admin: verify winner proof
const verifyWinner = async (req, res) => {
  try {
    const { id } = req.params;
    const { payoutStatus, adminNote } = req.body;

    const allowed = ["VERIFIED", "REJECTED"];
    if (!allowed.includes(payoutStatus)) {
      return res.status(400).json({ success: false, message: "payoutStatus must be VERIFIED or REJECTED" });
    }

    const win = await prisma.drawWin.findUnique({ where: { id } });
    if (!win) return res.status(404).json({ success: false, message: "Win record not found" });

    const updated = await prisma.drawWin.update({
      where: { id },
      data: {
        payoutStatus,
        adminNote: adminNote || null,
        verifiedAt: new Date(),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return res.json({ success: true, message: `Winner ${payoutStatus.toLowerCase()}`, win: updated });
  } catch (error) {
    console.error("Verify winner error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update winner" });
  }
};

// ─── PATCH /api/draws/admin/winners/:id/pay — Admin: mark as paid ─────────
const markWinnerPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const win = await prisma.drawWin.findUnique({ where: { id } });
    if (!win) return res.status(404).json({ success: false, message: "Win record not found" });
    if (win.payoutStatus !== "VERIFIED") {
      return res.status(400).json({ success: false, message: "Win must be verified before marking as paid" });
    }

    const updated = await prisma.drawWin.update({
      where: { id },
      data: { payoutStatus: "PAID", paidAt: new Date() },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return res.json({ success: true, message: "Winner marked as paid", win: updated });
  } catch (error) {
    console.error("Mark paid error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update payout status" });
  }
};

// ─── POST /api/draws/admin/winners/:id/proof — User: upload proof ─────────
const uploadProof = async (req, res) => {
  try {
    const { id } = req.params;
    const { proofImageUrl } = req.body;

    if (!proofImageUrl) {
      return res.status(400).json({ success: false, message: "proofImageUrl is required" });
    }

    try {
      const url = new URL(proofImageUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      return res.status(400).json({ success: false, message: "proofImageUrl must be a valid URL" });
    }

    const win = await prisma.drawWin.findUnique({ where: { id } });
    if (!win) return res.status(404).json({ success: false, message: "Win record not found" });

    // Only the winner themselves can upload proof
    if (win.userId !== req.user.userId) {
      return res.status(403).json({ success: false, message: "You can only upload proof for your own wins" });
    }

    const updated = await prisma.drawWin.update({
      where: { id },
      data: { proofImageUrl },
    });

    return res.json({ success: true, message: "Proof submitted for admin review", win: updated });
  } catch (error) {
    console.error("Upload proof error:", error.message);
    return res.status(500).json({ success: false, message: "Could not upload proof" });
  }
};

// ─── POST /api/draws/:id/enter — User: auto-enter a draw (uses last 5 scores)
const enterDraw = async (req, res) => {
  try {
    const drawId = req.params.id;
    const userId = req.user.userId;

    const draw = await prisma.draw.findUnique({ where: { id: drawId } });
    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });
    if (draw.status !== "OPEN") {
      return res.status(400).json({ success: false, message: "This draw is not open for entries. Admin must open it first." });
    }

    // Check active subscription
    const activeSub = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
    });
    if (!activeSub) {
      return res.status(403).json({ success: false, message: "An active subscription is required to enter a draw" });
    }

    // Get last 5 scores as the entry numbers
    const scores = await prisma.golfScore.findMany({
      where: { userId },
      orderBy: { scoreDate: "desc" },
      take: 5,
      select: { score: true },
    });

    if (scores.length < 3) {
      return res.status(400).json({ success: false, message: "You need at least 3 golf scores to enter a draw" });
    }

    const numbers = scores.map((s) => s.score);

    const entry = await prisma.drawEntry.upsert({
      where: { drawId_userId: { drawId, userId } },
      create: { drawId, userId, numbers },
      update: { numbers },
    });

    return res.status(201).json({ success: true, message: "Entered draw successfully", entry });
  } catch (error) {
    console.error("Enter draw error:", error.message);
    return res.status(500).json({ success: false, message: "Could not enter draw" });
  }
};

module.exports = {
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
};
