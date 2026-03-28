import { render, screen, fireEvent } from "@testing-library/react";
import { PromptInput } from "@/components/PromptInput";

const defaultProps = {
  prompt: "",
  onPromptChange: jest.fn(),
  negativePrompt: "",
  onNegativePromptChange: jest.fn(),
  showNegative: false,
  promptPrefix: null,
};

describe("PromptInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with data-testid", () => {
    render(<PromptInput {...defaultProps} />);
    expect(screen.getByTestId("prompt-input")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-textarea")).toBeInTheDocument();
  });

  it("shows character count", () => {
    render(<PromptInput {...defaultProps} prompt="hello" />);
    expect(screen.getByTestId("prompt-count")).toHaveTextContent("5 / 1000");
  });

  it("calls onPromptChange when typing", () => {
    const onPromptChange = jest.fn();
    render(<PromptInput {...defaultProps} onPromptChange={onPromptChange} />);
    fireEvent.change(screen.getByTestId("prompt-textarea"), {
      target: { value: "new prompt" },
    });
    expect(onPromptChange).toHaveBeenCalledWith("new prompt");
  });

  it("hides negative prompt when showNegative is false", () => {
    render(<PromptInput {...defaultProps} showNegative={false} />);
    expect(screen.queryByTestId("negative-prompt-wrapper")).not.toBeInTheDocument();
  });

  it("shows negative prompt when showNegative is true", () => {
    render(<PromptInput {...defaultProps} showNegative={true} />);
    expect(screen.getByTestId("negative-prompt-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("negative-prompt-textarea")).toBeInTheDocument();
  });

  it("shows prompt prefix badge when provided", () => {
    render(<PromptInput {...defaultProps} promptPrefix="blog thumbnail, " />);
    expect(screen.getByTestId("prompt-prefix-badge")).toBeInTheDocument();
    expect(screen.getByTestId("prompt-prefix-badge")).toHaveTextContent("blog thumbnail,");
  });

  it("hides prompt prefix badge when null", () => {
    render(<PromptInput {...defaultProps} promptPrefix={null} />);
    expect(screen.queryByTestId("prompt-prefix-badge")).not.toBeInTheDocument();
  });

  it("disables textarea when disabled prop is true", () => {
    render(<PromptInput {...defaultProps} disabled />);
    expect(screen.getByTestId("prompt-textarea")).toBeDisabled();
  });

  it("shows error color when prompt exceeds 1000 chars", () => {
    const longPrompt = "a".repeat(1001);
    render(<PromptInput {...defaultProps} prompt={longPrompt} />);
    const count = screen.getByTestId("prompt-count");
    expect(count).toHaveStyle({ color: "var(--color-error)" });
  });
});
