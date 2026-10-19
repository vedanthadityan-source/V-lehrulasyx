import React from 'react';

export default function TouchControls({ onInput }) {
  const press = (key) => () => onInput(key, true);
  const release = (key) => () => onInput(key, false);

  const btn = (label, key, extraClass = '') => (
    <button
      onTouchStart={(e) => { e.preventDefault(); onInput(key, true); }}
      onTouchEnd={(e) => { e.preventDefault(); onInput(key, false); }}
      onMouseDown={press(key)}
      onMouseUp={release(key)}
      onMouseLeave={release(key)}
      onContextMenu={(e) => e.preventDefault()}
      className={`select-none touch-none flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold active:bg-white/30 transition-colors ${extraClass}`}
    >
      {label}
    </button>
  );

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-between items-end p-3 z-20">
      {/* Left side: movement */}
      <div className="flex gap-2 pointer-events-auto">
        {btn('◀', 'ArrowLeft', 'w-14 h-14 text-2xl')}
        {btn('▶', 'ArrowRight', 'w-14 h-14 text-2xl')}
      </div>

      {/* Right side: actions */}
      <div className="grid grid-cols-2 gap-2 pointer-events-auto">
        {btn('⇪', 'Space', 'w-14 h-14 text-2xl')}
        {btn('⚡', 'ShiftLeft', 'w-14 h-14 text-xl')}
        {btn('Q', 'KeyQ', 'w-12 h-12 text-base')}
        {btn('E', 'KeyE', 'w-12 h-12 text-base')}
      </div>
    </div>
  );
}