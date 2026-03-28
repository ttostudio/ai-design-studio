import { render, screen, fireEvent } from "@testing-library/react";
import { TemplateSelector } from "@/components/TemplateSelector";
import { TEMPLATES } from "@/lib/templates";

describe("TemplateSelector", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders template-selector with data-testid", () => {
    render(<TemplateSelector selectedId={null} onChange={mockOnChange} />);
    expect(screen.getByTestId("template-selector")).toBeInTheDocument();
  });

  it("renders all templates plus custom", () => {
    render(<TemplateSelector selectedId={null} onChange={mockOnChange} />);
    expect(screen.getByTestId("template-chip-custom")).toBeInTheDocument();
    for (const t of TEMPLATES) {
      expect(screen.getByTestId(`template-chip-${t.id}`)).toBeInTheDocument();
    }
  });

  it("calls onChange with null when Custom is clicked", () => {
    render(<TemplateSelector selectedId="blog-thumbnail" onChange={mockOnChange} />);
    fireEvent.click(screen.getByTestId("template-chip-custom"));
    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it("calls onChange with template when a chip is clicked", () => {
    render(<TemplateSelector selectedId={null} onChange={mockOnChange} />);
    fireEvent.click(screen.getByTestId("template-chip-blog-thumbnail"));
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ id: "blog-thumbnail" })
    );
  });

  it("highlights selected template chip", () => {
    render(<TemplateSelector selectedId="blog-thumbnail" onChange={mockOnChange} />);
    const chip = screen.getByTestId("template-chip-blog-thumbnail");
    // Selected chip should have accent color background
    expect(chip).toHaveStyle({ backgroundColor: "var(--color-accent)" });
  });

  it("highlights custom chip when selectedId is null", () => {
    render(<TemplateSelector selectedId={null} onChange={mockOnChange} />);
    const chip = screen.getByTestId("template-chip-custom");
    expect(chip).toHaveStyle({ backgroundColor: "var(--color-accent)" });
  });
});
