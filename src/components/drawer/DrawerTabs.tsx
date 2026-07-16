interface DrawerTab {
  key: string;
  label: string;
  count?: number;
}

interface DrawerTabsProps {
  tabs: DrawerTab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export default function DrawerTabs({
  tabs,
  activeTab,
  onChange,
}: DrawerTabsProps) {
  return (
    <div className="mb-6 border-b border-slate-200">
      <div className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`relative flex items-center gap-2 whitespace-nowrap pb-3 text-sm font-semibold ${
                active
                  ? "text-indigo-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}

              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    active
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}

              {active && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-indigo-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}