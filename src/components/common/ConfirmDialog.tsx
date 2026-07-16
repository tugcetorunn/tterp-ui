import { AlertTriangle, X } from "lucide-react";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode
}

const confirmButtonClasses = {
  danger: "bg-red-600 hover:bg-red-700",
  warning: "bg-amber-500 hover:bg-amber-600",
  primary: "bg-indigo-600 hover:bg-indigo-700",
};

export default function ConfirmDialog({
  open,
  title = "İşlemi onaylıyor musunuz?",
  description,
  confirmText = "Onayla",
  cancelText = "İptal",
  loading = false,
  variant = "danger",
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <button
        type="button"
        aria-label="Pencereyi kapat"
        className="absolute inset-0 cursor-default"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={18} />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <AlertTriangle size={24} />
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {description}
        </p>

        {children && (
          <div className="mt-5 space-y-4">
            {children}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="h-11 rounded-xl border border-slate-200 px-5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`h-11 rounded-xl px-5 font-semibold text-white disabled:opacity-60 ${confirmButtonClasses[variant]}`}
          >
            {loading ? "İşleniyor..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}