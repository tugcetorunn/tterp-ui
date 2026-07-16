interface StatusBadgeProps {
  text: string;
  color?: string | null;
}

const colorClasses: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-amber-50 text-amber-700 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-blue-50 text-blue-700 ring-blue-600/20",
  primary: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  secondary: "bg-slate-100 text-slate-700 ring-slate-500/20",
  neutral: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

export default function StatusBadge({
  text,
  color = "neutral",
}: StatusBadgeProps) {

  const normalizedColor = color?.trim().toLocaleLowerCase("tr-TR") ?? "neutral";

  const classes =
    colorClasses[normalizedColor] ?? colorClasses.neutral;

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${classes}`}
    >
      {text}
    </span>
  );
}