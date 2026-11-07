/**
 * Server-only OpenAI helpers used by the Expo Router API routes in
 * `src/app/api/tutor/*`. This file must never be imported from client code:
 * it reads `OPENAI_API_KEY`, which is intentionally NOT prefixed with
 * `EXPO_PUBLIC_` so it is never inlined into the app bundle.
 */

export const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export const TUTOR_MODELS = {
  chat: process.env.OPENAI_TUTOR_CHAT_MODEL ?? 'gpt-4o-mini',
  transcribe: process.env.OPENAI_TUTOR_TRANSCRIBE_MODEL ?? 'gpt-4o-mini-transcribe',
  speech: process.env.OPENAI_TUTOR_SPEECH_MODEL ?? 'gpt-4o-mini-tts',
};

export const DEFAULT_TUTOR_VOICE = process.env.OPENAI_TUTOR_VOICE ?? 'alloy';

export function logServer(route: string, message: string, details?: unknown) {
  if (details !== undefined) {
    console.log(`[TutorAPI:${route}] ${message}`, details);
  } else {
    console.log(`[TutorAPI:${route}] ${message}`);
  }
}

export function logServerError(route: string, message: string, error?: unknown) {
  console.error(`[TutorAPI:${route} ERROR] ${message}`, error ?? '');
}

export function getOpenAIKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.trim().length === 0) {
    return null;
  }
  const trimmed = key.trim().replace(/^["']|["']$/g, '');
  return trimmed.length > 0 ? trimmed : null;
}

export function describeKeyStatus(): string {
  const raw = process.env.OPENAI_API_KEY;
  if (!raw) return 'missing (process.env.OPENAI_API_KEY is undefined)';
  const cleaned = getOpenAIKey();
  if (!cleaned) return 'empty string';
  if (!cleaned.startsWith('sk-')) {
    return `present (${cleaned.length} chars, starts with "${cleaned.slice(0, 4)}..." - expected "sk-...")`;
  }
  return `present (${cleaned.length} chars, ${cleaned.slice(0, 7)}...${cleaned.slice(-4)})`;
}

export function jsonError(
  message: string,
  status: number,
  stage?: string,
  details?: unknown
): Response {
  logServerError(stage ?? 'response', `HTTP ${status}: ${message}`, details);
  return Response.json(
    {
      error: message,
      stage: stage ?? 'unknown',
      status,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export function missingKeyResponse(route: string): Response {
  const keyStatus = describeKeyStatus();
  return jsonError(
    `OPENAI_API_KEY is not configured on the server (${keyStatus}). Add OPENAI_API_KEY=sk-... to .env.local and restart \`npx expo start -c\`.`,
    500,
    `${route}:env-check`
  );
}

/** Extracts a human-readable error message from an OpenAI error response. */
export async function readOpenAIError(route: string, response: Response): Promise<string> {
  const raw = await response.text();
  logServerError(
    route,
    `OpenAI upstream failed with HTTP ${response.status} ${response.statusText}`,
    raw.slice(0, 1000)
  );
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; code?: string; type?: string };
    };
    const err = parsed.error;
    if (err?.message) {
      const code = err.code || err.type ? ` [${err.code ?? err.type}]` : '';
      return `OpenAI (${response.status})${code}: ${err.message}`;
    }
    return raw;
  } catch {
    return raw || `OpenAI request failed with HTTP ${response.status}`;
  }
}
