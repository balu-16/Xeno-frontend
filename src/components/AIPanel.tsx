import { useMutation } from "@tanstack/react-query";
import { Bot, Minus, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type PanelMessage = {
  role: "user" | "assistant";
  content: string;
  tool?: string;
};

export function AIPanel() {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<PanelMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me to build a segment, draft campaign content, explain performance, recommend an audience, or diagnose a failure.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: async (content: string) => {
      const id =
        conversationId ??
        (await api.createConversation(content.slice(0, 70))).id;
      if (!conversationId) {
        setConversationId(id);
      }
      return api.sendAIMessage(id, content);
    },
    onSuccess: (result) => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.response,
          tool: result.grounding.tool,
        },
      ]);
    },
    onError: (error) => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: `I could not complete that request: ${error.message}`,
        },
      ]);
    },
  });

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, send.isPending]);

  const submit = () => {
    const content = input.trim();
    if (!content || send.isPending) return;
    setMessages((current) => [...current, { role: "user", content }]);
    setInput("");
    send.mutate(content);
  };

  const suggestions = [
    "Show dashboard performance",
    "Find inactive VIP shoppers",
    "Why did Summer Sale fail?",
    "List all segments",
    "How many customers do we have?",
    "Recommend an audience for winter",
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-6 z-40 inline-flex items-center gap-2 h-9 px-3.5 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all"
      >
        <Sparkles className="h-4 w-4 text-indigo-600" />
        <span className="text-sm font-medium text-indigo-700">Ask AI</span>
      </button>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-[2px] transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-3 right-3 bottom-3 z-50 w-[440px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl border border-slate-100 shadow-2xl flex flex-col transition-all duration-300 ${
          open ? "translate-x-0 opacity-100" : "translate-x-[110%] opacity-0"
        }`}
      >
        <header className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 grid place-items-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Xeno AI Copilot</h3>
            <p className="text-xs text-slate-500">
              Every answer is tool-grounded
            </p>
          </div>
          <button className="h-8 w-8 grid place-items-center rounded-md text-slate-400 hover:bg-slate-100">
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 grid place-items-center rounded-md text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && index === 0 && messages.length === 1 ? (
                <div className="w-full">
                  <div className="bg-slate-50 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-600 leading-relaxed">
                    {message.content}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {suggestions.slice(0, 3).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setInput(s);
                        }}
                        className="text-xs px-2.5 py-1.5 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md"
                      : "bg-slate-50 text-slate-700 rounded-bl-md border border-slate-100"
                  }`}
                >
                  {message.content}
                  {message.tool && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <Sparkles className="h-2.5 w-2.5" />
                        {message.tool}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {send.isPending && (
            <div className="flex justify-start">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-slate-400 ml-1">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestions.slice(3).map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
              placeholder="Ask a business question..."
              className="w-full h-11 pl-4 pr-12 rounded-full bg-slate-50 border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
            />
            <button
              onClick={submit}
              disabled={send.isPending}
              className="absolute right-1.5 top-1.5 h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
