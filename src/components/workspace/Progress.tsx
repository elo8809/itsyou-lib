export default function Progress({
  value,
  label,
  description,
}: {
  value: number;
  label: string;
  description?: string;
}) {
  const percent = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;
  return (
    <div className="ui-progress">
      <div className="ui-progress-label">
        <span>{label}</span>
        <span>
          {description || `${Math.round(percent)}%`}
        </span>
      </div>
      <div
        className="ui-progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
