import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRole, unauthorizedResponse } from "@/lib/auth-utils";
import { AIChatSchema } from "@/lib/validation";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { authorized, user } = await checkRole(["USER", "ADMIN"]);
    if (!authorized || !user) {
      return unauthorizedResponse("You must be logged in to chat with the AI assistant");
    }

    const body = await req.json();
    const parsed = AIChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }

    const { componentId, message, history } = parsed.data;

    // Fetch component details to provide context
    const component = await db.component.findUnique({
      where: { id: componentId },
      include: {
        manufacturer: true,
        category: true,
        pins: true,
      },
    });

    if (!component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    // Initialize Gemini Client
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set");
      return NextResponse.json({ error: "AI Assistant is currently unavailable (missing API key)" }, { status: 503 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // Fast and highly capable for chat
    });

    // Construct system instructions with component context
    const systemInstruction = `
You are an expert electronics engineer and AI assistant for the ElectroHub platform.
You are helping an engineer who is currently viewing the following component:
- MPN (Manufacturer Part Number): ${component.mpn}
- Manufacturer: ${component.manufacturer.name}
- Category: ${component.category.name}
- Description: ${component.description}

Specifications (Parametric Data):
${JSON.stringify(component.specs, null, 2)}

Pin Configuration (${component.pins.length} pins):
${component.pins
  .map(
    (p) =>
      `- Pin ${p.number} (${p.name}): Type=${p.type}, Group=${p.functionalGroup || "N/A"}, Description=${p.description || "N/A"}`
  )
  .join("\n")}

Instructions:
1. Answer the user's questions about this component's pinout, electrical limits, application circuits, or decoupling recommendations.
2. Be technically precise, concise, and helpful.
3. Do NOT hallucinate specifications, pin numbers, or capabilities. If the information is not in the context above and you cannot confidently infer it, state that it's not available in the current datasheet.
4. Provide code snippets or circuit formulas if relevant.
`;

    // Map history to Gemini's format
    const contents = [
      {
        role: "user",
        parts: [{ text: systemInstruction }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I have loaded the component context for " + component.mpn + " and am ready to assist you." }],
      },
      ...history.map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.content }],
      })),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    // Generate streaming response
    const result = await model.generateContentStream({
      contents,
    });

    // Create a ReadableStream to stream the response chunks to the client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (streamError) {
          console.error("Error during Gemini stream generation:", streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("POST /api/ai/chat error:", error);
    return NextResponse.json({ error: "Internal Server Error", message: error.message }, { status: 500 });
  }
}
