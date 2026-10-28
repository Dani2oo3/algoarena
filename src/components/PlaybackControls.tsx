import type { PlaybackStatus } from '../hooks/useTracePlayer';

interface PlaybackControlsProps {
  readonly status: PlaybackStatus;
  readonly cursor: number;
  readonly total: number;
  readonly progress: number;
  readonly delayMs: number;
  readonly onDelayChange: (delay: number) => void;
  readonly onPlay: () => void;
  readonly onPause: () => void;
  readonly onResume: () => void;
  readonly onStep: () => void;
  readonly onReset: () => void;
}

export default function PlaybackControls(props: PlaybackControlsProps) {
  const {
    status,
    cursor,
    total,
    progress,
    delayMs,
    onDelayChange,
    onPlay,
    onPause,
    onResume,
    onStep,
    onReset,
  } = props;
  const canPlay = total > 0 && status !== 'running';
  return (
    <div className="playback-panel" aria-label="Animation controls">
      <div className="playback-buttons">
        <button
          className="button button-primary"
          onClick={onPlay}
          disabled={!canPlay}
          type="button"
        >
          Play
        </button>
        <button className="button" onClick={onPause} disabled={status !== 'running'} type="button">
          Pause
        </button>
        <button className="button" onClick={onResume} disabled={status !== 'paused'} type="button">
          Resume
        </button>
        <button
          className="button"
          onClick={onStep}
          disabled={total === 0 || status === 'running' || status === 'completed'}
          type="button"
        >
          Step
        </button>
        <button
          className="button button-quiet"
          onClick={onReset}
          disabled={total === 0}
          type="button"
        >
          Reset
        </button>
      </div>
      <div className="playback-meta">
        <label className="speed-control">
          Playback speed
          <select
            aria-label="Playback speed"
            value={delayMs}
            onChange={(event) => onDelayChange(Number(event.target.value))}
          >
            <option value={320}>Slow</option>
            <option value={120}>Normal</option>
            <option value={35}>Fast</option>
          </select>
        </label>
        <span className={`status-pill status-${status}`}>
          <span aria-hidden="true" />
          {status}
        </span>
        <span className="event-count">
          {cursor.toLocaleString()} / {total.toLocaleString()} steps
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
