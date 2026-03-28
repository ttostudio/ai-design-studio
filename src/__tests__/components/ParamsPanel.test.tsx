import { render, screen, fireEvent } from "@testing-library/react";
import { ParamsPanel } from "@/components/ParamsPanel";

const defaultProps = {
  width: 1024,
  onWidthChange: jest.fn(),
  height: 576,
  onHeightChange: jest.fn(),
  steps: 20,
  onStepsChange: jest.fn(),
  seed: "",
  onSeedChange: jest.fn(),
};

describe("ParamsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with data-testid", () => {
    render(<ParamsPanel {...defaultProps} />);
    expect(screen.getByTestId("params-panel")).toBeInTheDocument();
  });

  it("shows width and height selects", () => {
    render(<ParamsPanel {...defaultProps} />);
    expect(screen.getByTestId("width-select")).toBeInTheDocument();
    expect(screen.getByTestId("height-select")).toBeInTheDocument();
  });

  it("shows current width value", () => {
    render(<ParamsPanel {...defaultProps} width={1024} />);
    const select = screen.getByTestId("width-select") as HTMLSelectElement;
    expect(select.value).toBe("1024");
  });

  it("calls onWidthChange when width changes", () => {
    const onWidthChange = jest.fn();
    render(<ParamsPanel {...defaultProps} onWidthChange={onWidthChange} />);
    fireEvent.change(screen.getByTestId("width-select"), { target: { value: "512" } });
    expect(onWidthChange).toHaveBeenCalledWith(512);
  });

  it("calls onHeightChange when height changes", () => {
    const onHeightChange = jest.fn();
    render(<ParamsPanel {...defaultProps} onHeightChange={onHeightChange} />);
    fireEvent.change(screen.getByTestId("height-select"), { target: { value: "768" } });
    expect(onHeightChange).toHaveBeenCalledWith(768);
  });

  it("shows steps slider and number input", () => {
    render(<ParamsPanel {...defaultProps} steps={20} />);
    expect(screen.getByTestId("steps-slider")).toBeInTheDocument();
    expect(screen.getByTestId("steps-number")).toBeInTheDocument();
  });

  it("calls onStepsChange via slider", () => {
    const onStepsChange = jest.fn();
    render(<ParamsPanel {...defaultProps} onStepsChange={onStepsChange} />);
    fireEvent.change(screen.getByTestId("steps-slider"), { target: { value: "30" } });
    expect(onStepsChange).toHaveBeenCalledWith(30);
  });

  it("shows seed input", () => {
    render(<ParamsPanel {...defaultProps} />);
    expect(screen.getByTestId("seed-input")).toBeInTheDocument();
  });

  it("calls onSeedChange when seed changes", () => {
    const onSeedChange = jest.fn();
    render(<ParamsPanel {...defaultProps} onSeedChange={onSeedChange} />);
    fireEvent.change(screen.getByTestId("seed-input"), { target: { value: "12345" } });
    expect(onSeedChange).toHaveBeenCalledWith("12345");
  });

  it("calls onSeedChange with random value when dice button is clicked", () => {
    const onSeedChange = jest.fn();
    render(<ParamsPanel {...defaultProps} onSeedChange={onSeedChange} />);
    fireEvent.click(screen.getByTestId("seed-random-btn"));
    expect(onSeedChange).toHaveBeenCalledTimes(1);
    const calledWith = onSeedChange.mock.calls[0][0] as string;
    expect(Number(calledWith)).toBeGreaterThanOrEqual(0);
  });

  it("disables inputs when disabled prop is true", () => {
    render(<ParamsPanel {...defaultProps} disabled />);
    expect(screen.getByTestId("width-select")).toBeDisabled();
    expect(screen.getByTestId("height-select")).toBeDisabled();
    expect(screen.getByTestId("steps-slider")).toBeDisabled();
    expect(screen.getByTestId("seed-input")).toBeDisabled();
    expect(screen.getByTestId("seed-random-btn")).toBeDisabled();
  });

  it("renders in accordion mode when onToggle is provided", () => {
    const onToggle = jest.fn();
    render(<ParamsPanel {...defaultProps} onToggle={onToggle} collapsed={true} />);
    expect(screen.getByTestId("params-toggle")).toBeInTheDocument();
  });

  it("calls onToggle when toggle button is clicked", () => {
    const onToggle = jest.fn();
    render(<ParamsPanel {...defaultProps} onToggle={onToggle} collapsed={false} />);
    fireEvent.click(screen.getByTestId("params-toggle"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("hides content when collapsed in accordion mode", () => {
    render(<ParamsPanel {...defaultProps} onToggle={jest.fn()} collapsed={true} />);
    expect(screen.queryByTestId("width-select")).not.toBeInTheDocument();
  });

  it("shows content when expanded in accordion mode", () => {
    render(<ParamsPanel {...defaultProps} onToggle={jest.fn()} collapsed={false} />);
    expect(screen.getByTestId("width-select")).toBeInTheDocument();
  });
});
