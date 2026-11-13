import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Quatube API is running",
  });
}
