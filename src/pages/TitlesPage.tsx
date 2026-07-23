import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    BadgeCheck,
    BriefcaseBusiness,
    Plus,
    RefreshCcw,
    Search,
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
    titleService,
    type CreateTitleRequest,
    type Title,
} from "../services/titleService";

import {
    getErrorMessage,
} from "../utils/apiResponse";

interface TitleFormState {
    name: string;
    description: string;
}

function createInitialForm(): TitleFormState {
    return {
        name: "",
        description: "",
    };
}

export default function TitlesPage() {
    const queryClient = useQueryClient();

    const [showCreateDrawer, setShowCreateDrawer] =
        useState(false);

    const [form, setForm] =
        useState<TitleFormState>(
            createInitialForm()
        );

    const [searchText, setSearchText] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("");

    const [usageFilter, setUsageFilter] =
        useState("");

    const [sortBy, setSortBy] =
        useState("name");

    const [sortDirection, setSortDirection] =
        useState("asc");

    /*
     * Queries
     */

    const titlesQuery = useQuery({
        queryKey: [
            "titles",
            {
                isDeleted: false,
            },
        ],

        queryFn: () =>
            titleService.getList({
                isDeleted: false,
            }),
    });

    const titles = titlesQuery.data ?? [];

    /*
     * KPI values
     */

    const kpis = useMemo(() => {
        const activeCount = titles.filter(
            (title) =>
                title.isActive &&
                !title.isDeleted
        ).length;

        const usedCount = titles.filter(
            (title) =>
                (title.employeeCount ?? 0) > 0
        ).length;

        const unusedCount = titles.filter(
            (title) =>
                (title.employeeCount ?? 0) === 0
        ).length;

        return {
            total: titles.length,
            active: activeCount,
            used: usedCount,
            unused: unusedCount,
        };
    }, [titles]);

    /*
     * Filtering and sorting
     */

    const filteredTitles = useMemo(() => {
        let result = [...titles];

        const normalizedSearch =
            normalizeText(searchText);

        if (normalizedSearch) {
            result = result.filter((title) => {
                return (
                    normalizeText(title.name).includes(
                        normalizedSearch
                    ) ||
                    normalizeText(
                        title.description
                    ).includes(normalizedSearch)
                );
            });
        }

        if (statusFilter === "active") {
            result = result.filter(
                (title) =>
                    title.isActive &&
                    !title.isDeleted
            );
        }

        if (statusFilter === "passive") {
            result = result.filter(
                (title) =>
                    !title.isActive &&
                    !title.isDeleted
            );
        }

        if (usageFilter === "used") {
            result = result.filter(
                (title) =>
                    (title.employeeCount ?? 0) > 0
            );
        }

        if (usageFilter === "unused") {
            result = result.filter(
                (title) =>
                    (title.employeeCount ?? 0) === 0
            );
        }

        result.sort((first, second) => {
            let comparison = 0;

            if (sortBy === "name") {
                comparison = first.name.localeCompare(
                    second.name,
                    "tr"
                );
            }

            if (sortBy === "employeeCount") {
                comparison =
                    (first.employeeCount ?? 0) -
                    (second.employeeCount ?? 0);
            }

            if (sortBy === "status") {
                comparison =
                    Number(first.isActive) -
                    Number(second.isActive);
            }

            return sortDirection === "asc"
                ? comparison
                : -comparison;
        });

        return result;
    }, [
        titles,
        searchText,
        statusFilter,
        usageFilter,
        sortBy,
        sortDirection,
    ]);

    /*
     * Create mutation
     */

    const createMutation = useMutation({
        mutationFn: (
            request: CreateTitleRequest
        ) => titleService.create(request),

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["titles"],
            });

            toast.success(
                "Ünvan başarıyla oluşturuldu."
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
     * Form handlers
     */

    const updateForm = (
        field: keyof TitleFormState,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const resetForm = () => {
        setForm(createInitialForm());
        createMutation.reset();
    };

    const openCreateDrawer = () => {
        resetForm();
        setShowCreateDrawer(true);
    };

    const closeCreateDrawer = () => {
        if (createMutation.isPending) {
            return;
        }

        setShowCreateDrawer(false);
        resetForm();
    };

    const clearFilters = () => {
        setSearchText("");
        setStatusFilter("");
        setUsageFilter("");
        setSortBy("name");
        setSortDirection("asc");
    };

    const submitCreate = (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const trimmedName =
            form.name.trim();

        const trimmedDescription =
            form.description.trim();

        if (!trimmedName) {
            toast.warning(
                "Ünvan adı zorunludur."
            );

            return;
        }

        if (trimmedName.length > 100) {
            toast.warning(
                "Ünvan adı en fazla 100 karakter olabilir."
            );

            return;
        }

        if (
            trimmedDescription.length > 500
        ) {
            toast.warning(
                "Açıklama en fazla 500 karakter olabilir."
            );

            return;
        }

        const request: CreateTitleRequest = {
            name: trimmedName,
            description:
                trimmedDescription || null,
        };

        createMutation.mutate(request);
    };

    /*
     * DataTable columns
     */

    const columns: DataTableColumn<Title>[] = [
        {
            header: "Ünvan",
            render: (title) => (
                <div className="flex min-w-[220px] items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <BriefcaseBusiness size={20} />
                    </div>

                    <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900">
                            {title.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                            Ünvan #{title.id}
                        </p>
                    </div>
                </div>
            ),
            filter: null,
        },
        {
            header: "Açıklama",
            render: (title) => (
                <div className="min-w-[300px] max-w-[420px]">
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                        {title.description?.trim() ||
                            "Açıklama girilmemiş"}
                    </p>
                </div>
            ),
            filter: null,
        },
        {
            header: "Çalışan Sayısı",
            render: (title) => {
                const employeeCount =
                    title.employeeCount ?? 0;

                return (
                    <div className="min-w-[150px]">
                        <div className="flex items-center gap-2">
                            <Users
                                size={17}
                                className={
                                    employeeCount > 0
                                        ? "text-indigo-500"
                                        : "text-slate-300"
                                }
                            />

                            <span className="font-bold text-slate-800">
                                {employeeCount}
                            </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-400">
                            {employeeCount > 0
                                ? "çalışana atanmış"
                                : "henüz kullanılmıyor"}
                        </p>
                    </div>
                );
            },
            filter: null,
        },
        {
            header: "Kullanım",
            render: (title) => {
                const isUsed =
                    (title.employeeCount ?? 0) > 0;

                return (
                    <span
                        className={
                            isUsed
                                ? "inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                                : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500"
                        }
                    >
                        {isUsed
                            ? "Kullanılıyor"
                            : "Atanmamış"}
                    </span>
                );
            },
            filter: null,
        },
        {
            header: "Durum",
            render: (title) => (
                <ActiveStatusBadge
                    isActive={
                        title.isActive &&
                        !title.isDeleted
                    }
                />
            ),
            filter: null,
        },
    ];

    return (
        <div>
            <PageHeader
                title="Ünvan Yönetimi"
                moduleName="İnsan Kaynakları"
                description="Çalışanlara atanabilecek ünvanları oluşturun ve yönetin."
                rightContent={
                    <button
                        type="button"
                        onClick={openCreateDrawer}
                        className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white transition hover:bg-indigo-700"
                    >
                        <Plus size={18} />
                        Yeni Ünvan
                    </button>
                }
            />

            {titlesQuery.isError && (
                <ErrorBox
                    error={titlesQuery.error}
                />
            )}

            {/* <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                    title="Toplam Ünvan"
                    value={String(kpis.total)}
                    description="Sistemde tanımlı ünvanlar"
                    icon={
                        <BriefcaseBusiness
                            size={22}
                        />
                    }
                    accent="indigo"
                />

                <KpiCard
                    title="Aktif Ünvan"
                    value={String(kpis.active)}
                    description="Kullanıma açık ünvanlar"
                    icon={
                        <BadgeCheck size={22} />
                    }
                    accent="emerald"
                />

                <KpiCard
                    title="Kullanılan Ünvan"
                    value={String(kpis.used)}
                    description="En az bir çalışana atanmış"
                    icon={<Users size={22} />}
                    accent="blue"
                />

                <KpiCard
                    title="Atanmamış Ünvan"
                    value={String(kpis.unused)}
                    description="Henüz çalışana atanmamış"
                    icon={
                        <BriefcaseBusiness
                            size={22}
                        />
                    }
                    accent="amber"
                />
            </div> */}

            <Card className="mb-5 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[240px] flex-1">
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
                                placeholder="Ünvan adı veya açıklama ara..."
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 pr-10 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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

                    <div className="w-[170px]">
                        <SelectInput
                            label="Kullanım"
                            value={usageFilter}
                            onChange={setUsageFilter}
                            placeholder="Tümü"
                            options={[
                                {
                                    value: "used",
                                    label: "Kullanılan",
                                },
                                {
                                    value: "unused",
                                    label: "Atanmamış",
                                },
                            ]}
                        />
                    </div>

                    <div className="w-[180px]">
                        <SelectInput
                            label="Sırala"
                            value={sortBy}
                            onChange={setSortBy}
                            options={[
                                {
                                    value: "name",
                                    label: "Ünvan Adı",
                                },
                                {
                                    value: "employeeCount",
                                    label: "Çalışan Sayısı",
                                },
                                {
                                    value: "status",
                                    label: "Durum",
                                },
                            ]}
                        />
                    </div>

                    <div className="w-[130px]">
                        <SelectInput
                            label="Yön"
                            value={sortDirection}
                            onChange={setSortDirection}
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
                            titlesQuery.refetch()
                        }
                        disabled={
                            titlesQuery.isFetching
                        }
                        className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCcw
                            size={16}
                            className={
                                titlesQuery.isFetching
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        Yenile
                    </button>
                </div>
            </Card>

            <Card
                title={`Toplam ${filteredTitles.length} ünvan`}
            >
                <DataTable
                    columns={columns}
                    data={filteredTitles}
                    loading={
                        titlesQuery.isLoading
                    }
                    emptyText="Ünvan kaydı bulunamadı."
                    totalCount={
                        filteredTitles.length
                    }
                />
            </Card>

            <CreateDrawer
                open={showCreateDrawer}
                title="Yeni Ünvan"
                subtitle="Çalışanlara atanabilecek yeni bir ünvan oluşturun."
                onClose={closeCreateDrawer}
                widthClassName="w-[620px]"
            >
                {createMutation.isError && (
                    <ErrorBox
                        error={createMutation.error}
                    />
                )}

                <form
                    onSubmit={submitCreate}
                    className="space-y-5"
                >
                    <Card className="overflow-hidden">
                        <div className="border-b border-slate-100 p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                    <BriefcaseBusiness
                                        size={21}
                                    />
                                </div>

                                <div>
                                    <h3 className="font-bold text-slate-900">
                                        Ünvan Bilgileri
                                    </h3>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Ünvan adını ve açıklamasını girin.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5 p-5">
                            <TextInput
                                label="Ünvan Adı"
                                value={form.name}
                                onChange={(value) =>
                                    updateForm(
                                        "name",
                                        value
                                    )
                                }
                                placeholder="Örn. Yazılım Uzmanı"
                                required
                            />

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-slate-700">
                                        Açıklama
                                    </label>

                                    <span
                                        className={`text-xs ${form.description.length >
                                            500
                                            ? "font-semibold text-red-500"
                                            : "text-slate-400"
                                            }`}
                                    >
                                        {
                                            form.description
                                                .length
                                        }
                                        /500
                                    </span>
                                </div>

                                <textarea
                                    value={
                                        form.description
                                    }
                                    onChange={(event) =>
                                        updateForm(
                                            "description",
                                            event.target.value
                                        )
                                    }
                                    rows={6}
                                    placeholder="Ünvanın görev kapsamını veya açıklamasını yazın..."
                                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                />
                            </div>
                        </div>
                    </Card>

                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-indigo-600">
                                <Users size={18} />
                            </div>

                            <div>
                                <p className="text-sm font-bold text-indigo-900">
                                    Çalışan ataması
                                </p>

                                <p className="mt-1 text-sm leading-6 text-indigo-700">
                                    Oluşturulan ünvan daha sonra çalışan oluşturma ve düzenleme ekranlarında seçilebilir olacaktır.
                                </p>
                            </div>
                        </div>
                    </div>

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
                            className="h-11 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {createMutation.isPending
                                ? "Ünvan oluşturuluyor..."
                                : "Ünvanı Oluştur"}
                        </button>
                    </div>
                </form>
            </CreateDrawer>
        </div>
    );
}

/*
 * Local components
 */

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
    | "blue"
    | "amber";
}) {
    const accentClasses = {
        indigo:
            "bg-indigo-50 text-indigo-600",
        emerald:
            "bg-emerald-50 text-emerald-600",
        blue:
            "bg-blue-50 text-blue-600",
        amber:
            "bg-amber-50 text-amber-600",
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