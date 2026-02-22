"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MUTE_STORAGE_KEY = "feastqr-orders-sound-muted";

function playBeepSound() {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Two-tone alert: high then low
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.15); // E5

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);

    // Play second beep after short pause
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.5);
    osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.65);

    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.5);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);

    osc2.start(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.9);

    // Clean up
    setTimeout(() => {
      void ctx.close();
    }, 1500);
  } catch {
    // Web Audio API not available, silently fail
  }
}

export function useOrderSound() {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  });
  const lastCountRef = useRef<number | null>(null);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;

      localStorage.setItem(MUTE_STORAGE_KEY, String(next));

      return next;
    });
  }, []);

  const checkNewOrders = useCallback(
    (currentCount: number) => {
      if (lastCountRef.current === null) {
        // First load, just set the baseline
        lastCountRef.current = currentCount;

        return;
      }

      if (currentCount > lastCountRef.current && !isMuted) {
        playBeepSound();
      }

      lastCountRef.current = currentCount;
    },
    [isMuted],
  );

  // Reset baseline when muting/unmuting
  useEffect(() => {
    // Keep the current count as baseline when toggling
  }, [isMuted]);

  return { isMuted, toggleMute, checkNewOrders };
}
