import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, Sparkles } from "lucide-react";
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
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-grain">
        <div className="mx-auto max-w-3xl px-6 py-10">
          {messages.length === 0 && <EmptyState />}
          <div className="space-y-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 pl-1 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Drafting response…
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error.message}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="relative rounded-xl border border-border bg-background shadow-sm focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Describe an event request, ask a question, or paste a client inquiry…"
              rows={3}
              className="w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isBusy}
              className="absolute bottom-2.5 right-2.5 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-muted-foreground">
            Enter to send · Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="prose-chat min-w-0 flex-1 text-sm text-foreground">
        <ReactMarkdown>{text}</ReactMarkdown>
      </div>
    </div>
  );
}

const SAMPLE_PROMPTS = [
  "Wedding reception for 180 guests on a Saturday in June, with live band and dinner.",
  "International tech conference, 3 days, ~500 attendees, plus breakout workshops.",
  "Rooftop product launch cocktail for 200 — late September, around 19:00.",
];

function EmptyState() {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <h2 className="text-display text-2xl font-semibold text-foreground">
        Event Operations Assistant
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Plan, coordinate, and execute events at the Pyramid of Tirana. Paste a client
        inquiry or describe a request to get started.
      </p>
      <div className="mx-auto mt-8 grid max-w-2xl gap-2 text-left sm:grid-cols-3">
        {SAMPLE_PROMPTS.map((p) => (
          <div
            key={p}
            className="rounded-lg border border-border bg-card/60 p-3 text-xs leading-snug text-muted-foreground"
          >
            <span className="text-primary">→</span> {p}
          </div>
        ))}
      </div>
    </div>
  );
}
