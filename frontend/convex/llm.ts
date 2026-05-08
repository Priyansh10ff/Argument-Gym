"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { buildSystemPrompt, resolveModel, HVH_MONITOR_PROMPT, SALES_PERSONAS } from "./prompts";
import OpenAI from "openai";

// ─── Model routing ────────────────────────────────────────────────────────────
const MODELS: Record<string, string> = {
  auto: "qwen/qwen3-plus:free",
  claude: "anthropic/claude-sonnet-4",
  gpt4: "openai/gpt-4o",
  gemini: "google/gemini-2.5-flash",
  llama: "meta-llama/llama-3.1-70b-instruct",
};

function getClient(): OpenAI {
  return new OpenAI({
    baseURL: process.env.PRIMARY_LLM_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.PRIMARY_LLM_API_KEY,
  });
}

function getModel(modelKey?: string): string {
  return MODELS[modelKey || "auto"] || MODELS.auto;
}

// ─── Sanitize ─────────────────────────────────────────────────────────────────
function sanitize(val: string, maxLen = 3000): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/\|\|\|[A-Z_]+\|\|\|/g, "")
    .replace(/<[^>]{0,200}>/g, "")
    .slice(0, maxLen)
    .trim();
}

// ─── Core LLM call ────────────────────────────────────────────────────────────
async function callLLM(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens = 700,
  modelKey?: string
): Promise<string> {
  const client = getClient();
  const res = await client.chat.completions.create({
    model: getModel(modelKey),
    max_tokens: maxTokens,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
  });
  return res.choices[0]?.message?.content || "";
}

// ─── Extract Claims ───────────────────────────────────────────────────────────
export const extractClaims = action({
  args: {
    statement: v.string(),
    topic: v.string(),
    stance: v.string(),
    difficulty: v.string(),
    mode: v.string(),
    scenario: v.optional(v.string()),
    persona: v.optional(v.string()),
    model: v.optional(v.string()),
    weaknessProfile: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const sys = buildSystemPrompt({
      mode: args.mode || "standard",
      persona: args.persona || "skeptical_cfo",
      scenario: sanitize(args.scenario || ""),
      weaknessProfile: args.weaknessProfile || null,
      topic: sanitize(args.topic, 200),
      stance: args.stance,
      difficulty: args.difficulty,
      claims: [],
    });

    const text = await callLLM(
      sys,
      [
        {
          role: "user",
          content: `ACTION: EXTRACT_CLAIMS\nTopic: ${sanitize(args.topic, 200)}\nStance: ${args.stance}\nDifficulty: ${args.difficulty}\nStatement: ${sanitize(args.statement)}`,
        },
      ],
      512,
      args.model
    );

    const match = text.match(/\|\|\|CLAIMS\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
    if (!match) throw new Error("Model format error — try a different model");
    return JSON.parse(match[1]);
  },
});

// ─── Argue ────────────────────────────────────────────────────────────────────
export const argue = action({
  args: {
    messages: v.array(v.object({ role: v.string(), content: v.string() })),
    topic: v.string(),
    stance: v.string(),
    difficulty: v.string(),
    claims: v.array(v.string()),
    mode: v.string(),
    scenario: v.optional(v.string()),
    persona: v.optional(v.string()),
    model: v.optional(v.string()),
    weaknessProfile: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const sys = buildSystemPrompt({
      mode: args.mode || "standard",
      persona: args.persona || "skeptical_cfo",
      scenario: sanitize(args.scenario || ""),
      weaknessProfile: args.weaknessProfile || null,
      topic: sanitize(args.topic, 200),
      stance: args.stance,
      difficulty: args.difficulty,
      claims: args.claims.map((c) => sanitize(c, 300)),
    });

    const text = await callLLM(sys, args.messages, 800, args.model);

    const scoreMatch = text.match(
      /\|\|\|SCORES\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
    );
    const claimHitsMatch = text.match(
      /\|\|\|CLAIM_HITS\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
    );
    const judgeMatch = text.match(
      /\|\|\|JUDGE\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
    );

    let argumentText = text
      .replace(/\|\|\|SCORES\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, "")
      .replace(/\|\|\|CLAIM_HITS\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, "")
      .replace(/\|\|\|JUDGE\|\|\|[\s\S]*?\|\|\|END\|\|\|/g, "");

    if (args.mode === "courtroom") {
      argumentText = argumentText.replace(/^COUNSEL:\s*/i, "").trim();
    }
    argumentText = argumentText.trim();

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

    return { argument: argumentText, scores, claimHits, judgeRuling };
  },
});

// ─── Verdict ──────────────────────────────────────────────────────────────────
export const getVerdict = action({
  args: {
    messages: v.array(v.object({ role: v.string(), content: v.string() })),
    topic: v.string(),
    stance: v.string(),
    difficulty: v.string(),
    claims: v.array(v.string()),
    sideSwitch: v.boolean(),
    mode: v.string(),
    scenario: v.optional(v.string()),
    persona: v.optional(v.string()),
    model: v.optional(v.string()),
    weaknessProfile: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    const sys = buildSystemPrompt({
      mode: args.mode || "standard",
      persona: args.persona || "skeptical_cfo",
      scenario: sanitize(args.scenario || ""),
      weaknessProfile: args.weaknessProfile || null,
      topic: sanitize(args.topic, 200),
      stance: args.stance,
      difficulty: args.difficulty,
      claims: args.claims.map((c) => sanitize(c, 300)),
    });

    const text = await callLLM(
      sys,
      [
        ...args.messages,
        {
          role: "user",
          content: `ACTION: FINAL_VERDICT${args.sideSwitch ? " (user switched sides)" : ""}`,
        },
      ],
      1000,
      args.model
    );

    const match = text.match(
      /\|\|\|VERDICT\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
    );
    if (!match) throw new Error("Model format error — try a different model");
    return JSON.parse(match[1]);
  },
});

// ─── HvH Monitor ─────────────────────────────────────────────────────────────
export const monitorHvH = action({
  args: {
    topic: v.string(),
    player1Name: v.string(),
    player2Name: v.string(),
    p1Text: v.string(),
    p2Text: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const monitor = `TOPIC: ${args.topic}\nP1 (${args.player1Name}, FOR): ${args.p1Text}\nP2 (${args.player2Name}, AGAINST): ${args.p2Text}\nScore this exchange.`;

    const text = await callLLM(
      HVH_MONITOR_PROMPT,
      [{ role: "user", content: monitor }],
      400,
      args.model
    );

    const match = text.match(
      /\|\|\|HVH_SCORES\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
    );
    if (!match) return null;
    return JSON.parse(match[1]);
  },
});

// ─── HvH Verdict ──────────────────────────────────────────────────────────────
export const hvhVerdict = action({
  args: {
    topic: v.string(),
    player1Name: v.string(),
    player2Name: v.string(),
    transcript: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const text = await callLLM(
      HVH_MONITOR_PROMPT,
      [
        {
          role: "user",
          content: `TOPIC: ${args.topic}\nP1: ${args.player1Name} (FOR)\nP2: ${args.player2Name} (AGAINST)\n\nTRANSCRIPT:\n${args.transcript}\n\nACTION: FINAL_VERDICT`,
        },
      ],
      900,
      args.model
    );

    const match = text.match(
      /\|\|\|HVH_VERDICT\|\|\|([\s\S]*?)\|\|\|END\|\|\|/
    );
    if (!match) throw new Error("Failed to generate verdict");
    return JSON.parse(match[1]);
  },
});

// ─── Get Sales Personas (for frontend dropdown) ──────────────────────────────
export const getSalesPersonas = action({
  args: {},
  handler: async () => {
    return Object.fromEntries(
      Object.entries(SALES_PERSONAS).map(([k, v]) => [
        k,
        { name: v.name, shortDesc: v.shortDesc },
      ])
    );
  },
});
