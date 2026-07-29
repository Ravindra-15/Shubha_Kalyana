const toScoreNumber = (value: unknown) => {
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace('%', '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getMatchPercentScore = (profile: {
  matchPercent?: unknown;
  matchPercentage?: unknown;
}) => {
  return toScoreNumber(profile.matchPercent ?? profile.matchPercentage ?? 0);
};

export const sortProfilesByMatchPercent = <
  T extends { matchPercent?: unknown; matchPercentage?: unknown },
>(
  profiles: T[] = [],
) => {
  return [...profiles].sort(
    (profileA, profileB) =>
      getMatchPercentScore(profileB) - getMatchPercentScore(profileA),
  );
};
