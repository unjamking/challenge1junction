import { createServerFn } from "@tanstack/react-start";
import { getGateway } from "./ai-gateway.server";
import { generateObject } from "ai";
import { z } from "zod";

const InquirySchema = z.object({
  client_name: z.string(),
  client_email: z.string().nullable(),
  client_phone: z.string().nullable(),
  event_type: z.string(),
  attendance: z.number().nullable(),
  preferred_date: z.string().nullable(), // YYYY-MM-DD
  start_time: z.string().nullable(), // HH:mm
  end_time: z.string().nullable(), // HH:mm
  notes: z.string().nullable(),
});

export const parseInquiry = createServerFn({ method: "POST" })
  .validator((text: string) => text)
  .handler(async ({ data: text }) => {
    const gateway = getGateway();
    const { object } = await generateObject({
      model: gateway("gpt-4o"), // Or whatever model is available
      schema: InquirySchema,
      prompt: `Extract event request details from the following inquiry text. If a field is missing, return null. Format date as YYYY-MM-DD and times as HH:mm.
      
      Inquiry:
      """
      ${text}
      """`,
    });
    return object;
  });
