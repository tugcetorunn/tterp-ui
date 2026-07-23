import { useMemo, useState } from "react";
import type {
  FormEvent,
  ReactNode,
} from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  EyeOff,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { toast } from "sonner";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";

import DataTable from "../components/table/DataTable";
import type {
  DataTableColumn,
} from "../components/table/DataTable";

import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";

import CreateDrawer from "../components/drawer/CreateDrawer";

import ActiveStatusBadge from "../components/common/ActiveStatusBadge";

import {
  employeeService,
  type CreateEmployeeRequest,
  type Employee,
} from "../services/employeeService";

import {
  organizationService,
} from "../services/organizationService";

import {
  parameterValueService,
} from "../services/parameterService";

import {
  locationService,
} from "../services/locationService";

import {
  getErrorMessage,
} from "../utils/apiResponse";

interface SelectOption {
  label: string;
  value: string;
}

interface EmployeeFormState {
  firstName: string;
  lastName: string;
  nationalId: string;
  phoneNumber: string;
  dateOfBirth: string;
  hireDate: string;

  gender: string;
  maritalStatus: string;

  roleId: string;
  titleId: string;
  teamId: string;

  salary: string;
  annualLeaveUsed: string;

  countryId: string;
  cityId: string;
  townId: string;
  districtId: string;
  neighborhoodId: string;

  addressLine: string;
  imagePath: string;
}

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

function createInitialForm(): EmployeeFormState {
  return {
    firstName: "",
    lastName: "",
    nationalId: "",
    phoneNumber: "",
    dateOfBirth: "",
    hireDate: todayInput(),

    gender: "",
    maritalStatus: "",

    roleId: "",
    titleId: "",
    teamId: "",

    salary: "",
    annualLeaveUsed: "0",

    countryId: "",
    cityId: "",
    townId: "",
    districtId: "",
    neighborhoodId: "",

    addressLine: "",
    imagePath: "",
  };
}

export default function EmployeesPage() {
  const queryClient = useQueryClient();

  const [showCreateDrawer, setShowCreateDrawer] =
    useState(false);

  const [form, setForm] =
    useState<EmployeeFormState>(
      createInitialForm
    );

  const [createdPassword, setCreatedPassword] =
    useState<string | null>(null);

  const [showPassword, setShowPassword] =
    useState(false);

  // Filtreler
  const [searchText, setSearchText] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("");

  const [titleFilter, setTitleFilter] =
    useState("");

  const [teamFilter, setTeamFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [sortBy, setSortBy] =
    useState("fullName");

  const [sortDirection, setSortDirection] =
    useState("asc");

  /*
   * Queries
   */

  const employeesQuery = useQuery({
    queryKey: ["employees"],
    queryFn: employeeService.getList,
  });

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: organizationService.getRoles,
  });

  const titlesQuery = useQuery({
    queryKey: ["titles"],
    queryFn: organizationService.getTitles,
  });

  const teamsQuery = useQuery({
    queryKey: ["teams"],
    queryFn: organizationService.getTeams,
  });

  const gendersQuery = useQuery({
    queryKey: [
      "parameter-options",
      "Gender",
    ],
    queryFn: () =>
      parameterValueService.getByParamType(
        "Gender"
      ),
  });

  const maritalStatusesQuery = useQuery({
    queryKey: [
      "parameter-options",
      "MaritalStatus",
    ],
    queryFn: () =>
      parameterValueService.getByParamType(
        "MaritalStatus"
      ),
  });

  const countriesQuery = useQuery({
    queryKey: [
      "locations",
      "countries",
    ],
    queryFn: locationService.getCountries,
  });

  const citiesQuery = useQuery({
    queryKey: [
      "locations",
      "cities",
      form.countryId,
    ],
    queryFn: () =>
      locationService.getCities(
        Number(form.countryId)
      ),
    enabled: Boolean(form.countryId),
  });

  const townsQuery = useQuery({
    queryKey: [
      "locations",
      "towns",
      form.cityId,
    ],
    queryFn: () =>
      locationService.getTowns(
        Number(form.cityId)
      ),
    enabled: Boolean(form.cityId),
  });

  const districtsQuery = useQuery({
    queryKey: [
      "locations",
      "districts",
      form.townId,
    ],
    queryFn: () =>
      locationService.getDistricts(
        Number(form.townId)
      ),
    enabled: Boolean(form.townId),
  });

  const neighborhoodsQuery = useQuery({
    queryKey: [
      "locations",
      "neighborhoods",
      form.districtId,
    ],
    queryFn: () =>
      locationService.getNeighborhoods(
        Number(form.districtId)
      ),
    enabled: Boolean(form.districtId),
  });

  const employees =
    employeesQuery.data ?? [];

  /*
   * Select options
   */

  const roleOptions = useMemo<SelectOption[]>(
    () =>
      (rolesQuery.data ?? []).map((role) => ({
        value: String(role.id),
        label: role.nameForUI,
      })),
    [rolesQuery.data]
  );

  const titleOptions = useMemo<SelectOption[]>(
    () =>
      (titlesQuery.data ?? []).map((title) => ({
        value: String(title.id),
        label: title.name,
      })),
    [titlesQuery.data]
  );

  const teamOptions = useMemo<SelectOption[]>(
    () =>
      (teamsQuery.data ?? []).map((team) => ({
        value: String(team.id),
        label: team.name,
      })),
    [teamsQuery.data]
  );

  const genderOptions =
    useMemo<SelectOption[]>(
      () =>
        (gendersQuery.data ?? [])
          .sort(
            (first, second) =>
              first.displayOrder -
              second.displayOrder
          )
          .map((item) => ({
            value: String(
              item.paramCode
            ),
            label: item.paramValue,
          })),
      [gendersQuery.data]
    );

  const maritalStatusOptions =
    useMemo<SelectOption[]>(
      () =>
        (
          maritalStatusesQuery.data ?? []
        )
          .sort(
            (first, second) =>
              first.displayOrder -
              second.displayOrder
          )
          .map((item) => ({
            value: String(
              item.paramCode
            ),
            label: item.paramValue,
          })),
      [maritalStatusesQuery.data]
    );

  const countryOptions =
    useMemo<SelectOption[]>(
      () =>
        (countriesQuery.data ?? []).map(
          (item) => ({
            value: String(item.id),
            label: item.name,
          })
        ),
      [countriesQuery.data]
    );

  const cityOptions =
    useMemo<SelectOption[]>(
      () =>
        (citiesQuery.data ?? []).map(
          (item) => ({
            value: String(item.id),
            label: item.name,
          })
        ),
      [citiesQuery.data]
    );

  const townOptions =
    useMemo<SelectOption[]>(
      () =>
        (townsQuery.data ?? []).map(
          (item) => ({
            value: String(item.id),
            label: item.name,
          })
        ),
      [townsQuery.data]
    );

  const districtOptions =
    useMemo<SelectOption[]>(
      () =>
        (
          districtsQuery.data ?? []
        ).map((item) => ({
          value: String(item.id),
          label: item.name,
        })),
      [districtsQuery.data]
    );

  const neighborhoodOptions =
    useMemo<SelectOption[]>(
      () =>
        (
          neighborhoodsQuery.data ?? []
        ).map((item) => ({
          value: String(item.id),
          label: item.name,
        })),
      [neighborhoodsQuery.data]
    );

  /*
   * KPIs
   */

  const kpis = useMemo(() => {
    const active = employees.filter(
      (employee) =>
        employee.isActive &&
        !employee.isDeleted
    ).length;

    const managers = employees.filter(
      (employee) =>
        normalize(employee.roleName)
          .includes("yonetici")
    ).length;

    const assignedToTeam =
      employees.filter(
        (employee) =>
          employee.teamId != null
      ).length;

    return {
      total: employees.length,
      active,
      managers,
      assignedToTeam,
    };
  }, [employees]);

  /*
   * Filtering and sorting
   */

  const filteredEmployees =
    useMemo(() => {
      let result = [...employees];

      const search =
        normalize(searchText);

      if (search) {
        result = result.filter(
          (employee) => {
            const fullName =
              getEmployeeFullName(
                employee
              );

            return (
              normalize(fullName)
                .includes(search) ||
              normalize(employee.email)
                .includes(search) ||
              normalize(
                employee.nationalId
              ).includes(search) ||
              normalize(
                employee.registrationNumber
              ).includes(search) ||
              normalize(
                employee.phoneNumber
              ).includes(search) ||
              normalize(
                employee.internalPhone
              ).includes(search) ||
              normalize(
                employee.roleName
              ).includes(search) ||
              normalize(
                employee.titleName
              ).includes(search) ||
              normalize(
                employee.teamName
              ).includes(search)
            );
          }
        );
      }

      if (roleFilter) {
        result = result.filter(
          (employee) =>
            String(
              employee.roleId ?? ""
            ) === roleFilter
        );
      }

      if (titleFilter) {
        result = result.filter(
          (employee) =>
            String(
              employee.titleId ?? ""
            ) === titleFilter
        );
      }

      if (teamFilter) {
        result = result.filter(
          (employee) =>
            String(
              employee.teamId ?? ""
            ) === teamFilter
        );
      }

      if (statusFilter) {
        result = result.filter(
          (employee) => {
            if (
              statusFilter === "active"
            ) {
              return (
                employee.isActive &&
                !employee.isDeleted
              );
            }

            if (
              statusFilter === "passive"
            ) {
              return (
                !employee.isActive &&
                !employee.isDeleted
              );
            }

            if (
              statusFilter === "deleted"
            ) {
              return employee.isDeleted;
            }

            return true;
          }
        );
      }

      result.sort(
        (
          firstEmployee,
          secondEmployee
        ) => {
          let comparison = 0;

          if (
            sortBy === "fullName"
          ) {
            comparison =
              getEmployeeFullName(
                firstEmployee
              ).localeCompare(
                getEmployeeFullName(
                  secondEmployee
                ),
                "tr"
              );
          }

          if (
            sortBy ===
            "registrationNumber"
          ) {
            comparison =
              Number(
                firstEmployee.registrationNumber ??
                0
              ) -
              Number(
                secondEmployee.registrationNumber ??
                0
              );
          }

          if (
            sortBy === "hireDate"
          ) {
            comparison =
              getDateTimestamp(
                firstEmployee.hireDate
              ) -
              getDateTimestamp(
                secondEmployee.hireDate
              );
          }

          if (
            sortBy === "roleName"
          ) {
            comparison = (
              firstEmployee.roleName ?? ""
            ).localeCompare(
              secondEmployee.roleName ??
              "",
              "tr"
            );
          }

          if (
            sortBy === "titleName"
          ) {
            comparison = (
              firstEmployee.titleName ??
              ""
            ).localeCompare(
              secondEmployee.titleName ??
              "",
              "tr"
            );
          }

          return sortDirection ===
            "asc"
            ? comparison
            : -comparison;
        }
      );

      return result;
    }, [
      employees,
      searchText,
      roleFilter,
      titleFilter,
      teamFilter,
      statusFilter,
      sortBy,
      sortDirection,
    ]);

  /*
   * Create mutation
   */

  const createMutation = useMutation({
    mutationFn: employeeService.create,

    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["employees"],
      });

      setCreatedPassword(
        result.initialPassword
      );

      setShowPassword(false);

      toast.success(
        "Çalışan başarıyla oluşturuldu."
      );
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(error)
      );
    },
  });

  /*
   * Form handlers
   */

  const updateForm = (
    field: keyof EmployeeFormState,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleCountryChange = (
    countryId: string
  ) => {
    setForm((previous) => ({
      ...previous,
      countryId,
      cityId: "",
      townId: "",
      districtId: "",
      neighborhoodId: "",
    }));
  };

  const handleCityChange = (
    cityId: string
  ) => {
    setForm((previous) => ({
      ...previous,
      cityId,
      townId: "",
      districtId: "",
      neighborhoodId: "",
    }));
  };

  const handleTownChange = (
    townId: string
  ) => {
    setForm((previous) => ({
      ...previous,
      townId,
      districtId: "",
      neighborhoodId: "",
    }));
  };

  const handleDistrictChange = (
    districtId: string
  ) => {
    setForm((previous) => ({
      ...previous,
      districtId,
      neighborhoodId: "",
    }));
  };

  const resetCreateForm = () => {
    setForm(createInitialForm());
    setCreatedPassword(null);
    setShowPassword(false);
    createMutation.reset();
  };

  const openCreateDrawer = () => {
    resetCreateForm();
    setShowCreateDrawer(true);
  };

  const closeCreateDrawer = () => {
    if (createMutation.isPending) {
      return;
    }

    setShowCreateDrawer(false);
    resetCreateForm();
  };

  const clearFilters = () => {
    setSearchText("");
    setRoleFilter("");
    setTitleFilter("");
    setTeamFilter("");
    setStatusFilter("");
    setSortBy("fullName");
    setSortDirection("asc");
  };

  const submitCreate = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      toast.warning(
        "Ad ve soyad alanlarını doldurun."
      );
      return;
    }

    if (
      form.nationalId.length !== 11
    ) {
      toast.warning(
        "T.C. kimlik numarası 11 haneli olmalıdır."
      );
      return;
    }

    if (
      form.phoneNumber.length !== 10
    ) {
      toast.warning(
        "Telefon numarası 10 haneli olmalıdır."
      );
      return;
    }

    if (
      !form.dateOfBirth ||
      !form.hireDate
    ) {
      toast.warning(
        "Doğum ve işe giriş tarihlerini seçin."
      );
      return;
    }

    if (
      !form.roleId ||
      !form.titleId
    ) {
      toast.warning(
        "Rol ve ünvan alanlarını seçin."
      );
      return;
    }

    if (
      !form.countryId ||
      !form.cityId ||
      !form.townId ||
      !form.districtId ||
      !form.neighborhoodId
    ) {
      toast.warning(
        "Adres seçimlerinin tamamını yapın."
      );
      return;
    }

    const payload:
      CreateEmployeeRequest = {
      firstName:
        form.firstName.trim(),

      lastName:
        form.lastName.trim(),

      nationalId:
        form.nationalId.trim(),

      phoneNumber:
        form.phoneNumber.trim(),

      dateOfBirth:
        form.dateOfBirth,

      hireDate:
        form.hireDate,

      gender: form.gender
        ? Number(form.gender)
        : null,

      maritalStatus:
        form.maritalStatus
          ? Number(
            form.maritalStatus
          )
          : null,

      roleId:
        Number(form.roleId),

      titleId:
        Number(form.titleId),

      teamId: form.teamId
        ? Number(form.teamId)
        : null,

      salary: form.salary
        ? Number(form.salary)
        : null,

      annualLeaveUsed:
        Number(
          form.annualLeaveUsed
        ) || 0,

      countryId:
        Number(form.countryId),

      cityId:
        Number(form.cityId),

      townId:
        Number(form.townId),

      districtId:
        Number(form.districtId),

      neighborhoodId:
        Number(
          form.neighborhoodId
        ),

      addressLine:
        form.addressLine.trim() ||
        null,

      imagePath:
        form.imagePath.trim() ||
        null,
    };

    createMutation.mutate(payload);
  };

  /*
   * DataTable columns
   */

  const columns:
    DataTableColumn<Employee>[] = [
      {
        header: "Çalışan",
        render: (employee) => {
          const fullName =
            getEmployeeFullName(
              employee
            );

          return (
            <div className="flex min-w-[230px] items-center gap-3">
              <EmployeeAvatar
                employee={employee}
              />

              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">
                  {fullName}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {employee.email ??
                    "E-posta oluşturulmamış"}
                </p>
              </div>
            </div>
          );
        },
        filter: null,
      },
      {
        header: "Sicil",
        render: (employee) => (
          <div className="min-w-[100px]">
            <p className="font-semibold text-slate-800">
              {employee.registrationNumber ??
                "-"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {employee.nationalId ??
                "T.C. yok"}
            </p>
          </div>
        ),
        filter: null,
      },
      {
        header: "Rol",
        render: (employee) => (
          <div className="min-w-[125px]">
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {employee.roleName ??
                "Rol atanmadı"}
            </span>
          </div>
        ),
        filter: null,
      },
      {
        header: "Organizasyon",
        render: (employee) => (
          <div className="min-w-[170px]">
            <p className="font-semibold text-slate-800">
              {employee.titleName ??
                "Ünvan yok"}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {employee.teamName ??
                "Takım atanmamış"}
            </p>
          </div>
        ),
        filter: null,
      },
      {
        header: "İletişim",
        render: (employee) => (
          <div className="min-w-[145px]">
            <p className="font-semibold text-slate-700">
              {formatPhone(
                employee.phoneNumber
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Dahili:{" "}
              {employee.internalPhone ??
                "-"}
            </p>
          </div>
        ),
        filter: null,
      },
      {
        header: "İşe Giriş",
        render: (employee) => (
          <div className="flex min-w-[125px] items-center gap-2">
            <CalendarDays
              size={16}
              className="text-indigo-500"
            />

            <span className="font-medium text-slate-700">
              {formatDate(
                employee.hireDate
              )}
            </span>
          </div>
        ),
        filter: null,
      },
      {
        header: "Yıllık İzin",
        render: (employee) => {
          const right =
            employee.rightToAnnualLeave ??
            0;

          const used =
            employee.annualLeaveUsed ??
            0;

          const remaining = Math.max(
            0,
            right - used
          );

          return (
            <div className="min-w-[145px]">
              <p className="font-bold text-slate-800">
                {remaining} gün kaldı
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Hak: {right} ·
                Kullanılan: {used}
              </p>
            </div>
          );
        },
        filter: null,
      },
      {
        header: "Maaş",
        render: (employee) => (
          <div className="min-w-[130px] font-bold text-slate-800">
            {formatCurrency(
              employee.salary
            )}
          </div>
        ),
        filter: null,
      },
      {
        header: "Durum",
        render: (employee) => (
          <ActiveStatusBadge
            isActive={
              employee.isActive &&
              !employee.isDeleted
            }
          />
        ),
        filter: null,
      },
    ];

  return (
    <div>
      <PageHeader
        title="Çalışan Yönetimi"
        moduleName="İnsan Kaynakları"
        description="Çalışanları, kullanıcı rollerini ve organizasyon bilgilerini tek ekrandan yönetin."
        rightContent={
          <button
            type="button"
            onClick={openCreateDrawer}
            className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus size={18} />
            Yeni Çalışan
          </button>
        }
      />

      {employeesQuery.isError && (
        <ErrorBox
          error={
            employeesQuery.error
          }
        />
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Toplam Çalışan"
          value={String(kpis.total)}
          description="Sistemdeki çalışan kayıtları"
          icon={<Users size={22} />}
          accent="indigo"
        />

        <KpiCard
          title="Aktif Çalışan"
          value={String(kpis.active)}
          description="Aktif kullanıcı hesabına sahip"
          icon={
            <BadgeCheck size={22} />
          }
          accent="emerald"
        />

        <KpiCard
          title="Yönetici"
          value={String(kpis.managers)}
          description="Yönetici rolüne sahip çalışan"
          icon={
            <ShieldCheck size={22} />
          }
          accent="amber"
        />

        <KpiCard
          title="Takıma Atanmış"
          value={String(
            kpis.assignedToTeam
          )}
          description="Bir organizasyon takımında"
          icon={
            <BriefcaseBusiness
              size={22}
            />
          }
          accent="blue"
        />
      </div>

      <Card className="mb-5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Arama
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
                placeholder="Ad, e-posta, sicil, T.C. veya telefon..."
                className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-10 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="w-[160px]">
            <SelectInput
              label="Rol"
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Tüm roller"
              options={roleOptions}
            />
          </div>

          <div className="w-[170px]">
            <SelectInput
              label="Ünvan"
              value={titleFilter}
              onChange={setTitleFilter}
              placeholder="Tüm ünvanlar"
              options={titleOptions}
            />
          </div>

          <div className="w-[160px]">
            <SelectInput
              label="Takım"
              value={teamFilter}
              onChange={setTeamFilter}
              placeholder="Tüm takımlar"
              options={teamOptions}
            />
          </div>

          <div className="w-[145px]">
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
                {
                  value: "deleted",
                  label: "Silinmiş",
                },
              ]}
            />
          </div>

          <div className="w-[160px]">
            <SelectInput
              label="Sırala"
              value={sortBy}
              onChange={setSortBy}
              options={[
                {
                  value: "fullName",
                  label: "Ad Soyad",
                },
                {
                  value:
                    "registrationNumber",
                  label: "Sicil Numarası",
                },
                {
                  value: "hireDate",
                  label: "İşe Giriş",
                },
                {
                  value: "roleName",
                  label: "Rol",
                },
                {
                  value: "titleName",
                  label: "Ünvan",
                },
              ]}
            />
          </div>

          <div className="w-[120px]">
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
              employeesQuery.refetch()
            }
            disabled={
              employeesQuery.isFetching
            }
            className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              size={16}
              className={
                employeesQuery.isFetching
                  ? "animate-spin"
                  : ""
              }
            />
            Yenile
          </button>
        </div>
      </Card>

      <Card
        title={`Toplam ${filteredEmployees.length} çalışan`}
      >
        <DataTable
          columns={columns}
          data={filteredEmployees}
          loading={
            employeesQuery.isLoading
          }
          emptyText="Çalışan kaydı bulunamadı."
          totalCount={
            filteredEmployees.length
          }
        />
      </Card>

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Çalışan"
        subtitle="Personel kaydı ile kullanıcı hesabını birlikte oluşturun."
        onClose={closeCreateDrawer}
        widthClassName="w-[920px]"
      >
        {createdPassword ? (
          <CreateSuccess
            password={createdPassword}
            showPassword={showPassword}
            onTogglePassword={() =>
              setShowPassword(
                (previous) =>
                  !previous
              )
            }
            onClose={
              closeCreateDrawer
            }
          />
        ) : (
          <>
            {createMutation.isError && (
              <ErrorBox
                error={
                  createMutation.error
                }
              />
            )}

            <form
              onSubmit={submitCreate}
              className="space-y-6"
            >
              <FormCard
                step="1"
                title="Kimlik Bilgileri"
                description="Çalışanın kişisel ve iletişim bilgilerini girin."
                icon={
                  <UserRound
                    size={20}
                  />
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <TextInput
                    label="Ad"
                    value={
                      form.firstName
                    }
                    onChange={(value) =>
                      updateForm(
                        "firstName",
                        value
                      )
                    }
                    placeholder="Çalışanın adı"
                    required
                  />

                  <TextInput
                    label="Soyad"
                    value={
                      form.lastName
                    }
                    onChange={(value) =>
                      updateForm(
                        "lastName",
                        value
                      )
                    }
                    placeholder="Çalışanın soyadı"
                    required
                  />

                  <TextInput
                    label="T.C. Kimlik Numarası"
                    value={
                      form.nationalId
                    }
                    onChange={(value) =>
                      updateForm(
                        "nationalId",
                        value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(0, 11)
                      )
                    }
                    placeholder="11 haneli T.C. kimlik numarası"
                    required
                  />

                  <TextInput
                    label="Telefon"
                    value={
                      form.phoneNumber
                    }
                    onChange={(value) =>
                      updateForm(
                        "phoneNumber",
                        value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(0, 10)
                      )
                    }
                    placeholder="5XXXXXXXXX"
                    required
                  />

                  <TextInput
                    label="Doğum Tarihi"
                    value={
                      form.dateOfBirth
                    }
                    onChange={(value) =>
                      updateForm(
                        "dateOfBirth",
                        value
                      )
                    }
                    type="date"
                    required
                  />

                  <TextInput
                    label="İşe Giriş Tarihi"
                    value={
                      form.hireDate
                    }
                    onChange={(value) =>
                      updateForm(
                        "hireDate",
                        value
                      )
                    }
                    type="date"
                    required
                  />

                  <SelectInput
                    label="Cinsiyet"
                    value={form.gender}
                    onChange={(value) =>
                      updateForm(
                        "gender",
                        value
                      )
                    }
                    placeholder={
                      gendersQuery.isLoading
                        ? "Yükleniyor..."
                        : "Cinsiyet seçin"
                    }
                    options={
                      genderOptions
                    }
                  />

                  <SelectInput
                    label="Medeni Durum"
                    value={
                      form.maritalStatus
                    }
                    onChange={(value) =>
                      updateForm(
                        "maritalStatus",
                        value
                      )
                    }
                    placeholder={
                      maritalStatusesQuery.isLoading
                        ? "Yükleniyor..."
                        : "Medeni durum seçin"
                    }
                    options={
                      maritalStatusOptions
                    }
                  />

                  <div className="md:col-span-2">
                    <TextInput
                      label="Görsel Yolu"
                      value={
                        form.imagePath
                      }
                      onChange={(value) =>
                        updateForm(
                          "imagePath",
                          value
                        )
                      }
                      placeholder="/images/employees/calisan.jpg"
                    />
                  </div>
                </div>
              </FormCard>

              <FormCard
                step="2"
                title="Organizasyon Bilgileri"
                description="Rol, ünvan, takım ve çalışma koşullarını belirleyin."
                icon={
                  <BriefcaseBusiness
                    size={20}
                  />
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectInput
                    label="Rol"
                    value={form.roleId}
                    onChange={(value) =>
                      updateForm(
                        "roleId",
                        value
                      )
                    }
                    placeholder={
                      rolesQuery.isLoading
                        ? "Roller yükleniyor..."
                        : "Rol seçin"
                    }
                    options={
                      roleOptions
                    }
                  />

                  <SelectInput
                    label="Ünvan"
                    value={form.titleId}
                    onChange={(value) =>
                      updateForm(
                        "titleId",
                        value
                      )
                    }
                    placeholder={
                      titlesQuery.isLoading
                        ? "Ünvanlar yükleniyor..."
                        : "Ünvan seçin"
                    }
                    options={
                      titleOptions
                    }
                  />

                  <SelectInput
                    label="Takım"
                    value={form.teamId}
                    onChange={(value) =>
                      updateForm(
                        "teamId",
                        value
                      )
                    }
                    placeholder={
                      teamsQuery.isLoading
                        ? "Takımlar yükleniyor..."
                        : "Takım seçin"
                    }
                    options={
                      teamOptions
                    }
                  />

                  <TextInput
                    label="Maaş"
                    value={form.salary}
                    onChange={(value) =>
                      updateForm(
                        "salary",
                        value
                      )
                    }
                    type="number"
                    placeholder="0"
                  />

                  <TextInput
                    label="Kullanılmış Yıllık İzin"
                    value={
                      form.annualLeaveUsed
                    }
                    onChange={(value) =>
                      updateForm(
                        "annualLeaveUsed",
                        value
                      )
                    }
                    type="number"
                    placeholder="0"
                  />
                </div>
              </FormCard>

              <FormCard
                step="3"
                title="Adres Bilgileri"
                description="Çalışanın ikamet lokasyonunu ve açık adresini girin."
                icon={
                  <Users size={20} />
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectInput
                    label="Ülke"
                    value={
                      form.countryId
                    }
                    onChange={
                      handleCountryChange
                    }
                    placeholder={
                      countriesQuery.isLoading
                        ? "Ülkeler yükleniyor..."
                        : "Ülke seçin"
                    }
                    options={
                      countryOptions
                    }
                  />

                  <SelectInput
                    label="Şehir"
                    value={form.cityId}
                    onChange={
                      handleCityChange
                    }
                    placeholder={
                      !form.countryId
                        ? "Önce ülke seçin"
                        : citiesQuery.isLoading
                          ? "Şehirler yükleniyor..."
                          : "Şehir seçin"
                    }
                    options={
                      cityOptions
                    }
                  />

                  <SelectInput
                    label="İlçe"
                    value={form.townId}
                    onChange={
                      handleTownChange
                    }
                    placeholder={
                      !form.cityId
                        ? "Önce şehir seçin"
                        : townsQuery.isLoading
                          ? "İlçeler yükleniyor..."
                          : "İlçe seçin"
                    }
                    options={
                      townOptions
                    }
                  />

                  <SelectInput
                    label="Semt"
                    value={
                      form.districtId
                    }
                    onChange={
                      handleDistrictChange
                    }
                    placeholder={
                      !form.townId
                        ? "Önce ilçe seçin"
                        : districtsQuery.isLoading
                          ? "Semtler yükleniyor..."
                          : "Semt seçin"
                    }
                    options={
                      districtOptions
                    }
                  />

                  <div className="md:col-span-2">
                    <SelectInput
                      label="Mahalle"
                      value={
                        form.neighborhoodId
                      }
                      onChange={(value) =>
                        updateForm(
                          "neighborhoodId",
                          value
                        )
                      }
                      placeholder={
                        !form.districtId
                          ? "Önce semt seçin"
                          : neighborhoodsQuery.isLoading
                            ? "Mahalleler yükleniyor..."
                            : "Mahalle seçin"
                      }
                      options={
                        neighborhoodOptions
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Açık Adres
                    </label>

                    <textarea
                      value={
                        form.addressLine
                      }
                      onChange={(
                        event
                      ) =>
                        updateForm(
                          "addressLine",
                          event.target
                            .value
                        )
                      }
                      rows={4}
                      placeholder="Sokak, bina, kapı numarası ve diğer adres bilgileri"
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </FormCard>

              <Card className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      Çalışan Kaydı
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Kullanıcı hesabı ve ilk giriş şifresi otomatik oluşturulacaktır.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={
                        closeCreateDrawer
                      }
                      disabled={
                        createMutation.isPending
                      }
                      className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Vazgeç
                    </button>

                    <button
                      type="submit"
                      disabled={
                        createMutation.isPending
                      }
                      className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {createMutation.isPending
                        ? "Çalışan oluşturuluyor..."
                        : "Çalışanı Oluştur"}
                    </button>
                  </div>
                </div>
              </Card>
            </form>
          </>
        )}
      </CreateDrawer>
    </div>
  );
}

/*
 * UI helpers
 */

function EmployeeAvatar({
  employee,
}: {
  employee: Employee;
}) {
  const fullName =
    getEmployeeFullName(employee);

  if (employee.imagePath) {
    return (
      <img
        src={employee.imagePath}
        alt={fullName}
        className="h-11 w-11 shrink-0 rounded-xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
      <UserRound size={20} />
    </div>
  );
}

function KpiCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  accent:
  | "indigo"
  | "emerald"
  | "amber"
  | "blue";
}) {
  const accentClasses = {
    indigo:
      "bg-indigo-50 text-indigo-600",
    emerald:
      "bg-emerald-50 text-emerald-600",
    amber:
      "bg-amber-50 text-amber-600",
    blue:
      "bg-blue-50 text-blue-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClasses[accent]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function FormCard({
  step,
  title,
  description,
  icon,
  children,
}: {
  step: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div className="border-b border-slate-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            {icon}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                {step}
              </span>

              <h3 className="font-bold text-slate-900">
                {title}
              </h3>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {children}
      </div>
    </Card>
  );
}

function CreateSuccess({
  password,
  showPassword,
  onTogglePassword,
  onClose,
}: {
  password: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex min-h-[560px] items-center justify-center">
      <div className="w-full max-w-lg rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <BadgeCheck size={34} />
        </div>

        <h3 className="mt-5 text-xl font-black text-slate-900">
          Çalışan oluşturuldu
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Personel ve kullanıcı hesabı başarıyla oluşturuldu. Aşağıdaki ilk giriş şifresini çalışana güvenli şekilde iletin.
        </p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4">
          <code className="flex-1 text-lg font-bold tracking-wider text-slate-900">
            {showPassword
              ? password
              : "••••••••••••"}
          </code>

          <button
            type="button"
            onClick={onTogglePassword}
            title={
              showPassword
                ? "Şifreyi gizle"
                : "Şifreyi göster"
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
          >
            {showPassword ? (
              <EyeOff size={19} />
            ) : (
              <Eye size={19} />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-700"
        >
          Tamam
        </button>
      </div>
    </div>
  );
}

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
 * Formatting helpers
 */

function normalize(
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

function getEmployeeFullName(
  employee: Employee
): string {
  return (
    employee.fullName?.trim() ||
    [
      employee.firstName,
      employee.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    `Çalışan #${employee.id}`
  );
}

function getDateTimestamp(
  value?: string | null
): number {
  if (!value) {
    return 0;
  }

  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "tr-TR"
  );
}

function formatCurrency(
  value?: number | null
): string {
  if (value == null) {
    return "-";
  }

  return value.toLocaleString(
    "tr-TR",
    {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }
  );
}

function formatPhone(
  value?: string | null
): string {
  if (!value) {
    return "-";
  }

  const phone =
    value.replace(/\D/g, "");

  if (phone.length !== 10) {
    return value;
  }

  return `${phone.slice(
    0,
    3
  )} ${phone.slice(
    3,
    6
  )} ${phone.slice(
    6,
    8
  )} ${phone.slice(8)}`;
}