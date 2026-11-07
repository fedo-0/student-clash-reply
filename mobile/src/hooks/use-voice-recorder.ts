import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import { useState } from 'react';

import { logTutorEvent } from '@/lib/tutor-api';

const VOICE_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64000,
  isMeteringEnabled: true,
};

export class MicrophonePermissionError extends Error {
  constructor() {
    super('Microphone access is required. Enable it in Settings to talk to your tutor.');
  }
}

/** Thin wrapper over expo-audio's recorder tailored for speech capture. */
export function useVoiceRecorder() {
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const [isRecording, setIsRecording] = useState(false);

  const start = async () => {
    logTutorEvent('info', 'recorder:start', 'Requesting microphone permission');
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      logTutorEvent('error', 'recorder:permission', `Permission denied (${permission.status})`);
      throw new MicrophonePermissionError();
    }

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      logTutorEvent('info', 'recorder:recording', 'Microphone recording started');
    } catch (err) {
      logTutorEvent('error', 'recorder:start-failed', 'Failed to start audio recorder', err);
      throw err;
    }
  };

  /** Stops recording and returns the file URI (or null if nothing was recorded). */
  const stop = async (): Promise<string | null> => {
    if (!recorder.isRecording) {
      setIsRecording(false);
      return null;
    }
    try {
      await recorder.stop();
      setIsRecording(false);
      // Restore playback-friendly audio routing (loudspeaker on iOS).
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      logTutorEvent('info', 'recorder:stopped', `Saved recording URI: ${recorder.uri ?? 'null'}`);
      return recorder.uri;
    } catch (err) {
      setIsRecording(false);
      logTutorEvent('error', 'recorder:stop-failed', 'Failed to stop audio recorder', err);
      throw err;
    }
  };

  /** Current input level in dBFS (-160 = silence, 0 = max). */
  const getLevel = (): number => {
    if (!recorder.isRecording) return -160;
    return recorder.getStatus().metering ?? -160;
  };

  const getDurationMs = (): number => recorder.getStatus().durationMillis ?? 0;

  return { isRecording, start, stop, getLevel, getDurationMs };
}
