import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReadingOptionsSheet from '$lib/components/ReadingOptionsSheet.svelte';
import { playbackRate, autoScroll } from '$lib/stores/audio';
import { get } from 'svelte/store';

describe('ReadingOptionsSheet', () => {
  const onCloseMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    playbackRate.set(1.0);
    autoScroll.set(false);
  });

  it('renders correctly', () => {
    render(ReadingOptionsSheet, { onClose: onCloseMock });

    expect(screen.getByText('Adjust Speed')).toBeInTheDocument();
    expect(screen.getByText('Auto Scroll')).toBeInTheDocument();
    expect(screen.getByText('0.5x')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('updates playbackRate when speed buttons are clicked', async () => {
    render(ReadingOptionsSheet, { onClose: onCloseMock });

    // Click 0.5x
    const btn05 = screen.getByText('0.5x');
    await fireEvent.click(btn05);
    expect(get(playbackRate)).toBe(0.5);

    // Click 2x
    const btn20 = screen.getByText('2x');
    await fireEvent.click(btn20);
    expect(get(playbackRate)).toBe(2.0);
  });

  it('toggles autoScroll when switch is clicked', async () => {
    render(ReadingOptionsSheet, { onClose: onCloseMock });

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    await fireEvent.click(toggle);
    expect(get(autoScroll)).toBe(true);
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    await fireEvent.click(toggle);
    expect(get(autoScroll)).toBe(false);
  });

  it('calls onClose when backdrop is clicked', async () => {
    render(ReadingOptionsSheet, { onClose: onCloseMock });

    const backdrop = screen.getByLabelText('Close options');
    await fireEvent.click(backdrop);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('calls onClose when handle is clicked', async () => {
    render(ReadingOptionsSheet, { onClose: onCloseMock });

    const handle = screen.getByTestId('sheet-handle');
    await fireEvent.click(handle);

    expect(onCloseMock).toHaveBeenCalled();
  });
});
