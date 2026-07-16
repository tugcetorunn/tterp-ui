import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  BadgeDollarSign,
  Banknote,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ClipboardList,
  Columns3,
  CreditCard,
  Eye,
  FileText,
  List as ListIcon,
  Plus,
  Printer,
  ReceiptText,
  RefreshCcw,
  Search,
  ShoppingCart,
  Trash2,
  Truck,
  UserRound,
  Warehouse as WarehouseIcon,
  X,
} from "lucide-react";

import PageHeader from "../components/page/PageHeader";
import Card from "../components/page/Card";
import DataTable from "../components/table/DataTable";
import type { DataTableColumn } from "../components/table/DataTable";
import TextInput from "../components/form/TextInput";
import SelectInput from "../components/form/SelectInput";
import MultiSelect from "../components/form/MultiSelect";
import CreateDrawer from "../components/drawer/CreateDrawer";
import DetailDrawer from "../components/drawer/DetailDrawer";
import DrawerTabs from "../components/drawer/DrawerTabs";
import ConfirmDialog from "../components/common/ConfirmDialog";
import StatusBadge from "../components/common/StatusBadge";
import ActiveStatusBadge from "../components/common/ActiveStatusBadge";

import {
  orderService,
} from "../services/orderService";
import type {
  AllowedWorkflowTransition,
  Order,
  OrderItem,
  WorkflowHistory,
} from "../services/orderService";

import {
  paymentService,
} from "../services/paymentService";
import type {
  Payment,
} from "../services/paymentService";

import {
  invoiceService,
} from "../services/invoiceService";
import type {
  Invoice,
} from "../services/invoiceService";

import { customerService } from "../services/customerService";
import { productService } from "../services/productService";
import { warehouseService } from "../services/warehouseService";

import { useParameterOptions } from "../hooks/useParameterOptions";
import { getErrorMessage } from "../utils/apiResponse";

type ViewMode = "list" | "board";

type OrderDetailTab =
  | "general"
  | "products"
  | "workflow"
  | "payments"
  | "invoices";

interface CreateStockAllocationLine {
  rowId: string;
  warehouseId: string;
  quantity: string;
}

interface CreateOrderLine {
  rowId: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
  allocations: CreateStockAllocationLine[];
  expanded: boolean;
}

interface TransitionTarget {
  order: Order;
  transition: AllowedWorkflowTransition;
}

interface PaymentTarget {
  order: Order;
}

interface InvoiceTarget {
  order: Order;
}

interface SelectOption {
  label: string;
  value: string;
}

function createEmptyAllocation(): CreateStockAllocationLine {
  return {
    rowId: crypto.randomUUID(),
    warehouseId: "",
    quantity: "",
  };
}

function createEmptyOrderLine(): CreateOrderLine {
  return {
    rowId: crypto.randomUUID(),
    productId: "",
    quantity: "1",
    unitPrice: "",
    discount: "0",
    taxRate: "0",
    allocations: [createEmptyAllocation()],
    expanded: true,
  };
}

export default function OrdersPage() {
  const queryClient = useQueryClient();

  const orderStatuses = useParameterOptions("OrderStatus", 1);
  const paymentStatuses = useParameterOptions("PaymentStatus", 1);
  const paymentTypes = useParameterOptions("PaymentType", 1);
  const currencies = useParameterOptions("Currency", 1);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeDetailTab, setActiveDetailTab] =
    useState<OrderDetailTab>("general");

  const [transitionTarget, setTransitionTarget] =
    useState<TransitionTarget | null>(null);
  const [transitionNote, setTransitionNote] = useState("");

  const [paymentTarget, setPaymentTarget] =
    useState<PaymentTarget | null>(null);
  const [paymentDate, setPaymentDate] = useState(todayInput());
  const [paymentType, setPaymentType] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const [invoiceTarget, setInvoiceTarget] =
    useState<InvoiceTarget | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(todayInput());
  const [invoiceCurrency, setInvoiceCurrency] = useState("");

  // Create form
  const [orderDate, setOrderDate] = useState(todayInput());
  const [customerId, setCustomerId] = useState("");
  const [orderDiscount, setOrderDiscount] = useState("0");
  const [createLines, setCreateLines] = useState<CreateOrderLine[]>([
    createEmptyOrderLine(),
  ]);

  // Filters
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedStatusCodes, setSelectedStatusCodes] = useState<string[]>([]);
  const [selectedPaymentStatusCodes, setSelectedPaymentStatusCodes] =
    useState<string[]>([]);
  const [selectedWarehouseIds, setSelectedWarehouseIds] =
    useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("orderDate");
  const [sortDirection, setSortDirection] = useState("desc");

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: () =>
      orderService.getList({
        isDeleted: false,
      }),
  });

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: customerService.getList,
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: productService.getList,
  });

  const warehousesQuery = useQuery({
    queryKey: ["warehouses"],
    queryFn: warehouseService.getList,
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", selectedOrder?.id],
    queryFn: () =>
      paymentService.getList({
        orderId: selectedOrder!.id,
        isDeleted: false,
      }),
    enabled: Boolean(selectedOrder),
  });

  const invoicesQuery = useQuery({
    queryKey: ["invoices", selectedOrder?.id],
    queryFn: () =>
      invoiceService.getList({
        orderId: selectedOrder!.id,
        isDeleted: false,
      }),
    enabled: Boolean(selectedOrder),
  });

  const orders = ordersQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const warehouses = warehousesQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];
  const invoices = invoicesQuery.data ?? [];

  const customerOptions = useMemo<SelectOption[]>(
    () =>
      customers
        .filter((item) => item.isActive)
        .map((item) => ({
          label:
            item.companyName ??
            [item.firstName, item.lastName].filter(Boolean).join(" ") ??
            `Müşteri #${item.id}`,
          value: String(item.id),
        })),
    [customers]
  );

  const productOptions = useMemo<SelectOption[]>(
    () =>
      products
        .filter((item) => item.isActive)
        .map((item) => ({
          label: `${item.name} (${item.code})`,
          value: String(item.id),
        })),
    [products]
  );

  const warehouseOptions = useMemo<SelectOption[]>(
    () =>
      warehouses
        .filter((item) => item.isActive)
        .map((item) => ({
          label: `${item.name} (${item.code})`,
          value: String(item.id),
        })),
    [warehouses]
  );

  const createMutation = useMutation({
    mutationFn: orderService.create,
    onSuccess: async () => {
      closeCreateDrawer();

      await queryClient.invalidateQueries({
        queryKey: ["orders"],
      });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: orderService.changeStatus,
    onSuccess: async (_, variables) => {
      const changedOrderId = variables.orderId;

      clearTransitionDialog();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["orders"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["product-stocks"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["product-stock-movements"],
        }),
      ]);

      const result = await ordersQuery.refetch();
      const updated =
        result.data?.find((order) => order.id === changedOrderId) ?? null;

      setSelectedOrder(updated);
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: paymentService.create,
    onSuccess: async (_, variables) => {
      closePaymentDialog();

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["payments", variables.orderId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["orders"],
        }),
      ]);

      const result = await ordersQuery.refetch();
      const updated =
        result.data?.find((order) => order.id === variables.orderId) ?? null;

      setSelectedOrder(updated);
      setActiveDetailTab("payments");
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: invoiceService.create,
    onSuccess: async (_, variables) => {
      closeInvoiceDialog();

      if (variables.orderId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["invoices", variables.orderId],
          }),
          queryClient.invalidateQueries({
            queryKey: ["orders"],
          }),
        ]);

        setActiveDetailTab("invoices");
      }
    },
  });

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchText.trim()) {
      const search = searchText
        .trim()
        .toLocaleLowerCase("tr-TR");

      result = result.filter((order) => {
        const orderNumber = getOrderNumber(order.id).toLocaleLowerCase("tr-TR");

        return (
          orderNumber.includes(search) ||
          order.customerName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          order.employeeName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          order.orderStatusName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          order.paymentStatusName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          order.shippingStatusName
            ?.toLocaleLowerCase("tr-TR")
            .includes(search) ||
          order.orderItems.some(
            (item) =>
              item.productName
                ?.toLocaleLowerCase("tr-TR")
                .includes(search) ||
              item.productCode
                ?.toLocaleLowerCase("tr-TR")
                .includes(search)
          )
        );
      });
    }

    if (selectedCustomerIds.length > 0) {
      result = result.filter((order) =>
        selectedCustomerIds.includes(String(order.customerId))
      );
    }

    if (selectedProductIds.length > 0) {
      result = result.filter((order) =>
        order.orderItems.some((item) =>
          selectedProductIds.includes(String(item.productId))
        )
      );
    }

    if (selectedStatusCodes.length > 0) {
      result = result.filter(
        (order) =>
          order.orderStatus != null &&
          selectedStatusCodes.includes(String(order.orderStatus))
      );
    }

    if (selectedPaymentStatusCodes.length > 0) {
      result = result.filter(
        (order) =>
          order.paymentStatus != null &&
          selectedPaymentStatusCodes.includes(String(order.paymentStatus))
      );
    }

    if (selectedWarehouseIds.length > 0) {
      result = result.filter((order) =>
        order.orderItems.some((item) =>
          item.stockLocations.some((stock) =>
            selectedWarehouseIds.includes(String(stock.warehouseId))
          )
        )
      );
    }

    result.sort((first, second) => {
      let compare = 0;

      if (sortBy === "orderDate") {
        compare =
          new Date(first.orderDate).getTime() -
          new Date(second.orderDate).getTime();
      }

      if (sortBy === "customerName") {
        compare = (first.customerName ?? "").localeCompare(
          second.customerName ?? "",
          "tr"
        );
      }

      if (sortBy === "finalAmount") {
        compare = first.finalAmount - second.finalAmount;
      }

      if (sortBy === "itemCount") {
        compare = first.orderItems.length - second.orderItems.length;
      }

      return sortDirection === "asc" ? compare : -compare;
    });

    return result;
  }, [
    orders,
    searchText,
    selectedCustomerIds,
    selectedProductIds,
    selectedStatusCodes,
    selectedPaymentStatusCodes,
    selectedWarehouseIds,
    sortBy,
    sortDirection,
  ]);

  const kpis = useMemo(() => {
    const today = todayInput();

    const todayOrders = orders.filter(
      (order) => order.orderDate.slice(0, 10) === today
    );

    const unpaidOrders = orders.filter(
      (order) =>
        !isPaidStatus(order.paymentStatusName ?? "")
    );

    const pendingOrders = orders.filter((order) => {
      const status = normalize(order.orderStatusShortCode ?? order.orderStatusName);

      return (
        status.includes("pending") ||
        status.includes("planned") ||
        status.includes("bekliyor") ||
        status.includes("planlandi")
      );
    });

    const preparingOrders = orders.filter((order) => {
      const status = normalize(order.orderStatusShortCode ?? order.orderStatusName);

      return (
        status.includes("preparing") ||
        status.includes("processing") ||
        status.includes("hazirlaniyor")
      );
    });

    const todayRevenue = todayOrders.reduce(
      (total, order) => total + order.finalAmount,
      0
    );

    const totalRevenue = orders.reduce(
      (total, order) => total + order.finalAmount,
      0
    );

    return {
      total: orders.length,
      today: todayOrders.length,
      unpaid: unpaidOrders.length,
      pending: pendingOrders.length,
      preparing: preparingOrders.length,
      todayRevenue,
      totalRevenue,
    };
  }, [orders]);

  const statusColumns = useMemo(() => {
    if (orderStatuses.data?.length) {
      return [...orderStatuses.data]
        .sort(
          (first, second) =>
            (first.displayOrder ?? 0) - (second.displayOrder ?? 0)
        )
        .map((status) => ({
          code: Number(status.paramCode),
          name: status.paramValue,
          shortCode: status.shortCode,
          badgeColor: status.badgeColor,
        }));
    }

    const map = new Map<
      number,
      {
        code: number;
        name: string;
        shortCode?: string | null;
        badgeColor?: string | null;
      }
    >();

    orders.forEach((order) => {
      if (order.orderStatus != null) {
        map.set(order.orderStatus, {
          code: order.orderStatus,
          name: order.orderStatusName ?? "Tanımsız",
          shortCode: order.orderStatusShortCode,
          badgeColor: order.orderStatusBadgeColor,
        });
      }
    });

    return Array.from(map.values()).sort(
      (first, second) => first.code - second.code
    );
  }, [orders, orderStatuses.data]);

  const createTotals = useMemo(() => {
    const items = createLines.map((line) => {
      const quantity = toNumber(line.quantity);
      const unitPrice = toNumber(line.unitPrice);
      const discount = toNumber(line.discount);
      const taxRate = toNumber(line.taxRate);

      const gross = quantity * unitPrice;
      const discounted = Math.max(0, gross - discount);
      const tax = discounted * (taxRate / 100);

      return {
        gross,
        discount,
        tax,
        final: discounted + tax,
      };
    });

    const gross = items.reduce((sum, item) => sum + item.gross, 0);
    const lineDiscount = items.reduce((sum, item) => sum + item.discount, 0);
    const tax = items.reduce((sum, item) => sum + item.tax, 0);
    const orderLevelDiscount = toNumber(orderDiscount);
    const final = Math.max(0, gross - lineDiscount - orderLevelDiscount + tax);

    return {
      gross,
      lineDiscount,
      orderLevelDiscount,
      tax,
      final,
      productCount: createLines.filter((line) => line.productId).length,
      warehouseCount: new Set(
        createLines.flatMap((line) =>
          line.allocations
            .filter((allocation) => allocation.warehouseId)
            .map((allocation) => allocation.warehouseId)
        )
      ).size,
    };
  }, [createLines, orderDiscount]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const openDetail = (order: Order, tab: OrderDetailTab = "general") => {
    setSelectedOrder(order);
    setActiveDetailTab(tab);
  };

  const closeDetail = () => {
    setSelectedOrder(null);
    setActiveDetailTab("general");
  };

  const clearFilters = () => {
    setSelectedCustomerIds([]);
    setSelectedProductIds([]);
    setSelectedStatusCodes([]);
    setSelectedPaymentStatusCodes([]);
    setSelectedWarehouseIds([]);
    setSearchText("");
    setSortBy("orderDate");
    setSortDirection("desc");
  };

  const resetCreateForm = () => {
    setOrderDate(todayInput());
    setCustomerId("");
    setOrderDiscount("0");
    setCreateLines([createEmptyOrderLine()]);
  };

  const closeCreateDrawer = () => {
    setShowCreateDrawer(false);
    resetCreateForm();
    createMutation.reset();
  };

  const addOrderLine = () => {
    setCreateLines((previous) => [...previous, createEmptyOrderLine()]);
  };

  const removeOrderLine = (rowId: string) => {
    setCreateLines((previous) => {
      const result = previous.filter((line) => line.rowId !== rowId);

      return result.length > 0 ? result : [createEmptyOrderLine()];
    });
  };

  const updateOrderLine = (
    rowId: string,
    field: keyof Omit<CreateOrderLine, "rowId" | "allocations">,
    value: string | boolean
  ) => {
    setCreateLines((previous) =>
      previous.map((line) =>
        line.rowId === rowId
          ? {
              ...line,
              [field]: value,
            }
          : line
      )
    );
  };

  const addAllocation = (lineId: string) => {
    setCreateLines((previous) =>
      previous.map((line) =>
        line.rowId === lineId
          ? {
              ...line,
              allocations: [...line.allocations, createEmptyAllocation()],
            }
          : line
      )
    );
  };

  const removeAllocation = (lineId: string, allocationId: string) => {
    setCreateLines((previous) =>
      previous.map((line) => {
        if (line.rowId !== lineId) {
          return line;
        }

        const result = line.allocations.filter(
          (allocation) => allocation.rowId !== allocationId
        );

        return {
          ...line,
          allocations: result.length > 0 ? result : [createEmptyAllocation()],
        };
      })
    );
  };

  const updateAllocation = (
    lineId: string,
    allocationId: string,
    field: "warehouseId" | "quantity",
    value: string
  ) => {
    setCreateLines((previous) =>
      previous.map((line) =>
        line.rowId === lineId
          ? {
              ...line,
              allocations: line.allocations.map((allocation) =>
                allocation.rowId === allocationId
                  ? {
                      ...allocation,
                      [field]: value,
                    }
                  : allocation
              ),
            }
          : line
      )
    );
  };

  const submitCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!customerId || !orderDate) {
      return;
    }

    const validLines = createLines.filter(
      (line) =>
        line.productId &&
        toNumber(line.quantity) > 0 &&
        line.allocations.some(
          (allocation) =>
            allocation.warehouseId && toNumber(allocation.quantity) > 0
        )
    );

    if (validLines.length === 0) {
      return;
    }

    createMutation.mutate({
      orderDate: `${orderDate}T00:00:00`,
      customerId: Number(customerId),
      discount: toNumber(orderDiscount),
      orderItems: validLines.map((line) => ({
        productId: Number(line.productId),
        quantity: toNumber(line.quantity),
        unitPrice: toNumber(line.unitPrice),
        discount: toNumber(line.discount),
        stockAllocations: line.allocations
          .filter(
            (allocation) =>
              allocation.warehouseId && toNumber(allocation.quantity) > 0
          )
          .map((allocation) => ({
            warehouseId: Number(allocation.warehouseId),
            quantityFromWarehouse: toNumber(allocation.quantity),
          })),
      })),
    });
  };

  const requestTransition = (
    order: Order,
    transition: AllowedWorkflowTransition
  ) => {
    setTransitionTarget({
      order,
      transition,
    });
    setTransitionNote("");
  };

  const clearTransitionDialog = () => {
    setTransitionTarget(null);
    setTransitionNote("");
    changeStatusMutation.reset();
  };

  const submitTransition = () => {
    if (!transitionTarget) {
      return;
    }

    changeStatusMutation.mutate({
      orderId: transitionTarget.order.id,
      targetStatusCode: transitionTarget.transition.targetStatusCode,
      note: transitionNote.trim() || null,
    });
  };

  const openPaymentDialog = (order: Order) => {
    setPaymentTarget({ order });
    setPaymentDate(todayInput());
    setPaymentType("");
    setPaymentStatus("");
    setPaymentAmount("");
    setPaymentCurrency(String(order.currency));
    setPaymentNote("");
  };

  const closePaymentDialog = () => {
    setPaymentTarget(null);
    setPaymentDate(todayInput());
    setPaymentType("");
    setPaymentStatus("");
    setPaymentAmount("");
    setPaymentCurrency("");
    setPaymentNote("");
    createPaymentMutation.reset();
  };

  const submitPayment = () => {
    if (
      !paymentTarget ||
      !paymentDate ||
      !paymentAmount ||
      !paymentCurrency
    ) {
      return;
    }

    createPaymentMutation.mutate({
      orderId: paymentTarget.order.id,
      paymentDate: `${paymentDate}T00:00:00`,
      paymentType: paymentType ? Number(paymentType) : null,
      paymentStatus: paymentStatus ? Number(paymentStatus) : null,
      amount: toNumber(paymentAmount),
      currency: Number(paymentCurrency),
      note: paymentNote.trim() || null,
    });
  };

  const openInvoiceDialog = (order: Order) => {
    setInvoiceTarget({ order });
    setInvoiceDate(todayInput());
    setInvoiceCurrency(String(order.currency));
  };

  const closeInvoiceDialog = () => {
    setInvoiceTarget(null);
    setInvoiceDate(todayInput());
    setInvoiceCurrency("");
    createInvoiceMutation.reset();
  };

  const submitInvoice = () => {
    if (!invoiceTarget || !invoiceDate || !invoiceCurrency) {
      return;
    }

    createInvoiceMutation.mutate({
      orderId: invoiceTarget.order.id,
      invoiceDate: `${invoiceDate}T00:00:00`,
      currency: Number(invoiceCurrency),
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const orderId = Number(event.active.id);
    const targetStatusCode = Number(event.over?.id);

    if (!orderId || !targetStatusCode) {
      return;
    }

    const order = orders.find((item) => item.id === orderId);

    if (!order || order.orderStatus === targetStatusCode) {
      return;
    }

    const transition = order.allowedTransitions?.find(
      (item) => item.targetStatusCode === targetStatusCode
    );

    if (!transition) {
      return;
    }

    requestTransition(order, transition);
  };

  const columns: DataTableColumn<Order>[] = [
    {
      header: "Sipariş",
      render: (order) => (
        <button
          type="button"
          onClick={() => openDetail(order)}
          className="text-left"
        >
          <p className="font-bold text-slate-900 hover:text-indigo-600">
            {getOrderNumber(order.id)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {formatDate(order.orderDate)}
          </p>
        </button>
      ),
      filter: null,
    },
    {
      header: "Müşteri",
      render: (order) => (
        <div className="min-w-[180px]">
          <p className="font-bold text-slate-900">
            {order.customerName ?? "-"}
          </p>

          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="rounded-full bg-violet-50 px-2 py-1 font-semibold text-violet-700">
              Kurumsal
            </span>

            <span className="text-amber-500">★★★★★</span>
          </div>
        </div>
      ),
      filter: null,
    },
    {
      header: "Durumlar",
      render: (order) => (
        <div className="flex min-w-[170px] flex-col items-start gap-2">
          <StatusBadge
            text={order.orderStatusName ?? "Tanımsız"}
            color={order.orderStatusBadgeColor ?? "neutral"}
          />

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {order.paymentStatusName ?? "Ödeme Tanımsız"}
          </span>

          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {order.shippingStatusName ?? "Teslimat Tanımsız"}
          </span>
        </div>
      ),
      filter: null,
    },
    {
      header: "Sipariş Özeti",
      render: (order) => (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShoppingCart size={15} className="text-indigo-500" />
            {order.orderItems.length} ürün
          </div>

          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <WarehouseIcon size={15} className="text-amber-500" />
            {getWarehouseCount(order)} depo
          </div>
        </div>
      ),
      filter: null,
    },
    {
      header: "Tutar",
      render: (order) => (
        <div className="min-w-[130px]">
          <p className="text-lg font-black text-slate-900">
            {formatMoney(order.finalAmount, order.currencyName)}
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            {order.currencyName ?? "Para birimi"}
          </p>
        </div>
      ),
      filter: null,
    },
    {
      header: "Satış Temsilcisi",
      render: (order) => (
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <UserRound size={16} />
          </div>

          <span className="font-medium text-slate-700">
            {order.employeeName ?? "-"}
          </span>
        </div>
      ),
      filter: null,
    },
    {
      header: "Kayıt",
      render: (order) => (
        <ActiveStatusBadge isActive={order.isActive} />
      ),
      filter: null,
    },
    {
      header: "İşlemler",
      render: (order) => (
        <div className="flex min-w-[210px] flex-wrap items-center gap-2">
          <button
            type="button"
            title="Detay"
            onClick={() => openDetail(order)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
          >
            <Eye size={16} />
          </button>

          <button
            type="button"
            onClick={() => openPaymentDialog(order)}
            className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Ödeme
          </button>

          <button
            type="button"
            onClick={() => openInvoiceDialog(order)}
            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
          >
            Fatura
          </button>
        </div>
      ),
      filter: null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sipariş Yönetimi"
        moduleName="Satış"
        description="Müşteriden teslimata kadar tüm sipariş sürecini tek ekrandan yönetin."
        rightContent={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                  viewMode === "list"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <ListIcon size={16} />
                Liste
              </button>

              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${
                  viewMode === "board"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Columns3 size={16} />
                Board
              </button>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <X size={18} />
              Temizle
            </button>

            <button
              type="button"
              onClick={() => setShowCreateDrawer(true)}
              className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              Yeni Sipariş
            </button>
          </div>
        }
      />

      {ordersQuery.isError && (
        <ErrorBox error={ordersQuery.error} />
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<ClipboardList size={22} />}
          title="Toplam Sipariş"
          value={String(kpis.total)}
          description={`${kpis.pending} bekleyen · ${kpis.preparing} hazırlanıyor`}
          accent="indigo"
        />

        <KpiCard
          icon={<CalendarDays size={22} />}
          title="Bugünkü Sipariş"
          value={String(kpis.today)}
          description="Bugün oluşturulan sipariş"
          accent="blue"
        />

        <KpiCard
          icon={<CircleDollarSign size={22} />}
          title="Ödenmeyen"
          value={String(kpis.unpaid)}
          description="Tahsilatı tamamlanmayan sipariş"
          accent="amber"
        />

        <KpiCard
          icon={<BadgeDollarSign size={22} />}
          title="Bugünkü Ciro"
          value={formatMoney(kpis.todayRevenue, "TRY")}
          description={`Toplam ciro ${formatMoney(kpis.totalRevenue, "TRY")}`}
          accent="emerald"
        />
      </div>

      <Card className="mb-5 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MultiSelect
            label="Müşteri"
            values={selectedCustomerIds}
            onChange={setSelectedCustomerIds}
            placeholder="Müşteri seçin"
            options={customerOptions}
          />

          <MultiSelect
            label="Ürün"
            values={selectedProductIds}
            onChange={setSelectedProductIds}
            placeholder="Ürün seçin"
            options={productOptions}
          />

          <MultiSelect
            label="Sipariş Durumu"
            values={selectedStatusCodes}
            onChange={setSelectedStatusCodes}
            placeholder="Durum seçin"
            options={orderStatuses.options}
          />

          <MultiSelect
            label="Ödeme Durumu"
            values={selectedPaymentStatusCodes}
            onChange={setSelectedPaymentStatusCodes}
            placeholder="Ödeme durumu seçin"
            options={paymentStatuses.options}
          />

          <MultiSelect
            label="Depo"
            values={selectedWarehouseIds}
            onChange={setSelectedWarehouseIds}
            placeholder="Depo seçin"
            options={warehouseOptions}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Arama
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute right-3 top-3 text-slate-400"
              />

              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Sipariş, müşteri, ürün..."
                className="h-11 w-full rounded-xl border border-slate-200 px-4 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <SelectInput
            label="Sırala"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { label: "Sipariş Tarihi", value: "orderDate" },
              { label: "Müşteri", value: "customerName" },
              { label: "Genel Toplam", value: "finalAmount" },
              { label: "Ürün Sayısı", value: "itemCount" },
            ]}
          />

          <SelectInput
            label="Sıralama"
            value={sortDirection}
            onChange={setSortDirection}
            options={[
              { label: "Artan", value: "asc" },
              { label: "Azalan", value: "desc" },
            ]}
          />
        </div>
      </Card>

      {viewMode === "list" && (
        <Card
          title={`Toplam ${filteredOrders.length} sipariş`}
          headerRight={
            <button
              type="button"
              onClick={() => ordersQuery.refetch()}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCcw size={17} />
              Yenile
            </button>
          }
        >
          <DataTable
            columns={columns}
            data={filteredOrders}
            loading={ordersQuery.isLoading}
            emptyText="Sipariş kaydı bulunamadı."
            totalCount={filteredOrders.length}
          />
        </Card>
      )}

      {viewMode === "board" && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-5">
            {statusColumns.map((status) => (
              <OrderBoardColumn
                key={status.code}
                statusCode={status.code}
                title={status.name}
                orders={filteredOrders.filter(
                  (order) => order.orderStatus === status.code
                )}
                onOpen={openDetail}
              />
            ))}
          </div>
        </DndContext>
      )}

      <CreateDrawer
        open={showCreateDrawer}
        title="Yeni Sipariş"
        subtitle="Müşteri, ürün, depo dağılımı ve sipariş özetini tek akışta tamamlayın."
        onClose={closeCreateDrawer}
        widthClassName="w-[1180px]"
      >
        {createMutation.isError && (
          <ErrorBox error={createMutation.error} />
        )}

        <form onSubmit={submitCreate} className="space-y-6">
          <FlowSection
            step="1"
            title="Müşteri ve Sipariş Bilgileri"
            description="Siparişin temel müşteri ve tarih bilgisini belirleyin."
            icon={<Building2 size={20} />}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SelectInput
                label="Müşteri"
                value={customerId}
                onChange={setCustomerId}
                placeholder="Müşteri seçin"
                options={customerOptions}
              />

              <TextInput
                label="Sipariş Tarihi"
                value={orderDate}
                onChange={setOrderDate}
                type="date"
                required
              />

              <TextInput
                label="Sipariş İskontosu"
                value={orderDiscount}
                onChange={setOrderDiscount}
                type="number"
                placeholder="0"
              />
            </div>
          </FlowSection>

          <FlowSection
            step="2"
            title="Ürünler"
            description="Sipariş kalemlerini, fiyatları ve vergi oranlarını ekleyin."
            icon={<ShoppingCart size={20} />}
            action={
              <button
                type="button"
                onClick={addOrderLine}
                className="flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                <Plus size={16} />
                Ürün Ekle
              </button>
            }
          >
            <div className="space-y-4">
              {createLines.map((line, index) => (
                <CreateProductCard
                  key={line.rowId}
                  line={line}
                  index={index}
                  productOptions={productOptions}
                  warehouseOptions={warehouseOptions}
                  productName={getOptionLabel(productOptions, line.productId)}
                  onUpdate={updateOrderLine}
                  onRemove={removeOrderLine}
                  onAddAllocation={addAllocation}
                  onRemoveAllocation={removeAllocation}
                  onUpdateAllocation={updateAllocation}
                />
              ))}
            </div>
          </FlowSection>

          <FlowSection
            step="3"
            title="Depo Kontrolü"
            description="Ürün miktarlarının depo dağılımlarıyla eşleştiğini kontrol edin."
            icon={<WarehouseIcon size={20} />}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {createLines.map((line) => {
                const ordered = toNumber(line.quantity);
                const allocated = line.allocations.reduce(
                  (sum, allocation) => sum + toNumber(allocation.quantity),
                  0
                );
                const valid = ordered > 0 && ordered === allocated;

                return (
                  <div
                    key={line.rowId}
                    className={`rounded-2xl border p-4 ${
                      valid
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-slate-900">
                          {getOptionLabel(productOptions, line.productId) ||
                            "Ürün seçilmedi"}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Sipariş: {ordered} · Depolara ayrılan: {allocated}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          valid
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {valid ? "Dengeli" : "Kontrol Gerekli"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </FlowSection>

          <FlowSection
            step="4"
            title="Sipariş Özeti"
            description="Kaydetmeden önce finansal ve operasyonel özeti inceleyin."
            icon={<ReceiptText size={20} />}
          >
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="font-bold text-slate-900">Operasyon Özeti</h4>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <SummaryMiniCard
                    label="Ürün Sayısı"
                    value={String(createTotals.productCount)}
                    icon={<ShoppingCart size={18} />}
                  />

                  <SummaryMiniCard
                    label="Kullanılan Depo"
                    value={String(createTotals.warehouseCount)}
                    icon={<WarehouseIcon size={18} />}
                  />
                </div>

                <div className="mt-4 space-y-3">
                  {createLines
                    .filter((line) => line.productId)
                    .map((line) => (
                      <div
                        key={line.rowId}
                        className="flex items-center justify-between rounded-xl bg-white px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-800">
                            {getOptionLabel(productOptions, line.productId)}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {line.quantity} adet · {line.allocations.length} depo satırı
                          </p>
                        </div>

                        <p className="font-bold text-slate-900">
                          {formatMoney(
                            toNumber(line.quantity) * toNumber(line.unitPrice),
                            "TRY"
                          )}
                        </p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 p-6 text-white">
                <p className="text-sm font-semibold text-slate-400">
                  Finansal Özet
                </p>

                <div className="mt-5 space-y-4">
                  <MoneyRow
                    label="Ara Toplam"
                    value={formatMoney(createTotals.gross, "TRY")}
                  />

                  <MoneyRow
                    label="Satır İskontosu"
                    value={`-${formatMoney(createTotals.lineDiscount, "TRY")}`}
                  />

                  <MoneyRow
                    label="Sipariş İskontosu"
                    value={`-${formatMoney(
                      createTotals.orderLevelDiscount,
                      "TRY"
                    )}`}
                  />

                  <MoneyRow
                    label="KDV"
                    value={formatMoney(createTotals.tax, "TRY")}
                  />

                  <div className="border-t border-slate-700 pt-4">
                    <MoneyRow
                      label="Genel Toplam"
                      value={formatMoney(createTotals.final, "TRY")}
                      strong
                    />
                  </div>
                </div>
              </div>
            </div>
          </FlowSection>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="h-14 w-full rounded-2xl bg-indigo-600 text-base font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {createMutation.isPending
              ? "Sipariş Kaydediliyor..."
              : "Siparişi Kaydet"}
          </button>
        </form>
      </CreateDrawer>

      <DetailDrawer
        open={Boolean(selectedOrder)}
        title={selectedOrder ? getOrderNumber(selectedOrder.id) : "Sipariş"}
        subtitle={selectedOrder?.customerName ?? undefined}
        onClose={closeDetail}
        widthClassName="w-[1040px]"
        headerRight={
          selectedOrder ? (
            <div className="flex flex-wrap justify-end gap-2">
              {selectedOrder.allowedTransitions?.map((transition) => (
                <button
                  key={transition.targetStatusCode}
                  type="button"
                  onClick={() => requestTransition(selectedOrder, transition)}
                  className="h-10 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {transition.buttonText ?? transition.actionName}
                </button>
              ))}
            </div>
          ) : null
        }
      >
        {selectedOrder && (
          <div className="space-y-5">
            <OrderHero order={selectedOrder} />

            <OrderFinancialSummary order={selectedOrder} />

            <DrawerTabs
              activeTab={activeDetailTab}
              onChange={(key) => setActiveDetailTab(key as OrderDetailTab)}
              tabs={[
                { key: "general", label: "Genel" },
                {
                  key: "products",
                  label: "Ürünler",
                  count: selectedOrder.orderItems.length,
                },
                {
                  key: "workflow",
                  label: "Workflow",
                  count: selectedOrder.workflowHistories.length,
                },
                {
                  key: "payments",
                  label: "Ödemeler",
                  count: payments.length,
                },
                {
                  key: "invoices",
                  label: "Faturalar",
                  count: invoices.length,
                },
              ]}
            />

            {activeDetailTab === "general" && (
              <OrderGeneralTab order={selectedOrder} />
            )}

            {activeDetailTab === "products" && (
              <OrderProductsTab items={selectedOrder.orderItems} />
            )}

            {activeDetailTab === "workflow" && (
              <OrderWorkflowTab order={selectedOrder} />
            )}

            {activeDetailTab === "payments" && (
              <OrderPaymentsTab
                order={selectedOrder}
                payments={payments}
                loading={paymentsQuery.isLoading}
                error={paymentsQuery.error}
                onAdd={() => openPaymentDialog(selectedOrder)}
              />
            )}

            {activeDetailTab === "invoices" && (
              <OrderInvoicesTab
                order={selectedOrder}
                invoices={invoices}
                loading={invoicesQuery.isLoading}
                error={invoicesQuery.error}
                onAdd={() => openInvoiceDialog(selectedOrder)}
              />
            )}
          </div>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(transitionTarget)}
        title={transitionTarget?.transition.actionName ?? "Durum Değiştir"}
        description={
          transitionTarget
            ? `${getOrderNumber(
                transitionTarget.order.id
              )} siparişi "${transitionTarget.transition.statusName}" durumuna geçirilecek.`
            : ""
        }
        confirmText={transitionTarget?.transition.actionName ?? "Onayla"}
        cancelText="İptal"
        loading={changeStatusMutation.isPending}
        variant="primary"
        onCancel={clearTransitionDialog}
        onConfirm={submitTransition}
      >
        {changeStatusMutation.isError && (
          <ErrorBox error={changeStatusMutation.error} />
        )}

        <TextInput
          label="İşlem Notu"
          value={transitionNote}
          onChange={setTransitionNote}
          placeholder="İsteğe bağlı açıklama..."
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(paymentTarget)}
        title="Yeni Ödeme Kaydı"
        description={
          paymentTarget
            ? `${getOrderNumber(
                paymentTarget.order.id
              )} siparişi için ödeme kaydı oluşturun.`
            : ""
        }
        confirmText="Ödemeyi Kaydet"
        cancelText="İptal"
        loading={createPaymentMutation.isPending}
        variant="primary"
        onCancel={closePaymentDialog}
        onConfirm={submitPayment}
      >
        {createPaymentMutation.isError && (
          <ErrorBox error={createPaymentMutation.error} />
        )}

        {paymentTarget && (
          <div className="grid grid-cols-2 gap-3">
            <InfoTile
              label="Sipariş Toplamı"
              value={formatMoney(
                paymentTarget.order.finalAmount,
                paymentTarget.order.currencyName
              )}
            />

            <InfoTile
              label="Müşteri"
              value={paymentTarget.order.customerName ?? "-"}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Ödeme Tarihi"
            value={paymentDate}
            onChange={setPaymentDate}
            type="date"
            required
          />

          <TextInput
            label="Tutar"
            value={paymentAmount}
            onChange={setPaymentAmount}
            type="number"
            required
          />

          <SelectInput
            label="Ödeme Tipi"
            value={paymentType}
            onChange={setPaymentType}
            placeholder="Ödeme tipi seçin"
            options={paymentTypes.options}
          />

          <SelectInput
            label="Ödeme Durumu"
            value={paymentStatus}
            onChange={setPaymentStatus}
            placeholder="Durum seçin"
            options={paymentStatuses.options}
          />

          <div className="col-span-2">
            <SelectInput
              label="Para Birimi"
              value={paymentCurrency}
              onChange={setPaymentCurrency}
              placeholder="Para birimi seçin"
              options={currencies.options}
            />
          </div>
        </div>

        <TextInput
          label="Not"
          value={paymentNote}
          onChange={setPaymentNote}
          placeholder="Ödeme açıklaması..."
        />
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(invoiceTarget)}
        title="Fatura Oluştur"
        description={
          invoiceTarget
            ? `${getOrderNumber(
                invoiceTarget.order.id
              )} siparişi için fatura oluşturun.`
            : ""
        }
        confirmText="Faturayı Oluştur"
        cancelText="İptal"
        loading={createInvoiceMutation.isPending}
        variant="primary"
        onCancel={closeInvoiceDialog}
        onConfirm={submitInvoice}
      >
        {createInvoiceMutation.isError && (
          <ErrorBox error={createInvoiceMutation.error} />
        )}

        {invoiceTarget && (
          <div className="rounded-2xl bg-blue-50 p-4">
            <p className="text-xs font-semibold text-blue-500">
              Faturalandırılacak Tutar
            </p>

            <p className="mt-1 text-2xl font-black text-blue-800">
              {formatMoney(
                invoiceTarget.order.finalAmount,
                invoiceTarget.order.currencyName
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <TextInput
            label="Fatura Tarihi"
            value={invoiceDate}
            onChange={setInvoiceDate}
            type="date"
            required
          />

          <SelectInput
            label="Para Birimi"
            value={invoiceCurrency}
            onChange={setInvoiceCurrency}
            placeholder="Para birimi seçin"
            options={currencies.options}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

function OrderHero({ order }: { order: Order }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-300">
            Sipariş
          </p>

          <h2 className="mt-2 text-3xl font-black">
            {getOrderNumber(order.id)}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
              {order.customerName ?? "-"}
            </span>

            <StatusBadge
              text={order.orderStatusName ?? "Tanımsız"}
              color={order.orderStatusBadgeColor ?? "neutral"}
            />

            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-300">
              {order.paymentStatusName ?? "Ödeme Tanımsız"}
            </span>

            <span className="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-bold text-sky-300">
              {order.shippingStatusName ?? "Teslimat Tanımsız"}
            </span>
          </div>
        </div>

        <div className="grid min-w-[260px] grid-cols-2 gap-3">
          <HeroMetric
            label="Ürün"
            value={String(order.orderItems.length)}
            icon={<ShoppingCart size={18} />}
          />

          <HeroMetric
            label="Depo"
            value={String(getWarehouseCount(order))}
            icon={<WarehouseIcon size={18} />}
          />
        </div>
      </div>
    </div>
  );
}

function OrderFinancialSummary({ order }: { order: Order }) {
  const tax = getOrderTax(order);

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <FinanceCard
        label="Toplam"
        value={formatMoney(order.totalAmount, order.currencyName)}
        icon={<Banknote size={19} />}
      />

      <FinanceCard
        label="İskonto"
        value={formatMoney(order.discount, order.currencyName)}
        icon={<BadgeDollarSign size={19} />}
      />

      <FinanceCard
        label="KDV"
        value={formatMoney(tax, order.currencyName)}
        icon={<ReceiptText size={19} />}
      />

      <FinanceCard
        label="Genel Toplam"
        value={formatMoney(order.finalAmount, order.currencyName)}
        icon={<CircleDollarSign size={19} />}
        featured
      />
    </div>
  );
}

function OrderGeneralTab({ order }: { order: Order }) {
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card title="Sipariş Bilgileri">
        <div className="grid grid-cols-2 gap-5 p-5 text-sm">
          <DetailItem label="Sipariş No" value={getOrderNumber(order.id)} />
          <DetailItem label="Sipariş Tarihi" value={formatDate(order.orderDate)} />
          <DetailItem label="Müşteri" value={order.customerName ?? "-"} />
          <DetailItem label="Satış Temsilcisi" value={order.employeeName ?? "-"} />
          <DetailItem label="Para Birimi" value={order.currencyName ?? "-"} />
          <DetailItem
            label="Ürün / Depo"
            value={`${order.orderItems.length} ürün · ${getWarehouseCount(order)} depo`}
          />
        </div>
      </Card>

      <Card title="Süreç Durumları">
        <div className="space-y-4 p-5">
          <ProcessRow
            icon={<ClipboardList size={18} />}
            label="Sipariş"
            value={order.orderStatusName ?? "Tanımsız"}
          />

          <ProcessRow
            icon={<CreditCard size={18} />}
            label="Ödeme"
            value={order.paymentStatusName ?? "Tanımsız"}
          />

          <ProcessRow
            icon={<Truck size={18} />}
            label="Teslimat"
            value={order.shippingStatusName ?? "Tanımsız"}
          />
        </div>
      </Card>
    </div>
  );
}

function OrderProductsTab({ items }: { items: OrderItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-slate-900">
                  {item.productName ?? "Ürün"}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  {item.productCode ?? `Ürün #${item.productId}`}
                </p>
              </div>

              <span className="rounded-xl bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700">
                {item.quantity.toLocaleString("tr-TR")} Adet
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <ProductMetric
                label="Birim Fiyat"
                value={formatMoney(item.unitPrice, item.currencyName)}
              />

              <ProductMetric
                label="İskonto"
                value={formatMoney(item.discount, item.currencyName)}
              />

              <ProductMetric
                label="Vergi"
                value={`%${item.taxRate.toLocaleString("tr-TR")}`}
              />
            </div>
          </div>

          <div className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <WarehouseIcon size={17} className="text-amber-600" />
              <p className="font-bold text-slate-800">Depolar</p>
            </div>

            <div className="space-y-2">
              {item.stockLocations.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {stock.warehouseName ?? "-"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {stock.warehouseCode ?? "-"}
                    </p>
                  </div>

                  <span className="font-black text-slate-900">
                    {stock.quantity.toLocaleString("tr-TR")}
                  </span>
                </div>
              ))}

              {item.stockLocations.length === 0 && (
                <EmptyInline text="Depo dağılımı bulunmuyor." />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-950 px-5 py-4 text-white">
            <span className="font-semibold text-slate-300">Toplam</span>

            <span className="text-xl font-black">
              {formatMoney(item.totalPrice, item.currencyName)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}

function OrderWorkflowTab({ order }: { order: Order }) {
  const histories = [...(order.workflowHistories ?? [])].sort(
    (first, second) =>
      new Date(second.changeDate).getTime() -
      new Date(first.changeDate).getTime()
  );

  return (
    <div className="space-y-5">
      <Card title="Mevcut Durum">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5">
          <StatusBadge
            text={order.orderStatusName ?? "Tanımsız"}
            color={order.orderStatusBadgeColor ?? "neutral"}
          />

          <div className="flex flex-wrap gap-2">
            {order.allowedTransitions?.map((transition) => (
              <span
                key={transition.targetStatusCode}
                className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700"
              >
                {transition.actionName}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card title={`Workflow Geçmişi (${histories.length})`}>
        <div className="p-5">
          {histories.length > 0 ? (
            <div>
              {histories.map((history, index) => (
                <WorkflowTimelineItem
                  key={history.id}
                  history={history}
                  isLast={index === histories.length - 1}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardList size={24} />}
              title="Workflow geçmişi bulunmuyor"
              description="Sipariş durumu değiştikçe süreç adımları burada görünecek."
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function OrderPaymentsTab({
  order,
  payments,
  loading,
  error,
  onAdd,
}: {
  order: Order;
  payments: Payment[];
  loading: boolean;
  error: unknown;
  onAdd: () => void;
}) {
  const paid = payments
    .filter((payment) =>
      isPaidStatus(payment.paymentStatusName ?? "")
    )
    .reduce((sum, payment) => sum + payment.amount, 0);

  const remaining = Math.max(0, order.finalAmount - paid);
  const percentage =
    order.finalAmount > 0 ? Math.min(100, (paid / order.finalAmount) * 100) : 0;

  return (
    <div className="space-y-5">
      <Card
        title="Ödeme Özeti"
        headerRight={
          <button
            type="button"
            onClick={onAdd}
            className="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <Plus size={16} />
            Yeni Ödeme
          </button>
        }
      >
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <PaymentSummaryCard
              label="Sipariş Toplamı"
              value={formatMoney(order.finalAmount, order.currencyName)}
            />

            <PaymentSummaryCard
              label="Ödenen"
              value={formatMoney(paid, order.currencyName)}
              accent="emerald"
            />

            <PaymentSummaryCard
              label="Kalan"
              value={formatMoney(remaining, order.currencyName)}
              accent="amber"
            />
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-500">
                Tahsilat oranı
              </span>

              <span className="font-black text-slate-900">
                %{percentage.toFixed(0)}
              </span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {!!error && <ErrorBox error={error} />}

      {loading ? (
        <LoadingBox text="Ödemeler yükleniyor..." />
      ) : payments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {payments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CreditCard size={24} />}
          title="Ödeme kaydı bulunmuyor"
          description="Bu sipariş için henüz ödeme oluşturulmamış."
          action={
            <button
              type="button"
              onClick={onAdd}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
            >
              İlk Ödemeyi Ekle
            </button>
          }
        />
      )}
    </div>
  );
}

function OrderInvoicesTab({
  order,
  invoices,
  loading,
  error,
  onAdd,
}: {
  order: Order;
  invoices: Invoice[];
  loading: boolean;
  error: unknown;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        title="Faturalar"
        headerRight={
          <button
            type="button"
            onClick={onAdd}
            className="flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Fatura Oluştur
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          <InfoTile label="Sipariş" value={getOrderNumber(order.id)} />
          <InfoTile
            label="Faturalanabilir Tutar"
            value={formatMoney(order.finalAmount, order.currencyName)}
          />
          <InfoTile label="Fatura Sayısı" value={String(invoices.length)} />
        </div>
      </Card>

      {!!error && <ErrorBox error={error} />}

      {loading ? (
        <LoadingBox text="Faturalar yükleniyor..." />
      ) : invoices.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FileText size={24} />}
          title="Fatura bulunmuyor"
          description="Bu sipariş için henüz fatura oluşturulmamış."
          action={
            <button
              type="button"
              onClick={onAdd}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
            >
              Fatura Oluştur
            </button>
          }
        />
      )}
    </div>
  );
}

function PaymentCard({ payment }: { payment: Payment }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-black text-slate-900">
            {formatMoney(payment.amount, payment.currencyName)}
          </p>

          <p className="mt-2 font-bold text-slate-700">
            {payment.paymentTypeName ?? "Ödeme"}
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          {payment.paymentStatusName ?? "Tanımsız"}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarDays size={16} />
          {formatDate(payment.paymentDate)}
        </div>

        <span className="text-xs font-bold text-slate-400">
          #{payment.id}
        </span>
      </div>

      {payment.note && (
        <p className="mt-4 text-sm text-slate-600">{payment.note}</p>
      )}
    </article>
  );
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-black text-slate-900">
            {invoice.invoiceNumber}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {formatDate(invoice.invoiceDate)}
          </p>
        </div>

        <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
          {invoice.currencyName ?? "-"}
        </span>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
        <p className="text-xs font-semibold text-slate-400">Genel Toplam</p>

        <p className="mt-1 text-2xl font-black">
          {formatMoney(invoice.finalAmount, invoice.currencyName)}
        </p>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 text-sm font-bold text-blue-700 hover:bg-blue-100"
        >
          <FileText size={16} />
          PDF
        </button>

        <button
          type="button"
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-100 text-sm font-bold text-slate-700 hover:bg-slate-200"
        >
          <Printer size={16} />
          Yazdır
        </button>
      </div>
    </article>
  );
}

function OrderBoardColumn({
  statusCode,
  title,
  orders,
  onOpen,
}: {
  statusCode: number;
  title: string;
  orders: Order[];
  onOpen: (order: Order, tab?: OrderDetailTab) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusCode,
  });

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[680px] min-w-[340px] flex-1 rounded-3xl border p-4 transition ${
        isOver
          ? "border-indigo-300 bg-indigo-50"
          : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-black text-slate-800">{title}</h3>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 shadow-sm">
          {orders.length}
        </span>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <OrderBoardCard key={order.id} order={order} onOpen={onOpen} />
        ))}

        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm font-medium text-slate-400">
            Bu durumda sipariş yok.
          </div>
        )}
      </div>
    </section>
  );
}

function OrderBoardCard({
  order,
  onOpen,
}: {
  order: Order;
  onOpen: (order: Order, tab?: OrderDetailTab) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: order.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const visibleItems = order.orderItems.slice(0, 3);
  const extraCount = Math.max(0, order.orderItems.length - visibleItems.length);

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        isDragging ? "z-50 opacity-70 shadow-xl" : ""
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => onOpen(order)}
            className="text-left"
          >
            <p className="text-sm font-black text-indigo-600">
              {getOrderNumber(order.id)}
            </p>

            <p className="mt-2 text-lg font-black text-slate-900">
              {order.customerName ?? "-"}
            </p>
          </button>

          <ShoppingCart size={20} className="text-indigo-500" />
        </div>

        <p className="mt-4 text-2xl font-black text-slate-950">
          {formatMoney(order.finalAmount, order.currencyName)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-400">Ürün</p>
            <p className="mt-1 font-black text-slate-800">
              {order.orderItems.length}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-400">Depo</p>
            <p className="mt-1 font-black text-slate-800">
              {getWarehouseCount(order)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <span className="block rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
            {order.paymentStatusName ?? "Ödeme Tanımsız"}
          </span>

          <span className="block rounded-xl bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700">
            {order.shippingStatusName ?? "Teslimat Tanımsız"}
          </span>
        </div>

        <button
          type="button"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setExpanded((previous) => !previous)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {expanded ? "Ürünleri Gizle" : "Ürünleri Göster"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400">
            Ürünler
          </p>

          <div className="space-y-2">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => onOpen(order, "products")}
                className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left"
              >
                <span className="truncate text-sm font-semibold text-slate-700">
                  {item.productName ?? "-"}
                </span>

                <span className="ml-3 text-xs font-black text-slate-500">
                  {item.quantity}
                </span>
              </button>
            ))}

            {extraCount > 0 && (
              <p className="px-3 py-1 text-xs font-bold text-indigo-600">
                +{extraCount} ürün daha
              </p>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

function CreateProductCard({
  line,
  index,
  productOptions,
  warehouseOptions,
  productName,
  onUpdate,
  onRemove,
  onAddAllocation,
  onRemoveAllocation,
  onUpdateAllocation,
}: {
  line: CreateOrderLine;
  index: number;
  productOptions: SelectOption[];
  warehouseOptions: SelectOption[];
  productName: string;
  onUpdate: (
    rowId: string,
    field: keyof Omit<CreateOrderLine, "rowId" | "allocations">,
    value: string | boolean
  ) => void;
  onRemove: (rowId: string) => void;
  onAddAllocation: (lineId: string) => void;
  onRemoveAllocation: (lineId: string, allocationId: string) => void;
  onUpdateAllocation: (
    lineId: string,
    allocationId: string,
    field: "warehouseId" | "quantity",
    value: string
  ) => void;
}) {
  const lineTotal =
    toNumber(line.quantity) * toNumber(line.unitPrice) -
    toNumber(line.discount);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 bg-slate-50 px-5 py-4">
        <button
          type="button"
          onClick={() => onUpdate(line.rowId, "expanded", !line.expanded)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">
            {index + 1}
          </span>

          <div className="min-w-0">
            <p className="truncate font-black text-slate-900">
              {productName || "Yeni Ürün Kalemi"}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              {formatMoney(lineTotal, "TRY")}
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdate(line.rowId, "expanded", !line.expanded)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600"
          >
            {line.expanded ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>

          <button
            type="button"
            onClick={() => onRemove(line.rowId)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {line.expanded && (
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <SelectInput
                label="Ürün"
                value={line.productId}
                onChange={(value) => onUpdate(line.rowId, "productId", value)}
                placeholder="Ürün seçin"
                options={productOptions}
              />
            </div>

            <TextInput
              label="Miktar"
              value={line.quantity}
              onChange={(value) => onUpdate(line.rowId, "quantity", value)}
              type="number"
            />

            <TextInput
              label="Birim Fiyat"
              value={line.unitPrice}
              onChange={(value) => onUpdate(line.rowId, "unitPrice", value)}
              type="number"
            />

            <TextInput
              label="İskonto"
              value={line.discount}
              onChange={(value) => onUpdate(line.rowId, "discount", value)}
              type="number"
            />
          </div>

          <div className="max-w-[240px]">
            <TextInput
              label="Vergi Oranı (%)"
              value={line.taxRate}
              onChange={(value) => onUpdate(line.rowId, "taxRate", value)}
              type="number"
            />
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 font-black text-slate-900">
                  <WarehouseIcon size={17} className="text-amber-600" />
                  Depo Dağılımları
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Sipariş miktarını bir veya birden fazla depoya dağıtın.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onAddAllocation(line.rowId)}
                className="flex h-9 items-center gap-2 rounded-xl bg-amber-500 px-4 text-sm font-bold text-white hover:bg-amber-600"
              >
                <Plus size={15} />
                Depo Ekle
              </button>
            </div>

            <div className="space-y-3">
              {line.allocations.map((allocation) => (
                <div
                  key={allocation.rowId}
                  className="grid grid-cols-[1fr_180px_40px] gap-3"
                >
                  <SelectInput
                    value={allocation.warehouseId}
                    onChange={(value) =>
                      onUpdateAllocation(
                        line.rowId,
                        allocation.rowId,
                        "warehouseId",
                        value
                      )
                    }
                    placeholder="Depo seçin"
                    options={warehouseOptions}
                  />

                  <input
                    value={allocation.quantity}
                    onChange={(event) =>
                      onUpdateAllocation(
                        line.rowId,
                        allocation.rowId,
                        "quantity",
                        event.target.value
                      )
                    }
                    type="number"
                    placeholder="Miktar"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 outline-none focus:ring-2 focus:ring-amber-400"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      onRemoveAllocation(line.rowId, allocation.rowId)
                    }
                    className="flex h-11 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function FlowSection({
  step,
  title,
  description,
  icon,
  action,
  children,
}: {
  step: string;
  title: string;
  description: string;
  icon: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-black text-white">
            {step}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600">{icon}</span>
              <h3 className="text-lg font-black text-slate-900">{title}</h3>
            </div>

            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>
        </div>

        {action}
      </div>

      <div className="p-6">{children}</div>
    </section>
  );
}

function KpiCard({
  icon,
  title,
  value,
  description,
  accent,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  description: string;
  accent: "indigo" | "blue" | "amber" | "emerald";
}) {
  const styles = {
    indigo: "bg-indigo-50 text-indigo-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-2 text-xs font-medium text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${styles[accent]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

function FinanceCard({
  label,
  value,
  icon,
  featured = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        featured
          ? "border-indigo-200 bg-indigo-600 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          featured
            ? "bg-white/15 text-white"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {icon}
      </div>

      <p
        className={`mt-4 text-sm font-semibold ${
          featured ? "text-indigo-100" : "text-slate-500"
        }`}
      >
        {label}
      </p>

      <p
        className={`mt-1 text-xl font-black ${
          featured ? "text-white" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <div className="text-indigo-300">{icon}</div>
      <p className="mt-2 text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function ProductMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
    </div>
  );
}

function PaymentSummaryCard({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string;
  accent?: "slate" | "emerald" | "amber";
}) {
  const classes = {
    slate: "bg-slate-50 text-slate-900",
    emerald: "bg-emerald-50 text-emerald-800",
    amber: "bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-2xl p-5 ${classes[accent]}`}>
      <p className="text-xs font-bold opacity-60">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}

function ProcessRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-600">
          {icon}
        </div>

        <span className="font-semibold text-slate-600">{label}</span>
      </div>

      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}

function WorkflowTimelineItem({
  history,
  isLast,
}: {
  history: WorkflowHistory;
  isLast: boolean;
}) {
  return (
    <div className="relative flex gap-4 pb-6">
      {!isLast && (
        <div className="absolute left-[8px] top-5 h-full w-px bg-slate-200" />
      )}

      <div className="relative z-10 mt-1.5 h-4 w-4 shrink-0 rounded-full border-4 border-indigo-100 bg-indigo-600" />

      <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-black text-slate-900">
              {history.fromStatusName ?? "Başlangıç"}
              <span className="mx-2 text-slate-400">→</span>
              {history.toStatusName ?? "Tanımsız"}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              {history.employeeName ?? "Kullanıcı bilgisi yok"}
            </p>
          </div>

          <p className="text-xs font-semibold text-slate-400">
            {formatDateTime(history.changeDate)}
          </p>
        </div>

        {history.note && (
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
            {history.note}
          </p>
        )}
      </div>
    </div>
  );
}

function SummaryMiniCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="text-indigo-600">{icon}</div>
      <p className="mt-3 text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function MoneyRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-base font-black text-white"
            : "text-sm font-semibold text-slate-400"
        }
      >
        {label}
      </span>

      <span
        className={
          strong
            ? "text-2xl font-black text-white"
            : "font-bold text-slate-200"
        }
      >
        {value}
      </span>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-800">{value}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value}</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <p className="mt-4 font-black text-slate-700">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function EmptyInline({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm font-medium text-slate-400">
      {text}
    </div>
  );
}

function LoadingBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}

function ErrorBox({ error }: { error: unknown }) {
  return (
    <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
      {getErrorMessage(error)}
    </div>
  );
}

function getOrderNumber(id: number) {
  return `SO-${String(id).padStart(6, "0")}`;
}

function getWarehouseCount(order: Order) {
  return new Set(
    order.orderItems.flatMap((item) =>
      item.stockLocations.map((stock) => stock.warehouseId)
    )
  ).size;
}

function getOrderTax(order: Order) {
  return order.orderItems.reduce((sum, item) => {
    const base = Math.max(
      0,
      item.quantity * item.unitPrice - item.discount
    );

    return sum + base * (item.taxRate / 100);
  }, 0);
}

function getOptionLabel(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? "";
}

function formatMoney(value: number, currency?: string | null) {
  const normalizedCurrency = normalizeCurrency(currency);

  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString("tr-TR", {
      maximumFractionDigits: 2,
    })} ${currency ?? ""}`.trim();
  }
}

function normalizeCurrency(currency?: string | null) {
  const normalized = currency?.trim().toUpperCase();

  if (!normalized || normalized === "TL" || normalized === "₺") {
    return "TRY";
  }

  if (normalized.includes("TÜRK") || normalized.includes("LIRA")) {
    return "TRY";
  }

  if (normalized.includes("DOLAR")) {
    return "USD";
  }

  if (normalized.includes("EURO")) {
    return "EUR";
  }

  return normalized.length === 3 ? normalized : "TRY";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("tr-TR");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("tr-TR");
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string | number | null | undefined) {
  const result = Number(value);

  return Number.isFinite(result) ? result : 0;
}

function normalize(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function isPaidStatus(value: string) {
  const status = normalize(value);

  return (
    status === "paid" ||
    status === "completed" ||
    status === "tamamlandi" ||
    status === "odendi"
  );
}
