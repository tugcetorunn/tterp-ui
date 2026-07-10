import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";
import ParameterDefinitionsPage from "./pages/ParameterDefinitionsPage";
import SuppliersPage from "./pages/SuppliersPage";
import ComingSoonPage from "./pages/ComingSoonPage";

function ProtectedRoute() {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/parameters" element={<ParameterDefinitionsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />

        <Route path="/orders" element={<ComingSoonPage title="Siparişler" />} />
        <Route path="/invoices" element={<ComingSoonPage title="Faturalar" />} />
        <Route path="/payments" element={<ComingSoonPage title="Ödemeler" />} />
        <Route path="/warehouses" element={<ComingSoonPage title="Depolar" />} />
        <Route path="/materials" element={<ComingSoonPage title="Malzemeler" />} />
        <Route path="/supplies" element={<ComingSoonPage title="Tedarikler" />} />
        <Route path="/productions" element={<ComingSoonPage title="Üretim Planları" />} />
        <Route path="/employees" element={<ComingSoonPage title="Çalışanlar" />} />
        <Route path="/roles" element={<ComingSoonPage title="Roller" />} />
        <Route path="/teams" element={<ComingSoonPage title="Takımlar" />} />
        <Route path="/titles" element={<ComingSoonPage title="Ünvanlar" />} />
        <Route path="/announcements" element={<ComingSoonPage title="Duyurular" />} />
        <Route path="/notifications" element={<ComingSoonPage title="Bildirimler" />} />
      </Route>
    </Routes>
  );
}