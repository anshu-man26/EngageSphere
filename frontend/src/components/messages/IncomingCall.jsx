import React, { useEffect, useState } from 'react';
import { FaPhone, FaVideo } from 'react-icons/fa';

export default function IncomingCall({ callerName, onAccept, onDecline }) {
  const initial = (callerName || 'U').charAt(0).toUpperCase();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-[10001] flex flex-col items-center justify-between p-6 sm:p-8 overflow-hidden">
      {/* Layered background — solid black + glowing gradient orbs */}
      <div aria-hidden className="absolute inset-0 bg-black" />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-black to-blue-900/40"
      />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-emerald-500/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-20 w-[420px] h-[420px] rounded-full bg-blue-500/10 blur-3xl"
      />

      {/* Top label */}
      <div className="relative z-10 mt-6 sm:mt-12 text-center">
        <p className="text-white/50 text-[11px] tracking-[0.25em] uppercase font-semibold">
          Incoming Video Call
        </p>
      </div>

      {/* Center: avatar + caller info */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 mb-8">
          <div className="absolute inset-0 rounded-full bg-emerald-500/25 animate-ping" />
          <div
            className="absolute inset-3 rounded-full bg-emerald-500/30 animate-ping"
            style={{ animationDelay: '0.5s' }}
          />
          <div
            className="absolute inset-6 rounded-full bg-emerald-500/35 animate-ping"
            style={{ animationDelay: '1s' }}
          />
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-5xl sm:text-6xl font-bold shadow-2xl ring-4 ring-white/10">
            {initial}
          </div>
        </div>

        <h2 className="text-white text-3xl sm:text-4xl font-bold tracking-wide">
          {callerName || 'Unknown caller'}
        </h2>
        <p className="mt-3 inline-flex items-center gap-2 text-emerald-300/90 text-sm font-medium">
          <FaVideo className="w-3.5 h-3.5" />
          <span>EngageSphere video call</span>
          <span className="text-white/30">·</span>
          <span className="tabular-nums">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
          </span>
        </p>
      </div>

      {/* Bottom: action buttons */}
      <div className="relative z-10 w-full max-w-md mb-4 sm:mb-10">
        <div className="grid grid-cols-2 gap-12 sm:gap-20 px-4">
          <button
            onClick={onDecline}
            aria-label="Decline call"
            className="flex flex-col items-center gap-2 group focus:outline-none"
          >
            <span className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-red-600 group-hover:bg-red-700 group-active:scale-95 flex items-center justify-center text-white shadow-2xl shadow-red-900/50 transition">
              <FaPhone className="w-6 h-6 rotate-[135deg]" />
            </span>
            <span className="text-white/70 text-xs font-medium tracking-wide">Decline</span>
          </button>

          <button
            onClick={onAccept}
            aria-label="Accept call"
            className="flex flex-col items-center gap-2 group focus:outline-none"
          >
            <span className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-emerald-500 group-hover:bg-emerald-600 group-active:scale-95 flex items-center justify-center text-white shadow-2xl shadow-emerald-900/50 transition">
              <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
              <FaPhone className="relative w-6 h-6" />
            </span>
            <span className="text-white/70 text-xs font-medium tracking-wide">Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
