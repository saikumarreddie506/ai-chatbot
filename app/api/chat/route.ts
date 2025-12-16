import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      summary: `Summary: ${text.slice(0, 100)}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}