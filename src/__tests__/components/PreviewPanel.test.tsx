import { render, screen, fireEvent } from "@testing-library/react";
import { PreviewPanel } from "@/components/PreviewPanel";

const defaultProps = {
  status: "idle" as const,
  progress: 0,
  imageUrl: null,
  errorMessage: null,
  width: 1024,
  height: 576,
  prompt: "test prompt",
  generationId: null,
  onRetry: jest.fn(),
};

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("PreviewPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with data-testid", () => {
    render(<PreviewPanel {...defaultProps} />);
    expect(screen.getByTestId("preview-panel")).toBeInTheDocument();
  });

  it("shows idle state", () => {
    render(<PreviewPanel {...defaultProps} status="idle" />);
    expect(screen.getByTestId("preview-idle")).toBeInTheDocument();
    expect(screen.getByText("プロンプトを入力して")).toBeInTheDocument();
  });

  it("shows processing state with progress", () => {
    render(<PreviewPanel {...defaultProps} status="processing" progress={52} />);
    expect(screen.getByTestId("preview-processing")).toBeInTheDocument();
    expect(screen.getByText(/生成中/)).toBeInTheDocument();
  });

  it("shows queued state", () => {
    render(<PreviewPanel {...defaultProps} status="queued" />);
    expect(screen.getByTestId("preview-processing")).toBeInTheDocument();
    expect(screen.getByText(/キューに追加中/)).toBeInTheDocument();
  });

  it("shows error state with retry button", () => {
    render(
      <PreviewPanel
        {...defaultProps}
        status="error"
        errorMessage="テストエラー"
      />
    );
    expect(screen.getByTestId("preview-error")).toBeInTheDocument();
    expect(screen.getByText("生成に失敗しました")).toBeInTheDocument();
    expect(screen.getByText("テストエラー")).toBeInTheDocument();
    expect(screen.getByTestId("preview-retry-btn")).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = jest.fn();
    render(
      <PreviewPanel {...defaultProps} status="error" onRetry={onRetry} />
    );
    fireEvent.click(screen.getByTestId("preview-retry-btn"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows completed image when status is complete", () => {
    render(
      <PreviewPanel
        {...defaultProps}
        status="complete"
        imageUrl="/api/images/test.png"
        generationId="gen_abc"
      />
    );
    expect(screen.getByTestId("preview-image")).toBeInTheDocument();
    expect(screen.getByTestId("preview-download-btn")).toBeInTheDocument();
    expect(screen.getByTestId("preview-copy-prompt-btn")).toBeInTheDocument();
    expect(screen.getByTestId("preview-gallery-link")).toBeInTheDocument();
  });

  it("does not show gallery link when generationId is null", () => {
    render(
      <PreviewPanel
        {...defaultProps}
        status="complete"
        imageUrl="/api/images/test.png"
        generationId={null}
      />
    );
    expect(screen.queryByTestId("preview-gallery-link")).not.toBeInTheDocument();
  });
});
