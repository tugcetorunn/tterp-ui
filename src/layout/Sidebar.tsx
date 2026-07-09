import { NavLink } from "react-router-dom";
import { menuItems } from "./menuItems";
import { Settings } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-[#0f1b2d] text-white border-r border-white/10">
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TTERP</h1>
          <p className="text-xs text-slate-400">ERP Yönetim Paneli</p>
        </div>
      </div>

      <nav className="p-4 space-y-5 overflow-y-auto h-[calc(100vh-160px)]">
        {menuItems.map((item) => {
          const Icon = item.icon;

          if (!item.children) {
            return (
              <NavLink
                key={item.title}
                to={item.path!}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-slate-300 hover:bg-white/10"
                  }`
                }
              >
                <Icon size={19} />
                {item.title}
              </NavLink>
            );
          }

          return (
            <div key={item.title}>
              <div className="px-2 mb-2 text-[11px] font-bold tracking-wider text-indigo-300 uppercase">
                {item.title}
              </div>

              <div className="space-y-1">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;

                  return (
                    <NavLink
                      key={child.title}
                      to={child.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                            : "text-slate-300 hover:bg-white/10"
                        }`
                      }
                    >
                      <ChildIcon size={18} />
                      {child.title}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="h-20 border-t border-white/10 flex items-center px-6">
        <div className="flex items-center gap-3 text-slate-300 text-sm">
          <Settings size={19} />
          Ayarlar
        </div>
      </div>
    </aside>
  );
}