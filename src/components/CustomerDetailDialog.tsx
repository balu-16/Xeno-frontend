import { useQuery } from "@tanstack/react-query";
import { Clock, Globe, MapPin, Monitor, ShoppingBag } from "lucide-react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CustomerDetailDialogProps {
  customerId: string | null;
  onClose: () => void;
}

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function CustomerDetailDialog({ customerId, onClose }: CustomerDetailDialogProps) {
  const customer = useQuery({
    queryKey: ["customer-detail", customerId],
    queryFn: () => api.customer(customerId!),
    enabled: !!customerId,
  });

  const loginLogs = useQuery({
    queryKey: ["customer-login-logs", customerId],
    queryFn: () => api.customerLoginLogs(customerId!),
    enabled: !!customerId,
  });

  return (
    <Dialog open={!!customerId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customer Details</DialogTitle>
          <DialogDescription>View customer profile, order history, and campaign activity.</DialogDescription>
        </DialogHeader>
        {customer.isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading...</div>
        ) : customer.error ? (
          <div className="py-12 text-center text-sm text-rose-600">Failed to load customer</div>
        ) : customer.data ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 grid place-items-center text-white text-lg font-semibold">
                {customer.data.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{customer.data.name}</h3>
                <p className="text-sm text-slate-500">{customer.data.email}</p>
                <p className="text-xs text-slate-400">{customer.data.phone}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  City
                </div>
                <div className="mt-1 font-semibold text-sm">
                  {String((customer.data.metadata as Record<string, unknown>).city ?? "Unknown")}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Orders
                </div>
                <div className="mt-1 font-semibold text-sm">{customer.data.orders.length}</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Joined
                </div>
                <div className="mt-1 font-semibold text-sm">
                  {new Date(customer.data.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Globe className="h-3.5 w-3.5" />
                  Preferred
                </div>
                <div className="mt-1 font-semibold text-sm capitalize">
                  {String((customer.data.metadata as Record<string, unknown>).preferredCategory ?? "N/A")}
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            {customer.data.orders.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Recent Orders</div>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100">
                        <th className="text-left px-4 py-2 font-medium">Order ID</th>
                        <th className="text-right px-4 py-2 font-medium">Amount</th>
                        <th className="text-right px-4 py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.data.orders.slice(0, 10).map((order) => (
                        <tr key={order.id} className="border-b border-slate-50">
                          <td className="px-4 py-2 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                          <td className="px-4 py-2 text-right">{currency.format(Number(order.amount))}</td>
                          <td className="px-4 py-2 text-right text-slate-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Campaign Activity */}
            {customer.data.campaignEvents.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Campaign Activity</div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {customer.data.campaignEvents.slice(0, 15).map((event) => (
                    <div key={event.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{event.campaign.name}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-600">{event.type.replace("Message", "")}</span>
                      </div>
                      <span className="text-slate-400">{new Date(event.occurredAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Login Logs */}
            <div>
              <div className="text-xs text-slate-500 mb-2">Login History</div>
              {loginLogs.isLoading ? (
                <div className="py-6 text-center text-sm text-slate-500">Loading login logs...</div>
              ) : loginLogs.data && loginLogs.data.length > 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 border-b border-slate-100">
                        <th className="text-left px-4 py-2 font-medium">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> Time</div>
                        </th>
                        <th className="text-left px-4 py-2 font-medium">
                          <div className="flex items-center gap-1"><Globe className="h-3 w-3" /> IP Address</div>
                        </th>
                        <th className="text-left px-4 py-2 font-medium">
                          <div className="flex items-center gap-1"><Monitor className="h-3 w-3" /> Device</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loginLogs.data.map((log) => (
                        <tr key={log.id} className="border-b border-slate-50">
                          <td className="px-4 py-2 text-slate-700">
                            {new Date(log.loggedInAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 font-mono text-xs text-slate-600">
                            {log.ip ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-500 truncate max-w-[200px]">
                            {log.userAgent ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-6 text-center text-sm text-slate-400 bg-slate-50 rounded-lg">
                  No login history recorded
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
