import SelectInput from "../form/SelectInput";
import { useLocation } from "../../hooks/useLocation";
import type { LocationValue } from "../../types/location";

interface LocationFilterProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  className?: string;
  showCountry?: boolean;
  defaultCountryName?: string;
}

export default function LocationFilter({
  value,
  onChange,
  className = "",
  showCountry = true,
  defaultCountryName = "Türkiye",
}: LocationFilterProps) {
  const location = useLocation({
    value,
    onChange,
    defaultCountryName,
  });

  return (
    <div
        className={`grid ${
        showCountry ? "grid-cols-5" : "grid-cols-4"
        } gap-4 ${className}`}
    >
        {showCountry && (
        <SelectInput
            label="Ülke"
            value={value.countryId}
            onChange={location.changeCountry}
            placeholder="Tümü"
            options={location.countryOptions}
            disabled={location.countriesLoading}
        />
        )}

        <SelectInput
        label="Şehir"
        value={value.cityId}
        onChange={location.changeCity}
        placeholder="Tümü"
        options={location.cityOptions}
        disabled={!value.countryId || location.citiesLoading}
        />

        <SelectInput
        label="İlçe"
        value={value.townId}
        onChange={location.changeTown}
        placeholder="Tümü"
        options={location.townOptions}
        disabled={!value.cityId || location.townsLoading}
        />

        <SelectInput
        label="Semt / Bölge"
        value={value.districtId}
        onChange={location.changeDistrict}
        placeholder="Tümü"
        options={location.districtOptions}
        disabled={!value.townId || location.districtsLoading}
        />

        <SelectInput
        label="Mahalle"
        value={value.neighborhoodId}
        onChange={location.changeNeighborhood}
        placeholder="Tümü"
        options={location.neighborhoodOptions}
        disabled={
            !value.districtId ||
            location.neighborhoodsLoading
        }
        />
    </div>
    );
}