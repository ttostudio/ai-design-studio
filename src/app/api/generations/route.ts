import { NextRequest, NextResponse } from "next/server";
import { listGenerations } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const workflow = sp.get("workflow") ?? undefined;
  const templateId = sp.get("templateId") ?? undefined;
  const search = sp.get("search") ?? undefined;
  const dateFilter = sp.get("dateFilter") as "today" | "week" | "month" | undefined;
  const sort = sp.get("sort") as "newest" | "oldest" | undefined;
  const limit = Math.min(Number(sp.get("limit") ?? "20"), 100);
  const offset = Math.max(Number(sp.get("offset") ?? "0"), 0);
  const tagsParam = sp.get("tags");
  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;
  const statusParam = sp.get("status") as "success" | "error" | "all" | undefined;
  const isFavorite = sp.get("isFavorite") === "1" ? true : undefined;

  try {
    const items = await listGenerations({
      workflow,
      templateId,
      search,
      dateFilter,
      sort,
      limit,
      offset,
      tags,
      status: statusParam,
      isFavorite,
    });
    return NextResponse.json({ data: { items, total: items.length } });
  } catch (err) {
    console.error("[generations] listGenerations error:", err);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "履歴の取得に失敗しました" } },
      { status: 500 }
    );
  }
}
