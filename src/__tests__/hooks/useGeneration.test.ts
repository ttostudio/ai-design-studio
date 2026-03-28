import { renderHook, act } from "@testing-library/react";
import { useGeneration } from "@/hooks/useGeneration";

// Mock the api module
jest.mock("@/lib/api", () => ({
  postGenerate: jest.fn(),
}));

import { postGenerate } from "@/lib/api";
const mockPostGenerate = postGenerate as jest.Mock;

// Mock EventSource
class MockEventSource {
  static instances: MockEventSource[] = [];
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(public url: string) {
    MockEventSource.instances.push(this);
  }

  close() {
    this.closed = true;
  }

  // Helper to simulate events
  emit(data: unknown) {
    if (this.onmessage) {
      this.onmessage({ data: JSON.stringify(data) } as MessageEvent);
    }
  }

  emitError() {
    if (this.onerror) {
      this.onerror();
    }
  }
}

describe("useGeneration", () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    mockPostGenerate.mockClear();
    global.EventSource = MockEventSource as unknown as typeof EventSource;
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useGeneration());
    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.progress).toBe(0);
    expect(result.current.state.imageUrl).toBeNull();
    expect(result.current.state.errorMessage).toBeNull();
  });

  it("transitions to queued when generate is called", async () => {
    mockPostGenerate.mockResolvedValue({ generationId: "gen_test", promptId: "p123" });

    const { result } = renderHook(() => useGeneration());

    act(() => {
      result.current.generate({
        prompt: "test",
        workflow: "flux-gguf",
        width: 1024,
        height: 576,
        steps: 4,
        cfgScale: 1.0,
      });
    });

    expect(result.current.state.status).toBe("queued");
  });

  it("transitions to error when postGenerate fails", async () => {
    mockPostGenerate.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate({
        prompt: "test",
        workflow: "flux-gguf",
        width: 1024,
        height: 576,
        steps: 4,
        cfgScale: 1.0,
      });
    });

    expect(result.current.state.status).toBe("error");
    expect(result.current.state.errorMessage).toBe("Network error");
  });

  it("transitions to processing after postGenerate succeeds", async () => {
    mockPostGenerate.mockResolvedValue({ generationId: "gen_test", promptId: "p123" });

    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate({
        prompt: "test",
        workflow: "flux-gguf",
        width: 1024,
        height: 576,
        steps: 4,
        cfgScale: 1.0,
      });
    });

    expect(result.current.state.status).toBe("processing");
    expect(result.current.state.generationId).toBe("gen_test");
  });

  it("updates progress when SSE sends progress event", async () => {
    mockPostGenerate.mockResolvedValue({ generationId: "gen_test", promptId: "p123" });

    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate({
        prompt: "test",
        workflow: "flux-gguf",
        width: 1024,
        height: 576,
        steps: 4,
        cfgScale: 1.0,
      });
    });

    const es = MockEventSource.instances[0];
    act(() => {
      es.emit({ progress: 50 });
    });

    expect(result.current.state.progress).toBe(50);
  });

  it("transitions to complete on SSE complete event", async () => {
    mockPostGenerate.mockResolvedValue({ generationId: "gen_test", promptId: "p123" });

    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate({
        prompt: "test",
        workflow: "flux-gguf",
        width: 1024,
        height: 576,
        steps: 4,
        cfgScale: 1.0,
      });
    });

    const es = MockEventSource.instances[0];
    act(() => {
      es.emit({ imageUrl: "/api/images/result.png", status: "complete" });
    });

    expect(result.current.state.status).toBe("complete");
    expect(result.current.state.imageUrl).toBe("/api/images/result.png");
    expect(es.closed).toBe(true);
  });

  it("transitions to error on SSE error event", async () => {
    mockPostGenerate.mockResolvedValue({ generationId: "gen_test", promptId: "p123" });

    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate({
        prompt: "test",
        workflow: "flux-gguf",
        width: 1024,
        height: 576,
        steps: 4,
        cfgScale: 1.0,
      });
    });

    const es = MockEventSource.instances[0];
    act(() => {
      es.emit({ status: "error", error: "GPU error" });
    });

    expect(result.current.state.status).toBe("error");
    expect(result.current.state.errorMessage).toBe("GPU error");
  });

  it("resets to idle when reset is called", async () => {
    mockPostGenerate.mockResolvedValue({ generationId: "gen_test", promptId: "p123" });

    const { result } = renderHook(() => useGeneration());

    await act(async () => {
      await result.current.generate({
        prompt: "test",
        workflow: "flux-gguf",
        width: 1024,
        height: 576,
        steps: 4,
        cfgScale: 1.0,
      });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.status).toBe("idle");
    expect(result.current.state.progress).toBe(0);
    expect(result.current.state.imageUrl).toBeNull();
    expect(result.current.state.errorMessage).toBeNull();
  });
});
