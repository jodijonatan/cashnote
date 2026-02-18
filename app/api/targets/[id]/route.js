import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/prisma";

// Middleware to authenticate user
function authenticateToken(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return { error: "Access token required", status: 401 };
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key",
    );
    return { user: { userId: decoded.userId } };
  } catch (err) {
    return { error: "Invalid token", status: 403 };
  }
}

// PUT - Update target
export async function PUT(request, { params }) {
  const auth = authenticateToken(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const userId = auth.user.userId;
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
    const userId = auth.user.userId;
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
