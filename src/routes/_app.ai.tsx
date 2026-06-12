import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bot,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { type AIMessage, type Conversation, api } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ai")({
  head: () => ({ meta: [{ title: "AI Conversations · Xeno Mini" }] }),
  component: AIHistory,
});

const AI_SKILLS = [
  {
    category: "Campaigns",
    icon: "📧",
    suggestions: [
      "Show me all campaigns",
      "Create a campaign called Summer Sale targeting High Value Customers",
      "Why did my last campaign fail?",
    ],
  },
  {
    category: "Customers",
    icon: "👥",
    suggestions: [
      "How many customers do we have?",
      "Find customer by email john@example.com",
      "Create a customer named Sarah with email sarah@test.com",
    ],
  },
  {
    category: "Segments",
    icon: "🎯",
    suggestions: [
      "Show me all segments",
      "Create a segment for customers who spent over $500",
      "How many customers are in the VIP segment?",
    ],
  },
  {
    category: "Analytics",
    icon: "📊",
    suggestions: [
      "Show campaign performance analytics",
      "What is our total revenue this month?",
      "Show delivery analytics for all campaigns",
    ],
  },
];

function AIHistory() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [input, setInput] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const conversations = useQuery({
    queryKey: ["ai", "conversations"],
    queryFn: api.conversations,
  });
  useEffect(() => {
    if (!selectedId && conversations.data?.[0]) {
      setSelectedId(conversations.data[0].id);
    }
  }, [conversations.data, selectedId]);
  const conversation = useQuery({
    queryKey: ["ai", "conversation", selectedId],
    queryFn: () => api.conversation(selectedId!),
    enabled: Boolean(selectedId),
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.data?.messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const create = useMutation({
    mutationFn: () => api.createConversation(),
    onSuccess: async (result) => {
      setSelectedId(result.id);
      await queryClient.invalidateQueries({
        queryKey: ["ai", "conversations"],
      });
    },
  });

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      api.renameConversation(id, title),
    onSuccess: async () => {
      setRenamingId(null);
      setRenameValue("");
      await queryClient.invalidateQueries({
        queryKey: ["ai", "conversations"],
      });
      toast.success("Conversation renamed");
    },
    onError: (error) => {
      toast.error(`Failed to rename: ${error.message}`);
    },
  });

  const deleteConv = useMutation({
    mutationFn: (id: string) => api.deleteConversation(id),
    onSuccess: async (_, deletedId) => {
      if (selectedId === deletedId) {
        setSelectedId(undefined);
      }
      await queryClient.invalidateQueries({
        queryKey: ["ai", "conversations"],
      });
      toast.success("Conversation deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const send = useMutation({
    mutationFn: (content: string) => api.sendAIMessage(selectedId!, content),
    onMutate: async (content) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: ["ai", "conversation", selectedId],
      });

      // Snapshot the previous value
      const previousConversation = queryClient.getQueryData<Conversation>([
        "ai",
        "conversation",
        selectedId,
      ]);

      // Optimistically add the user message to the conversation
      if (previousConversation) {
        const optimisticUserMessage: AIMessage = {
          id: `optimistic-user-${Date.now()}`,
          role: "USER",
          content,
          grounding: null,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<Conversation>(
          ["ai", "conversation", selectedId],
          {
            ...previousConversation,
            messages: [...previousConversation.messages, optimisticUserMessage],
          },
        );
      }

      setInput("");

      return { previousConversation };
    },
    onSuccess: async (result) => {
      // Directly update the conversation cache with the assistant's response
      queryClient.setQueryData<Conversation>(
        ["ai", "conversation", selectedId],
        (old) => {
          if (!old) return old;
          const assistantMessage: AIMessage = {
            id: `assistant-${Date.now()}`,
            role: "ASSISTANT",
            content: result.response,
            grounding: result.grounding
              ? {
                  tool: result.grounding.tool,
                  sources: result.grounding.sources,
                }
              : null,
            createdAt: new Date().toISOString(),
          };
          return {
            ...old,
            messages: [...old.messages, assistantMessage],
          };
        },
      );

      // Also invalidate the conversations list to update the sidebar
      await queryClient.invalidateQueries({
        queryKey: ["ai", "conversations"],
      });
    },
    onError: (_error, _content, context) => {
      // Rollback to the previous value on error
      if (context?.previousConversation) {
        queryClient.setQueryData(
          ["ai", "conversation", selectedId],
          context.previousConversation,
        );
      }
    },
  });

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
    setOpenMenuId(null);
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      rename.mutate({ id, title: renameValue.trim() });
    }
  };

  const handleDelete = (id: string) => {
    setOpenMenuId(null);
    deleteConv.mutate(id);
  };

  if (conversations.isLoading) {
    return (
      <Page>
        <LoadingState label="Loading AI conversation history" />
      </Page>
    );
  }
  if (conversations.error) {
    return (
      <Page>
        <ErrorState
          error={conversations.error}
          retry={() => void conversations.refetch()}
        />
      </Page>
    );
  }
  return (
    <Page>
      <PageHeader
        title="AI Conversation History"
        subtitle="Reopen every grounded copilot conversation and inspect its tool sources."
        action={
          <button
            onClick={() => create.mutate()}
            className="h-9 px-4 rounded-lg bg-slate-950 text-white text-sm flex items-center gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" /> New conversation
          </button>
        }
      />
      <div className="h-[calc(100vh-170px)] min-h-[600px] grid grid-cols-1 md:grid-cols-[320px_1fr] bg-white border border-slate-200 rounded-xl overflow-hidden">
        <aside className="border-r border-slate-100 overflow-y-auto">
          <div className="p-4 text-xs uppercase tracking-wider text-slate-400">
            Previous conversations
          </div>
          {conversations.data!.map((item) => (
            <div
              key={item.id}
              className={`relative border-t border-slate-50 ${
                selectedId === item.id ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
            >
              {renamingId === item.id ? (
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit(item.id);
                        if (e.key === "Escape") {
                          setRenamingId(null);
                          setRenameValue("");
                        }
                      }}
                      className="flex-1 h-8 px-2 rounded border border-indigo-300 text-sm outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleRenameSubmit(item.id)}
                      className="h-8 px-2 rounded bg-indigo-600 text-white text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setRenamingId(null);
                        setRenameValue("");
                      }}
                      className="h-8 w-8 rounded grid place-items-center text-slate-400 hover:bg-slate-100"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <button
                    onClick={() => setSelectedId(item.id)}
                    className="flex-1 text-left px-4 py-3"
                  >
                    <div className="text-sm font-medium truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {new Date(item.updatedAt).toLocaleString()}
                    </div>
                  </button>
                  <div
                    className="relative pr-2"
                    ref={openMenuId === item.id ? menuRef : undefined}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === item.id ? null : item.id);
                      }}
                      className="h-8 w-8 rounded grid place-items-center text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenuId === item.id && (
                      <div className="absolute right-0 top-9 z-50 w-40 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(item.id, item.title);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </aside>
        <section className="flex flex-col min-w-0 min-h-0 overflow-hidden">
          {conversation.isLoading ? (
            <LoadingState label="Opening conversation" />
          ) : conversation.data ? (
            <>
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-semibold">{conversation.data.title}</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversation.data.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "USER" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-3xl rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                        message.role === "USER"
                          ? "bg-indigo-600 text-white rounded-br-md"
                          : "bg-slate-100 text-slate-700 rounded-bl-md"
                      }`}
                    >
                      {message.content}
                      {message.grounding?.tool && (
                        <div className="mt-3 pt-2 border-t border-slate-200/50 text-[10px] uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3" />
                          {message.grounding.tool}
                          {message.grounding.sources &&
                            message.grounding.sources.length > 0 &&
                            ` · ${message.grounding.sources.join(", ")}`}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {send.isPending && (
                  <div className="flex justify-start">
                    <div className="max-w-3xl rounded-2xl rounded-bl-md px-4 py-3 text-sm bg-slate-100 text-slate-500">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 animate-pulse text-indigo-600" />
                        <span>Thinking...</span>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        Intent → Tool → Grounding → Response
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {conversation.data.messages.length > 0 && (
                <div className="px-4 pb-2">
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {AI_SKILLS.flatMap((skill) =>
                      skill.suggestions.slice(0, 1).map((s) => (
                        <button
                          key={s}
                          onClick={() => setInput(s)}
                          className="shrink-0 text-[11px] text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-full px-3 py-1 transition-colors truncate max-w-[200px]"
                        >
                          {skill.icon} {s}
                        </button>
                      )),
                    )}
                  </div>
                </div>
              )}
              <div className="p-4 border-t border-slate-100">
                <div className="relative">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        input.trim() &&
                        !send.isPending
                      )
                        send.mutate(input.trim());
                    }}
                    placeholder='Ask "Why did Summer Sale fail?"'
                    disabled={send.isPending}
                    className="w-full h-11 rounded-full border border-slate-200 bg-slate-50 pl-4 pr-12 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
                  />
                  <button
                    onClick={() =>
                      input.trim() &&
                      !send.isPending &&
                      send.mutate(input.trim())
                    }
                    disabled={send.isPending || !input.trim()}
                    className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-indigo-600 text-white grid place-items-center disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full overflow-y-auto p-6 flex flex-col items-center justify-center">
              <div className="w-full max-w-2xl space-y-6">
                <div className="text-center space-y-2">
                  <Bot className="h-10 w-10 mx-auto text-indigo-400" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    What can I help you with?
                  </h3>
                  <p className="text-sm text-slate-500">
                    Ask me anything about your campaigns, customers, segments, or analytics.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AI_SKILLS.map((skill) => (
                    <div
                      key={skill.category}
                      className="rounded-xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{skill.icon}</span>
                        <span className="text-sm font-semibold text-slate-700">
                          {skill.category}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {skill.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onClick={() => setInput(suggestion)}
                            className="w-full text-left text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-2.5 py-1.5 transition-colors truncate"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return <div className="px-8 py-8 max-w-[1500px] mx-auto">{children}</div>;
}
