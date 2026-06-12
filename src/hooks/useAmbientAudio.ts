import { useEffect, useRef, useState } from "react";

/**
 * Real microphone capture with RMS volume analysis.
 * Stand-in for full YAMNet scream detection — sustained loud audio
 * (RMS > threshold for ~600ms) is flagged as a potential threat.
 * No audio is ever uploaded or stored.
 */
export function useAmbientAudio() {
  const [enabled, setEnabled] = useState(false);
  const [level, setLevel] = useState(0); // 0..1
  const [error, setError] = useState<string | null>(null);
  const [threatScore, setThreatScore] = useState(0); // 0..1 sliding confidence
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        src.connect(analyser);
        const buf = new Float32Array(analyser.fftSize);
        let loudFrames = 0;

        const tick = () => {
          analyser.getFloatTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
          const rms = Math.sqrt(sum / buf.length);
          const norm = Math.min(1, rms * 5);
          setLevel(norm);
          if (norm > 0.55) loudFrames += 1; else loudFrames = Math.max(0, loudFrames - 1);
          setThreatScore(Math.min(1, loudFrames / 40));
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (e: any) {
        setError(e?.message ?? "Microphone permission denied");
        setEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      setLevel(0);
      setThreatScore(0);
    };
  }, [enabled]);

  return { enabled, setEnabled, level, threatScore, error };
}
