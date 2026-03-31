import { NextRequest, NextResponse } from "next/server";
import { getGenerationById, deleteGeneration, listGenerations } from "@/lib/db";

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
    const generation = await getGenerationById(id);
    if (!generation) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "指定されたIDの生成結果が見つかりません" } },
        { status: 404 }
      );
    }

    let similar: Awaited<ReturnType<typeof listGenerations>> = [];
    if (generation.template_id) {
      const candidates = await listGenerations({
        templateId: generation.template_id,
        limit: 7,
        sort: "newest",
        status: "success",
      });
      similar = candidates.filter((g) => g.id !== id).slice(0, 6);
    }

    return NextResponse.json({ data: { generation, similar } });
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
