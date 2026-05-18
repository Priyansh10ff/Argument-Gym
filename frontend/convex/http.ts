import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import OpenAI from "openai";
import { buildSystemPrompt, resolveModel } from "./prompts";

const http = httpRouter();

// ─── Auth routes ────────────────────────────────────────────────────────────
auth.addHttpRoutes(http);

// ─── Streaming argue endpoint ───────────────────────────────────────────────
http.route({
  path: "/api/stream/argue",
  method: "POST",
  handler: httpAction(async (_ctx, request) => {
    const body = await request.json();

    const MODELS: Record<string, string> = {
      auto: "openrouter/auto",
      claude: "anthropic/claude-sonnet-4",
      gpt4: "openai/gpt-4o",
      gemini: "google/gemini-2.5-flash",
      llama: "meta-llama/llama-3.1-70b-instruct",
    };

    const modelId = MODELS[body.model || "auto"] || MODELS.auto;

    const client = new OpenAI({
      baseURL:
        process.env.PRIMARY_LLM_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey: process.env.PRIMARY_LLM_API_KEY,
    });

    function sanitize(val: string, maxLen = 3000): string {
      if (typeof val !== "string") return "";
      return val
        .replace(/\|\|\|[A-Z_]+\|\|\|/g, "")
        .replace(/<[^>]{0,200}>/g, "")
        .slice(0, maxLen)
        .trim();
    }

    const sys = buildSystemPrompt({
      mode: body.mode || "standard",
      persona: body.persona || "skeptical_cfo",
      scenario: sanitize(body.scenario || ""),
      weaknessProfile: body.weaknessProfile || null,
      topic: sanitize(body.topic, 200),
      stance: body.stance || "for",
      difficulty: body.difficulty || "rigorous",
      claims: (body.claims || []).map((c: string) => sanitize(c, 300)),
    });

    const messages = (body.messages || []).map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    const stream = await client.chat.completions.create({
      model: modelId,
      max_tokens: 800,
      stream: true,
      messages: [{ role: "system" as const, content: sys }, ...messages],
    });

    const encoder = new TextEncoder();
    let fullText = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) {
              fullText += token;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ token })}\n\n`)
              );
            }
          }

          // Parse structured data from the full response
          const scoreMatch = fullText.match(
            /\|\|\|SCORES\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
          );
          const claimHitsMatch = fullText.match(
            /\|\|\|CLAIM_HITS\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
          );
          const judgeMatch = fullText.match(
            /\|\|\|JUDGE\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
          );

          let argumentText = fullText
            .replace(/\|\|\|SCORES\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, "")
            .replace(/\|\|\|CLAIM_HITS\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, "")
            .replace(/\|\|\|JUDGE\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, "")
            .trim();

          if (body.mode === "courtroom") {
            argumentText = argumentText
              .replace(/^COUNSEL:\s*/i, "")
              .trim();
          }

          let scores = {
            logic: 7,
            evidence: 6,
            originality: 7,
            roundFeedback: "",
          };
          let claimHits = [false, false, false];
          let judgeRuling = null;

          if (scoreMatch) {
            try {
              scores = JSON.parse(scoreMatch[1]);
            } catch (_) {}
          }
          if (claimHitsMatch) {
            try {
              claimHits = JSON.parse(claimHitsMatch[1]);
            } catch (_) {}
          }
          if (judgeMatch) {
            try {
              judgeRuling = JSON.parse(judgeMatch[1]);
            } catch (_) {}
          }

          // Send final structured data
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                argument: argumentText,
                scores,
                claimHits,
                judgeRuling,
              })}\n\n`
            )
          );
          controller.close();
        } catch (error: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: error.message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// ─── CORS preflight for streaming ───────────────────────────────────────────
http.route({
  path: "/api/stream/argue",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }),
});

export default http;
