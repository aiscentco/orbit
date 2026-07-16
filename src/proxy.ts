import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// /api/cron routes protect themselves via a CRON_SECRET bearer token (Vercel
// Cron has no Clerk session to present), so they're exempted here rather than
// relying on this proxy alone.
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api/cron(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
    "/(api|trpc)(.*)",
  ],
};
