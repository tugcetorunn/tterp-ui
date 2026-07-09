import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface DataTableColumn<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => ReactNode;
  filter?: ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyText = "Kayıt bulunamadı.",
  totalCount,
  page = 1,
  pageSize = 5,
}: DataTableProps<T>) {
  if (loading) {
    return <div className="p-8 text-slate-500">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-700">
              {columns.map((column) => (
                <th key={column.header} className="text-left px-5 py-4 font-bold whitespace-nowrap">
                  {column.header}
                </th>
              ))}
            </tr>

            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((column) => (
                <th key={`${column.header}-filter`} className="px-5 py-3 text-left font-normal">
                  {column.filter ?? null}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                {columns.map((column) => (
                  <td key={column.header} className="px-5 py-4 text-slate-700 whitespace-nowrap">
                    {column.render
                      ? column.render(row)
                      : column.accessor
                        ? String(row[column.accessor] ?? "-")
                        : "-"}
                  </td>
                ))}
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-slate-500">
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {data.length > 0
            ? `1 - ${data.length} arası, toplam ${totalCount ?? data.length} kayıt`
            : "Kayıt yok"}
        </p>

        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
            <ChevronsLeft size={17} />
          </button>
          <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
            <ChevronLeft size={17} />
          </button>

          <button className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-semibold">
            {page}
          </button>

          <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600">
            2
          </button>
          <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600">
            3
          </button>

          <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600">
            <ChevronRight size={17} />
          </button>
          <button className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600">
            <ChevronsRight size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}