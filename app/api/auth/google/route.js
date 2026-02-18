import { NextResponse } from "next/server";

export async function GET() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;
  const frontendURL = process.env.FRONTEND_URL;

  if (!clientID) {
    return NextResponse.json(
      { error: "Google Client ID not configured" },
      { status: 500 },
    );
  }

  const scopes = ["profile", "email"];
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=${callbackURL}&response_type=code&scope=${scopes.join(
    " ",
  )}&access_type=offline&prompt=consent`;

  return NextResponse.redirect(authUrl);
}
