import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePagination } from '../usePagination.js';

describe('usePagination', () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1);

  it('returns the selected slice and advances between pages', () => {
    const { result } = renderHook(() => usePagination(items));

    expect(result.current.visibleItems).toEqual(items.slice(0, 10));
    act(() => result.current.setPage(3));
    expect(result.current.visibleItems).toEqual([21, 22, 23]);
  });

  it('resets page when the filter changes and clamps when results shrink', () => {
    const { result, rerender } = renderHook(
      ({ currentItems, filter }) => usePagination(currentItems, filter),
      { initialProps: { currentItems: items, filter: '' } },
    );

    act(() => result.current.setPage(3));
    rerender({ currentItems: [1, 2, 3], filter: 'new filter' });

    expect(result.current.page).toBe(1);
    expect(result.current.visibleItems).toEqual([1, 2, 3]);
  });

  it('resets to the first page when the page size changes', () => {
    const { result } = renderHook(() => usePagination(items));
    act(() => result.current.setPage(3));
    act(() => result.current.setPageSize(25));

    expect(result.current.page).toBe(1);
    expect(result.current.visibleItems).toEqual(items);
  });
});
