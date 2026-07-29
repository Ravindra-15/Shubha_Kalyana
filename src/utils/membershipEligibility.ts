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

export const canVerifyProfilePhotoWithMembership = () => true;
