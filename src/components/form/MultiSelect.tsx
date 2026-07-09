import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  label: string;
  values: string[];
  options: MultiSelectOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export default function MultiSelect({
  label,
  values,
  options,
  onChange,
  placeholder = "Seçiniz",
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLabels = options
    .filter((option) => values.includes(option.value))
    .map((option) => option.label);

  const toggleValue = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((x) => x !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const clear = () => {
    onChange([]);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full h-11 border border-slate-200 rounded-xl px-4 bg-white text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 flex items-center justify-between"
      >
        <span className="truncate">
          {selectedLabels.length > 0
            ? selectedLabels.join(", ")
            : placeholder}
        </span>

        <ChevronDown size={18} />
      </button>

      {values.length > 0 && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-9 top-[39px] text-slate-400 hover:text-red-500"
        >
          <X size={16} />
        </button>
      )}

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto p-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={values.includes(option.value)}
                onChange={() => toggleValue(option.value)}
                className="w-4 h-4 accent-indigo-600"
              />

              {option.label}
            </label>
          ))}

          {options.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400">
              Seçenek bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}