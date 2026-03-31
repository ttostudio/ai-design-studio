"use client";

import Image from "next/image";
import Link from "next/link";
import type { Generation } from "@/lib/api";

interface Props {
  generations: Generation[];
}

export function SimilarDesigns({ generations }: Props) {
  if (generations.length === 0) return null;

  return (
    <section>
      <h2
        className="text-base font-semibold mb-4"
        style={{ color: "var(--color-text-primary)" }}
      >
        類似デザイン
      </h2>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}
      >
        {generations.map((gen) => {
          const aspectRatio = `${gen.width} / ${gen.height}`;
          return (
            <Link
              key={gen.id}
              href={`/gallery/${gen.id}`}
              className="block rounded overflow-hidden transition-all duration-150"
              style={{
                backgroundColor: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
              }}
            >
              {gen.image_url ? (
                <div className="relative w-full" style={{ aspectRatio }}>
                  <Image
                    src={gen.image_url}
                    alt={gen.prompt.slice(0, 100)}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="w-full flex items-center justify-center"
                  style={{ aspectRatio, backgroundColor: "var(--color-bg-elevated)" }}
                >
                  <span style={{ color: "var(--color-text-disabled)", fontSize: "10px" }}>No image</span>
                </div>
              )}
              <p
                className="text-xs p-2 line-clamp-2"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {gen.prompt}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
