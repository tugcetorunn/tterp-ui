import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  fullName?: string | null;

  nationalId: string;
  registrationNumber?: number | null;

  email?: string | null;
  phoneNumber?: string | null;
  internalPhone?: string | null;

  dateOfBirth: string;
  hireDate: string;

  gender?: number | null;
  genderName?: string | null;

  maritalStatus?: number | null;
  maritalStatusName?: string | null;

  countryId: number;
  countryName?: string | null;

  cityId: number;
  cityName?: string | null;

  townId: number;
  townName?: string | null;

  districtId: number;
  districtName?: string | null;

  neighborhoodId: number;
  neighborhoodName?: string | null;

  addressLine?: string | null;
  imagePath?: string | null;

  titleId?: number | null;
  titleName?: string | null;

  teamId?: number | null;
  teamName?: string | null;

  roleId?: number | null;
  roleName?: string | null;

  salary?: number | null;
  annualLeaveUsed: number;
  rightToAnnualLeave?: number | null;

  isActive: boolean;
  isDeleted: boolean;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  nationalId: string;

  addressLine?: string | null;

  countryId: number;
  cityId: number;
  townId: number;
  districtId: number;
  neighborhoodId: number;

  phoneNumber?: string | null;
  dateOfBirth: string;
  imagePath?: string | null;

  gender?: number | null;
  maritalStatus?: number | null;

  hireDate: string;

  titleId?: number | null;
  teamId?: number | null;
  roleId: number;

  salary?: number | null;
  annualLeaveUsed: number;
}

export interface CreateEmployeeResult {
  employee: Employee;
  initialPassword: string;
}

export const employeeService = {
  async getList(): Promise<Employee[]> {
    const response = await apiClient.get("/Employees/GetList");
    return extractData<Employee[]>(response.data);
  },

  async create(
    payload: CreateEmployeeRequest
  ): Promise<CreateEmployeeResult> {
    const response = await apiClient.post(
      "/Employees/Create",
      payload
    );

    return extractData<CreateEmployeeResult>(
      response.data
    );
  },
};