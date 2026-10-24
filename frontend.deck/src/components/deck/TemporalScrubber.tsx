import React, { useEffect, useRef } from 'react';
import { useCommandDeckStore } from '@/store/useCommandDeckStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Clock,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const TemporalScrubber: React.FC = () => {
  const timeline = useCommandDeckStore((s) => s.timeline);
  const setTimeline = useCommandDeckStore((s) => s.setTimeline);

  const startTimestamp = new Date(timeline.startDate).getTime();
  const endTimestamp = new Date(timeline.endDate).getTime();
  const currentTimestamp = new Date(timeline.currentPlayheadDate).getTime();

  // Progress percentage (0 - 100)
  const totalDuration = Math.max(endTimestamp - startTimestamp, 1);
  const progressPercent = Math.min(
    Math.max(((currentTimestamp - startTimestamp) / totalDuration) * 100, 0),
    100
  );

  // Playback timer animation
  useEffect(() => {
    if (!timeline.isPlaying) return;

    const stepMs = 600 / timeline.playbackSpeed; // step speed inversely proportional to multiplier
    const interval = setInterval(() => {
      const current = new Date(useCommandDeckStore.getState().timeline.currentPlayheadDate).getTime();
      const end = new Date(useCommandDeckStore.getState().timeline.endDate).getTime();
      const start = new Date(useCommandDeckStore.getState().timeline.startDate).getTime();

      // Advance by 1 day (86400000ms)
      const nextTimestamp = current + 86400000;

      if (nextTimestamp > end) {
        // Loop back to start or pause
        setTimeline({ currentPlayheadDate: new Date(start).toISOString().slice(0, 10), isPlaying: true });
      } else {
        setTimeline({ currentPlayheadDate: new Date(nextTimestamp).toISOString().slice(0, 10) });
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [timeline.isPlaying, timeline.playbackSpeed, setTimeline]);

  // Handle Preset Clicks
  const handlePreset = (preset: '24h' | '7d' | '30d' | '90d') => {
    const now = new Date();
    let daysAgo = 30;
    if (preset === '24h') daysAgo = 1;
    if (preset === '7d') daysAgo = 7;
    if (preset === '30d') daysAgo = 30;
    if (preset === '90d') daysAgo = 90;

    const start = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    setTimeline({
      startDate: start.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10),
      currentPlayheadDate: now.toISOString().slice(0, 10),
      preset,
    });
  };

  // Handle Slider Drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value);
    const targetTimestamp = startTimestamp + (percent / 100) * totalDuration;
    const targetDateStr = new Date(targetTimestamp).toISOString().slice(0, 10);
    setTimeline({ currentPlayheadDate: targetDateStr, preset: 'custom' });
  };

  const formattedPlayheadDate = new Date(timeline.currentPlayheadDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="h-12 flex items-center gap-4 px-4 border-t border-cyan-900/40 bg-[#071325]/95 backdrop-blur-md shrink-0 select-none z-30">
      {/* 1. Playback Transport Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setTimeline({ currentPlayheadDate: timeline.startDate })}
          className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
          title="Reset to timeline start"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setTimeline({ isPlaying: !timeline.isPlaying })}
          className={`p-1.5 rounded-full border transition-all ${
            timeline.isPlaying
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
              : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/20'
          }`}
          title={timeline.isPlaying ? 'Pause Playback' : 'Play Timeline Expansion'}
        >
          {timeline.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setTimeline({ currentPlayheadDate: timeline.endDate })}
          className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
          title="Jump to latest"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Interactive Scrubber Slider with Glowing Track */}
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className="text-[10px] font-mono text-slate-400 shrink-0">{timeline.startDate}</span>

        <div className="flex-1 relative flex items-center h-4">
          {/* Visual Track */}
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden relative pointer-events-none">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_10px_#06b6d4]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* HTML Range Input overlay for seamless dragging */}
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={progressPercent}
            onChange={handleSliderChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
          />

          {/* Glowing Playhead Thumb */}
          <div
            className="absolute pointer-events-none w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#050b14] shadow-[0_0_12px_#06b6d4] -translate-x-1/2 transition-transform hover:scale-125"
            style={{ left: `${progressPercent}%` }}
          />
        </div>

        <span className="text-[10px] font-mono text-slate-400 shrink-0">{timeline.endDate}</span>
      </div>

      {/* 3. Current Scrubbed Date Readout Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0a182d] border border-cyan-900/60 font-mono text-[11px] text-cyan-300 shrink-0">
        <Calendar className="w-3 h-3 text-cyan-400" />
        <span className="font-bold">{formattedPlayheadDate}</span>
      </div>

      {/* 4. Speed Multipliers */}
      <div className="flex items-center gap-1 shrink-0 border-l border-white/10 pl-3">
        <Clock className="w-3 h-3 text-slate-400" />
        {([1, 2, 5] as const).map((speed) => (
          <button
            key={speed}
            onClick={() => setTimeline({ playbackSpeed: speed })}
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-all ${
              timeline.playbackSpeed === speed
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* 5. Preset Windows */}
      <div className="hidden lg:flex items-center gap-1 shrink-0 border-l border-white/10 pl-3 font-mono text-[10px]">
        {(['24h', '7d', '30d', '90d'] as const).map((p) => {
          const label = p === '24h' ? '24H' : p === '7d' ? '7D' : p === '30d' ? '30D' : '90D';
          const isSelected = timeline.preset === p;
          return (
            <button
              key={p}
              onClick={() => handlePreset(p)}
              className={`px-2 py-0.5 rounded transition-all ${
                isSelected
                  ? 'bg-cyan-400 text-[#050b14] font-bold shadow-[0_0_8px_#06b6d4]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
