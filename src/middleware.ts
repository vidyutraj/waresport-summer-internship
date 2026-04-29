import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware's getToken() picks the session cookie name from NEXTAUTH_URL's scheme.
 * If Vercel still has NEXTAUTH_URL=http://localhost:3000, it looks for the wrong
 * cookie while the API sets __Secure-next-auth.session-token on HTTPS — login
 * appears to "do nothing". Align the cookie name with production HTTPS.
 */
const sessionTokenName =
  process.env.VERCEL || process.env.NEXTAUTH_URL?.startsWith("https://")
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Redirect to change-password if mustChangePassword
    if (token?.mustChangePassword && pathname !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url));
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    cookies: {
      sessionToken: { name: sessionTokenName },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/logs/:path*",
    "/resources/:path*",
    "/profile/:path*",
    "/directory/:path*",
    "/admin/:path*",
    "/change-password",
  ],
};
