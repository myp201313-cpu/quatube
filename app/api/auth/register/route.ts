import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";

import prisma from "@/lib/prisma";

const registrationSchema = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  let input: z.infer<typeof registrationSchema>;

  try {
    input = registrationSchema.parse(await request.json());
  } catch {
    return NextResponse.json(
      { error: "Provide a valid email, name, and password of at least 12 characters." },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name || input.email.split("@")[0],
        passwordHash: await hash(input.password, 12),
        profiles: {
          create: [{ name: "Default", isPrimary: true, maturity: "GENERAL" }],
        },
      },
      select: { id: true, email: true, name: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    console.error("Registration failed:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
