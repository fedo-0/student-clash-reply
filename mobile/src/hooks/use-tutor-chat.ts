import { useEffect, useRef, useState } from 'react';

import { useProfile } from '@/context/profile-context';
import { createId, useTutor } from '@/context/tutor-context';
import { streamTutorReply } from '@/lib/tutor-api';
import { type TutorMessage, type TutorModeId, type TutorThread } from '@/types/tutor';
import { buildTutorSystemPrompt } from '@/utils/tutor-prompt';

interface UseTutorChatOptions {
  /** `null` while the chat is still a draft (no message sent yet). */
  threadId: string | null;
  draftCourseId: string | null;
  draftMode: TutorModeId;
  onThreadCreated: (thread: TutorThread) => void;
}

interface SendOptions {
  viaVoice?: boolean;
}

export function useTutorChat({
  threadId,
  draftCourseId,
  draftMode,
  onThreadCreated,
}: UseTutorChatOptions) {
  const { activeProfile, activeProfileId, courses, quizAttempts, upcomingExams, targetAverage } =
    useProfile();
  const { getThread, createThread, appendMessage, updateMessage, removeMessage } = useTutor();

  const thread = threadId ? getThread(threadId) : undefined;
  const courseId = thread ? thread.courseId : draftCourseId;
  const mode = thread ? thread.mode : draftMode;
  const course = courses.find((item) => item.id === courseId) ?? null;

  const [isResponding, setIsResponding] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const threadIdRef = useRef<string | null>(threadId);
  const historyRef = useRef<TutorMessage[]>(thread?.messages ?? []);

  useEffect(() => {
    threadIdRef.current = threadId;
  }, [threadId]);

  useEffect(() => {
    if (thread) historyRef.current = thread.messages;
  }, [thread]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
  };

  /** Sends a user message and resolves with the assistant reply (or null on failure). */
  const send = async (text: string, options: SendOptions = {}): Promise<string | null> => {
    const content = text.trim();
    if (!content) return null;
    stop();

    const userMessage: TutorMessage = {
      id: createId('msg'),
      role: 'user',
      content,
      createdAt: Date.now(),
      viaVoice: options.viaVoice,
    };

    let activeThreadId = threadIdRef.current;
    if (!activeThreadId) {
      const created = createThread({
        profileId: activeProfileId,
        courseId,
        mode,
        firstMessage: userMessage,
      });
      activeThreadId = created.id;
      threadIdRef.current = created.id;
      historyRef.current = [];
      onThreadCreated(created);
    } else {
      appendMessage(activeThreadId, userMessage);
    }

    const history = [...historyRef.current, userMessage];
    historyRef.current = history;

    const assistantMessage: TutorMessage = {
      id: createId('msg'),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      viaVoice: options.viaVoice,
    };
    appendMessage(activeThreadId, assistantMessage);

    const system = buildTutorSystemPrompt({
      profile: activeProfile,
      courses,
      course,
      mode,
      quizAttempts,
      upcomingExams,
      targetAverage,
      voice: Boolean(options.viaVoice),
    });

    const controller = new AbortController();
    abortRef.current = controller;
    setIsResponding(true);

    const targetThreadId = activeThreadId;
    let latest = '';
    try {
      const reply = await streamTutorReply({
        system,
        messages: history
          .filter((message) => !message.isError)
          .map(({ role, content: body }) => ({ role, content: body })),
        signal: controller.signal,
        onText: (fullText) => {
          latest = fullText;
          updateMessage(targetThreadId, assistantMessage.id, { content: fullText });
        },
      });
      historyRef.current = [...history, { ...assistantMessage, content: reply }];
      return reply;
    } catch (error) {
      if (controller.signal.aborted) {
        historyRef.current = [...history, { ...assistantMessage, content: latest }];
        return latest || null;
      }
      const message = error instanceof Error ? error.message : 'Something went wrong';
      updateMessage(targetThreadId, assistantMessage.id, {
        content: `⚠️ ${message}`,
        isError: true,
      });
      return null;
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsResponding(false);
    }
  };

  /** Re-sends the user message that produced a failed assistant reply. */
  const retry = async (errorMessageId: string): Promise<string | null> => {
    const activeThreadId = threadIdRef.current;
    if (!activeThreadId) return null;
    const history = historyRef.current;
    const errorIndex = history.findIndex((message) => message.id === errorMessageId);
    if (errorIndex < 0) return null;
    const previousUser = history
      .slice(0, errorIndex)
      .reverse()
      .find((message) => message.role === 'user');
    if (!previousUser) return null;

    removeMessage(activeThreadId, errorMessageId);
    removeMessage(activeThreadId, previousUser.id);
    historyRef.current = history.filter(
      (message) => message.id !== errorMessageId && message.id !== previousUser.id
    );
    return send(previousUser.content, { viaVoice: previousUser.viaVoice });
  };

  return { thread, course, mode, isResponding, send, stop, retry };
}
