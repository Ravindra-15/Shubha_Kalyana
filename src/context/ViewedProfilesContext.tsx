import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import { useAuth } from './AuthContext';
import { getMyViewedProfiles } from '../api/profile';
import { CONTACT_VIEWED_EVENT } from '../api/membershipPayment';

type ViewedProfilesContextType = {
  // True when this member has viewed this person's contact (pass the profile
  // id and/or user id -- different cards know different ids).
  isProfileViewed: (...ids: Array<string | undefined | null>) => boolean;
  markProfileViewed: (...ids: Array<string | undefined | null>) => void;
};

const ViewedProfilesContext = createContext<ViewedProfilesContextType>({
  isProfileViewed: () => false,
  markProfileViewed: () => {},
});

// Everyone whose CONTACT this member has viewed (just opening a profile
// doesn't count), shared by every card so that person's card shows "Profile
// Viewed" (green) on every screen. Loaded from the server on login (so it
// matches the web app and other devices), added to the moment a contact is
// viewed, and re-checked when the app comes back to the foreground.
export const ViewedProfilesProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => new Set());

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

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      // Logged out: forget the previous member's list.
      setViewedIds(new Set());
      return;
    }
    const load = () =>
      getMyViewedProfiles()
        .then(({ profileIds, userIds }) => {
          if (!cancelled) markProfileViewed(...profileIds, ...userIds);
        })
        .catch(() => {
          // Not critical: cards just show "View Profile" until the next load.
        });

    // A contact was just viewed on some screen: turn that person's cards
    // green now, then reload so cards that only know the user id update too.
    const contactSub = DeviceEventEmitter.addListener(
      CONTACT_VIEWED_EVENT,
      (profileId: string) => {
        markProfileViewed(profileId);
        load();
      },
    );
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });

    load();
    return () => {
      cancelled = true;
      contactSub.remove();
      appStateSub.remove();
    };
  }, [user, markProfileViewed]);

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
