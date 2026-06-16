import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Sparkles, User, Paperclip, CornerDownLeft } from "lucide-react";
import { saveMessage, renameThread, deriveTitle } from "@/lib/threads";

interface ChatWindowProps {
  threadId: string;
  initialMessages: UIMessage[];
  initialTitle: string;
}

export function ChatWindow({ threadId, initialMessages, initialTitle }: ChatWindowProps) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const persistedIds = useRef(new Set(initialMessages.map((m) => m.id)));
  const titleSet = useRef(initialTitle !== "New event request");

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onFinish: async ({ message }) => {
      if (!persistedIds.current.has(message.id)) {
        persistedIds.current.add(message.id);
        try {
          await saveMessage(threadId, message);
          qc.invalidateQueries({ queryKey: ["threads"] });
        } catch (e) {
          console.error("save assistant", e);
        }
      }
    },
  });

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // Focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  async function handleSend() {
    const text = input.trim();
    if (!text || status === "submitted" || status === "streaming") return;
    setInput("");

    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text }],
    };
    persistedIds.current.add(userMsg.id);

    // Persist user message + maybe set title
    try {
      await saveMessage(threadId, userMsg);
      if (!titleSet.current) {
        titleSet.current = true;
        await renameThread(threadId, deriveTitle(text));
      }
      qc.invalidateQueries({ queryKey: ["threads"] });
    } catch (e) {
      console.error("save user", e);
    }

    sendMessage(userMsg);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background/20">
      {/* BACKGROUND DECOR */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/30 blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-[128px]" />
      </div>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-6 py-10">
        <div className="mx-auto max-w-3xl">
          {messages.length === 0 && <EmptyState />}
          <div className="space-y-8">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}

            {isBusy && (
              <div className="flex justify-start animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex max-w-[85%] gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30 shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl bg-white/5 px-5 py-4 backdrop-blur-md ring-1 ring-white/5 shadow-2xl">
                    <div className="flex gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg animate-in shake duration-500">
                <p className="font-bold uppercase tracking-widest text-[10px] mb-1">System Error</p>
                {error.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 p-6 pt-0">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="glass-card group flex flex-col gap-2 rounded-2xl p-2 ring-1 ring-white/10 shadow-[0_0_64px_rgba(0,0,0,0.4)] transition-all duration-300 focus-within:ring-primary/40 focus-within:shadow-[0_0_64px_rgba(249,115,22,0.1)]"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe an event, ask a question, or paste an inquiry..."
              rows={2}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-white/5 p-1 pt-2">
              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded-lg p-2 text-muted-foreground/60 hover:bg-white/5 hover:text-primary transition-all"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded-lg p-2 text-muted-foreground/60 hover:bg-white/5 hover:text-primary transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40 hidden sm:inline-block">
                  Press{" "}
                  <kbd className="rounded border border-white/10 bg-white/5 px-1 px-0.5 text-[9px]">
                    Enter
                  </kbd>{" "}
                  to send
                </span>
                <button
                  type="submit"
                  disabled={!input.trim() || isBusy}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                >
                  {isBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </form>
          <p className="mt-3 text-center text-[9px] uppercase tracking-[0.3em] text-muted-foreground/20">
            Tirana Elite Operations Concierge · AI Powered
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  return (
    <div
      className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-500 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div className={`flex max-w-[90%] gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-lg transition-transform duration-300 hover:scale-110 ${
            isUser
              ? "bg-accent/20 text-accent ring-1 ring-accent/30"
              : "bg-primary/20 text-primary ring-1 ring-primary/30"
          }`}
        >
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>
        <div
          className={`rounded-2xl px-6 py-4 shadow-2xl transition-all duration-300 ${
            isUser
              ? "glass-card text-foreground ring-1 ring-white/10"
              : "bg-white/5 text-foreground ring-1 ring-white/5 backdrop-blur-md"
          }`}
        >
          <div className="prose-chat whitespace-pre-wrap">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  "Corporate gala for 300, premium catering, live string quartet.",
  "Tech summit workshop series, breakout rooms, high-speed WiFi.",
  "Sunset cocktail launch on the Rooftop, 150 guests, minimalist decor.",
];

function EmptyState() {
  return (
    <div className="py-12 text-center animate-in fade-in zoom-in-95 duration-700">
      <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 shadow-[0_0_40px_rgba(249,115,22,0.1)] ring-1 ring-primary/20">
        <Sparkles className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-display text-4xl font-bold tracking-tight text-foreground">
        Elite Event Assistant
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground/70 leading-relaxed">
        Curate unforgettable experiences at the Pyramid of Tirana. Paste a formal inquiry or share
        your vision to begin.
      </p>

      <div className="mx-auto mt-12 grid max-w-3xl gap-4 text-left sm:grid-cols-3 px-4">
        {SAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            className="group glass-card rounded-2xl p-4 text-xs leading-relaxed text-muted-foreground/60 transition-all duration-300 hover:text-primary hover:ring-primary/40 hover:scale-[1.02]"
          >
            <div className="mb-2 flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-primary/40 transition-colors group-hover:bg-primary/20 group-hover:text-primary">
              <CornerDownLeft className="h-3 w-3" />
            </div>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
