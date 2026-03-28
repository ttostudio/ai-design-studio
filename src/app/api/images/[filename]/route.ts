import { NextRequest, NextResponse } from "next/server";
import { validateFilename, validateSubfolder } from "@/lib/validators";

const COMFYUI_API_URL =
  process.env["COMFYUI_API_URL"] ?? "http://comfyui-api:3300";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const subfolder = req.nextUrl.searchParams.get("subfolder") ?? "";
  const type = req.nextUrl.searchParams.get("type") ?? "output";

  if (!validateFilename(filename)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "不正なファイル名です" } },
      { status: 400 }
    );
  }

  if (subfolder && !validateSubfolder(subfolder)) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "不正なサブフォルダ名です" } },
      { status: 400 }
    );
  }

  const url = new URL(`${COMFYUI_API_URL}/api/images/${encodeURIComponent(filename)}`);
  if (subfolder) url.searchParams.set("subfolder", subfolder);
  if (type) url.searchParams.set("type", type);

  try {
    const upstream = await fetch(url.toString(), {
      signal: AbortSignal.timeout(15_000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: { code: "IMAGE_NOT_FOUND", message: "画像が見つかりません" } },
        { status: upstream.status }
      );
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "画像の取得に失敗しました" } },
      { status: 500 }
    );
  }
}
