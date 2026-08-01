const DEFAULT_SINGLE_PROFILE_UNLOCK_LIMIT = 3;

const numberOrDefault = (value: any, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

export const getSingleProfileUnlockLimit = (access: any) =>
  numberOrDefault(access?.singleProfileUnlockLimit, DEFAULT_SINGLE_PROFILE_UNLOCK_LIMIT);

export const getSingleProfileUnlocksRemaining = (access: any) =>
  Math.max(
    numberOrDefault(
      access?.singleProfileUnlocksRemaining,
      getSingleProfileUnlockLimit(access),
    ),
    0,
  );

export const isFreePlanSingleUnlockLimitReached = (access: any) =>
  Boolean(access && !access.hasActiveMembership && access.singleProfileUnlockLimitReached);

export const getSingleProfileUnlockRemainingLabel = (access: any) => {
  const remaining = getSingleProfileUnlocksRemaining(access);
  const limit = getSingleProfileUnlockLimit(access);
  return `${remaining} of ${limit} single profile unlock${limit === 1 ? '' : 's'} remaining`;
};

export const getSingleProfileUnlockLimitMessage = (access: any) =>
  `You have used your ${getSingleProfileUnlockLimit(
    access,
  )} single profile unlocks. Please buy any membership to continue.`;
