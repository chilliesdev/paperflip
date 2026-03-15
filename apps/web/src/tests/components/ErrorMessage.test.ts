import { render, screen, fireEvent, cleanup } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ErrorMessage from "../../lib/components/ErrorMessage.svelte";

describe("ErrorMessage Component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders with the provided message", () => {
    render(ErrorMessage, { props: { message: "Test Error" } });
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Test Error")).toBeInTheDocument();
  });

  it("calls onDismiss when close button is clicked", async () => {
    const onDismiss = vi.fn();
    render(ErrorMessage, { props: { message: "Test Error", onDismiss } });

    const closeButton = screen.getByLabelText("Dismiss");
    await fireEvent.click(closeButton);

    expect(onDismiss).toHaveBeenCalled();
  });

  it("auto-dismisses after duration", async () => {
    const onDismiss = vi.fn();
    render(ErrorMessage, {
      props: { message: "Test Error", duration: 3000, onDismiss },
    });

    expect(onDismiss).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(3000);

    expect(onDismiss).toHaveBeenCalled();
  });

  it("does not auto-dismiss if duration is 0", async () => {
    const onDismiss = vi.fn();
    render(ErrorMessage, {
      props: { message: "Test Error", duration: 0, onDismiss },
    });

    vi.advanceTimersByTime(10000);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("resets timer when message changes", async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(ErrorMessage, {
      props: { message: "Error 1", duration: 3000, onDismiss },
    });

    // Advance 2 seconds
    vi.advanceTimersByTime(2000);
    expect(onDismiss).not.toHaveBeenCalled();

    // Update message
    await rerender({ message: "Error 2", duration: 3000, onDismiss });

    // Advance another 2 seconds (total 4s from start, but should be 2s from update)
    vi.advanceTimersByTime(2000);
    expect(onDismiss).not.toHaveBeenCalled();

    // Advance another 1 second (total 3s from update)
    vi.advanceTimersByTime(1000);
    expect(onDismiss).toHaveBeenCalled();
  });
});
