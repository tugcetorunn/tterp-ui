import type { ReactNode } from "react";
import { X } from "lucide-react";

interface DetailDrawerProps {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  widthClassName?: string;
  headerRight?: ReactNode;
}

export default function DetailDrawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  widthClassName = "w-[760px]",
  headerRight,
}: DetailDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <button
        type="button"
        aria-label="Detay panelini kapat"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <aside
        className={`relative h-full ${widthClassName} overflow-y-auto bg-white shadow-2xl`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
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

          <div className="flex items-center gap-2">
            {headerRight}

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </aside>
    </div>
  );
}