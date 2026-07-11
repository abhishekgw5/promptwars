import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does not update the value before the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    act(() => { jest.advanceTimersByTime(100); });
    expect(result.current).toBe('initial');
  });

  it('updates the value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    act(() => { jest.advanceTimersByTime(300); });
    expect(result.current).toBe('updated');
  });

  it('resets the timer on rapid successive changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'ab' });
    act(() => { jest.advanceTimersByTime(100); });
    rerender({ value: 'abc' });
    act(() => { jest.advanceTimersByTime(100); });
    rerender({ value: 'abcd' });
    act(() => { jest.advanceTimersByTime(300); });

    // Only the final value should be emitted
    expect(result.current).toBe('abcd');
  });

  it('uses default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'start' } }
    );

    rerender({ value: 'end' });
    act(() => { jest.advanceTimersByTime(299); });
    expect(result.current).toBe('start');
    act(() => { jest.advanceTimersByTime(1); });
    expect(result.current).toBe('end');
  });
});
