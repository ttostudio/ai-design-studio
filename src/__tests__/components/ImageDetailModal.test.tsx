import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImageDetailModal } from "@/components/ImageDetailModal";
import * as api from "@/lib/api";
import type { Generation } from "@/lib/api";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  toggleFavorite: jest.fn(),
}));

const mockGen: Generation = {
  id: "gen_abc12345678901234",
  prompt: "test prompt",
  negative_prompt: null,
  workflow: "flux-gguf",
  width: 1024,
  height: 576,
  steps: 4,
  cfg_scale: 1.0,
  seed: 12345,
  template_id: null,
  image_url: "/api/images/test.png",
  execution_time: 5000,
  status: "success",
  created_at: "2026-04-01T10:00:00Z",
  tags: [],
  is_favorite: false,
};

describe("ImageDetailModal", () => {
  const mockOnClose = jest.fn();
  const mockToggleFavorite = api.toggleFavorite as jest.MockedFunction<typeof api.toggleFavorite>;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockToggleFavorite.mockClear();
  });

  it("renders modal with image", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    expect(screen.getByTestId("image-detail-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-image")).toBeInTheDocument();
  });

  it("displays prompt in modal-prompt area", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    expect(screen.getByTestId("modal-prompt")).toHaveTextContent("test prompt");
  });

  it("displays metadata correctly", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    expect(screen.getByText("Flux-schnell")).toBeInTheDocument();
    expect(screen.getByText("1024 × 576")).toBeInTheDocument();
    expect(screen.getAllByText("4")[0]).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
  });

  it("calls onClose when Escape key is pressed", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay is clicked", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId("image-detail-modal-overlay"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("does not close when modal content is clicked", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId("image-detail-modal"));
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("renders favorite button with aria-pressed=false initially", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    const favBtn = screen.getByTestId("modal-favorite-btn");
    expect(favBtn).toHaveAttribute("aria-pressed", "false");
    expect(favBtn).toHaveAttribute("aria-label", "お気に入りに追加");
  });

  it("renders favorite button active when is_favorite=true", () => {
    render(<ImageDetailModal generation={{ ...mockGen, is_favorite: true }} onClose={mockOnClose} />);
    const favBtn = screen.getByTestId("modal-favorite-btn");
    expect(favBtn).toHaveAttribute("aria-pressed", "true");
    expect(favBtn).toHaveAttribute("aria-label", "お気に入りから削除");
  });

  it("toggles favorite optimistically on click", async () => {
    mockToggleFavorite.mockResolvedValueOnce(undefined);
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    const favBtn = screen.getByTestId("modal-favorite-btn");
    fireEvent.click(favBtn);
    expect(favBtn).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith(mockGen.id, true);
    });
  });

  it("renders reuse prompt button", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    expect(screen.getByTestId("modal-reuse-btn")).toBeInTheDocument();
  });

  it("renders download button", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    expect(screen.getByTestId("modal-download-btn")).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<ImageDetailModal generation={mockGen} onClose={mockOnClose} />);
    fireEvent.click(screen.getByTestId("modal-close-btn"));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
