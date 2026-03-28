import { NextRequest } from "next/server";
import { getProgressStream } from "@/lib/comfyui-client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate promptId format (alphanumeric/hyphens only)
  if (!id || !/^[a-zA-Z0-9_\-]{1,128}$/.test(id)) {
    return new Response(
      JSON.stringify({ error: { code: "INVALID_ID", message: "IDの形式が不正です" } }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let upstream: Response;
  try {
    upstream = await getProgressStream(id);
  } catch {
    const stream = new ReadableStream({
      start(controller) {
        const errorEvent = `data: ${JSON.stringify({ status: "error", error: "ComfyUI に接続できません" })}\n\n`;
        controller.enqueue(new TextEncoder().encode(errorEvent));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Relay the upstream SSE stream
  const { readable, writable } = new TransformStream();
  upstream.body?.pipeTo(writable).catch(() => {});

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
