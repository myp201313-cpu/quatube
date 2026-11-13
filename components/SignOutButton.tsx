"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return <button type="button" onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">Sign out</button>;
}
