import { NextResponse } from "next/server";
import OpenAI from "openai";
import mammoth from "mammoth";

export const runtime = "nodejs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractPdfText(buffer: Buffer): Promise<string> {
  // Works with ESM/CJS builds
  const mod: any = await import("pdf-parse");
  const pdfParse = mod?.default ?? mod;
  const result = await pdfParse(buffer);
  return (result?.text ?? "").trim();
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return (result?.value ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // =========================
    // FILE MODE: multipart/form-data
    // =========================
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const name = (file.name || "").toLowerCase();
      const type = (file.type || "").toLowerCase();

      let text = "";

      if (type === "application/pdf" || name.endsWith(".pdf")) {
        text = await extractPdfText(buffer);
      } else if (
        type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        name.endsWith(".docx")
      ) {
        text = await extractDocxText(buffer);
      } else {
        return NextResponse.json(
          { error: "Only PDF and DOCX supported" },
          { status: 400 }
        );
      }

      if (!text) {
        // common when PDF is scanned images
        return NextResponse.json(
          { error: "No readable text found (scanned PDF needs OCR)" },
          { status: 400 }
        );
      }

      const resp = await client.responses.create({
        model: "gpt-4.1-mini",
        input: `Summarize this document in 8-12 bullet points (simple English):\n\n${text.slice(
          0,
          120000
        )}`,
      });

      return NextResponse.json({ summary: resp.output_text });
    }

    // =========================
    // CHAT MODE: application/json
    // =========================
    const body = await req.json().catch(() => ({}));
    const msgs = body?.messages;

    if (!Array.isArray(msgs) || msgs.length === 0) {
      return NextResponse.json(
        { error: "messages[] is required" },
        { status: 400 }
      );
    }

    // Send history to the model (keeps context)
    const resp = await client.responses.create({
      model: "gpt-4.1-mini",
      input: msgs.map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content ?? ""),
      })),
    });

    return NextResponse.json({ reply: resp.output_text });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}