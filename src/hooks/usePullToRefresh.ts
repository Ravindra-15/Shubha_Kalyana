import { useCallback, useState } from 'react';

/**
 * Wraps an existing async data-loading function with a `refreshing` flag,
 * for wiring native pull-to-refresh (FlatList's refreshing/onRefresh props,
 * or ScrollView's <RefreshControl>) without duplicating fetch logic.
 */
export function usePullToRefresh(refresh: () => Promise<unknown> | unknown) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return { refreshing, onRefresh };
}
