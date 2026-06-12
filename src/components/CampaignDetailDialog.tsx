import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  Mail,
  MessageSquare,
  Phone,
  Radio,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CampaignDetailDialogProps {
  campaignId: string | null;
  onClose: () => void;
}

const channelIcons: Record<string, typeof Mail> = {
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  SMS: Phone,
  RCS: Radio,
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  QUEUED: "bg-amber-100 text-amber-700",
  RUNNING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

export function CampaignDetailDialog({
  campaignId,
  onClose,
}: CampaignDetailDialogProps) {
  const campaign = useQuery({
    queryKey: ["campaign-detail", campaignId],
    queryFn: () => api.campaign(campaignId!),
    enabled: !!campaignId,
  });

  const ChannelIcon = channelIcons[campaign.data?.channel ?? "EMAIL"] ?? Mail;

  return (
    <Dialog open={!!campaignId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Details</DialogTitle>
          <DialogDescription>
            View campaign performance, analytics, and delivery status.
          </DialogDescription>
        </DialogHeader>
        {campaign.isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            Loading...
          </div>
        ) : campaign.error ? (
          <div className="py-12 text-center text-sm text-rose-600">
            Failed to load campaign
          </div>
        ) : campaign.data ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{campaign.data.name}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Created{" "}
                  {new Date(campaign.data.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColors[campaign.data.status] ?? statusColors.DRAFT}`}
              >
                {campaign.data.status}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ChannelIcon className="h-3.5 w-3.5" />
                  Channel
                </div>
                <div className="mt-1 font-semibold text-sm">
                  {campaign.data.channel}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5" />
                  Audience
                </div>
                <div className="mt-1 font-semibold text-sm">
                  {campaign.data.audienceSizeSnapshot.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Activity className="h-3.5 w-3.5" />
                  Segment
                </div>
                <div className="mt-1 font-semibold text-sm truncate">
                  {campaign.data.segment.name}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Launched
                </div>
                <div className="mt-1 font-semibold text-sm">
                  {campaign.data.launchedAt
                    ? new Date(campaign.data.launchedAt).toLocaleDateString()
                    : "Not yet"}
                </div>
              </div>
            </div>

            {/* Subject */}
            {campaign.data.subject && (
              <div>
                <div className="text-xs text-slate-500 mb-1">Subject</div>
                <div className="text-sm bg-slate-50 rounded-lg p-3">
                  {campaign.data.subject}
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <div className="text-xs text-slate-500 mb-1">Message</div>
              <div className="text-sm bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">
                {campaign.data.message}
              </div>
            </div>

            {/* Analytics */}
            {campaign.data.analytics && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Performance</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    ["Sent", campaign.data.analytics.totalSent],
                    ["Delivered", campaign.data.analytics.totalDelivered],
                    ["Opened", campaign.data.analytics.totalOpened],
                    ["Clicked", campaign.data.analytics.totalClicked],
                    ["Converted", campaign.data.analytics.totalConverted],
                    ["Failed", campaign.data.analytics.totalFailed],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="text-center bg-slate-50 rounded-lg p-2"
                    >
                      <div className="text-lg font-semibold">
                        {Number(value).toLocaleString()}
                      </div>
                      <div className="text-[10px] uppercase text-slate-400">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    ["Delivery Rate", campaign.data.analytics.deliveryRate],
                    ["Open Rate", campaign.data.analytics.openRate],
                    ["Click Rate", campaign.data.analytics.clickRate],
                    ["Conversion Rate", campaign.data.analytics.conversionRate],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="text-center bg-indigo-50 rounded-lg p-2"
                    >
                      <div className="text-lg font-semibold text-indigo-700">
                        {Number(value).toFixed(1)}%
                      </div>
                      <div className="text-[10px] uppercase text-indigo-400">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failures */}
            {campaign.data.failures && campaign.data.failures.length > 0 && (
              <div>
                <div className="text-xs text-slate-500 mb-2">Failures</div>
                <div className="space-y-2">
                  {campaign.data.failures.map((f) => (
                    <div
                      key={f.reason}
                      className="flex justify-between bg-rose-50 rounded-lg px-4 py-2 text-sm"
                    >
                      <span className="text-rose-800">{f.reason}</span>
                      <span className="font-semibold text-rose-900">
                        {f.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
