import type { ReactNode } from "react";
import { X } from "lucide-react";

interface CreateDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  widthClassName?: string;
}

export default function CreateDrawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  widthClassName = "w-[560px]",
}: CreateDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <button
        type="button"
        aria-label="Paneli kapat"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <aside
        className={`relative h-full ${widthClassName} overflow-y-auto bg-white p-6 shadow-2xl`}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </aside>
    </div>
  );
}