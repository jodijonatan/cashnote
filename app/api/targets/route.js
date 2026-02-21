import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { authenticateToken } from "@/lib/auth";

// GET all targets for user
export async function GET(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;

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

    return NextResponse.json(targetsWithProgress);
  } catch (error) {
    console.error("Get targets error:", error);
    return NextResponse.json(
      { error: "Failed to get targets" },
      { status: 500 },
    );
  }
}

// POST - Create new target
export async function POST(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;
    const { title, targetAmount, category, deadline } = await request.json();

    // Validation
    if (!title || !targetAmount || targetAmount <= 0) {
      return NextResponse.json(
        { error: "Title and target amount are required" },
        { status: 400 },
      );
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

    return NextResponse.json(target, { status: 201 });
  } catch (error) {
    console.error("Create target error:", error);
    return NextResponse.json(
      { error: "Failed to create target" },
      { status: 500 },
    );
  }
}
