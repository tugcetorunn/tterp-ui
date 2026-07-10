import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface ParameterDefinition {
  id: number;
  parameterDefinitionId: number;
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
  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateParameterDefinitionRequest {
  paramType: string;
  description?: string | null;
  dataType?: string | null;
  defaultValue?: string | null;
  parameterValues?: CreateParameterValueRequest[];
}

export interface CreateParameterValueRequest {
  paramType: string;
  paramCode: string;
  paramValue: string;
  description?: string | null;
  languageId: number;
}

export const parameterDefinitionService = {
  async getList(): Promise<ParameterDefinition[]> {
    const response = await apiClient.get("/ParameterDefinitions/GetList");
    return extractData<ParameterDefinition[]>(response);
  },

  async create(data: CreateParameterDefinitionRequest): Promise<number> {
    const response = await apiClient.post("/ParameterDefinitions/Create", data);
    return extractData<number>(response);
  },
};

export const parameterValueService = {
  async getList(): Promise<ParameterValue[]> {
    const response = await apiClient.get("/ParameterValues/GetList");
    return extractData<ParameterValue[]>(response);
  },

  async create(data: CreateParameterValueRequest): Promise<number> {
    const response = await apiClient.post("/ParameterValues/Create", data);
    return extractData<number>(response);
  },
};