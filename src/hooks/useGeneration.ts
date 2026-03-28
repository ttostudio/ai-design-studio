"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { postGenerate } from "@/lib/api";
import type { GenerateParams } from "@/lib/api";

export type GenerationStatus = "idle" | "queued" | "processing" | "complete" | "error";

export interface GenerationState {
  status: GenerationStatus;
  progress: number;
  imageUrl: string | null;
  generationId: string | null;
  errorMessage: string | null;
}

export function useGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: "idle",
    progress: 0,
    imageUrl: null,
    generationId: null,
    errorMessage: null,
  });

  const esRef = useRef<EventSource | null>(null);

  const closeStream = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  useEffect(() => {
    return () => closeStream();
  }, [closeStream]);

  const generate = useCallback(async (params: GenerateParams) => {
    closeStream();
    setState({ status: "queued", progress: 0, imageUrl: null, generationId: null, errorMessage: null });

    let generationId: string;
    let promptId: string;

    try {
      const result = await postGenerate(params);
      generationId = result.generationId;
      promptId = result.promptId;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: err instanceof Error ? err.message : "生成リクエストに失敗しました",
      }));
      return;
    }

    setState((prev) => ({ ...prev, status: "processing", generationId }));

    const es = new EventSource(`/api/progress/${promptId}`);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as {
          progress?: number;
          imageUrl?: string;
          status?: string;
          error?: string;
        };
        if (typeof data.progress === "number") {
          setState((prev) => ({ ...prev, progress: data.progress as number }));
        }
        if (data.imageUrl) {
          setState((prev) => ({ ...prev, imageUrl: data.imageUrl as string }));
        }
        if (data.status === "complete") {
          setState((prev) => ({ ...prev, status: "complete", progress: 100 }));
          es.close();
        } else if (data.status === "error") {
          setState((prev) => ({
            ...prev,
            status: "error",
            errorMessage: data.error ?? "生成中にエラーが発生しました",
          }));
          es.close();
        }
      } catch {
        // ignore JSON parse errors
      }
    };

    es.onerror = () => {
      es.close();
      setState((prev) => {
        if (prev.status === "complete") return prev;
        return {
          ...prev,
          status: "error",
          errorMessage: "進捗ストリームが切断されました",
        };
      });
    };
  }, [closeStream]);

  const reset = useCallback(() => {
    closeStream();
    setState({ status: "idle", progress: 0, imageUrl: null, generationId: null, errorMessage: null });
  }, [closeStream]);

  return { state, generate, reset };
}
