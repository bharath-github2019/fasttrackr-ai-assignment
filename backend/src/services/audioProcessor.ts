import OpenAI from "openai";
import { z } from "zod";
import { AudioEnrichment } from "../types.js";

const EnrichmentSchema = z.object({
  householdName: z.string().optional(),
  updates: z
    .object({
      annualIncome: z.number().optional(),
      netWorth: z.number().optional(),
      liquidNetWorth: z.number().optional(),
      expenseRange: z.string().optional(),
      taxBracket: z.string().optional(),
      riskTolerance: z.string().optional(),
      timeHorizonYears: z.number().optional(),
      notes: z.string().optional()
    })
    .default({}),
  memberUpdates: z
    .array(
      z.object({
        fullName: z.string(),
        dateOfBirth: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        relationship: z.string().optional(),
        addressLine: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional()
      })
    )
    .default([]),
  accountUpdates: z
    .array(
      z.object({
        accountNumber: z.string().optional(),
        custodian: z.string().optional(),
        accountType: z.string().optional(),
        accountValue: z.number().optional(),
        ownershipDistribution: z.string().optional()
      })
    )
    .default([]),
  bankUpdates: z
    .array(
      z.object({
        bankName: z.string().optional(),
        accountNumber: z.string().optional(),
        routingNumber: z.string().optional()
      })
    )
    .default([]),
  summary: z.string().default("No enrichment summary generated."),
  confidence: z.enum(["low", "medium", "high"]).default("low")
});

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const fallbackEnrichment = (transcript: string): AudioEnrichment => ({
  updates: {
    notes: transcript.slice(0, 500)
  },
  memberUpdates: [],
  accountUpdates: [],
  bankUpdates: [],
  summary:
    "Audio processed without OpenAI key. Transcript captured in notes for manual review.",
  confidence: "low"
});

export const transcribeAndExtract = async (
  audioBuffer: Buffer,
  fileName: string
): Promise<{ transcript: string; enrichment: AudioEnrichment }> => {
  if (!client) {
    return {
      transcript: "OpenAI API key is missing; transcription skipped.",
      enrichment: fallbackEnrichment("OpenAI API key is missing; transcription skipped.")
    };
  }

  const file = new File([new Uint8Array(audioBuffer)], fileName, {
    type: "audio/mpeg"
  });
  const transcription = await client.audio.transcriptions.create({
    file,
    model: "whisper-1"
  });

  const transcript = transcription.text;

  const extraction = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    input: [
      {
        role: "system",
        content:
          "You are a financial CRM extraction assistant. Return strict JSON only. Extract possible household updates from transcript with conservative confidence."
      },
      {
        role: "user",
        content: transcript
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "audio_enrichment",
        strict: true,
        schema: {
          type: "object",
          properties: {
            householdName: { type: "string" },
            updates: {
              type: "object",
              properties: {
                annualIncome: { type: "number" },
                netWorth: { type: "number" },
                liquidNetWorth: { type: "number" },
                expenseRange: { type: "string" },
                taxBracket: { type: "string" },
                riskTolerance: { type: "string" },
                timeHorizonYears: { type: "number" },
                notes: { type: "string" }
              },
              additionalProperties: false
            },
            memberUpdates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  dateOfBirth: { type: "string" },
                  email: { type: "string" },
                  phone: { type: "string" },
                  relationship: { type: "string" },
                  addressLine: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  postalCode: { type: "string" },
                  country: { type: "string" }
                },
                required: ["fullName"],
                additionalProperties: false
              }
            },
            accountUpdates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  accountNumber: { type: "string" },
                  custodian: { type: "string" },
                  accountType: { type: "string" },
                  accountValue: { type: "number" },
                  ownershipDistribution: { type: "string" }
                },
                additionalProperties: false
              }
            },
            bankUpdates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  bankName: { type: "string" },
                  accountNumber: { type: "string" },
                  routingNumber: { type: "string" }
                },
                additionalProperties: false
              }
            },
            summary: { type: "string" },
            confidence: { type: "string", enum: ["low", "medium", "high"] }
          },
          required: [
            "updates",
            "memberUpdates",
            "accountUpdates",
            "bankUpdates",
            "summary",
            "confidence"
          ],
          additionalProperties: false
        }
      }
    }
  });

  const output = extraction.output_text || "{}";
  const parsed = EnrichmentSchema.safeParse(JSON.parse(output));
  if (!parsed.success) {
    return { transcript, enrichment: fallbackEnrichment(transcript) };
  }

  return { transcript, enrichment: parsed.data };
};
