import { apiClient } from "../api/apiClient";
import { extractData } from "../utils/apiResponse";

export interface Role {
  id: number;
  name: string;
  nameForUI: string;
  userCount: number;
  permissionCount: number;
  isActive: boolean;
  isDeleted: boolean;
}

export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description?: string | null;
  displayOrder: number;
}

export interface RolePermission {
  permissionId: number;
  code: string;
  name: string;
  module: string;
  description?: string | null;
  displayOrder: number;
  isAssigned: boolean;
}

export interface RoleDetail {
  id: number;
  name: string;
  nameForUI: string;
  userCount: number;
  isActive: boolean;
  isDeleted: boolean;
  permissions: RolePermission[];
}

export interface CreateRoleRequest {
  name: string;
  nameForUI: string;
  permissionIds: number[];
}

export interface UpdateRolePermissionsRequest {
  roleId: number;
  permissionIds: number[];
}

export interface GetRolesParams {
  isActive?: boolean;
  isDeleted?: boolean;
}

export const roleService = {
  async getList(
    params?: GetRolesParams
  ): Promise<Role[]> {
    const response = await apiClient.get(
      "/Roles/GetList",
      { params }
    );

    return extractData<Role[]>(response);
  },

  async getDetail(
    roleId: number
  ): Promise<RoleDetail> {
    const response = await apiClient.get(
      "/Roles/GetDetail",
      {
        params: { id: roleId },
      }
    );

    return extractData<RoleDetail>(response);
  },

  async getPermissions(): Promise<Permission[]> {
    const response = await apiClient.get(
      "/Roles/GetPermissions"
    );

    return extractData<Permission[]>(response);
  },

  async create(
    request: CreateRoleRequest
  ): Promise<number> {
    const response = await apiClient.post(
      "/Roles/Create",
      request
    );

    return extractData<number>(response);
  },

  async updatePermissions(
    request: UpdateRolePermissionsRequest
  ): Promise<boolean> {
    const response = await apiClient.put(
      "/Roles/UpdatePermissions",
      request
    );

    return extractData<boolean>(response);
  },
};