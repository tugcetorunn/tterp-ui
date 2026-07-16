import SelectInput from "../form/SelectInput";
import { useLocation } from "../../hooks/useLocation";
import type { LocationValue } from "../../types/location";

interface LocationSelectorProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  disabled?: boolean;
  showCountry?: boolean;
  defaultCountryName?: string;
}

export default function LocationSelector({
  value,
  onChange,
  disabled = false,
  showCountry = true,
  defaultCountryName = "Türkiye",
}: LocationSelectorProps) {
  const location = useLocation({
    value,
    onChange,
    defaultCountryName,
  });

  return (
    <div className="space-y-4">
      {showCountry && (
        <SelectInput
          label="Ülke"
          value={value.countryId}
          onChange={location.changeCountry}
          placeholder={
            location.countriesLoading
              ? "Yükleniyor..."
              : "Ülke seçiniz"
          }
          options={location.countryOptions}
          disabled={disabled || location.countriesLoading}
        />
      )}

      <SelectInput
        label="Şehir"
        value={value.cityId}
        onChange={location.changeCity}
        placeholder={
          location.citiesLoading
            ? "Yükleniyor..."
            : "Şehir seçiniz"
        }
        options={location.cityOptions}
        disabled={
          disabled ||
          !value.countryId ||
          location.citiesLoading
        }
      />

      <SelectInput
        label="İlçe"
        value={value.townId}
        onChange={location.changeTown}
        placeholder={
          location.townsLoading
            ? "Yükleniyor..."
            : "İlçe seçiniz"
        }
        options={location.townOptions}
        disabled={
          disabled ||
          !value.cityId ||
          location.townsLoading
        }
      />

      <SelectInput
        label="Semt / Bölge"
        value={value.districtId}
        onChange={location.changeDistrict}
        placeholder={
          location.districtsLoading
            ? "Yükleniyor..."
            : "Semt seçiniz"
        }
        options={location.districtOptions}
        disabled={
          disabled ||
          !value.townId ||
          location.districtsLoading
        }
      />

      <SelectInput
        label="Mahalle"
        value={value.neighborhoodId}
        onChange={location.changeNeighborhood}
        placeholder={
          location.neighborhoodsLoading
            ? "Yükleniyor..."
            : "Mahalle seçiniz"
        }
        options={location.neighborhoodOptions}
        disabled={
          disabled ||
          !value.districtId ||
          location.neighborhoodsLoading
        }
      />

      {location.isError && (
        <p className="text-sm text-red-600">
          Lokasyon bilgileri yüklenirken hata oluştu.
        </p>
      )}
    </div>
  );
}