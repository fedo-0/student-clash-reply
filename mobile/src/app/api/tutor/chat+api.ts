import {
  describeKeyStatus,
  getOpenAIKey,
  jsonError,
  logServer,
  logServerError,
  missingKeyResponse,
  OPENAI_BASE_URL,
  readOpenAIError,
  TUTOR_MODELS,
} from '@/lib/openai.server';

interface ChatRequestBody {
  system?: unknown;
  messages?: unknown;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const MAX_HISTORY = 40;
const MAX_MESSAGE_CHARS = 8000;
const ROUTE = 'chat';

function sanitizeMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value)) return null;
  const result: ChatMessage[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const { role, content } = item as Record<string, unknown>;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return null;
    }
    if (content.trim().length === 0) continue;
    result.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  return result.slice(-MAX_HISTORY);
}

/**
 * GET /api/tutor/chat
 * Diagnostic healthcheck endpoint so the client can verify API route + OpenAI key status.
 */
export async function GET(): Promise<Response> {
  const key = getOpenAIKey();
  const status = describeKeyStatus();
  logServer(ROUTE, `Healthcheck GET -> key ${status}`, TUTOR_MODELS);
  return Response.json({
    ok: Boolean(key),
    keyStatus: status,
    models: TUTOR_MODELS,
  });
}

/**
 * POST /api/tutor/chat
 * Body: { system: string, messages: { role, content }[] }
 * Response: a plain-text stream of the assistant reply.
 */
export async function POST(request: Request): Promise<Response> {
  logServer(ROUTE, `POST /api/tutor/chat received (key: ${describeKeyStatus()})`);

  const apiKey = getOpenAIKey();
  if (!apiKey) return missingKeyResponse(ROUTE);

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch (err) {
    return jsonError('Invalid JSON body sent to /api/tutor/chat', 400, `${ROUTE}:parse-body`, String(err));
  }

  const messages = sanitizeMessages(body.messages);
  if (!messages || messages.length === 0) {
    return jsonError('`messages` must be a non-empty array', 400, `${ROUTE}:validate-messages`);
  }
  const system = typeof body.system === 'string' ? body.system.slice(0, 12000) : '';

  logServer(ROUTE, `Calling OpenAI chat/completions`, {
    model: TUTOR_MODELS.chat,
    messageCount: messages.length,
    lastUserPreview: messages[messages.length - 1]?.content.slice(0, 80),
  });

  let upstream: Response;
  try {
    upstream = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: TUTOR_MODELS.chat,
        stream: true,
        temperature: 0.6,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages,
        ],
      }),
      signal: request.signal,
    });
  } catch (err) {
    return jsonError(
      `Network error reaching OpenAI: ${err instanceof Error ? err.message : String(err)}`,
      502,
      `${ROUTE}:fetch-openai`
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errMsg = await readOpenAIError(ROUTE, upstream);
    return jsonError(errMsg, upstream.status || 502, `${ROUTE}:openai-upstream`);
  }

  logServer(ROUTE, `OpenAI stream connected (HTTP ${upstream.status})`);

  // Convert OpenAI's SSE stream into a plain UTF-8 text stream of deltas.
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data) as {
              choices?: { delta?: { content?: string } }[];
              error?: { message?: string };
            };
            if (parsed.error?.message) {
              logServerError(ROUTE, 'OpenAI stream error event', parsed.error);
            }
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // Ignore keep-alive or partial lines.
          }
        }
      } catch (streamErr) {
        logServerError(ROUTE, 'Stream pull failed', streamErr);
        controller.error(streamErr);
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
