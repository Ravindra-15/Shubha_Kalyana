const FREE_PLAN_NAMES = new Set([
  'free',
  'free plan',
  'default',
  'default plan',
]);

const normalizePlanName = (value: unknown) =>
  String(value || '')
    .trim()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();

const numericValue = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const unwrapMembership = (membership: any) => {
  if (
    membership &&
    Object.prototype.hasOwnProperty.call(membership, 'data') &&
    Object.prototype.hasOwnProperty.call(membership, 'success')
  ) {
    return membership.data || null;
  }

  return membership || null;
};

export const getMembershipPlanName = (membership: any) =>
  unwrapMembership(membership)?.planSnapshot?.planName ||
  unwrapMembership(membership)?.plan?.planName ||
  unwrapMembership(membership)?.plan?.name ||
  unwrapMembership(membership)?.planName ||
  '';

export const canVerifyProfilePhotoWithMembership = (membership: any) => {
  const activeMembership = unwrapMembership(membership);
  if (!activeMembership) return false;

  const price = numericValue(
    activeMembership?.planSnapshot?.price ??
      activeMembership?.plan?.price ??
      activeMembership?.price,
  );
  if (price !== null && price <= 0) return false;

  const rank = numericValue(
    activeMembership?.planSnapshot?.rank ??
      activeMembership?.plan?.rank ??
      activeMembership?.rank,
  );

  const normalizedPlanName = normalizePlanName(getMembershipPlanName(activeMembership));
  if (!normalizedPlanName && price === null && rank === null) return false;
  if (FREE_PLAN_NAMES.has(normalizedPlanName)) return false;

  if (rank !== null && rank <= 0) return false;

  return true;
};
