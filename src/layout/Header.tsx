import { Bell, LogOut, Menu, Moon, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("accessToken");
    navigate("/login");
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8">
      <div className="flex items-center gap-5">
        <button className="p-2 rounded-xl hover:bg-slate-100">
          <Menu size={22} />
        </button>

        <div className="relative w-[520px]">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
          <input
            className="w-full h-12 pl-12 pr-20 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Arama yapın..."
          />
          <span className="absolute right-3 top-3 text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500">
            Ctrl + K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button className="p-2 rounded-xl hover:bg-slate-100">
          <Moon size={19} />
        </button>

        <button className="relative p-2 rounded-xl hover:bg-slate-100">
          <Bell size={20} />
          <span className="absolute -right-1 -top-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
            8
          </span>
        </button>

        <div className="text-xl">🇹🇷</div>

        <div className="h-9 w-px bg-slate-200" />

        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">Talha Torun</p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>

        <div className="relative w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
          TT
          <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
        </div>

        <button onClick={logout} className="p-2 rounded-xl hover:bg-red-50 text-red-500">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}