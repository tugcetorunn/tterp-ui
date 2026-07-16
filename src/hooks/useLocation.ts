import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { locationService } from "../services/locationService";
import type { LocationValue } from "../types/location";

interface UseLocationOptions {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  defaultCountryName?: string;
}

export function useLocation({
  value,
  onChange,
  defaultCountryName = "Türkiye",
}: UseLocationOptions) {
  const countriesQuery = useQuery({
    queryKey: ["locations", "countries"],
    queryFn: locationService.getCountries,
  });

  const citiesQuery = useQuery({
    queryKey: ["locations", "cities", value.countryId],
    queryFn: () => locationService.getCities(Number(value.countryId)),
    enabled: Boolean(value.countryId),
  });

  const townsQuery = useQuery({
    queryKey: ["locations", "towns", value.cityId],
    queryFn: () => locationService.getTowns(Number(value.cityId)),
    enabled: Boolean(value.cityId),
  });

  const districtsQuery = useQuery({
    queryKey: ["locations", "districts", value.townId],
    queryFn: () => locationService.getDistricts(Number(value.townId)),
    enabled: Boolean(value.townId),
  });

  const neighborhoodsQuery = useQuery({
    queryKey: ["locations", "neighborhoods", value.districtId],
    queryFn: () =>
      locationService.getNeighborhoods(Number(value.districtId)),
    enabled: Boolean(value.districtId),
  });

  const countries = countriesQuery.data ?? [];
  const cities = citiesQuery.data ?? [];
  const towns = townsQuery.data ?? [];
  const districts = districtsQuery.data ?? [];
  const neighborhoods = neighborhoodsQuery.data ?? [];

  useEffect(() => {
    if (value.countryId || countries.length === 0) {
        return;
    }

    const defaultCountry = countries.find(
        (country) =>
        country.name.trim().toLocaleLowerCase("tr-TR") ===
        defaultCountryName.trim().toLocaleLowerCase("tr-TR")
    );

    if (!defaultCountry) {
        return;
    }

    onChange({
        countryId: String(defaultCountry.id),
        cityId: "",
        townId: "",
        districtId: "",
        neighborhoodId: "",
    });
    }, [countries, value.countryId, defaultCountryName, onChange]);

  const countryOptions = useMemo(
    () =>
      countries.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    [countries]
  );

  const cityOptions = useMemo(
    () =>
      cities.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    [cities]
  );

  const townOptions = useMemo(
    () =>
      towns.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    [towns]
  );

  const districtOptions = useMemo(
    () =>
      districts.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    [districts]
  );

  const neighborhoodOptions = useMemo(
    () =>
      neighborhoods.map((item) => ({
        label: item.name,
        value: String(item.id),
      })),
    [neighborhoods]
  );

  const changeCountry = (countryId: string) => {
    onChange({
      countryId,
      cityId: "",
      townId: "",
      districtId: "",
      neighborhoodId: "",
    });
  };

  const changeCity = (cityId: string) => {
    onChange({
      ...value,
      cityId,
      townId: "",
      districtId: "",
      neighborhoodId: "",
    });
  };

  const changeTown = (townId: string) => {
    onChange({
      ...value,
      townId,
      districtId: "",
      neighborhoodId: "",
    });
  };

  const changeDistrict = (districtId: string) => {
    onChange({
      ...value,
      districtId,
      neighborhoodId: "",
    });
  };

  const changeNeighborhood = (neighborhoodId: string) => {
    onChange({
      ...value,
      neighborhoodId,
    });
  };

  const isError =
    countriesQuery.isError ||
    citiesQuery.isError ||
    townsQuery.isError ||
    districtsQuery.isError ||
    neighborhoodsQuery.isError;

  return {
    countryOptions,
    cityOptions,
    townOptions,
    districtOptions,
    neighborhoodOptions,

    changeCountry,
    changeCity,
    changeTown,
    changeDistrict,
    changeNeighborhood,

    countriesLoading: countriesQuery.isLoading,
    citiesLoading: citiesQuery.isLoading,
    townsLoading: townsQuery.isLoading,
    districtsLoading: districtsQuery.isLoading,
    neighborhoodsLoading: neighborhoodsQuery.isLoading,

    isError,
  };
}