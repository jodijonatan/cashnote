import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { authenticateToken } from "@/lib/auth";

// GET target summary
export async function GET(request) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;

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

    return NextResponse.json({
      totalTargets,
      completedTargets,
      activeTargets: totalTargets - completedTargets,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress: parseFloat(overallProgress.toFixed(1)),
    });
  } catch (error) {
    console.error("Target summary error:", error);
    return NextResponse.json(
      { error: "Failed to get target summary" },
      { status: 500 },
    );
  }
}
