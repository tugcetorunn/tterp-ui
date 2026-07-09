import { Package, ShoppingCart, Users, Warehouse } from "lucide-react";

const cards = [
  { title: "Toplam Müşteri", value: "128", icon: Users },
  { title: "Aktif Sipariş", value: "42", icon: ShoppingCart },
  { title: "Ürün Sayısı", value: "315", icon: Package },
  { title: "Depo Sayısı", value: "6", icon: Warehouse },
];

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
      <p className="text-gray-500 mt-1">ERP genel durum ekranı</p>

      <div className="grid grid-cols-4 gap-5 mt-6">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                  <h3 className="text-3xl font-bold mt-2">{card.value}</h3>
                </div>
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-5 mt-6">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900">Son Siparişler</h3>
          <p className="text-gray-500 mt-3">Buraya order listesi bağlanacak.</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900">Stok Uyarıları</h3>
          <p className="text-gray-500 mt-3">Buraya düşük stoklar bağlanacak.</p>
        </div>
      </div>
    </div>
  );
}