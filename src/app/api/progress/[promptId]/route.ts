import { NextRequest } from "next/server";
import { getGenerationById } from "@/lib/db";

export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 1_000;
const TIMEOUT_MS = 330_000;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  // promptId === generationId in async design
  const { promptId: generationId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller may already be closed
        }
      };

      const startTime = Date.now();
      let closed = false;

      req.signal.addEventListener("abort", () => {
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      });

      while (!closed) {
        if (Date.now() - startTime > TIMEOUT_MS) {
          send({ status: "error", error: "生成タイムアウト" });
          break;
        }

        let row: Awaited<ReturnType<typeof getGenerationById>> = null;
        try {
          row = await getGenerationById(generationId);
        } catch {
          // DB error — retry next tick
        }

        if (row?.status === "queued") {
          send({ progress: 0 });
        } else if (row?.status === "processing") {
          // Approximate progress: increases over time (max 90 until complete)
          const elapsed = Date.now() - startTime;
          const approx = Math.min(90, Math.round((elapsed / TIMEOUT_MS) * 100 * 3));
          send({ progress: approx });
        } else if (row?.status === "success" && row.image_url) {
          send({ progress: 100 });
          send({ imageUrl: row.image_url, status: "complete" });
          break;
        } else if (row?.status === "error") {
          send({ status: "error", error: row.error_message ?? "生成に失敗しました" });
          break;
        }

        await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }

      try { controller.close(); } catch { /* already closed */ }
    },
    cancel() {
      // cleaned up via req.signal
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
