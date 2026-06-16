import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { getGateway, SYSTEM_PROMPT } = await import("@/lib/ai-gateway.server");
        const { messages }: { messages: UIMessage[] } = await request.json();

        try {
          const gateway = getGateway();
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
          });
          return result.toUIMessageStreamResponse();
        } catch (err) {
          console.error("[api/chat]", err);
          const message = err instanceof Error ? err.message : "AI request failed";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
