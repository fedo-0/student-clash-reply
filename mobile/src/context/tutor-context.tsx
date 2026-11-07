import { Storage } from 'expo-sqlite/kv-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { type ProfileId } from '@/data/profiles';
import { type TutorMessage, type TutorModeId, type TutorThread } from '@/types/tutor';

const STORAGE_KEY = 'tutor.threads.v1';
const PERSIST_DELAY_MS = 400;

function loadThreads(): TutorThread[] {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TutorThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 48 ? `${clean.slice(0, 45)}…` : clean || 'New chat';
}

interface CreateThreadInput {
  profileId: ProfileId;
  courseId: string | null;
  mode: TutorModeId;
  firstMessage: TutorMessage;
}

interface TutorContextValue {
  threads: TutorThread[];
  getThread: (id: string) => TutorThread | undefined;
  createThread: (input: CreateThreadInput) => TutorThread;
  deleteThread: (id: string) => void;
  appendMessage: (threadId: string, message: TutorMessage) => void;
  updateMessage: (threadId: string, messageId: string, patch: Partial<TutorMessage>) => void;
  removeMessage: (threadId: string, messageId: string) => void;
}

const TutorContext = createContext<TutorContextValue | undefined>(undefined);

export function TutorProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<TutorThread[]>(loadThreads);

  // Debounced persistence (streaming updates fire many times per second).
  useEffect(() => {
    const timer = setTimeout(() => {
      Storage.setItemAsync(STORAGE_KEY, JSON.stringify(threads)).catch(() => {});
    }, PERSIST_DELAY_MS);
    return () => clearTimeout(timer);
  }, [threads]);

  const getThread = useCallback(
    (id: string) => threads.find((thread) => thread.id === id),
    [threads]
  );

  const createThread = useCallback((input: CreateThreadInput) => {
    const now = Date.now();
    const thread: TutorThread = {
      id: createId('thread'),
      profileId: input.profileId,
      courseId: input.courseId,
      mode: input.mode,
      title: titleFrom(input.firstMessage.content),
      createdAt: now,
      updatedAt: now,
      messages: [input.firstMessage],
    };
    setThreads((prev) => [thread, ...prev]);
    return thread;
  }, []);

  const deleteThread = useCallback((id: string) => {
    setThreads((prev) => prev.filter((thread) => thread.id !== id));
  }, []);

  const mutateThread = useCallback(
    (threadId: string, mutate: (thread: TutorThread) => TutorThread) => {
      setThreads((prev) =>
        prev.map((thread) => (thread.id === threadId ? mutate(thread) : thread))
      );
    },
    []
  );

  const appendMessage = useCallback(
    (threadId: string, message: TutorMessage) => {
      mutateThread(threadId, (thread) => ({
        ...thread,
        updatedAt: Date.now(),
        messages: [...thread.messages, message],
      }));
    },
    [mutateThread]
  );

  const updateMessage = useCallback(
    (threadId: string, messageId: string, patch: Partial<TutorMessage>) => {
      mutateThread(threadId, (thread) => ({
        ...thread,
        messages: thread.messages.map((message) =>
          message.id === messageId ? { ...message, ...patch } : message
        ),
      }));
    },
    [mutateThread]
  );

  const removeMessage = useCallback(
    (threadId: string, messageId: string) => {
      mutateThread(threadId, (thread) => ({
        ...thread,
        messages: thread.messages.filter((message) => message.id !== messageId),
      }));
    },
    [mutateThread]
  );

  return (
    <TutorContext.Provider
      value={{
        threads,
        getThread,
        createThread,
        deleteThread,
        appendMessage,
        updateMessage,
        removeMessage,
      }}>
      {children}
    </TutorContext.Provider>
  );
}

export function useTutor(): TutorContextValue {
  const context = useContext(TutorContext);
  if (!context) {
    throw new Error('useTutor must be used within a TutorProvider');
  }
  return context;
}
