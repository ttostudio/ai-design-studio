import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GalleryCard } from "@/components/GalleryCard";
import * as api from "@/lib/api";
import type { Generation } from "@/lib/api";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  toggleFavorite: jest.fn(),
}));

const mockGen: Generation = {
  id: "gen_abc12345678901234",
  prompt: "A beautiful sunset",
  negative_prompt: null,
  workflow: "flux-gguf",
  width: 1024,
  height: 576,
  steps: 4,
  cfg_scale: 1.0,
  seed: 42,
  template_id: "blog-thumbnail",
  image_url: "/api/images/test.png",
  execution_time: 5000,
  status: "success",
  created_at: "2026-04-01T10:00:00Z",
  tags: [],
  is_favorite: false,
};

describe("GalleryCard", () => {
  const mockOnClick = jest.fn();
  const mockToggleFavorite = api.toggleFavorite as jest.MockedFunction<typeof api.toggleFavorite>;

  beforeEach(() => {
    mockOnClick.mockClear();
    mockToggleFavorite.mockClear();
  });

  it("renders card with image", () => {
    render(<GalleryCard generation={mockGen} onClick={mockOnClick} />);
    expect(screen.getByTestId(`gallery-card-${mockGen.id}`)).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", mockGen.image_url);
  });

  it("renders template label", () => {
    render(<GalleryCard generation={mockGen} onClick={mockOnClick} />);
    expect(screen.getByTestId("gallery-card-template")).toHaveTextContent("ブログサムネイル");
  });

  it("does not show template label when template_id is null", () => {
    render(<GalleryCard generation={{ ...mockGen, template_id: null }} onClick={mockOnClick} />);
    expect(screen.queryByTestId("gallery-card-template")).not.toBeInTheDocument();
  });

  it("calls onClick when card button is clicked", () => {
    render(<GalleryCard generation={mockGen} onClick={mockOnClick} />);
    fireEvent.click(screen.getByTestId(`gallery-card-${mockGen.id}`));
    expect(mockOnClick).toHaveBeenCalledWith(mockGen);
  });

  it("renders favorite button with aria-pressed=false when not favorite", () => {
    render(<GalleryCard generation={mockGen} onClick={mockOnClick} />);
    const favBtn = screen.getByTestId(`gallery-card-favorite-${mockGen.id}`);
    expect(favBtn).toHaveAttribute("aria-pressed", "false");
    expect(favBtn).toHaveAttribute("aria-label", "お気に入りに追加");
  });

  it("renders favorite button with aria-pressed=true when is_favorite=true", () => {
    render(<GalleryCard generation={{ ...mockGen, is_favorite: true }} onClick={mockOnClick} />);
    const favBtn = screen.getByTestId(`gallery-card-favorite-${mockGen.id}`);
    expect(favBtn).toHaveAttribute("aria-pressed", "true");
    expect(favBtn).toHaveAttribute("aria-label", "お気に入りから削除");
  });

  it("toggles favorite on click (optimistic update)", async () => {
    mockToggleFavorite.mockResolvedValueOnce(undefined);
    render(<GalleryCard generation={mockGen} onClick={mockOnClick} />);
    const favBtn = screen.getByTestId(`gallery-card-favorite-${mockGen.id}`);
    fireEvent.click(favBtn);
    expect(favBtn).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith(mockGen.id, true);
    });
  });

  it("rolls back favorite on API failure", async () => {
    mockToggleFavorite.mockRejectedValueOnce(new Error("fail"));
    render(<GalleryCard generation={mockGen} onClick={mockOnClick} />);
    const favBtn = screen.getByTestId(`gallery-card-favorite-${mockGen.id}`);
    fireEvent.click(favBtn);
    expect(favBtn).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(favBtn).toHaveAttribute("aria-pressed", "false");
    });
  });

  it("favorite button click does not propagate to card onClick", () => {
    render(<GalleryCard generation={mockGen} onClick={mockOnClick} />);
    const favBtn = screen.getByTestId(`gallery-card-favorite-${mockGen.id}`);
    fireEvent.click(favBtn);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it("renders detail link", () => {
    render(<GalleryCard generation={mockGen} onClick={mockOnClick} />);
    const link = screen.getByTestId(`gallery-card-detail-link-${mockGen.id}`);
    expect(link).toHaveAttribute("href", `/gallery/${mockGen.id}`);
  });
});
