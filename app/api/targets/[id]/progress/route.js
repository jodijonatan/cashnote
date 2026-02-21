import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { authenticateToken } from "@/lib/auth";

// POST - Update target progress (add amount)
export async function POST(request, { params }) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;
    const { id } = params;
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 },
      );
    }

    // Check if target exists and belongs to user
    const target = await prisma.financialTarget.findFirst({
      where: { id, userId },
    });

    if (!target) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    const updatedTarget = await prisma.financialTarget.update({
      where: { id },
      data: {
        currentAmount: {
          increment: parseFloat(amount),
        },
      },
    });

    return NextResponse.json(updatedTarget);
  } catch (error) {
    console.error("Update progress error:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 },
    );
  }
}
