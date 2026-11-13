import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists." }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        passwordHash,
        profiles: {
          create: [{
            name: "Default",
            isPrimary: true,
            maturity: "GENERAL",
          }],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({ message: "User registered successfully.", user }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Failed to register user." }, { status: 500 });
  }
}
