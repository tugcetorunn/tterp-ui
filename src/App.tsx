import { Toaster } from "sonner";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProductsPage from "./pages/ProductsPage";
import CustomersPage from "./pages/CustomersPage";
import ParameterDefinitionsPage from "./pages/ParameterDefinitionsPage";
import SuppliersPage from "./pages/SuppliersPage";
import MaterialsPage from "./pages/MaterialsPage";
import SupplierMaterialsPage from "./pages/SupplierMaterialsPage";
import MaterialStockMovementsPage from "./pages/MaterialStockMovementsPage";
import MaterialStocksPage from "./pages/MaterialStocksPage";
import WarehousesPage from "./pages/WarehousesPage";
import ProductStocksPage from "./pages/ProductStocksPage";
import ProductStockMovementsPage from "./pages/ProductStockMovementsPage";
import SuppliesPage from "./pages/SuppliesPage";
import OrdersPage from "./pages/OrdersPage";
import ProductionsPage from "./pages/ProductionsPage";
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
    <>
      <Toaster
        position="top-right"
        richColors
        closeButton
      />
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/productStocks" element={<ProductStocksPage />} />
        <Route path="/productStockMovements" element={<ProductStockMovementsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/parameters" element={<ParameterDefinitionsPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/supplierMaterials" element={<SupplierMaterialsPage />} />
        <Route path="/materialStockMovements" element={<MaterialStockMovementsPage />} />
        <Route path="/materialStocks" element={<MaterialStocksPage />} />
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/supplies" element={<SuppliesPage />} />
        <Route path="/productions" element={<ProductionsPage />} />
        <Route path="/orders" element={<OrdersPage />} />

        <Route path="/invoices" element={<ComingSoonPage title="Faturalar" />} />
        <Route path="/payments" element={<ComingSoonPage title="Ödemeler" />} />
        <Route path="/employees" element={<ComingSoonPage title="Çalışanlar" />} />
        <Route path="/roles" element={<ComingSoonPage title="Roller" />} />
        <Route path="/teams" element={<ComingSoonPage title="Takımlar" />} />
        <Route path="/titles" element={<ComingSoonPage title="Ünvanlar" />} />
        <Route path="/announcements" element={<ComingSoonPage title="Duyurular" />} />
        <Route path="/notifications" element={<ComingSoonPage title="Bildirimler" />} />
      </Route>
    </Routes>
     </>
  );
}