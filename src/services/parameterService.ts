import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface ParameterDefinition {
  id: number;
  paramType: string;
  description?: string | null;
  dataType?: string | null;
  defaultValue?: string | null;
  isActive: boolean;
  isDeleted: boolean;
}

export interface ParameterValue {
  id: number;
  parameterDefinitionId: number;
  paramType: string;
  paramCode: number | string;
  paramValue: string;
  description?: string | null;
  languageId: number;

  shortCode?: string | null;
  symbol?: string | null;
  badgeColor?: string | null;
  icon?: string | null;
  displayOrder: number;
  isDefault: boolean;

  isActive: boolean;
  isDeleted: boolean;
}

export interface ParameterOption {
  id: number;
  paramCode: number | string;
  paramValue: string;
  description?: string | null;

  shortCode?: string | null;
  symbol?: string | null;
  badgeColor?: string | null;
  icon?: string | null;
  displayOrder: number;
  isDefault: boolean;
}

export interface CreateParameterDefinitionRequest {
  paramType: string;
  description?: string | null;
  dataType?: string | null;
  defaultValue?: string | null;
  parameterValues?: CreateParameterValueRequest[];
}

export interface CreateParameterValueRequest {
  parameterDefinitionId?: number;
  paramType: string;
  paramCode: string;
  paramValue: string;
  description?: string | null;
  languageId: number;

  shortCode?: string | null;
  symbol?: string | null;
  badgeColor?: string | null;
  icon?: string | null;
  displayOrder: number;
  isDefault: boolean;
}

export interface ParameterValueListParams {
  isActive?: boolean;
  isDeleted?: boolean;
  languageId?: number;
}


export const parameterDefinitionService = {
  async getList(): Promise<ParameterDefinition[]> {
    const response = await apiClient.get(
      "/ParameterDefinitions/GetList"
    );

    return extractData<ParameterDefinition[]>(response);
  },

  async create(
    data: CreateParameterDefinitionRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/ParameterDefinitions/Create",
      data
    );

    return extractData<number>(response);
  },
};

export const parameterValueService = {
  async getList(params?: ParameterValueListParams): Promise<ParameterValue[]> {
    const response = await apiClient.get(
      "/ParameterValues/GetList", { params }
    );

    return extractData<ParameterValue[]>(response);
  },

  async getByParamType(
    paramType: string
  ): Promise<ParameterOption[]> {
    const response = await apiClient.get(
      "/ParameterValues/GetByParamType",
      {
        params: {
          paramType,
        },
      }
    );

    return extractData<ParameterOption[]>(response);
  },

  async create(
    data: CreateParameterValueRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/ParameterValues/Create",
      data
    );

    return extractData<number>(response);
  },

  async createMany(
    values: CreateParameterValueRequest[]
  ): Promise<number[]> {
    return Promise.all(
      values.map((value) =>
        parameterValueService.create(value)
      )
    );
  },
};