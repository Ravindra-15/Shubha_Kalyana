import { useRef, useCallback } from 'react';
import { View, ScrollView } from 'react-native';

export function useScrollToError() {
  const scrollRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<Record<string, View | null>>({});

  const registerField = useCallback(
    (key: string) => (node: View | null) => {
      fieldRefs.current[key] = node;
    },
    []
  );

  const scrollToError = useCallback((errorKeys: string[], order: string[]) => {
    const firstKey = order.find((k) => errorKeys.includes(k));
    if (!firstKey) return;
    const node = fieldRefs.current[firstKey] as any;
    const scrollNode = scrollRef.current as any;
    if (!node || !scrollNode || !node.measureLayout) return;
    node.measureLayout(
      scrollNode,
      (_x: number, y: number) => {
        scrollNode.scrollTo({ y: Math.max(y - 24, 0), animated: true });
      },
      () => {}
    );
  }, []);

  return { scrollRef, registerField, scrollToError };
}
