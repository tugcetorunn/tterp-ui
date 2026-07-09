interface SelectInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export default function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder = "Seçiniz",
}: SelectInputProps) {
  return (
    <div>
      {label && <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>}

      <select
        className="w-full h-11 border border-slate-200 rounded-xl px-4 bg-white text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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