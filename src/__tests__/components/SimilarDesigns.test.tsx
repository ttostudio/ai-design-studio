import { render, screen } from "@testing-library/react";
import { SimilarDesigns } from "@/components/SimilarDesigns";
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

const mockGen: Generation = {
  id: "gen_abc12345678901234",
  prompt: "A similar design",
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

describe("SimilarDesigns", () => {
  it("renders nothing when empty", () => {
    const { container } = render(<SimilarDesigns generations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders section with designs", () => {
    render(<SimilarDesigns generations={[mockGen]} />);
    expect(screen.getByText("類似デザイン")).toBeInTheDocument();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders links to each design", () => {
    const gen2 = { ...mockGen, id: "gen_xyz98765432109876" };
    render(<SimilarDesigns generations={[mockGen, gen2]} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", `/gallery/${mockGen.id}`);
    expect(links[1]).toHaveAttribute("href", `/gallery/${gen2.id}`);
  });

  it("renders prompt text for each design", () => {
    render(<SimilarDesigns generations={[mockGen]} />);
    expect(screen.getByText("A similar design")).toBeInTheDocument();
  });
});
