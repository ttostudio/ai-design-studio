import { render, screen, fireEvent } from "@testing-library/react";
import { GalleryGrid } from "@/components/GalleryGrid";
import type { Generation } from "@/lib/api";

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const mockGeneration: Generation = {
  id: "gen_abc12345678901234",
  prompt: "a beautiful landscape with mountains",
  negative_prompt: null,
  workflow: "flux-gguf",
  width: 1024,
  height: 576,
  steps: 4,
  cfg_scale: 1.0,
  seed: 12345,
  template_id: "blog-thumbnail",
  image_url: "/api/images/test.png",
  execution_time: 5000,
  status: "success",
  created_at: "2026-03-28T10:00:00Z",
};

describe("GalleryGrid", () => {
  const mockOnCardClick = jest.fn();

  beforeEach(() => {
    mockOnCardClick.mockClear();
  });

  it("renders empty state when no generations", () => {
    render(<GalleryGrid generations={[]} onCardClick={mockOnCardClick} />);
    expect(screen.getByTestId("gallery-empty")).toBeInTheDocument();
    expect(screen.getByText("まだ生成画像がありません")).toBeInTheDocument();
  });

  it("renders grid with generations", () => {
    render(<GalleryGrid generations={[mockGeneration]} onCardClick={mockOnCardClick} />);
    expect(screen.getByTestId("gallery-grid")).toBeInTheDocument();
    expect(screen.getByTestId(`gallery-card-${mockGeneration.id}`)).toBeInTheDocument();
  });

  it("shows prompt text in card", () => {
    render(<GalleryGrid generations={[mockGeneration]} onCardClick={mockOnCardClick} />);
    expect(screen.getByTestId(`gallery-card-${mockGeneration.id}`))
      .toHaveTextContent("a beautiful landscape");
  });

  it("shows template label when template_id is set", () => {
    render(<GalleryGrid generations={[mockGeneration]} onCardClick={mockOnCardClick} />);
    expect(screen.getByTestId("gallery-card-template")).toHaveTextContent("ブログサムネイル");
  });

  it("does not show template label when template_id is null", () => {
    const gen = { ...mockGeneration, template_id: null };
    render(<GalleryGrid generations={[gen]} onCardClick={mockOnCardClick} />);
    expect(screen.queryByTestId("gallery-card-template")).not.toBeInTheDocument();
  });

  it("calls onCardClick when card is clicked", () => {
    render(<GalleryGrid generations={[mockGeneration]} onCardClick={mockOnCardClick} />);
    fireEvent.click(screen.getByTestId(`gallery-card-${mockGeneration.id}`));
    expect(mockOnCardClick).toHaveBeenCalledWith(mockGeneration);
  });

  it("renders multiple cards", () => {
    const gen2 = { ...mockGeneration, id: "gen_xyz98765432109876" };
    render(
      <GalleryGrid generations={[mockGeneration, gen2]} onCardClick={mockOnCardClick} />
    );
    expect(screen.getByTestId(`gallery-card-${mockGeneration.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`gallery-card-${gen2.id}`)).toBeInTheDocument();
  });
});
