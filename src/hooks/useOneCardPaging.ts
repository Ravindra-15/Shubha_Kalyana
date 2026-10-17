import { useRef, useState } from 'react';
import { FlatList } from 'react-native';

/**
 * One-card-per-swipe scrolling for vertical profile-card lists (Shaadi.com
 * style): every swipe, short or long, stops on the very next/previous card.
 *
 * Each row's height is measured (cards can differ) and a card's top is the
 * sum of everything above it -- onLayout's y can't be used because it's
 * relative to FlatList's own per-row wrapper (always 0). When a swipe
 * starts, the list may only snap to the card above, the current one, or the
 * one below, so a swipe that drags past the next card's top still stops on
 * that next card instead of skipping ahead.
 *
 * Usage: wrap each row in a View with `marginBottom: gap` and
 * `onLayout={(e) => onRowLayout(index, e.nativeEvent.layout.height)}`, give
 * the FlatList `ref={listRef}` and `{...pagingProps}`. A ListHeaderComponent
 * reports its height through onHeaderLayout.
 *
 * rowMinHeight: each row should be at least this tall (use it as the row's
 * minHeight with a "fill" card) so one card takes the screen and only a
 * PEEK-high strip of the next card shows below it, inviting the next swipe.
 * null until the list has been measured.
 */
const PEEK = 60;

export function useOneCardPaging(itemCount: number, gap: number, enabled = true) {
  const listRef = useRef<FlatList<any>>(null);
  const rowHeights = useRef<number[]>([]);
  const headerHeight = useRef(0);
  const gestureSnaps = useRef<number[]>([]);
  const [snapOffsets, setSnapOffsets] = useState<number[]>([]);
  const [listHeight, setListHeight] = useState(0);
  const rowMinHeight = enabled && listHeight ? Math.max(0, listHeight - gap - PEEK) : null;

  const onRowLayout = (index: number, height: number) => {
    rowHeights.current[index] = height;
  };
  const onHeaderLayout = (height: number) => {
    headerHeight.current = height;
  };
  // Call when a row is removed from the list, so later rows' measured
  // heights shift up with them.
  const onRowRemoved = (index: number) => {
    rowHeights.current.splice(index, 1);
  };

  const getRowTops = () => {
    const tops: number[] = [];
    let top = headerHeight.current;
    for (let i = 0; i < itemCount; i++) {
      const h = rowHeights.current[i];
      if (h == null) break; // not rendered/measured yet
      tops.push(i === 0 ? 0 : top); // first card: back to the very top
      top += h + gap;
    }
    return tops;
  };

  const onSwipeStart = (y: number) => {
    const tops = getRowTops();
    if (!tops.length) return;
    let current = 0;
    tops.forEach((top, i) => {
      if (Math.abs(top - y) < Math.abs(tops[current] - y)) current = i;
    });
    const snaps = [tops[current - 1], tops[current], tops[current + 1]].filter(
      (v): v is number => v != null,
    );
    gestureSnaps.current = snaps;
    setSnapOffsets(snaps);
  };

  // Fallback for a swipe longer than a whole card: Android then leaves the
  // list where the finger let go, so settle it on the nearest allowed card.
  const onSwipeSettled = (y: number, maxOffset: number) => {
    // The last card usually can't scroll all the way to the top.
    const snaps = gestureSnaps.current.map((v) => Math.min(v, Math.max(0, maxOffset)));
    if (!snaps.length || snaps.some((v) => Math.abs(v - y) < 2)) return;
    const last = snaps[snaps.length - 1];
    const target =
      y > last
        ? last
        : y < snaps[0]
          ? snaps[0]
          : snaps.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
    listRef.current?.scrollToOffset({ offset: target, animated: true });
  };

  const pagingProps = enabled
    ? {
        snapToOffsets: snapOffsets,
        snapToStart: false,
        snapToEnd: false,
        decelerationRate: 'fast' as const,
        onLayout: (e: any) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h && h !== listHeight) setListHeight(h);
        },
        disableIntervalMomentum: true,
        onScrollBeginDrag: (e: any) => onSwipeStart(e.nativeEvent.contentOffset.y),
        onMomentumScrollEnd: (e: any) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          onSwipeSettled(contentOffset.y, contentSize.height - layoutMeasurement.height);
        },
      }
    : {};

  return { listRef, onRowLayout, onHeaderLayout, onRowRemoved, pagingProps, rowMinHeight };
}
