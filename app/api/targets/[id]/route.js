import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { authenticateToken } from "@/lib/auth";

// PUT - Update target
export async function PUT(request, { params }) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;
    const { id } = params;
    const { title, targetAmount, category, deadline, status } =
      await request.json();

    // Check if target exists and belongs to user
    const existingTarget = await prisma.financialTarget.findFirst({
      where: { id, userId },
    });

    if (!existingTarget) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
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

    return NextResponse.json(target);
  } catch (error) {
    console.error("Update target error:", error);
    return NextResponse.json(
      { error: "Failed to update target" },
      { status: 500 },
    );
  }
}

// DELETE - Delete target
export async function DELETE(request, { params }) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;
    const { id } = params;

    // Check if target exists and belongs to user
    const existingTarget = await prisma.financialTarget.findFirst({
      where: { id, userId },
    });

    if (!existingTarget) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    await prisma.financialTarget.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Target deleted successfully" });
  } catch (error) {
    console.error("Delete target error:", error);
    return NextResponse.json(
      { error: "Failed to delete target" },
      { status: 500 },
    );
  }
}
