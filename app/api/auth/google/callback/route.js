import { NextResponse } from "next/server";
import prisma from "@/prisma";
import { generateToken } from "@/lib/auth";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const frontendURL = process.env.FRONTEND_URL;

    if (!code) {
      return NextResponse.redirect(`${frontendURL}/login?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${frontendURL}/login?error=token_failed`);
    }

    // Get user info
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );

    const userInfo = await userInfoResponse.json();
    const { email, name } = userInfo;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          password: "", // No password for Google users
        },
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Redirect to frontend with token
    return NextResponse.redirect(`${frontendURL}/login?token=${token}`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    const frontendURL = process.env.FRONTEND_URL;
    return NextResponse.redirect(`${frontendURL}/login?error=auth_failed`);
  }
}
