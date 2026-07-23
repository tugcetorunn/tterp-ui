import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Check,
  ChevronDown,
  ChevronRight,
  KeyRound,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { toast } from "sonner";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";
import CreateDrawer from "../components/drawer/CreateDrawer";
import ActiveStatusBadge from "../components/common/ActiveStatusBadge";

import {
  roleService,
  type CreateRoleRequest,
  type Permission,
  type Role,
  type RolePermission,
  type UpdateRolePermissionsRequest,
} from "../services/roleService";

import { getErrorMessage } from "../utils/apiResponse";

interface CreateRoleForm {
  name: string;
  nameForUI: string;
  permissionIds: number[];
}

function createInitialForm(): CreateRoleForm {
  return {
    name: "",
    nameForUI: "",
    permissionIds: [],
  };
}

export default function RolesPage() {
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("");
  const [sortBy, setSortBy] = useState("nameForUI");
  const [sortDirection, setSortDirection] = useState("asc");

  const [createDrawerOpen, setCreateDrawerOpen] =
    useState(false);

  const [permissionDrawerOpen, setPermissionDrawerOpen] =
    useState(false);

  const [selectedRoleId, setSelectedRoleId] =
    useState<number | null>(null);

  const [createForm, setCreateForm] =
    useState<CreateRoleForm>(createInitialForm());

  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState<number[]>([]);

  const [expandedCreateModules, setExpandedCreateModules] =
    useState<string[]>([]);

  const [expandedEditModules, setExpandedEditModules] =
    useState<string[]>([]);

  /*
   * Queries
   */

  const rolesQuery = useQuery({
    queryKey: [
      "roles",
      {
        isDeleted: false,
      },
    ],

    queryFn: () =>
      roleService.getList({
        isDeleted: false,
      }),
  });

  const permissionsQuery = useQuery({
    queryKey: ["permissions"],

    queryFn: () =>
      roleService.getPermissions(),
  });

  const roleDetailQuery = useQuery({
    queryKey: [
      "role-detail",
      selectedRoleId,
    ],

    queryFn: () =>
      roleService.getDetail(
        selectedRoleId as number
      ),

    enabled:
      permissionDrawerOpen &&
      selectedRoleId !== null,
  });

  const roles = rolesQuery.data ?? [];
  const permissions =
    permissionsQuery.data ?? [];

  /*
   * Role detail geldiğinde seçili yetkileri doldur
   */

  useEffect(() => {
    if (!roleDetailQuery.data) {
      return;
    }

    const assignedPermissionIds =
      roleDetailQuery.data.permissions
        .filter(
          (permission) =>
            permission.isAssigned
        )
        .map(
          (permission) =>
            permission.permissionId
        );

    setSelectedPermissionIds(
      assignedPermissionIds
    );

    const modules = Array.from(
      new Set(
        roleDetailQuery.data.permissions.map(
          (permission) =>
            permission.module
        )
      )
    );

    setExpandedEditModules(modules);
  }, [roleDetailQuery.data]);

  /*
   * Permission grupları
   */

  const createPermissionGroups =
    useMemo(
      () =>
        groupPermissionsByModule(
          permissions
        ),
      [permissions]
    );

  const editPermissionGroups =
    useMemo(
      () =>
        groupRolePermissionsByModule(
          roleDetailQuery.data
            ?.permissions ?? []
        ),
      [roleDetailQuery.data]
    );

  /*
   * Filtreleme ve sıralama
   */

  const filteredRoles = useMemo(() => {
    let result = [...roles];

    const normalizedSearch =
      normalizeText(searchText);

    if (normalizedSearch) {
      result = result.filter(
        (role) =>
          normalizeText(
            role.nameForUI
          ).includes(
            normalizedSearch
          ) ||
          normalizeText(role.name).includes(
            normalizedSearch
          )
      );
    }

    if (statusFilter === "active") {
      result = result.filter(
        (role) =>
          role.isActive &&
          !role.isDeleted
      );
    }

    if (statusFilter === "passive") {
      result = result.filter(
        (role) =>
          !role.isActive &&
          !role.isDeleted
      );
    }

    if (
      assignmentFilter ===
      "has-users"
    ) {
      result = result.filter(
        (role) =>
          (role.userCount ?? 0) > 0
      );
    }

    if (
      assignmentFilter ===
      "no-users"
    ) {
      result = result.filter(
        (role) =>
          (role.userCount ?? 0) === 0
      );
    }

    if (
      assignmentFilter ===
      "has-permissions"
    ) {
      result = result.filter(
        (role) =>
          (role.permissionCount ?? 0) >
          0
      );
    }

    if (
      assignmentFilter ===
      "no-permissions"
    ) {
      result = result.filter(
        (role) =>
          (role.permissionCount ?? 0) ===
          0
      );
    }

    result.sort((first, second) => {
      let comparison = 0;

      if (sortBy === "nameForUI") {
        comparison =
          first.nameForUI.localeCompare(
            second.nameForUI,
            "tr"
          );
      }

      if (sortBy === "name") {
        comparison =
          first.name.localeCompare(
            second.name,
            "tr"
          );
      }

      if (sortBy === "userCount") {
        comparison =
          (first.userCount ?? 0) -
          (second.userCount ?? 0);
      }

      if (
        sortBy === "permissionCount"
      ) {
        comparison =
          (first.permissionCount ?? 0) -
          (second.permissionCount ?? 0);
      }

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [
    roles,
    searchText,
    statusFilter,
    assignmentFilter,
    sortBy,
    sortDirection,
  ]);

  /*
   * Create mutation
   */

  const createMutation = useMutation({
    mutationFn: (
      request: CreateRoleRequest
    ) => roleService.create(request),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["roles"],
      });

      toast.success(
        "Rol başarıyla oluşturuldu."
      );

      closeCreateDrawer();
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(error)
      );
    },
  });

  /*
   * Update permissions mutation
   */

  const updatePermissionsMutation =
    useMutation({
      mutationFn: (
        request: UpdateRolePermissionsRequest
      ) =>
        roleService.updatePermissions(
          request
        ),

      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["roles"],
          }),

          queryClient.invalidateQueries({
            queryKey: [
              "role-detail",
              selectedRoleId,
            ],
          }),
        ]);

        toast.success(
          "Rol yetkileri güncellendi."
        );

        closePermissionDrawer();
      },

      onError: (error) => {
        toast.error(
          getErrorMessage(error)
        );
      },
    });

  /*
   * Drawer işlemleri
   */

  const openCreateDrawer = () => {
    setCreateForm(createInitialForm());

    setExpandedCreateModules(
      Object.keys(createPermissionGroups)
    );

    createMutation.reset();
    setCreateDrawerOpen(true);
  };

  const closeCreateDrawer = () => {
    if (createMutation.isPending) {
      return;
    }

    setCreateDrawerOpen(false);
    setCreateForm(createInitialForm());
    setExpandedCreateModules([]);
    createMutation.reset();
  };

  const openPermissionDrawer = (
    roleId: number
  ) => {
    setSelectedRoleId(roleId);
    setSelectedPermissionIds([]);
    setExpandedEditModules([]);

    updatePermissionsMutation.reset();
    setPermissionDrawerOpen(true);
  };

  const closePermissionDrawer = () => {
    if (
      updatePermissionsMutation.isPending
    ) {
      return;
    }

    setPermissionDrawerOpen(false);
    setSelectedRoleId(null);
    setSelectedPermissionIds([]);
    setExpandedEditModules([]);

    updatePermissionsMutation.reset();
  };

  /*
   * Form işlemleri
   */

  const updateCreateForm = (
    field: "name" | "nameForUI",
    value: string
  ) => {
    setCreateForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const submitCreateRole = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const name =
      createForm.name.trim();

    const nameForUI =
      createForm.nameForUI.trim();

    if (!name) {
      toast.warning(
        "Sistem rol adı zorunludur."
      );

      return;
    }

    if (!nameForUI) {
      toast.warning(
        "Görünen rol adı zorunludur."
      );

      return;
    }

    if (name.length > 256) {
      toast.warning(
        "Sistem rol adı en fazla 256 karakter olabilir."
      );

      return;
    }

    if (nameForUI.length > 150) {
      toast.warning(
        "Görünen rol adı en fazla 150 karakter olabilir."
      );

      return;
    }

    createMutation.mutate({
      name,
      nameForUI,
      permissionIds:
        createForm.permissionIds,
    });
  };

  const submitPermissionUpdate = () => {
    if (selectedRoleId === null) {
      return;
    }

    updatePermissionsMutation.mutate({
      roleId: selectedRoleId,
      permissionIds:
        selectedPermissionIds,
    });
  };

  /*
   * Permission seçimi
   */

  const toggleCreatePermission = (
    permissionId: number
  ) => {
    setCreateForm((previous) => ({
      ...previous,

      permissionIds:
        previous.permissionIds.includes(
          permissionId
        )
          ? previous.permissionIds.filter(
              (id) =>
                id !== permissionId
            )
          : [
              ...previous.permissionIds,
              permissionId,
            ],
    }));
  };

  const toggleEditPermission = (
    permissionId: number
  ) => {
    setSelectedPermissionIds(
      (previous) =>
        previous.includes(permissionId)
          ? previous.filter(
              (id) =>
                id !== permissionId
            )
          : [
              ...previous,
              permissionId,
            ]
    );
  };

  const toggleCreateModule = (
    moduleName: string
  ) => {
    setExpandedCreateModules(
      (previous) =>
        previous.includes(moduleName)
          ? previous.filter(
              (module) =>
                module !== moduleName
            )
          : [...previous, moduleName]
    );
  };

  const toggleEditModule = (
    moduleName: string
  ) => {
    setExpandedEditModules(
      (previous) =>
        previous.includes(moduleName)
          ? previous.filter(
              (module) =>
                module !== moduleName
            )
          : [...previous, moduleName]
    );
  };

  const toggleAllCreateModulePermissions =
    (
      modulePermissions: Permission[]
    ) => {
      const modulePermissionIds =
        modulePermissions.map(
          (permission) =>
            permission.id
        );

      const allSelected =
        modulePermissionIds.every((id) =>
          createForm.permissionIds.includes(
            id
          )
        );

      setCreateForm((previous) => {
        if (allSelected) {
          return {
            ...previous,

            permissionIds:
              previous.permissionIds.filter(
                (id) =>
                  !modulePermissionIds.includes(
                    id
                  )
              ),
          };
        }

        return {
          ...previous,

          permissionIds: Array.from(
            new Set([
              ...previous.permissionIds,
              ...modulePermissionIds,
            ])
          ),
        };
      });
    };

  const toggleAllEditModulePermissions =
    (
      modulePermissions: RolePermission[]
    ) => {
      const modulePermissionIds =
        modulePermissions.map(
          (permission) =>
            permission.permissionId
        );

      const allSelected =
        modulePermissionIds.every((id) =>
          selectedPermissionIds.includes(id)
        );

      setSelectedPermissionIds(
        (previous) => {
          if (allSelected) {
            return previous.filter(
              (id) =>
                !modulePermissionIds.includes(
                  id
                )
            );
          }

          return Array.from(
            new Set([
              ...previous,
              ...modulePermissionIds,
            ])
          );
        }
      );
    };

  const selectAllCreatePermissions =
    () => {
      setCreateForm((previous) => ({
        ...previous,

        permissionIds:
          permissions.map(
            (permission) =>
              permission.id
          ),
      }));
    };

  const clearAllCreatePermissions =
    () => {
      setCreateForm((previous) => ({
        ...previous,
        permissionIds: [],
      }));
    };

  const selectAllEditPermissions =
    () => {
      const permissionIds =
        roleDetailQuery.data?.permissions.map(
          (permission) =>
            permission.permissionId
        ) ?? [];

      setSelectedPermissionIds(
        permissionIds
      );
    };

  const clearAllEditPermissions =
    () => {
      setSelectedPermissionIds([]);
    };

  /*
   * Filtre temizleme
   */

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("");
    setAssignmentFilter("");
    setSortBy("nameForUI");
    setSortDirection("asc");
  };

  /*
   * DataTable kolonları
   */

  const columns: DataTableColumn<Role>[] =
    [
      {
        header: "Rol",
        render: (role) => (
          <div className="flex min-w-[230px] items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <ShieldCheck size={20} />
            </div>

            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900">
                {role.nameForUI}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Rol #{role.id}
              </p>
            </div>
          </div>
        ),
        filter: null,
      },
      {
        header: "Sistem Adı",
        render: (role) => (
          <div className="min-w-[170px]">
            <span className="inline-flex rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700">
              {role.name}
            </span>
          </div>
        ),
        filter: null,
      },
      {
        header: "Kullanıcı",
        render: (role) => (
          <div className="min-w-[130px]">
            <div className="flex items-center gap-2">
              <Users
                size={17}
                className={
                  role.userCount > 0
                    ? "text-blue-500"
                    : "text-slate-300"
                }
              />

              <span className="font-bold text-slate-800">
                {role.userCount ?? 0}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              kullanıcı ataması
            </p>
          </div>
        ),
        filter: null,
      },
      {
        header: "Yetki",
        render: (role) => (
          <div className="min-w-[130px]">
            <div className="flex items-center gap-2">
              <KeyRound
                size={17}
                className={
                  role.permissionCount > 0
                    ? "text-amber-500"
                    : "text-slate-300"
                }
              />

              <span className="font-bold text-slate-800">
                {role.permissionCount ??
                  0}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-400">
              atanmış yetki
            </p>
          </div>
        ),
        filter: null,
      },
      {
        header: "Durum",
        render: (role) => (
          <ActiveStatusBadge
            isActive={
              role.isActive &&
              !role.isDeleted
            }
          />
        ),
        filter: null,
      },
      {
        header: "İşlemler",
        render: (role) => (
          <button
            type="button"
            onClick={() =>
              openPermissionDrawer(
                role.id
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
          >
            <Pencil size={15} />
            Yetkileri Düzenle
          </button>
        ),
        filter: null,
      },
    ];

  return (
    <div>
      <PageHeader
        title="Rol ve Yetki Yönetimi"
        moduleName="İnsan Kaynakları"
        description="Sistem rollerini oluşturun ve modül bazlı yetkileri yönetin."
        rightContent={
          <button
            type="button"
            onClick={openCreateDrawer}
            className="flex h-11 items-center gap-2 rounded-xl bg-violet-600 px-5 font-semibold text-white transition hover:bg-violet-700"
          >
            <Plus size={18} />
            Yeni Rol
          </button>
        }
      />

      {rolesQuery.isError && (
        <ErrorBox
          error={rolesQuery.error}
        />
      )}

      {permissionsQuery.isError && (
        <ErrorBox
          error={
            permissionsQuery.error
          }
        />
      )}

      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[250px] flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Rol Ara
            </label>

            <div className="relative">
              <Search
                size={17}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                placeholder="Rol adı veya sistem adı ara..."
                className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-10 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          <div className="w-[160px]">
            <SelectInput
              label="Durum"
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Tüm durumlar"
              options={[
                {
                  value: "active",
                  label: "Aktif",
                },
                {
                  value: "passive",
                  label: "Pasif",
                },
              ]}
            />
          </div>

          <div className="w-[210px]">
            <SelectInput
              label="Atama Durumu"
              value={assignmentFilter}
              onChange={
                setAssignmentFilter
              }
              placeholder="Tüm roller"
              options={[
                {
                  value: "has-users",
                  label:
                    "Kullanıcısı olan",
                },
                {
                  value: "no-users",
                  label:
                    "Kullanıcısı olmayan",
                },
                {
                  value:
                    "has-permissions",
                  label:
                    "Yetkisi olan",
                },
                {
                  value:
                    "no-permissions",
                  label:
                    "Yetkisi olmayan",
                },
              ]}
            />
          </div>

          <div className="w-[190px]">
            <SelectInput
              label="Sırala"
              value={sortBy}
              onChange={setSortBy}
              options={[
                {
                  value: "nameForUI",
                  label:
                    "Görünen Rol Adı",
                },
                {
                  value: "name",
                  label: "Sistem Adı",
                },
                {
                  value: "userCount",
                  label:
                    "Kullanıcı Sayısı",
                },
                {
                  value:
                    "permissionCount",
                  label:
                    "Yetki Sayısı",
                },
              ]}
            />
          </div>

          <div className="w-[130px]">
            <SelectInput
              label="Yön"
              value={sortDirection}
              onChange={
                setSortDirection
              }
              options={[
                {
                  value: "asc",
                  label: "Artan",
                },
                {
                  value: "desc",
                  label: "Azalan",
                },
              ]}
            />
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <X size={16} />
            Temizle
          </button>

          <button
            type="button"
            onClick={() =>
              rolesQuery.refetch()
            }
            disabled={
              rolesQuery.isFetching
            }
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              size={16}
              className={
                rolesQuery.isFetching
                  ? "animate-spin"
                  : ""
              }
            />
            Yenile
          </button>
        </div>
      </Card>

      <Card
        title={`Roller (${filteredRoles.length})`}
      >
        <DataTable
          columns={columns}
          data={filteredRoles}
          loading={
            rolesQuery.isLoading
          }
          emptyText="Rol kaydı bulunamadı."
          totalCount={
            filteredRoles.length
          }
        />
      </Card>

      {/* Yeni rol drawer */}

      <CreateDrawer
        open={createDrawerOpen}
        title="Yeni Rol"
        subtitle="Rol bilgilerini girin ve sahip olacağı yetkileri seçin."
        onClose={closeCreateDrawer}
        widthClassName="w-[760px]"
      >
        {createMutation.isError && (
          <ErrorBox
            error={createMutation.error}
          />
        )}

        <form
          onSubmit={submitCreateRole}
          className="space-y-5"
        >
          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <ShieldCheck
                    size={21}
                  />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Rol Bilgileri
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Sistemde ve arayüzde kullanılacak rol adlarını girin.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
              <TextInput
                label="Sistem Rol Adı"
                value={createForm.name}
                onChange={(value) =>
                  updateCreateForm(
                    "name",
                    value
                  )
                }
                placeholder="Örn. SALES_MANAGER"
                required
              />

              <TextInput
                label="Görünen Rol Adı"
                value={
                  createForm.nameForUI
                }
                onChange={(value) =>
                  updateCreateForm(
                    "nameForUI",
                    value
                  )
                }
                placeholder="Örn. Satış Yöneticisi"
                required
              />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
              <div>
                <h3 className="font-bold text-slate-900">
                  Rol Yetkileri
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {
                    createForm
                      .permissionIds
                      .length
                  }{" "}
                  yetki seçildi.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    selectAllCreatePermissions
                  }
                  className="h-9 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                >
                  Tümünü Seç
                </button>

                <button
                  type="button"
                  onClick={
                    clearAllCreatePermissions
                  }
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Seçimleri Temizle
                </button>
              </div>
            </div>

            <div className="space-y-3 p-5">
              {permissionsQuery.isLoading ? (
                <LoadingPermissions />
              ) : Object.keys(
                  createPermissionGroups
                ).length === 0 ? (
                <EmptyPermissions />
              ) : (
                Object.entries(
                  createPermissionGroups
                ).map(
                  ([
                    moduleName,
                    modulePermissions,
                  ]) => (
                    <PermissionModule
                      key={moduleName}
                      moduleName={
                        moduleName
                      }
                      expanded={expandedCreateModules.includes(
                        moduleName
                      )}
                      onToggle={() =>
                        toggleCreateModule(
                          moduleName
                        )
                      }
                      selectedCount={modulePermissions.filter(
                        (permission) =>
                          createForm.permissionIds.includes(
                            permission.id
                          )
                      ).length}
                      totalCount={
                        modulePermissions.length
                      }
                      onToggleAll={() =>
                        toggleAllCreateModulePermissions(
                          modulePermissions
                        )
                      }
                    >
                      {modulePermissions.map(
                        (permission) => (
                          <PermissionCheckbox
                            key={
                              permission.id
                            }
                            checked={createForm.permissionIds.includes(
                              permission.id
                            )}
                            title={
                              permission.name
                            }
                            code={
                              permission.code
                            }
                            description={
                              permission.description
                            }
                            onChange={() =>
                              toggleCreatePermission(
                                permission.id
                              )
                            }
                          />
                        )
                      )}
                    </PermissionModule>
                  )
                )
              )}
            </div>
          </Card>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={closeCreateDrawer}
              disabled={
                createMutation.isPending
              }
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vazgeç
            </button>

            <button
              type="submit"
              disabled={
                createMutation.isPending
              }
              className="h-11 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createMutation.isPending
                ? "Rol oluşturuluyor..."
                : "Rolü Oluştur"}
            </button>
          </div>
        </form>
      </CreateDrawer>

      {/* Yetki düzenleme drawer */}

      <CreateDrawer
        open={permissionDrawerOpen}
        title="Rol Yetkilerini Düzenle"
        subtitle="Rolün modül bazlı erişim yetkilerini güncelleyin."
        onClose={
          closePermissionDrawer
        }
        widthClassName="w-[760px]"
      >
        {roleDetailQuery.isError && (
          <ErrorBox
            error={
              roleDetailQuery.error
            }
          />
        )}

        {updatePermissionsMutation.isError && (
          <ErrorBox
            error={
              updatePermissionsMutation.error
            }
          />
        )}

        {roleDetailQuery.isLoading ? (
          <LoadingRoleDetail />
        ) : roleDetailQuery.data ? (
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <div className="flex items-center gap-4 p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <ShieldCheck
                    size={25}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-black text-slate-900">
                    {
                      roleDetailQuery.data
                        .nameForUI
                    }
                  </h3>

                  <p className="mt-1 font-mono text-xs font-semibold text-slate-500">
                    {
                      roleDetailQuery.data
                        .name
                    }
                  </p>
                </div>

                <ActiveStatusBadge
                  isActive={
                    roleDetailQuery.data
                      .isActive &&
                    !roleDetailQuery.data
                      .isDeleted
                  }
                />
              </div>

              <div className="grid grid-cols-2 border-t border-slate-100">
                <div className="border-r border-slate-100 p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Kullanıcı Sayısı
                  </p>

                  <p className="mt-2 text-xl font-black text-slate-900">
                    {
                      roleDetailQuery.data
                        .userCount
                    }
                  </p>
                </div>

                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-400">
                    Seçili Yetki
                  </p>

                  <p className="mt-2 text-xl font-black text-slate-900">
                    {
                      selectedPermissionIds.length
                    }
                  </p>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Yetkiler
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Rolün erişebileceği işlemleri seçin.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={
                      selectAllEditPermissions
                    }
                    className="h-9 rounded-xl border border-violet-200 bg-violet-50 px-3 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                  >
                    Tümünü Seç
                  </button>

                  <button
                    type="button"
                    onClick={
                      clearAllEditPermissions
                    }
                    className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    Seçimleri Temizle
                  </button>
                </div>
              </div>

              <div className="space-y-3 p-5">
                {Object.keys(
                  editPermissionGroups
                ).length === 0 ? (
                  <EmptyPermissions />
                ) : (
                  Object.entries(
                    editPermissionGroups
                  ).map(
                    ([
                      moduleName,
                      modulePermissions,
                    ]) => (
                      <PermissionModule
                        key={moduleName}
                        moduleName={
                          moduleName
                        }
                        expanded={expandedEditModules.includes(
                          moduleName
                        )}
                        onToggle={() =>
                          toggleEditModule(
                            moduleName
                          )
                        }
                        selectedCount={modulePermissions.filter(
                          (permission) =>
                            selectedPermissionIds.includes(
                              permission.permissionId
                            )
                        ).length}
                        totalCount={
                          modulePermissions.length
                        }
                        onToggleAll={() =>
                          toggleAllEditModulePermissions(
                            modulePermissions
                          )
                        }
                      >
                        {modulePermissions.map(
                          (permission) => (
                            <PermissionCheckbox
                              key={
                                permission.permissionId
                              }
                              checked={selectedPermissionIds.includes(
                                permission.permissionId
                              )}
                              title={
                                permission.name
                              }
                              code={
                                permission.code
                              }
                              description={
                                permission.description
                              }
                              onChange={() =>
                                toggleEditPermission(
                                  permission.permissionId
                                )
                              }
                            />
                          )
                        )}
                      </PermissionModule>
                    )
                  )
                )}
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={
                  closePermissionDrawer
                }
                disabled={
                  updatePermissionsMutation.isPending
                }
                className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={
                  submitPermissionUpdate
                }
                disabled={
                  updatePermissionsMutation.isPending
                }
                className="h-11 rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updatePermissionsMutation.isPending
                  ? "Yetkiler kaydediliyor..."
                  : "Yetkileri Kaydet"}
              </button>
            </div>
          </div>
        ) : null}
      </CreateDrawer>
    </div>
  );
}

/*
 * Permission module
 */

interface PermissionModuleProps {
  moduleName: string;
  expanded: boolean;
  selectedCount: number;
  totalCount: number;
  onToggle: () => void;
  onToggleAll: () => void;
  children: React.ReactNode;
}

function PermissionModule({
  moduleName,
  expanded,
  selectedCount,
  totalCount,
  onToggle,
  onToggleAll,
  children,
}: PermissionModuleProps) {
  const allSelected =
    totalCount > 0 &&
    selectedCount === totalCount;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
            <LockKeyhole size={17} />
          </div>

          <div className="min-w-0">
            <p className="truncate font-bold text-slate-800">
              {moduleName}
            </p>

            <p className="mt-0.5 text-xs text-slate-400">
              {selectedCount}/{totalCount}{" "}
              yetki seçildi
            </p>
          </div>

          {expanded ? (
            <ChevronDown
              size={18}
              className="ml-auto shrink-0 text-slate-400"
            />
          ) : (
            <ChevronRight
              size={18}
              className="ml-auto shrink-0 text-slate-400"
            />
          )}
        </button>

        <button
          type="button"
          onClick={onToggleAll}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            allSelected
              ? "bg-violet-600 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700"
          }`}
        >
          {allSelected
            ? "Seçimi Kaldır"
            : "Modülü Seç"}
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-4 lg:grid-cols-2">
          {children}
        </div>
      )}
    </div>
  );
}

/*
 * Permission checkbox
 */

interface PermissionCheckboxProps {
  checked: boolean;
  title: string;
  code: string;
  description?: string | null;
  onChange: () => void;
}

function PermissionCheckbox({
  checked,
  title,
  code,
  description,
  onChange,
}: PermissionCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
        checked
          ? "border-violet-300 bg-violet-50"
          : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
      }`}
    >
      <div
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          checked
            ? "border-violet-600 bg-violet-600 text-white"
            : "border-slate-300 bg-white"
        }`}
      >
        {checked && <Check size={14} />}
      </div>

      <div className="min-w-0">
        <p
          className={`text-sm font-bold ${
            checked
              ? "text-violet-900"
              : "text-slate-800"
          }`}
        >
          {title}
        </p>

        <p className="mt-1 break-all font-mono text-[11px] font-semibold text-slate-400">
          {code}
        </p>

        {description?.trim() && (
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}

/*
 * Loading ve empty
 */

function LoadingPermissions() {
  return (
    <div className="flex min-h-[180px] items-center justify-center">
      <div className="text-center">
        <RefreshCcw
          size={24}
          className="mx-auto animate-spin text-violet-600"
        />

        <p className="mt-3 text-sm font-semibold text-slate-500">
          Yetkiler yükleniyor...
        </p>
      </div>
    </div>
  );
}

function LoadingRoleDetail() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        <RefreshCcw
          size={27}
          className="mx-auto animate-spin text-violet-600"
        />

        <p className="mt-3 text-sm font-semibold text-slate-500">
          Rol detayları yükleniyor...
        </p>
      </div>
    </div>
  );
}

function EmptyPermissions() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
      <KeyRound
        size={28}
        className="mx-auto text-slate-300"
      />

      <p className="mt-3 font-bold text-slate-700">
        Yetki bulunamadı
      </p>

      <p className="mt-1 text-sm text-slate-400">
        Aktif bir yetki kaydı bulunmuyor.
      </p>
    </div>
  );
}

/*
 * Error
 */

function ErrorBox({
  error,
}: {
  error: unknown;
}) {
  return (
    <div className="mb-5 whitespace-pre-line rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
      {getErrorMessage(error)}
    </div>
  );
}

/*
 * Helpers
 */

function groupPermissionsByModule(
  permissions: Permission[]
): Record<string, Permission[]> {
  return [...permissions]
    .sort(
      (first, second) =>
        first.displayOrder -
        second.displayOrder
    )
    .reduce<Record<string, Permission[]>>(
      (groups, permission) => {
        const moduleName =
          permission.module?.trim() ||
          "Diğer";

        if (!groups[moduleName]) {
          groups[moduleName] = [];
        }

        groups[moduleName].push(
          permission
        );

        return groups;
      },
      {}
    );
}

function groupRolePermissionsByModule(
  permissions: RolePermission[]
): Record<string, RolePermission[]> {
  return [...permissions]
    .sort(
      (first, second) =>
        first.displayOrder -
        second.displayOrder
    )
    .reduce<
      Record<string, RolePermission[]>
    >((groups, permission) => {
      const moduleName =
        permission.module?.trim() ||
        "Diğer";

      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }

      groups[moduleName].push(
        permission
      );

      return groups;
    }, {});
}

function normalizeText(
  value:
    | string
    | number
    | null
    | undefined
): string {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}