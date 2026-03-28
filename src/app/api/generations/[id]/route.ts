import { NextRequest, NextResponse } from "next/server";
import { getGenerationById, deleteGeneration } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^gen_[A-Za-z0-9_-]{16}$/.test(id)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "IDの形式が不正です" } },
      { status: 400 }
    );
  }

  try {
    const row = await getGenerationById(id);
    if (!row) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "指定されたIDの生成結果が見つかりません" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: row });
  } catch (err) {
    console.error("[generations/id] getGenerationById error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "取得に失敗しました" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !/^gen_[A-Za-z0-9_-]{16}$/.test(id)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "IDの形式が不正です" } },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteGeneration(id);
    if (!deleted) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "指定されたIDの生成結果が見つかりません" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("[generations/id] deleteGeneration error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "削除に失敗しました" } },
      { status: 500 }
    );
  }
}
