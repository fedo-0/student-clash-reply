import {
  DEFAULT_TUTOR_VOICE,
  describeKeyStatus,
  getOpenAIKey,
  jsonError,
  logServer,
  missingKeyResponse,
  OPENAI_BASE_URL,
  readOpenAIError,
  TUTOR_MODELS,
} from '@/lib/openai.server';

const ALLOWED_VOICES = new Set([
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar',
]);

const MAX_INPUT_CHARS = 4000;
const ROUTE = 'speech';

/**
 * GET /api/tutor/speech?text=...&voice=alloy
 * Response: audio/mpeg stream. Exposed as GET so the native audio player
 * can stream it directly from a URL.
 */
export async function GET(request: Request): Promise<Response> {
  logServer(ROUTE, `GET /api/tutor/speech received (key: ${describeKeyStatus()})`);

  const apiKey = getOpenAIKey();
  if (!apiKey) return missingKeyResponse(ROUTE);

  const url = new URL(request.url);
  const text = (url.searchParams.get('text') ?? '').trim().slice(0, MAX_INPUT_CHARS);
  if (!text) return jsonError('Missing `text` query parameter', 400, `${ROUTE}:missing-text`);

  const requestedVoice = url.searchParams.get('voice') ?? DEFAULT_TUTOR_VOICE;
  const voice = ALLOWED_VOICES.has(requestedVoice) ? requestedVoice : 'alloy';

  const requestSpeech = async (model: string): Promise<Response> => {
    const supportsInstructions = model.startsWith('gpt-4o');
    logServer(ROUTE, `Calling OpenAI audio/speech`, {
      model,
      voice,
      chars: text.length,
    });
    return fetch(`${OPENAI_BASE_URL}/audio/speech`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        input: text,
        response_format: 'mp3',
        ...(supportsInstructions
          ? {
              instructions:
                'Speak like a warm, encouraging university tutor. Clear pacing, natural tone.',
            }
          : {}),
      }),
    });
  };

  let upstream: Response;
  try {
    upstream = await requestSpeech(TUTOR_MODELS.speech);
    // Automatic fallback to `tts-1` if the project doesn't have access to `gpt-4o-mini-tts`.
    if (!upstream.ok && TUTOR_MODELS.speech !== 'tts-1' && (upstream.status === 404 || upstream.status === 400 || upstream.status === 403)) {
      logServer(ROUTE, `Primary TTS model "${TUTOR_MODELS.speech}" returned ${upstream.status}; falling back to "tts-1"`);
      upstream = await requestSpeech('tts-1');
    }
  } catch (err) {
    return jsonError(
      `Network error reaching OpenAI TTS: ${err instanceof Error ? err.message : String(err)}`,
      502,
      `${ROUTE}:fetch-openai`
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errMsg = await readOpenAIError(ROUTE, upstream);
    return jsonError(errMsg, upstream.status || 502, `${ROUTE}:openai-upstream`);
  }

  logServer(ROUTE, `OpenAI TTS audio stream ready (HTTP ${upstream.status})`);

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}
