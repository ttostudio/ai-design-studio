import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GalleryListView } from "@/components/GalleryListView";
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
  prompt: "A futuristic city",
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

describe("GalleryListView", () => {
  const mockOnCardClick = jest.fn();
  const mockToggleFavorite = api.toggleFavorite as jest.MockedFunction<typeof api.toggleFavorite>;

  beforeEach(() => {
    mockOnCardClick.mockClear();
    mockToggleFavorite.mockClear();
  });

  it("renders empty state when no generations", () => {
    render(<GalleryListView generations={[]} onCardClick={mockOnCardClick} />);
    expect(screen.getByTestId("gallery-empty")).toBeInTheDocument();
  });

  it("renders list with generations", () => {
    render(<GalleryListView generations={[mockGen]} onCardClick={mockOnCardClick} />);
    expect(screen.getByTestId("gallery-list")).toBeInTheDocument();
    expect(screen.getByTestId(`gallery-list-item-${mockGen.id}`)).toBeInTheDocument();
  });

  it("shows favorite button with correct aria-pressed", () => {
    render(<GalleryListView generations={[mockGen]} onCardClick={mockOnCardClick} />);
    const favBtn = screen.getByTestId(`gallery-card-favorite-${mockGen.id}`);
    expect(favBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("shows active favorite button when is_favorite=true", () => {
    render(<GalleryListView generations={[{ ...mockGen, is_favorite: true }]} onCardClick={mockOnCardClick} />);
    const favBtn = screen.getByTestId(`gallery-card-favorite-${mockGen.id}`);
    expect(favBtn).toHaveAttribute("aria-pressed", "true");
    expect(favBtn).toHaveAttribute("aria-label", "お気に入りから削除");
  });

  it("toggles favorite optimistically", async () => {
    mockToggleFavorite.mockResolvedValueOnce(undefined);
    render(<GalleryListView generations={[mockGen]} onCardClick={mockOnCardClick} />);
    const favBtn = screen.getByTestId(`gallery-card-favorite-${mockGen.id}`);
    fireEvent.click(favBtn);
    expect(favBtn).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      expect(mockToggleFavorite).toHaveBeenCalledWith(mockGen.id, true);
    });
  });

  it("shows detail link", () => {
    render(<GalleryListView generations={[mockGen]} onCardClick={mockOnCardClick} />);
    const link = screen.getByTestId(`gallery-card-detail-link-${mockGen.id}`);
    expect(link).toHaveAttribute("href", `/gallery/${mockGen.id}`);
  });

  it("renders multiple items", () => {
    const gen2 = { ...mockGen, id: "gen_xyz98765432109876" };
    render(<GalleryListView generations={[mockGen, gen2]} onCardClick={mockOnCardClick} />);
    expect(screen.getByTestId(`gallery-list-item-${mockGen.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`gallery-list-item-${gen2.id}`)).toBeInTheDocument();
  });
});
