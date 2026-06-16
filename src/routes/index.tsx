import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createThread, listThreads } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Event Operations · Pyramid of Tirana" },
      {
        name: "description",
        content:
          "AI-powered event operations assistant for the Pyramid of Tirana — plan, coordinate, and execute events end to end.",
      },
      { property: "og:title", content: "Event Operations · Pyramid of Tirana" },
      {
        property: "og:description",
        content:
          "AI-powered event operations assistant for the Pyramid of Tirana — plan, coordinate, and execute events end to end.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: threads } = useQuery({ queryKey: ["threads"], queryFn: listThreads });

  const create = useMutation({
    mutationFn: createThread,
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      navigate({ to: "/$threadId", params: { threadId: t.id } });
    },
  });

  // If threads exist, send them to the most recent one
  useEffect(() => {
    if (threads && threads.length > 0) {
      navigate({ to: "/$threadId", params: { threadId: threads[0].id }, replace: true });
    }
  }, [threads, navigate]);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-grain px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="text-[11px] uppercase tracking-[0.25em] text-primary">Pyramid of Tirana</p>
      <h1 className="text-display mt-2 max-w-xl text-4xl font-semibold tracking-tight text-foreground">
        Event Operations, end to end.
      </h1>
      <p className="mt-3 max-w-lg text-sm text-muted-foreground">
        From the first inquiry to the day-of run sheet — your AI assistant for planning,
        coordinating, and executing events at the Pyramid.
      </p>
      <button
        onClick={() => create.mutate()}
        disabled={create.isPending}
        className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
      >
        Start a new event request
      </button>
    </div>
  );
}
