import StatusBadge from "./StatusBadge";

interface ActiveStatusBadgeProps {
  isActive: boolean;
}

export default function ActiveStatusBadge({
  isActive,
}: ActiveStatusBadgeProps) {
  return (
    <StatusBadge
      text={isActive ? "Aktif" : "Pasif"}
      color={isActive ? "success" : "danger"}
    />
  );
}