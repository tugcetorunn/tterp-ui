import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  moduleName?: string;
  rightContent?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  moduleName,
  rightContent,
}: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          {moduleName && (
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
              <span>{moduleName}</span>
              <ChevronRight size={15} />
              <span className="text-slate-700">{title}</span>
            </div>
          )}

          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>

          {description && <p className="text-slate-500 mt-1">{description}</p>}
        </div>

        {rightContent}
      </div>
    </div>
  );
}