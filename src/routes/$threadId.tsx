import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChatWindow } from "@/components/ChatWindow";
import { getThreadMessages } from "@/lib/threads";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/$threadId")({
  head: () => ({
    meta: [{ title: "Event Request · Pyramid of Tirana" }],
  }),
  component: ThreadPage,
});

async function loadThread(threadId: string) {
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  const messages = await getThreadMessages(threadId);
  return { thread: data, messages };
}

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => loadThread(threadId),
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading thread…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        Could not load this event request.
      </div>
    );
  }

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      initialMessages={data.messages}
      initialTitle={data.thread.title}
    />
  );
}
