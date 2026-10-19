import React from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTestAppStore, TestProviders } from '#mocks';
import { mergeSyncedPrefs } from '#prefs/prefsSlice';

import { PrivacyFilter } from './PrivacyFilter';

const FIGURE = 'R$ 1.234,56';

/**
 * A figure inside something that acts on a press, which is where most of them
 * live on a phone: an account row, a budget cell.
 */
function renderFigure(isPrivacyEnabled: boolean, figure = FIGURE) {
  const store = createTestAppStore();
  store.dispatch(
    mergeSyncedPrefs({ isPrivacyEnabled: String(isPrivacyEnabled) }),
  );
  const onRowPointerDown = vi.fn();
  const onRowPress = vi.fn();
  const row = (text: string) => (
    <TestProviders store={store}>
      <button
        type="button"
        onPointerDown={onRowPointerDown}
        onClick={onRowPress}
      >
        <PrivacyFilter>{text}</PrivacyFilter>
      </button>
    </TestProviders>
  );
  const view = render(row(figure));

  return {
    onRowPointerDown,
    onRowPress,
    container: view.container,
    showAnotherFigure: (text: string) => view.rerender(row(text)),
  };
}

/** The box the filter draws around a figure: the figure, then its twin. */
function overlayOf(figure: string) {
  const overlay = screen.getByText(figure).parentElement;
  if (!overlay) {
    throw new Error('The figure is not inside an overlay');
  }
  return overlay;
}

function tap(element: Element) {
  fireEvent.pointerDown(element, { pointerType: 'touch' });
  fireEvent.click(element);
}

afterEach(() => {
  vi.useRealTimers();
});

describe('PrivacyFilter', () => {
  it('prints the figure as it is while the mode is off', () => {
    const { container } = renderFigure(false);

    expect(screen.getByText(FIGURE)).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('puts a redacted twin over the figure while the mode is on', () => {
    const { container } = renderFigure(true);

    const twin = container.querySelector('[aria-hidden="true"]');
    expect(twin).toHaveTextContent('R**1*234*56');
    expect(overlayOf(FIGURE)).not.toHaveAttribute('data-revealed');
  });

  it('shows the figure on a tap and keeps the press from what it sits in', () => {
    const { onRowPointerDown, onRowPress } = renderFigure(true);

    tap(screen.getByText(FIGURE));

    expect(overlayOf(FIGURE)).toHaveAttribute('data-revealed');
    expect(onRowPointerDown).not.toHaveBeenCalled();
    expect(onRowPress).not.toHaveBeenCalled();
  });

  it('lets a tap through once the figure is showing, and hides it', () => {
    const { onRowPointerDown, onRowPress } = renderFigure(true);

    tap(screen.getByText(FIGURE));
    tap(screen.getByText(FIGURE));

    expect(overlayOf(FIGURE)).not.toHaveAttribute('data-revealed');
    expect(onRowPointerDown).toHaveBeenCalledTimes(1);
    expect(onRowPress).toHaveBeenCalledTimes(1);
  });

  it('hides a figure it has shown after five seconds', () => {
    vi.useFakeTimers();
    renderFigure(true);

    tap(screen.getByText(FIGURE));
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(overlayOf(FIGURE)).toHaveAttribute('data-revealed');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(overlayOf(FIGURE)).not.toHaveAttribute('data-revealed');
  });

  it('hides a figure it has shown when the page goes to the background', () => {
    renderFigure(true);
    tap(screen.getByText(FIGURE));
    expect(overlayOf(FIGURE)).toHaveAttribute('data-revealed');

    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    hidden.mockRestore();

    expect(overlayOf(FIGURE)).not.toHaveAttribute('data-revealed');
  });

  it('starts over, hidden, when another figure takes its place', () => {
    const { showAnotherFigure } = renderFigure(true);
    tap(screen.getByText(FIGURE));
    expect(overlayOf(FIGURE)).toHaveAttribute('data-revealed');

    showAnotherFigure('R$ 9.876,54');

    expect(overlayOf('R$ 9.876,54')).not.toHaveAttribute('data-revealed');
  });

  it('leaves a mouse alone: it reveals by hovering, and its click acts', () => {
    const { onRowPointerDown, onRowPress } = renderFigure(true);
    const figure = screen.getByText(FIGURE);

    fireEvent.pointerDown(figure, { pointerType: 'mouse' });
    fireEvent.click(figure);

    expect(overlayOf(FIGURE)).not.toHaveAttribute('data-revealed');
    expect(onRowPointerDown).toHaveBeenCalledTimes(1);
    expect(onRowPress).toHaveBeenCalledTimes(1);
  });
});
