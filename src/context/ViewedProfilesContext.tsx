import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getMyViewedProfiles } from '../api/profile';

type ViewedProfilesContextType = {
  // True when this member has opened the profile (pass its profile id and/or
  // user id -- different cards know different ids).
  isProfileViewed: (...ids: Array<string | undefined | null>) => boolean;
  markProfileViewed: (...ids: Array<string | undefined | null>) => void;
};

const ViewedProfilesContext = createContext<ViewedProfilesContextType>({
  isProfileViewed: () => false,
  markProfileViewed: () => {},
});

// Profiles this member has opened, shared by every card so the same person's
// card shows "Profile Viewed" (green) on every screen. Loaded from the server
// on login (so it matches the web app and other devices), then added to the
// moment a profile is opened.
export const ViewedProfilesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      // Logged out: forget the previous member's views.
      setViewedIds(new Set());
      return;
    }
    getMyViewedProfiles()
      .then(({ profileIds, userIds }) => {
        if (cancelled) return;
        setViewedIds((current) => new Set([...current, ...profileIds, ...userIds]));
      })
      .catch(() => {
        // Not critical: cards just show "View Profile" until the next load.
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const markProfileViewed = useCallback(
    (...ids: Array<string | undefined | null>) => {
      const clean = ids.filter(Boolean).map(String);
      if (!clean.length) return;
      setViewedIds((current) =>
        clean.every((id) => current.has(id)) ? current : new Set([...current, ...clean]),
      );
    },
    [],
  );

  const isProfileViewed = useCallback(
    (...ids: Array<string | undefined | null>) =>
      ids.some((id) => Boolean(id) && viewedIds.has(String(id))),
    [viewedIds],
  );

  const value = useMemo(
    () => ({ isProfileViewed, markProfileViewed }),
    [isProfileViewed, markProfileViewed],
  );

  return (
    <ViewedProfilesContext.Provider value={value}>
      {children}
    </ViewedProfilesContext.Provider>
  );
};

export const useViewedProfiles = () => useContext(ViewedProfilesContext);
