import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  CreditCard,
  Package,
  PackageSearch,
  Warehouse,
  Truck,
  Factory,
  ClipboardList,
  Bell,
  Settings,
  UserRound,
  Shield,
  Briefcase,
  Megaphone,
  ArrowLeftRight,
  ShoppingBag,
  PackageCheck,
  Boxes,
  Repeat2
} from "lucide-react";

export const menuItems = [
  {
    title: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Satış",
    icon: ShoppingCart,
    children: [
      { title: "Müşteriler", path: "/customers", icon: Users },
      { title: "Siparişler", path: "/orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Satın Alma",
    icon: Truck,
    children: [
      { title: "Tedarikçiler", path: "/suppliers", icon: Truck },
      { title: "Malzemeler", path: "/materials", icon: Package },
      { title: "Tedarikler", path: "/supplies", icon: ClipboardList },
      { title: "Tedarikçi Malzemeleri", path: "/supplierMaterials", icon: PackageSearch },
    ],
  },
  {
    title: "Stok Yönetimi",
    icon: Boxes,
    children: [
      {
        title: "Malzeme Stokları",
        path: "/materialStocks",
        icon: Boxes,
      },
      {
        title: "Malzeme Stok Hareketleri",
        path: "/materialStockMovements",
        icon: ArrowLeftRight,
      },
      {
        title: "Kategoriler",
        path: "/categories",
        icon: Package, // değiştir
      },
      {
        title: "Ürünler",
        path: "/products",
        icon: ShoppingBag,
      },
      {
        title: "Ürün Stokları",
        path: "/productStocks",
        icon: PackageCheck,
      },
      {
        title: "Ürün Stok Hareketleri",
        path: "/productStockMovements",
        icon: Repeat2,
      },
      {
        title: "Depolar",
        path: "/warehouses",
        icon: Warehouse,
      },
    ],
  },
  {
    title: "Üretim",
    icon: Factory,
    children: [{ title: "Üretim Planları", path: "/productions", icon: Factory }],
  },
  {
    title: "İK",
    icon: UserRound,
    children: [
      { title: "Çalışanlar", path: "/employees", icon: UserRound },
      { title: "Roller", path: "/roles", icon: Shield },
      { title: "Takımlar", path: "/teams", icon: Users },
      { title: "Ünvanlar", path: "/titles", icon: Briefcase },
    ],
  },
  {
    title: "Sistem",
    icon: Settings,
    children: [
      { title: "Duyurular", path: "/announcements", icon: Megaphone },
      { title: "Bildirimler", path: "/notifications", icon: Bell },
      { title: "Parametreler", path: "/parameters", icon: Settings },
    ],
  },
];