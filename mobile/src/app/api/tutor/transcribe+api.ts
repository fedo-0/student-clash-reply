import {
  describeKeyStatus,
  getOpenAIKey,
  jsonError,
  logServer,
  missingKeyResponse,
  OPENAI_BASE_URL,
  readOpenAIError,
  TUTOR_MODELS,
} from '@/lib/openai.server';

const MAX_AUDIO_BYTES = 24 * 1024 * 1024; // OpenAI limit is 25 MB
const ROUTE = 'transcribe';

interface WebFormData {
  get(name: string): File | string | null;
}

/**
 * POST /api/tutor/transcribe
 * Body: multipart/form-data with `file` (audio) and optional `language` (ISO-639-1).
 * Response: { text: string }
 */
export async function POST(request: Request): Promise<Response> {
  logServer(ROUTE, `POST /api/tutor/transcribe received (key: ${describeKeyStatus()})`);

  const apiKey = getOpenAIKey();
  if (!apiKey) return missingKeyResponse(ROUTE);

  let form: WebFormData;
  try {
    form = (await request.formData()) as unknown as WebFormData;
  } catch (err) {
    return jsonError(
      `Expected multipart/form-data body: ${err instanceof Error ? err.message : String(err)}`,
      400,
      `${ROUTE}:parse-form`
    );
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') {
    return jsonError('Missing `file` field in multipart upload', 400, `${ROUTE}:missing-file`);
  }
  logServer(ROUTE, `Audio file received`, {
    size: file.size,
    type: file.type,
    name: 'name' in file ? file.name : 'unknown',
  });

  if (file.size === 0) return Response.json({ text: '' });
  if (file.size > MAX_AUDIO_BYTES) {
    return jsonError('Audio file too large (>24MB)', 413, `${ROUTE}:file-too-large`);
  }

  const fileName =
    'name' in file && typeof file.name === 'string' && file.name ? file.name : 'speech.m4a';

  const language = form.get('language');
  const validLang =
    typeof language === 'string' && /^[a-z]{2}$/.test(language) ? language : null;

  const tryTranscribe = async (model: string): Promise<Response> => {
    const upstreamForm = new FormData();
    upstreamForm.append('file', file, fileName);
    upstreamForm.append('model', model);
    if (validLang) upstreamForm.append('language', validLang);

    logServer(ROUTE, `Calling OpenAI audio/transcriptions with model="${model}"`);
    return fetch(`${OPENAI_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstreamForm,
    });
  };

  let upstream: Response;
  try {
    upstream = await tryTranscribe(TUTOR_MODELS.transcribe);
    // Automatic fallback to `whisper-1` if the project doesn't have access to `gpt-4o-mini-transcribe`.
    if (!upstream.ok && TUTOR_MODELS.transcribe !== 'whisper-1' && (upstream.status === 404 || upstream.status === 400 || upstream.status === 403)) {
      logServer(ROUTE, `Primary model "${TUTOR_MODELS.transcribe}" returned ${upstream.status}; falling back to "whisper-1"`);
      upstream = await tryTranscribe('whisper-1');
    }
  } catch (err) {
    return jsonError(
      `Network error reaching OpenAI transcription: ${err instanceof Error ? err.message : String(err)}`,
      502,
      `${ROUTE}:fetch-openai`
    );
  }

  if (!upstream.ok) {
    const errMsg = await readOpenAIError(ROUTE, upstream);
    return jsonError(errMsg, upstream.status || 502, `${ROUTE}:openai-upstream`);
  }

  const data = (await upstream.json()) as { text?: string };
  const text = (data.text ?? '').trim();
  logServer(ROUTE, `Transcription succeeded (${text.length} chars): "${text.slice(0, 80)}"`);
  return Response.json({ text });
}
