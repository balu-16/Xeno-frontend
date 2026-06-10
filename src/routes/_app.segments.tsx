import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bot, Plus, Sparkles, Target, Users, X } from "lucide-react";
import { useState } from "react";
import {
  segmentRuleGroupSchema,
  type SegmentRuleGroup,
} from "../lib/contracts";
import { toast } from "sonner";
import { EditableText } from "@/components/EditableText";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, ErrorState } from "@/components/QueryState";
import { Skeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/segments")({
  head: () => ({ meta: [{ title: "Segments · Xeno Mini" }] }),
  component: Segments,
});

const defaultRules: SegmentRuleGroup = {
  operator: "AND",
  conditions: [
    { field: "totalSpent", operator: ">", value: 500 },
    { field: "daysSinceLastOrder", operator: ">", value: 30 },
  ],
};

function Segments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(
    "Find high-value shoppers who have not ordered in 30 days",
  );
  const [name, setName] = useState("AI Generated Segment");
  const [rules, setRules] = useState<SegmentRuleGroup>(defaultRules);
  const [audienceSize, setAudienceSize] = useState<number>();
  const query = useQuery({
    queryKey: ["segments"],
    queryFn: () => api.segments(),
  });
  const generate = useMutation({
    mutationFn: async () => {
      const conversation = await api.createConversation(prompt.slice(0, 70));
      return api.sendAIMessage(conversation.id, prompt);
    },
    onSuccess: (result) => {
      const parsed = segmentRuleGroupSchema.parse(
        (result.toolResult as { rules?: unknown }).rules,
      );
      setRules(parsed);
      const size = (result.toolResult as { audienceSize?: unknown })
        .audienceSize;
      setAudienceSize(typeof size === "number" ? size : undefined);
      setName(prompt.slice(0, 60));
      toast.success("AI generated validated segment rules");
    },
  });
  const preview = useMutation({
    mutationFn: () => api.previewSegment(rules),
    onSuccess: (result) => setAudienceSize(result.audienceSize),
  });
  const create = useMutation({
    mutationFn: () => api.createSegment({ name, rules }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["segments"] });
      setOpen(false);
      toast.success("Segment saved");
    },
  });
  const updateName = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      api.updateSegmentName(id, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["segments"] });
      toast.success("Segment renamed");
    },
  });

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Segments"
        subtitle="Build secure audiences manually or from natural language."
        action={
          <button
            onClick={() => setOpen(true)}
            className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" /> Generate segment
          </button>
        }
      />
      {query.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200/70 rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-36 mt-4" />
              <Skeleton className="h-7 w-20 mt-1" />
              <Skeleton className="h-3 w-28 mt-1" />
              <Skeleton className="h-14 w-full mt-4 rounded-lg" />
              <Skeleton className="h-9 w-full mt-4 rounded-lg" />
            </div>
          ))}
        </div>
      ) : query.error ? (
        <ErrorState error={query.error} retry={() => void query.refetch()} />
      ) : query.data!.data.length === 0 ? (
        <EmptyState
          title="No segments yet"
          description="Generate your first target audience with AI."
          illustration="segments"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {query.data!.data.map((segment) => (
            <div
              key={segment.id}
              className="group bg-white border border-slate-200/70 rounded-xl p-5 transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50 hover:border-slate-300/80 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 grid place-items-center transition-transform duration-300 group-hover:scale-110">
                  <Target className="h-4 w-4" />
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(segment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <EditableText
                value={segment.name}
                onSave={(name) => updateName.mutate({ id: segment.id, name })}
                className="mt-4 font-semibold"
              />
              <div className="mt-1 text-2xl font-semibold">
                {segment.audienceSize.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">matching customers</div>
              <div className="mt-4 rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-slate-600 line-clamp-3">
                {JSON.stringify(segment.rules)}
              </div>
              <button
                onClick={() =>
                  void navigate({
                    to: "/campaigns",
                    search: { segmentId: segment.id },
                  })
                }
                className="mt-4 w-full h-9 rounded-lg border border-slate-200 text-sm hover:border-indigo-300 hover:text-indigo-700"
              >
                Launch campaign
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/30 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-[560px] max-w-full bg-white shadow-2xl transition-transform duration-300 overflow-y-auto ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Bot className="h-4 w-4 text-indigo-600" /> AI Segment Generator
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Natural language becomes validated JSON rules, never SQL.
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Describe the audience
            </span>
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
            />
          </label>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="h-10 px-4 rounded-lg bg-slate-950 text-white text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {generate.isPending
              ? "Classifying and generating..."
              : "Generate with AI"}
          </button>
          {generate.error && (
            <p className="text-sm text-rose-600">{generate.error.message}</p>
          )}
          <label className="block">
            <span className="text-xs font-medium text-slate-600">
              Segment name
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </label>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Validated rules
              </span>
              <button
                onClick={() => setRules(defaultRules)}
                className="text-xs text-indigo-600"
              >
                Reset
              </button>
            </div>
            <pre className="mt-1.5 rounded-xl bg-slate-950 text-slate-200 p-4 text-xs overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(rules, null, 2)}
            </pre>
          </div>
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-indigo-600" />
            <div>
              <div className="text-xs text-indigo-600">Audience preview</div>
              <div className="font-semibold text-indigo-950">
                {audienceSize === undefined
                  ? "Not calculated"
                  : `${audienceSize.toLocaleString()} customers`}
              </div>
            </div>
            <button
              onClick={() => preview.mutate()}
              className="ml-auto text-xs font-medium text-indigo-700"
            >
              Refresh
            </button>
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending || !name.trim()}
            className="w-full h-11 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />{" "}
            {create.isPending ? "Saving..." : "Save segment"}
          </button>
        </div>
      </aside>
    </div>
  );
}
