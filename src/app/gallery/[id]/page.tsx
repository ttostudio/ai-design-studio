import { notFound } from "next/navigation";
import { GalleryDetailClient } from "./GalleryDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GalleryDetailPage({ params }: PageProps) {
  const { id } = await params;

  const apiBase = process.env["NEXT_PUBLIC_API_BASE"] ?? "";
  const res = await fetch(`${apiBase}/api/generations/${id}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    notFound();
  }

  const json = await res.json() as {
    data?: { generation: unknown; similar: unknown[] };
    error?: unknown;
  };

  if (!json.data) {
    notFound();
  }

  return (
    <GalleryDetailClient
      generation={json.data.generation as Parameters<typeof GalleryDetailClient>[0]["generation"]}
      similar={json.data.similar as Parameters<typeof GalleryDetailClient>[0]["similar"]}
    />
  );
}
