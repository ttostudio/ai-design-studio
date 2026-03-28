import { render, screen, fireEvent } from "@testing-library/react";
import { WorkflowSelector } from "@/components/WorkflowSelector";

describe("WorkflowSelector", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders with data-testid", () => {
    render(<WorkflowSelector value="flux-gguf" onChange={mockOnChange} />);
    expect(screen.getByTestId("workflow-selector")).toBeInTheDocument();
    expect(screen.getByTestId("workflow-select")).toBeInTheDocument();
  });

  it("shows current workflow value", () => {
    render(<WorkflowSelector value="flux-gguf" onChange={mockOnChange} />);
    const select = screen.getByTestId("workflow-select") as HTMLSelectElement;
    expect(select.value).toBe("flux-gguf");
  });

  it("shows sd15 value when set", () => {
    render(<WorkflowSelector value="sd15" onChange={mockOnChange} />);
    const select = screen.getByTestId("workflow-select") as HTMLSelectElement;
    expect(select.value).toBe("sd15");
  });

  it("calls onChange when selection changes", () => {
    render(<WorkflowSelector value="flux-gguf" onChange={mockOnChange} />);
    fireEvent.change(screen.getByTestId("workflow-select"), {
      target: { value: "sd15" },
    });
    expect(mockOnChange).toHaveBeenCalledWith("sd15");
  });

  it("is disabled when disabled prop is true", () => {
    render(<WorkflowSelector value="flux-gguf" onChange={mockOnChange} disabled />);
    expect(screen.getByTestId("workflow-select")).toBeDisabled();
  });

  it("renders both workflow options", () => {
    render(<WorkflowSelector value="flux-gguf" onChange={mockOnChange} />);
    const select = screen.getByTestId("workflow-select");
    expect(select).toContainHTML("flux-gguf");
    expect(select).toContainHTML("sd15");
  });
});
