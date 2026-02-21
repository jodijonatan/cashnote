import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Authenticates a request by verifying the JWT token in the Authorization header.
 * @param {Request} request - The incoming request object.
 * @returns {Object} - An object containing user data or an error with status.
 */
export function authenticateToken(request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("Authentication Failed: No token provided in headers");
    return { error: "Access token required", status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { user: { id: decoded.userId, email: decoded.email } };
  } catch (err) {
    console.error("Authentication Failed: JWT Verification Error", {
      reason: err.message,
      type: err.name,
      tokenSnippet: token ? `${token.substring(0, 10)}...` : "none",
    });

    if (err.name === "TokenExpiredError") {
      return { error: "Token expired", status: 401 };
    }
    return { error: "Invalid token", status: 403 };
  }
}

/**
 * Generates a JWT token for a user.
 * @param {Object} user - The user object containing id and email.
 * @returns {string} - The generated JWT token.
 */
export function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
