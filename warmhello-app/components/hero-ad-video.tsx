"use client";

import { useRef, useState } from "react";

export function HeroAdVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

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
        title={isMuted ? "Enable sound" : "Mute video"}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          background: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: "50%",
          cursor: "pointer",
          zIndex: 2,
        }}
      >
        {isMuted ? (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default HeroAdVideo;
