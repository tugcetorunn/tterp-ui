export interface LocationValue {
  countryId: string;
  cityId: string;
  townId: string;
  districtId: string;
  neighborhoodId: string;
}

export const emptyLocationValue: LocationValue = {
  countryId: "",
  cityId: "",
  townId: "",
  districtId: "",
  neighborhoodId: "",
};