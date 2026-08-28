"use client";

import { useEffect, useRef, useState } from "react";

export function HeroAdVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);

  useEffect(() => {
    function onFirstInteraction() {
      setUserInteracted(true);
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    }
    window.addEventListener("pointerdown", onFirstInteraction);
    window.addEventListener("keydown", onFirstInteraction);
    return () => {
      window.removeEventListener("pointerdown", onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    };
  }, []);

  function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    if (!next) {
      v.volume = 1;
      const playPromise = v.play();
      if (playPromise && typeof (playPromise as Promise<void>).catch === "function") {
        (playPromise as Promise<void>).catch(() => {});
      }
    }
    setIsMuted(next);
  }

  return (
    <div
      style={{
        marginTop: 24,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "#000",
        boxShadow: "0 18px 45px -18px rgba(15,23,42,0.65)",
        position: "relative",
        width: "100%",
      }}
    >
      <video
        ref={videoRef}
        src="/WH Ad 1.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-warmhello.png"
        title="Warm-Hello — Gentle daily SMS check-ins for seniors living alone."
        onPlay={() => {
          if (videoRef.current) setIsMuted(videoRef.current.muted);
        }}
        onVolumeChange={() => {
          if (videoRef.current) setIsMuted(videoRef.current.muted);
        }}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          aspectRatio: "16 / 10",
          objectFit: "contain",
          background: "#000",
        }}
      />
      <button
        type="button"
        onClick={toggleSound}
        aria-label={isMuted ? "Enable sound for video" : "Mute video"}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          padding: "8px 14px",
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          background: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 999,
          cursor: "pointer",
          zIndex: 2,
          whiteSpace: "nowrap",
        }}
      >
        {isMuted
          ? userInteracted
            ? "🔈 Click to enable sound"
            : "🔈 Sound off (click to enable)"
          : "🔊 Sound on (click to mute)"}
      </button>
    </div>
  );
}

export default HeroAdVideo;
