"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type TimerStatus = "idle" | "running" | "paused" | "completed";

interface UsePomodoroTimerOptions {
  durationMinutes: number;
  onComplete?: () => void;
  onTick?: (secondsLeft: number) => void;
}

export function usePomodoroTimer({
  durationMinutes,
  onComplete,
  onTick,
}: UsePomodoroTimerOptions) {
  const totalSeconds = durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [status, setStatus] = useState<TimerStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onTickRef = useRef(onTick);

  onCompleteRef.current = onComplete;
  onTickRef.current = onTick;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setStatus("running");
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        const next = prev - 1;
        onTickRef.current?.(next);
        if (next <= 0) {
          clearTimer();
          setStatus("completed");
          onCompleteRef.current?.();
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setStatus("paused");
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (status === "paused") start();
  }, [status, start]);

  const reset = useCallback(() => {
    clearTimer();
    setSecondsLeft(totalSeconds);
    setStatus("idle");
  }, [clearTimer, totalSeconds]);

  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return {
    secondsLeft,
    minutes,
    seconds,
    status,
    progress,
    start,
    pause,
    resume,
    reset,
  };
}
