import { render, screen } from "@testing-library/react";
import { ProgressBar } from "@/components/ProgressBar";

describe("ProgressBar", () => {
  it("renders with data-testid", () => {
    render(<ProgressBar progress={50} />);
    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
  });

  it("shows correct percentage text", () => {
    render(<ProgressBar progress={75} />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("clamps progress to 0-100", () => {
    const { rerender } = render(<ProgressBar progress={-10} />);
    expect(screen.getByText("0%")).toBeInTheDocument();

    rerender(<ProgressBar progress={150} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("sets aria attributes correctly", () => {
    render(<ProgressBar progress={30} />);
    const progressBar = screen.getByRole("progressbar");
    expect(progressBar).toHaveAttribute("aria-valuenow", "30");
    expect(progressBar).toHaveAttribute("aria-valuemin", "0");
    expect(progressBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("fill width reflects progress", () => {
    render(<ProgressBar progress={60} />);
    const fill = screen.getByTestId("progress-bar-fill");
    expect(fill).toHaveStyle({ width: "60%" });
  });

  it("accepts custom data-testid", () => {
    render(<ProgressBar progress={50} data-testid="custom-bar" />);
    expect(screen.getByTestId("custom-bar")).toBeInTheDocument();
  });
});
