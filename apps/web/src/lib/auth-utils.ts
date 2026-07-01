import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export type Role = "GUEST" | "USER" | "ADMIN";

export async function checkRole(allowedRoles: string[]) {
  const user = await getSessionUser();
  
  if (!user) {
    if (allowedRoles.includes("GUEST")) {
      return { authorized: true, role: "GUEST" as Role, user: null };
    }
    return { authorized: false, role: "GUEST" as Role, user: null };
  }
  
  const userRole = user.role.toUpperCase();
  
  if (allowedRoles.includes(userRole)) {
    return { authorized: true, role: userRole as Role, user };
  }
  
  return { authorized: false, role: userRole as Role, user };
}

export function unauthorizedResponse(message = "Unauthorized access") {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

export function forbiddenResponse(message = "Forbidden: Insufficient permissions") {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}
