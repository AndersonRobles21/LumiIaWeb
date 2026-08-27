// gemini.config.js
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

throw new Error("GEMINI_API_KEY no está configurada");

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const GEMINI_TEMPERATURE = Number(
  process.env.GEMINI_TEMPERATURE ?? 0.6
);

export const GEMINI_MAX_OUTPUT_TOKENS = Number(
  process.env.GEMINI_MAX_OUTPUT_TOKENS ?? 8192
);

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});