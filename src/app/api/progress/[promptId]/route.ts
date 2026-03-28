import { NextRequest } from "next/server";
import { getGenerationByPromptId } from "@/lib/db";

const COMFYUI_API_URL =
  process.env["COMFYUI_API_URL"] ?? "http://comfyui-api:3300";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  const { promptId } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Check if generation is already complete in DB
      const existing = await getGenerationByPromptId(promptId).catch(() => null);
      if (existing && existing.status === "success" && existing.image_url) {
        send({ progress: 100 });
        send({ imageUrl: existing.image_url, status: "complete" });
        controller.close();
        return;
      }
      if (existing && existing.status === "error") {
        send({ status: "error", error: existing.error_message ?? "生成に失敗しました" });
        controller.close();
        return;
      }

      // Proxy ComfyUI SSE stream
      let upstream: Response;
      try {
        upstream = await fetch(`${COMFYUI_API_URL}/api/progress/${promptId}`, {
          signal: AbortSignal.timeout(310_000),
        });
      } catch {
        send({ status: "error", error: "ComfyUI APIへの接続に失敗しました" });
        controller.close();
        return;
      }

      if (!upstream.ok || !upstream.body) {
        send({ status: "error", error: "進捗ストリームの取得に失敗しました" });
        controller.close();
        return;
      }

      const reader = upstream.body.getReader();
      const textDecoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += textDecoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6);
            let event: Record<string, unknown>;
            try {
              event = JSON.parse(raw) as Record<string, unknown>;
            } catch {
              continue;
            }

            if (event["error"]) {
              send({ status: "error", error: event["error"] });
              controller.close();
              return;
            }

            if (typeof event["progress"] === "number") {
              send({ progress: event["progress"] });
            }

            if (event["done"] === true) {
              // ComfyUI reports done — fetch image info from DB (should be saved by now)
              send({ progress: 100 });
              const gen = await getGenerationByPromptId(promptId).catch(() => null);
              if (gen?.image_url) {
                send({ imageUrl: gen.image_url, status: "complete" });
              } else {
                send({ status: "complete" });
              }
              controller.close();
              return;
            }
          }
        }
      } catch {
        // stream closed by client or network error
      } finally {
        reader.cancel().catch(() => {});
      }

      controller.close();
    },
    cancel() {
      // nothing to clean up
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
