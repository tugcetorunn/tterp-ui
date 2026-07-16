interface SelectInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: {
    label: string;
    value: string;
  }[];
  placeholder?: string;
  disabled?: boolean;
}

export default function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Seçiniz",
  disabled = false,
}: SelectInputProps) {
  return (
    <div>
      {label && <label className="mb-2 block text-sm font-semibold text-slate-700 mb-2">{label}</label>}

      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 border border-slate-200 rounded-xl px-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}