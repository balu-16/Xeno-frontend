import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, Download, Search, Tag, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CustomerDetailDialog } from "@/components/CustomerDetailDialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { TableSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import { downloadCSV } from "@/lib/utils";

export const Route = createFileRoute("/_app/customers")({
  head: () => ({ meta: [{ title: "Customers · Xeno Mini" }] }),
  component: Customers,
});

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function Customers() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Debounce search to avoid a network request on every keystroke
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 350);
  };

  const tagsQuery = useQuery({
    queryKey: ["customer-tags"],
    queryFn: () => api.customerTags(),
  });

  const query = useQuery({
    queryKey: ["customers", page, search, selectedTag],
    queryFn: () => api.customers(page, search, selectedTag || undefined),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Customers"
        subtitle="Searchable shopper profiles, orders, value, and behavioral metadata."
        action={
          query.data && query.data.data.length > 0 ? (
            <button
              onClick={() =>
                downloadCSV(
                  "customers.csv",
                  query.data!.data.map((c) => ({
                    Name: c.name,
                    Email: c.email,
                    Phone: c.phone,
                    City: c.metadata.city ?? "Unknown",
                    Tags: c.tags?.join(", ") ?? "",
                    Orders: c.orders,
                    "Lifetime Value": c.lifetimeValue,
                    "Last Activity": new Date(c.lastActivity).toLocaleDateString(),
                  })),
                )
              }
              className="h-9 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          ) : undefined
        }
      />
      <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchInput}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by name or email"
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-indigo-400"
            />
          </div>
          {tagsQuery.data && tagsQuery.data.length > 0 && (
            <div className="relative">
              <Tag className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={selectedTag}
                onChange={(event) => {
                  setSelectedTag(event.target.value);
                  setPage(1);
                }}
                className="h-10 pl-9 pr-8 rounded-lg bg-slate-50 border border-slate-200 text-sm outline-none focus:bg-white focus:border-indigo-400 appearance-none cursor-pointer"
              >
                <option value="">All Tags</option>
                {tagsQuery.data.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
          {selectedTag && (
            <button
              onClick={() => {
                setSelectedTag("");
                setPage(1);
              }}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-1.5 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
          <div className="ml-auto text-xs text-slate-500">
            {query.data?.meta.total.toLocaleString() ?? "—"} customers
          </div>
        </div>
        {query.isLoading ? (
          <TableSkeleton rows={8} />
        ) : query.error ? (
          <ErrorState error={query.error} retry={() => void query.refetch()} />
        ) : query.data!.data.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Try a different search term."
            illustration="customers"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="font-medium py-3 px-5">Customer</th>
                    <th className="font-medium py-3 px-5">Contact</th>
                    <th className="font-medium py-3 px-5">City</th>
                    <th className="font-medium py-3 px-5">Tags</th>
                    <th className="font-medium py-3 px-5 text-right">Orders</th>
                    <th className="font-medium py-3 px-5 text-right">
                      Lifetime Value
                    </th>
                    <th className="font-medium py-3 px-5">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data!.data.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer"
                      onClick={() => setSelectedCustomerId(customer.id)}
                    >
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center text-white text-xs font-semibold">
                            {customer.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="text-slate-700">{customer.email}</div>
                        <div className="text-xs text-slate-400">
                          {customer.phone}
                        </div>
                      </td>
                      <td className="py-3 px-5 text-slate-600">
                        {String(customer.metadata.city ?? "Unknown")}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-wrap gap-1">
                          {customer.tags && customer.tags.length > 0 ? (
                            customer.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">--</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-5 text-right tabular-nums">
                        {customer.orders}
                      </td>
                      <td className="py-3 px-5 text-right tabular-nums font-medium">
                        {currency.format(customer.lifetimeValue)}
                      </td>
                      <td className="py-3 px-5 text-slate-500">
                        {new Date(customer.lastActivity).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Page {query.data!.meta.page} of{" "}
                {Math.max(1, query.data!.meta.totalPages)}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page === 1}
                  className="h-9 px-3 rounded-lg border border-slate-200 text-sm flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((value) => value + 1)}
                  disabled={page >= query.data!.meta.totalPages}
                  className="h-9 px-3 rounded-lg border border-slate-200 text-sm flex items-center gap-1 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
        <Users className="h-3.5 w-3.5" />
        Customer data feeds segment rules, campaigns, attribution, and AI tools.
      </div>
      <CustomerDetailDialog
        customerId={selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
}
