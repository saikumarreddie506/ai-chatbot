import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    return NextResponse.json({
      summary: `Summary: ${body.text}`,
    });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 500 });
  }
}