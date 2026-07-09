import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />

      <main className="ml-72 min-h-screen">
        <Header />

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}