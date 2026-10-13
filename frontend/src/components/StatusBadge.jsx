export const STATUS_META = {
  VERIFIED: { label: "VERIFIED", cls: "ok", icon: "\u2714" },
  INVALID: { label: "INVALID", cls: "bad", icon: "\u2716" },
  DATA_MISMATCH: { label: "DATA MISMATCH", cls: "warn", icon: "!" },
  ERROR: { label: "ERROR", cls: "err", icon: "?" },
};

export default function StatusBadge({ result, large = false }) {
  const meta = STATUS_META[result] || STATUS_META.ERROR;
  return (
    <span className={`badge badge-${meta.cls} ${large ? "badge-large" : ""}`}>
      <span className="badge-icon">{meta.icon}</span> {meta.label}
    </span>
  );
}
