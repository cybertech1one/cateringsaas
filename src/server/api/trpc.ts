/**
 * Diyafa — tRPC Server Configuration
 *
 * Multi-tenant catering SaaS with organization-scoped procedures.
 * Every data access is scoped to the user's organization via middleware.
 *
 * Procedure hierarchy:
 *   publicProcedure     — No auth required (marketplace browse, public profiles)
 *   privateProcedure    — User must be authenticated
 *   orgProcedure        — User must be an active org member (adds orgId + orgRole to ctx)
 *   orgAdminProcedure   — User must be org admin or higher
 *   orgOwnerProcedure   — User must be org owner
 *   superAdminProcedure — User must be platform super_admin
 */
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod";

import { db } from "~/server/db";
import { getUserAsAdmin } from "../supabase/supabaseClient";

// ──────────────────────────────────────────────
// 1. CONTEXT
// ──────────────────────────────────────────────

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const headers = opts.headers;
  const authToken = headers.get("authorization");

  const { user } = authToken ? await getUserAsAdmin(authToken) : { user: null };

  return {
    ...opts,
    db,
    user,
  };
};

// ──────────────────────────────────────────────
// 2. INITIALIZATION
// ──────────────────────────────────────────────

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ──────────────────────────────────────────────
// 3. ROUTER & PROCEDURES
// ──────────────────────────────────────────────

export const createTRPCRouter = t.router;

/**
 * Public procedure — No authentication required.
 * Used for marketplace browse, public caterer profiles, etc.
 */
export const publicProcedure = t.procedure;

/**
 * Middleware: Enforce user is authenticated
 */
const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return next({
    ctx: {
      user: ctx.user,
    },
  });
});

/**
 * Private procedure — User must be authenticated.
 */
export const privateProcedure = t.procedure.use(enforceUserIsAuthed);

// ──────────────────────────────────────────────
// 4. ORGANIZATION-SCOPED PROCEDURES (Multi-tenancy)
// ──────────────────────────────────────────────

/** Org role hierarchy (highest to lowest) */
export const ORG_ROLES = ["super_admin", "org_owner", "admin", "manager", "staff"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

/** Check if a role meets a minimum role requirement */
function meetsMinimumRole(userRole: OrgRole, minimumRole: OrgRole): boolean {
  const userIndex = ORG_ROLES.indexOf(userRole);
  const minIndex = ORG_ROLES.indexOf(minimumRole);
  return userIndex <= minIndex; // Lower index = higher privilege
}

/**
 * Middleware: Enforce user is a member of an organization.
 * Requires `orgId` in input (passed explicitly or from user's default org).
 *
 * Adds to context: orgId, orgRole, orgMembership
 */
const enforceOrgMembership = (minimumRole: OrgRole = "staff") =>
  t.middleware(async ({ ctx, next, rawInput }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    // Extract orgId from input
    const input = rawInput as Record<string, unknown> | undefined;
    let orgId = input?.orgId as string | undefined;

    // If no orgId in input, try to get user's default/only org
    if (!orgId) {
      const membership = await ctx.db.orgMembers.findFirst({
        where: {
          userId: ctx.user.id,
          isActive: true,
        },
        select: { orgId: true, role: true },
        orderBy: { createdAt: "asc" },
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of any organization",
        });
      }

      orgId = membership.orgId;
    }

    // Verify membership and role
    const membership = await ctx.db.orgMembers.findFirst({
      where: {
        orgId,
        userId: ctx.user.id,
        isActive: true,
      },
      select: {
        id: true,
        orgId: true,
        role: true,
        permissions: true,
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this organization",
      });
    }

    const orgRole = membership.role as OrgRole;
    if (!meetsMinimumRole(orgRole, minimumRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `This action requires at least ${minimumRole} role`,
      });
    }

    return next({
      ctx: {
        user: ctx.user,
        orgId: membership.orgId,
        orgRole,
        orgMemberId: membership.id,
        orgPermissions: membership.permissions as Record<string, boolean> | null,
      },
    });
  });

/**
 * Org procedure — User must be an active org member (any role).
 * Use for: viewing events, browsing menus, reading data.
 */
export const orgProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceOrgMembership("staff"));

/**
 * Org manager procedure — User must be manager or higher.
 * Use for: creating events, managing staff, editing menus.
 */
export const orgManagerProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceOrgMembership("manager"));

/**
 * Org admin procedure — User must be admin or higher.
 * Use for: managing members, org settings, financial operations.
 */
export const orgAdminProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceOrgMembership("admin"));

/**
 * Org owner procedure — User must be the org owner.
 * Use for: deleting org, transferring ownership, billing.
 */
export const orgOwnerProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceOrgMembership("org_owner"));

// ──────────────────────────────────────────────
// 5. PLATFORM-LEVEL PROCEDURES
// ──────────────────────────────────────────────

/**
 * Middleware: Enforce user has a platform-level role
 */
const enforceUserRole = (allowedRoles: string[]) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    const profile = await ctx.db.profiles.findUnique({
      where: { id: ctx.user.id },
      select: { role: true },
    });

    if (!profile || !allowedRoles.includes(profile.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient platform permissions",
      });
    }

    return next({
      ctx: { user: ctx.user, userRole: profile.role },
    });
  });

/**
 * Admin procedure — User must be platform admin.
 * Use for: platform analytics, org management, moderation.
 */
export const adminProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceUserRole(["super_admin", "admin"]));

/**
 * Super admin procedure — User must be platform super_admin.
 * Use for: feature flags, system settings, financial settlements.
 */
export const superAdminProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceUserRole(["super_admin"]));

/**
 * Manager procedure — Kept for backward compatibility.
 */
export const managerProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceUserRole(["super_admin", "admin", "manager"]));
