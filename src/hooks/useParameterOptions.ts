import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { parameterValueService } from "../services/parameterService";

export function useParameterOptions(paramType: string ,
  languageId = 1) {
  const query = useQuery({
    queryKey: ["parameter-options", paramType, languageId],
    queryFn: () => parameterValueService.getList({
        isActive: true,
        isDeleted: false,
        languageId,
      }),
    enabled: Boolean(paramType),
    staleTime: 1000 * 60 * 30,
  });

  const data = useMemo(
    () =>
      (query.data ?? []).filter(
        (item) =>
          item.paramType === paramType &&
          item.languageId === languageId
      ),
    [query.data, paramType, languageId]
  );

  const options = useMemo(
    () =>
      data.map((item) => ({
        label: item.paramValue,
        value: String(item.paramCode),
      })),
    [data]
  );

  const getByCode = (
    code?: number | string | null
  ) =>
    data.find(
      (item) =>
        String(item.paramCode) === String(code)
    );

  return {
    ...query,
    data,
    options,
    getByCode,
  };
}