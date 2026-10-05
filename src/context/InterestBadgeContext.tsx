import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getNavbarCounts } from '../api/profile';

const INTEREST_SEEN_COUNT_KEY = 'lastSeenInterestCount';

type InterestBadgeContextType = {
  newInterestCount: number;
  bumpInterestCount: (delta: number) => void;
  markInterestsSeen: () => Promise<void>;
};

const InterestBadgeContext = createContext<InterestBadgeContextType>(
  {} as InterestBadgeContextType,
);

// Tracks the "new since last visit" badge shown on the bottom tab bar's
// Interests tab. Previously this lived as local state inside MainTabs and
// was only ever computed once on mount, so adding/removing an interest from
// Home or Search never moved the badge until the app restarted. Lifting it
// here lets every screen with an interest toggle nudge the same shared
// count instantly via bumpInterestCount.
export const InterestBadgeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [newInterestCount, setNewInterestCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [counts, storedSeenCount] = await Promise.all([
        getNavbarCounts(),
        AsyncStorage.getItem(INTEREST_SEEN_COUNT_KEY),
      ]);
      const seenCount = Number(storedSeenCount || 0);
      setNewInterestCount(Math.max(0, counts.interestCount - seenCount));
    } catch {
      // keep previous count on failure
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNewInterestCount(0);
      return;
    }
    refresh();
  }, [user, refresh]);

  // Instant local nudge for the current user's own add/remove action, so the
  // tab badge updates immediately instead of waiting for the next app
  // launch. refresh() above still runs on login/mount to stay correct for
  // anything that happened elsewhere (e.g. another device).
  const bumpInterestCount = useCallback((delta: number) => {
    setNewInterestCount((current) => Math.max(0, current + delta));
  }, []);

  const markInterestsSeen = useCallback(async () => {
    try {
      const { interestCount } = await getNavbarCounts();
      await AsyncStorage.setItem(INTEREST_SEEN_COUNT_KEY, String(interestCount));
      setNewInterestCount(0);
    } catch {
      // If this fails, the badge simply stays as-is until the next successful check.
    }
  }, []);

  return (
    <InterestBadgeContext.Provider
      value={{ newInterestCount, bumpInterestCount, markInterestsSeen }}
    >
      {children}
    </InterestBadgeContext.Provider>
  );
};

export const useInterestBadge = () => useContext(InterestBadgeContext);
