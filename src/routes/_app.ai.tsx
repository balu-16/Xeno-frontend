import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bot, MessageSquarePlus, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ErrorState, LoadingState } from "@/components/QueryState";
import { type AIMessage, type Conversation, api } from "@/lib/api";

export const Route = createFileRoute("/_app/ai")({
  head: () => ({ meta: [{ title: "AI Conversations · Xeno Mini" }] }),
  component: AIHistory,
});

function AIHistory() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const create = useMutation({
    mutationFn: () => api.createConversation(),
    onSuccess: async (result) => {
      setSelectedId(result.id);
      await queryClient.invalidateQueries({
        queryKey: ["ai", "conversations"],
      });
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
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full text-left px-4 py-3 border-t border-slate-50 ${
                selectedId === item.id ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
            >
              <div className="text-sm font-medium truncate">{item.title}</div>
              <div className="text-xs text-slate-400 mt-1">
                {new Date(item.updatedAt).toLocaleString()}
              </div>
            </button>
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
              <div className="p-4 border-t border-slate-100">
                <div className="relative">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && input.trim() && !send.isPending)
                        send.mutate(input.trim());
                    }}
                    placeholder='Ask "Why did Summer Sale fail?"'
                    disabled={send.isPending}
                    className="w-full h-11 rounded-full border border-slate-200 bg-slate-50 pl-4 pr-12 text-sm outline-none focus:border-indigo-400 disabled:opacity-50"
                  />
                  <button
                    onClick={() =>
                      input.trim() && !send.isPending && send.mutate(input.trim())
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
            <div className="h-full grid place-items-center text-sm text-slate-500">
              Create a conversation to begin.
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
