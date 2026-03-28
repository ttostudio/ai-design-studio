import { NextResponse } from "next/server";
import { getComfyUIStatus } from "@/lib/comfyui-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getComfyUIStatus();
  return NextResponse.json({ data: status });
}
