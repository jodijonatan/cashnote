const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { protect } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all targets for user
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const targets = await prisma.financialTarget.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate progress for each target
    const targetsWithProgress = targets.map((target) => {
      const progress =
        target.targetAmount > 0
          ? (target.currentAmount / target.targetAmount) * 100
          : 0;

      const daysLeft = target.deadline
        ? Math.ceil(
            (new Date(target.deadline) - new Date()) / (1000 * 60 * 60 * 24),
          )
        : null;

      return {
        ...target,
        progress: Math.min(progress, 100),
        daysLeft,
        isCompleted: progress >= 100,
        isOverdue:
          target.deadline &&
          new Date(target.deadline) < new Date() &&
          progress < 100,
      };
    });

    res.json(targetsWithProgress);
  } catch (error) {
    console.error("Get targets error:", error);
    res.status(500).json({ error: "Failed to get targets" });
  }
});

// Create new target
router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, targetAmount, category, deadline } = req.body;

    // Validation
    if (!title || !targetAmount || targetAmount <= 0) {
      return res.status(400).json({
        error: "Title and target amount are required",
      });
    }

    const target = await prisma.financialTarget.create({
      data: {
        userId,
        title,
        targetAmount: parseFloat(targetAmount),
        category: category || "general",
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    res.status(201).json(target);
  } catch (error) {
    console.error("Create target error:", error);
    res.status(500).json({ error: "Failed to create target" });
  }
});

// Update target
router.put("/:id", protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, targetAmount, category, deadline, status } = req.body;

    // Check if target exists and belongs to user
    const existingTarget = await prisma.financialTarget.findFirst({
      where: { id, userId },
    });

    if (!existingTarget) {
      return res.status(404).json({ error: "Target not found" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (targetAmount !== undefined)
      updateData.targetAmount = parseFloat(targetAmount);
    if (category !== undefined) updateData.category = category;
    if (deadline !== undefined)
      updateData.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) updateData.status = status;

    const target = await prisma.financialTarget.update({
      where: { id },
      data: updateData,
    });

    res.json(target);
  } catch (error) {
    console.error("Update target error:", error);
    res.status(500).json({ error: "Failed to update target" });
  }
});

// Update target progress (add amount)
router.post("/:id/progress", protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: "Valid amount is required",
      });
    }

    // Check if target exists and belongs to user
    const target = await prisma.financialTarget.findFirst({
      where: { id, userId },
    });

    if (!target) {
      return res.status(404).json({ error: "Target not found" });
    }

    const updatedTarget = await prisma.financialTarget.update({
      where: { id },
      data: {
        currentAmount: {
          increment: parseFloat(amount),
        },
      },
    });

    res.json(updatedTarget);
  } catch (error) {
    console.error("Update progress error:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// Delete target
router.delete("/:id", protect, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Check if target exists and belongs to user
    const existingTarget = await prisma.financialTarget.findFirst({
      where: { id, userId },
    });

    if (!existingTarget) {
      return res.status(404).json({ error: "Target not found" });
    }

    await prisma.financialTarget.delete({
      where: { id },
    });

    res.json({ message: "Target deleted successfully" });
  } catch (error) {
    console.error("Delete target error:", error);
    res.status(500).json({ error: "Failed to delete target" });
  }
});

// Get target summary
router.get("/summary", protect, async (req, res) => {
  try {
    const userId = req.user.userId;

    const targets = await prisma.financialTarget.findMany({
      where: { userId },
    });

    const totalTargets = targets.length;
    const completedTargets = targets.filter(
      (t) => t.currentAmount / t.targetAmount >= 100,
    ).length;
    const totalTargetAmount = targets.reduce(
      (sum, t) => sum + t.targetAmount,
      0,
    );
    const totalCurrentAmount = targets.reduce(
      (sum, t) => sum + t.currentAmount,
      0,
    );
    const overallProgress =
      totalTargetAmount > 0
        ? (totalCurrentAmount / totalTargetAmount) * 100
        : 0;

    res.json({
      totalTargets,
      completedTargets,
      activeTargets: totalTargets - completedTargets,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress: parseFloat(overallProgress.toFixed(1)),
    });
  } catch (error) {
    console.error("Target summary error:", error);
    res.status(500).json({ error: "Failed to get target summary" });
  }
});

module.exports = router;
