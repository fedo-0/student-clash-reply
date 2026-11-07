import Constants from 'expo-constants';
import { File as ExpoFile } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { Platform } from 'react-native';

import { type TutorRole } from '@/types/tutor';

/** Logs tutor events strictly to the CLI / Metro terminal. */
export function logTutorEvent(
  level: 'info' | 'warn' | 'error',
  stage: string,
  message: string,
  details?: unknown
) {
  let detailsStr = '';
  if (details !== undefined) {
    if (details instanceof Error) {
      detailsStr = `${details.name}: ${details.message}`;
    } else if (typeof details === 'string') {
      detailsStr = details;
    } else {
      try {
        detailsStr = JSON.stringify(details);
      } catch {
        detailsStr = String(details);
      }
    }
  }

  const prefix = `[Tutor:${stage}]`;
  if (level === 'error') {
    console.error(prefix, message, detailsStr);
  } else if (level === 'warn') {
    console.warn(prefix, message, detailsStr);
  } else {
    console.log(prefix, message, detailsStr);
  }
}

/**
 * Resolves the server base URL across Web, iOS Simulator, Android Emulator, and physical devices.
 */
export function resolveServerOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const cleanHost = hostUri.replace(/^(exp|http|https):\/\//, '').split('/')[0];
    if (cleanHost) {
      return `http://${cleanHost}`;
    }
  }

  throw new Error(
    `Tutor server origin is unavailable (window.location.origin=${
      typeof window !== 'undefined' ? window.location?.origin : 'no-window'
    }, hostUri=${hostUri ?? 'none'}). Run the app via \`npx expo start\`.`
  );
}

function apiUrl(path: string): string {
  const origin = resolveServerOrigin();
  return new URL(path, origin).toString();
}

async function readError(
  stage: string,
  url: string,
  response: { status: number; text(): Promise<string> }
): Promise<string> {
  const raw = await response.text();
  logTutorEvent('error', stage, `HTTP ${response.status} from ${url}`, raw.slice(0, 600));
  try {
    const parsed = JSON.parse(raw) as { error?: string; stage?: string; status?: number };
    if (parsed.error) {
      const serverStage = parsed.stage ? ` [${parsed.stage}]` : '';
      return `${parsed.error}${serverStage}`;
    }
    return raw;
  } catch {
    return raw || `Request to ${url} failed with HTTP ${response.status}`;
  }
}

export interface ChatTurn {
  role: TutorRole;
  content: string;
}

/**
 * Streams the tutor reply. `onText` is called with the full text so far.
 * Resolves with the final reply.
 */
export async function streamTutorReply(options: {
  system: string;
  messages: ChatTurn[];
  signal?: AbortSignal;
  onText: (fullText: string) => void;
}): Promise<string> {
  const url = apiUrl('/api/tutor/chat');
  logTutorEvent('info', 'chat:request', `POST ${url} (${options.messages.length} msgs)`);

  let response: Awaited<ReturnType<typeof expoFetch>>;
  try {
    response = await expoFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: options.system, messages: options.messages }),
      signal: options.signal,
    });
  } catch (networkErr) {
    logTutorEvent('error', 'chat:network', `Failed to reach ${url}`, networkErr);
    throw new Error(
      `[chat:network] Could not reach ${url}: ${
        networkErr instanceof Error ? networkErr.message : String(networkErr)
      }`
    );
  }

  if (!response.ok) {
    const errMsg = await readError('chat:http', url, response);
    throw new Error(errMsg);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const text = await response.text();
    logTutorEvent('info', 'chat:complete', `Received non-streamed reply (${text.length} chars)`);
    options.onText(text);
    return text;
  }

  const decoder = new TextDecoder();
  let fullText = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    fullText += decoder.decode(value, { stream: true });
    options.onText(fullText);
  }
  fullText += decoder.decode();
  logTutorEvent('info', 'chat:complete', `Stream finished (${fullText.length} chars)`);
  return fullText;
}

/** Uploads a local recording and returns the transcript. */
export async function transcribeRecording(uri: string): Promise<string> {
  const url = apiUrl('/api/tutor/transcribe');
  logTutorEvent('info', 'transcribe:start', `Uploading recording (${Platform.OS})`, uri);

  const form = new FormData();

  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'speech.webm');
  } else {
    // Expo SDK 58's WinterCG `FormData` + `expo/fetch` expects an `expo-file-system` `File`
    // (which implements `.bytes()`, `.name`, and `.type`), rather than a legacy `{ uri }` object.
    const file = new ExpoFile(uri);
    form.append('file', file);
  }

  let response: Awaited<ReturnType<typeof expoFetch>>;
  try {
    response = await expoFetch(url, {
      method: 'POST',
      body: form,
    });
  } catch (networkErr) {
    logTutorEvent('error', 'transcribe:network', `Failed to reach ${url}`, networkErr);
    throw new Error(
      `[transcribe:network] Could not reach ${url}: ${
        networkErr instanceof Error ? networkErr.message : String(networkErr)
      }`
    );
  }

  if (!response.ok) {
    const errMsg = await readError('transcribe:http', url, response);
    throw new Error(errMsg);
  }
  const data = (await response.json()) as { text?: string };
  const text = data.text ?? '';
  logTutorEvent('info', 'transcribe:done', `Transcript (${text.length} chars): "${text}"`);
  return text;
}

/** Returns a streamable URL for the spoken version of `text`. */
export function getSpeechUrl(text: string, voice?: string): string {
  const params = new URLSearchParams({ text: text.slice(0, 4000) });
  if (voice) params.set('voice', voice);
  const url = apiUrl(`/api/tutor/speech?${params.toString()}`);
  logTutorEvent('info', 'speech:url', `Prepared TTS stream (${text.length} chars)`);
  return url;
}

/** Strips markdown so text reads naturally when spoken. */
export function toSpeakableText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
