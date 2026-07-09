import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileText,
  CreditCard,
  Package,
  Tags,
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
      { title: "Faturalar", path: "/invoices", icon: FileText },
      { title: "Ödemeler", path: "/payments", icon: CreditCard },
    ],
  },
  {
    title: "Ürün & Stok",
    icon: Package,
    children: [
      { title: "Ürünler", path: "/products", icon: Package },
      { title: "Kategoriler", path: "/categories", icon: Tags },
      { title: "Depolar", path: "/warehouses", icon: Warehouse },
    ],
  },
  {
    title: "Satın Alma",
    icon: Truck,
    children: [
      { title: "Tedarikçiler", path: "/suppliers", icon: Truck },
      { title: "Malzemeler", path: "/materials", icon: Package },
      { title: "Tedarikler", path: "/supplies", icon: ClipboardList },
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