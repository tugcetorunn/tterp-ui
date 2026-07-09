interface Props {
  title: string;
}

export default function ComingSoonPage({ title }: Props) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <p className="text-gray-500 mt-2">Bu sayfa bir sonraki adımda bağlanacak.</p>
    </div>
  );
}