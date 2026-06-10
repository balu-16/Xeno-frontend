import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Radio,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Channel } from "../lib/contracts";
import { toast } from "sonner";
import { CampaignDetailDialog } from "@/components/CampaignDetailDialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { TableSkeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import { downloadCSV } from "@/lib/utils";

export const Route = createFileRoute("/_app/campaigns")({
  validateSearch: (search: Record<string, unknown>) => ({
    segmentId:
      typeof search.segmentId === "string" ? search.segmentId : undefined,
  }),
  head: () => ({ meta: [{ title: "Campaigns · Xeno Mini" }] }),
  component: Campaigns,
});

const channels: Array<{
  value: Channel;
  label: string;
  icon: typeof Mail;
}> = [
  { value: "WHATSAPP", label: "WhatsApp", icon: MessageSquare },
  { value: "SMS", label: "SMS", icon: Phone },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "RCS", label: "RCS", icon: Radio },
];

const steps = ["Segment", "Channel", "Message", "Audience", "Launch"];

function Campaigns() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(Boolean(search.segmentId));
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [segmentId, setSegmentId] = useState(search.segmentId ?? "");
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [name, setName] = useState("New Campaign");
  const [subject, setSubject] = useState("A special offer for {{first_name}}");
  const [message, setMessage] = useState(
    "Hi {{first_name}}, we selected something special for you. Explore it today.",
  );
  const [draftId, setDraftId] = useState<string>();
  const [audienceSize, setAudienceSize] = useState<number>();
  const campaigns = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api.campaigns(),
  });
  const segments = useQuery({
    queryKey: ["segments"],
    queryFn: () => api.segments(),
  });
  const prepare = useMutation({
    mutationFn: async () => {
      const campaign = await api.createCampaign({
        name,
        segmentId,
        channel,
        subject: channel === "EMAIL" ? subject : undefined,
        message,
      });
      const preview = await api.previewCampaign(campaign.id);
      return { campaign, preview };
    },
    onSuccess: ({ campaign, preview }) => {
      setDraftId(campaign.id);
      setAudienceSize(preview.audienceSize);
      setStep(3);
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
  const launch = useMutation({
    mutationFn: () => api.launchCampaign(draftId!),
    onSuccess: async (result) => {
      toast.success(
        `Campaign queued for ${result.audienceSize.toLocaleString()} customers`,
      );
      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      await navigate({
        to: "/campaigns/$id",
        params: { id: result.campaignId },
        search: { segmentId: undefined },
      });
    },
  });
  const generateMessage = useMutation({
    mutationFn: async () => {
      const conversation = await api.createConversation(`Copy for ${name}`);
      return api.sendAIMessage(
        conversation.id,
        `Draft ${channel} campaign copy for "${name}" targeting the selected segment.`,
      );
    },
    onSuccess: (result) => {
      const output = result.toolResult as {
        subject?: unknown;
        message?: unknown;
      };
      if (typeof output.subject === "string") setSubject(output.subject);
      if (typeof output.message === "string") setMessage(output.message);
      else setMessage(result.response);
    },
  });

  useEffect(() => {
    if (search.segmentId) {
      setSegmentId(search.segmentId);
      setOpen(true);
    }
  }, [search.segmentId]);

  const reset = () => {
    setStep(0);
    setDraftId(undefined);
    setAudienceSize(undefined);
    setName("New Campaign");
    setSubject("A special offer for {{first_name}}");
    setMessage(
      "Hi {{first_name}}, we selected something special for you. Explore it today.",
    );
  };

  const continueWizard = () => {
    if (step === 2) {
      prepare.mutate();
      return;
    }
    if (step === 3) {
      setStep(4);
      return;
    }
    setStep((value) => Math.min(4, value + 1));
  };

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Campaigns"
        subtitle="Select an audience, compose a message, launch, and monitor the full lifecycle."
        action={
          <div className="flex items-center gap-2">
            {campaigns.data && campaigns.data.data.length > 0 && (
              <button
                onClick={() =>
                  downloadCSV(
                    "campaigns.csv",
                    campaigns.data!.data.map((c) => ({
                      Name: c.name,
                      Segment: c.segment.name,
                      Channel: c.channel,
                      Status: c.status,
                      Audience: c.audienceSizeSnapshot,
                      "Open Rate": c.analytics
                        ? `${c.analytics.openRate.toFixed(1)}%`
                        : "—",
                    })),
                  )
                }
                className="h-9 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center gap-2 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            )}
            <button
              onClick={() => {
                reset();
                setOpen(true);
              }}
              className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> Create campaign
            </button>
          </div>
        }
      />
      {campaigns.isLoading ? (
        <TableSkeleton rows={5} />
      ) : campaigns.error ? (
        <ErrorState
          error={campaigns.error}
          retry={() => void campaigns.refetch()}
        />
      ) : campaigns.data!.data.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create a campaign from a saved segment."
          illustration="campaigns"
        />
      ) : (
        <div className="bg-white border border-slate-200/70 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">Campaign</th>
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Channel</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Audience</th>
                <th className="px-5 py-3 font-medium text-right">Open Rate</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.data!.data.map((campaign) => (
                <tr
                  key={campaign.id}
                  className="border-b border-slate-50 hover:bg-slate-50/70 cursor-pointer"
                  onClick={() => setSelectedCampaignId(campaign.id)}
                >
                  <td className="px-5 py-4">
                    <span className="font-medium hover:text-indigo-600">
                      {campaign.name}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">
                    {campaign.segment.name}
                  </td>
                  <td className="px-5 py-4">{campaign.channel}</td>
                  <td className="px-5 py-4">
                    <Status value={campaign.status} />
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {campaign.audienceSizeSnapshot.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right tabular-nums">
                    {campaign.analytics
                      ? `${campaign.analytics.openRate.toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <div
        className={`fixed inset-0 z-50 grid place-items-center px-4 pointer-events-none transition-all ${open ? "opacity-100" : "opacity-0"}`}
      >
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Create campaign</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {steps[step]} · Step {step + 1} of 5
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-6 pt-5 flex gap-2">
            {steps.map((label, index) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1 rounded-full ${index <= step ? "bg-indigo-600" : "bg-slate-100"}`}
                />
                <div className="mt-1 text-[10px] text-slate-400 hidden sm:block">
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 min-h-[340px]">
            {step === 0 && (
              <div>
                <h3 className="font-medium">1. Select Segment</h3>
                <p className="text-sm text-slate-500 mt-1 mb-5">
                  Choose the saved audience this campaign will target.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {segments.data?.data.map((segment) => (
                    <button
                      key={segment.id}
                      onClick={() => setSegmentId(segment.id)}
                      className={`text-left rounded-xl border-2 p-4 ${
                        segmentId === segment.id
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="font-medium text-sm">{segment.name}</div>
                      <div className="text-xs text-slate-500 mt-1">
                        {segment.audienceSize.toLocaleString()} customers
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <div>
                <h3 className="font-medium">2. Select Channel</h3>
                <p className="text-sm text-slate-500 mt-1 mb-5">
                  Choose the simulated delivery channel.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {channels.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setChannel(value)}
                      className={`text-left rounded-xl border-2 p-4 ${
                        channel === value
                          ? "border-indigo-500 bg-indigo-50/50"
                          : "border-slate-200"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-indigo-600 mb-3" />
                      <div className="font-medium text-sm">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">
                      3. Generate or Write Message
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Create channel-appropriate content.
                    </p>
                  </div>
                  <button
                    onClick={() => generateMessage.mutate()}
                    className="h-9 px-3 rounded-lg border border-indigo-200 text-indigo-700 text-xs flex items-center gap-2"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {generateMessage.isPending
                      ? "Generating..."
                      : "Generate with AI"}
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Campaign name"
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm"
                  />
                  {channel === "EMAIL" && (
                    <input
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Subject"
                      className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm"
                    />
                  )}
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={6}
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm resize-none"
                  />
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="text-center py-8">
                <div className="text-xs uppercase tracking-wider text-slate-400">
                  4. Audience Preview
                </div>
                <div className="mt-4 text-5xl font-semibold tracking-tight">
                  {audienceSize?.toLocaleString() ?? "—"}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  customers match the selected segment
                </div>
                <div className="mt-6 max-w-md mx-auto rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
                  Audience membership is evaluated and snapshotted when the
                  campaign launches.
                </div>
              </div>
            )}
            {step === 4 && (
              <div>
                <h3 className="font-medium">5. Launch Campaign</h3>
                <p className="text-sm text-slate-500 mt-1 mb-5">
                  Confirm the campaign before queueing delivery jobs.
                </p>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {[
                    ["Campaign", name],
                    ["Channel", channel],
                    [
                      "Audience",
                      `${audienceSize?.toLocaleString() ?? 0} customers`,
                    ],
                    [
                      "Subject",
                      channel === "EMAIL" ? subject : "Not applicable",
                    ],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex justify-between p-4 text-sm"
                    >
                      <span className="text-slate-500">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {prepare.error && (
              <p className="mt-4 text-sm text-rose-600">
                {prepare.error.message}
              </p>
            )}
            {launch.error && (
              <p className="mt-4 text-sm text-rose-600">
                {launch.error.message}
              </p>
            )}
          </div>
          <div className="p-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0 || Boolean(draftId)}
              className="h-9 px-4 rounded-lg text-sm text-slate-600 flex items-center gap-2 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < 4 ? (
              <button
                onClick={continueWizard}
                disabled={
                  prepare.isPending ||
                  (step === 0 && !segmentId) ||
                  (step === 2 && (!name.trim() || !message.trim()))
                }
                className="h-9 px-4 rounded-lg bg-slate-950 text-white text-sm flex items-center gap-2 disabled:opacity-40"
              >
                {prepare.isPending
                  ? "Preparing..."
                  : step === 2
                    ? "Preview audience"
                    : "Continue"}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => launch.mutate()}
                disabled={launch.isPending}
                className="h-10 px-5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />{" "}
                {launch.isPending ? "Queueing..." : "Launch campaign"}
              </button>
            )}
          </div>
        </div>
      </div>
      <CampaignDetailDialog
        campaignId={selectedCampaignId}
        onClose={() => setSelectedCampaignId(null)}
      />
    </div>
  );
}

function Status({ value }: { value: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600",
    QUEUED: "bg-amber-100 text-amber-700",
    RUNNING: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    FAILED: "bg-rose-100 text-rose-700",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-1 rounded-full ${styles[value] ?? styles.DRAFT}`}
    >
      {value}
    </span>
  );
}
