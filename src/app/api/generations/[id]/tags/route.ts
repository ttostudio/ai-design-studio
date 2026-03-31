import { NextRequest, NextResponse } from "next/server";
import { updateGenerationTags } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^gen_[A-Za-z0-9_-]{16}$/.test(id)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "IDの形式が不正です" } },
      { status: 400 }
    );
  }

  let body: { tags?: unknown };
  try {
    body = await req.json() as { tags?: unknown };
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "リクエストボディが不正です" } },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.tags) || body.tags.some((t) => typeof t !== "string")) {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "tags は文字列配列で指定してください" } },
      { status: 400 }
    );
  }

  const tags = body.tags as string[];

  try {
    const updated = await updateGenerationTags(id, tags);
    if (!updated) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "指定されたIDの生成結果が見つかりません" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { tags } });
  } catch (err) {
    console.error("[generations/id/tags] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "更新に失敗しました" } },
      { status: 500 }
    );
  }
}
