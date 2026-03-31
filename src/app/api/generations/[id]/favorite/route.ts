import { NextRequest, NextResponse } from "next/server";
import { updateGenerationFavorite } from "@/lib/db";

export async function PUT(
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

  let body: { isFavorite?: unknown };
  try {
    body = await req.json() as { isFavorite?: unknown };
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "リクエストボディが不正です" } },
      { status: 400 }
    );
  }

  if (typeof body.isFavorite !== "boolean") {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "isFavorite は boolean で指定してください" } },
      { status: 400 }
    );
  }

  try {
    const updated = await updateGenerationFavorite(id, body.isFavorite);
    if (!updated) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "指定されたIDの生成結果が見つかりません" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { isFavorite: body.isFavorite } });
  } catch (err) {
    console.error("[generations/id/favorite] error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "更新に失敗しました" } },
      { status: 500 }
    );
  }
}
