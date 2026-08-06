const toArray = (value: any) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const getProfile = (value: any) => value?.raw?.profile || value?.profile || value || {};

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

const getMembership = (value: any, override?: any) => {
  if (override !== undefined) return unwrapMembership(override);

  const sources = [value, value?.raw, value?.profile, value?.raw?.profile];
  const activeSource = sources.find((item) =>
    item && Object.prototype.hasOwnProperty.call(item, 'activeMembership')
  );
  if (activeSource) return unwrapMembership(activeSource.activeMembership);

  const membershipSource = sources.find((item) =>
    item && Object.prototype.hasOwnProperty.call(item, 'membership')
  );
  return unwrapMembership(membershipSource?.membership);
};

const getMembershipPlanName = (membership: any) => {
  if (typeof membership === 'string') return membership;

  return (
    membership?.planSnapshot?.planName ||
    membership?.plan?.planName ||
    membership?.plan?.name ||
    membership?.planName ||
    ''
  );
};

const getCurrentProfilePhoto = (profile: any) => {
  const photos = toArray(profile?.photos);
  return photos.find((photo: any) => photo?.isProfilePhoto) || photos[0] || null;
};

export type VerificationPromptStatus = {
  profilePhotoVerified: boolean;
  aadhaarNumberVerified: boolean;
  hasMembershipPlan: boolean;
  shouldShow: boolean;
};

export const hasActivePaidMembershipForPrompt = (value: any, membershipOverride?: any) => {
  const membership = getMembership(value, membershipOverride);
  if (!membership) return false;

  const planName = getMembershipPlanName(membership);
  if (/\bfree\b/i.test(planName)) return false;

  const status = String(membership.status || 'ACTIVE').toUpperCase();
  if (status !== 'ACTIVE') return false;

  if (membership.endDate) {
    const endTime = new Date(membership.endDate).getTime();
    if (Number.isFinite(endTime) && endTime <= Date.now()) return false;
  }

  const price = Number(
    membership.amount ??
      membership.planSnapshot?.price ??
      membership.plan?.price ??
      membership.price,
  );

  if (Number.isFinite(price)) return price > 0;

  return Boolean(planName || membership._id || membership.id);
};

export const isProfilePictureVerifiedForPrompt = (value: any) => {
  if (typeof value?.profilePictureVerified === 'boolean') {
    return value.profilePictureVerified;
  }

  const profile = getProfile(value);
  const profilePhoto = getCurrentProfilePhoto(profile);
  const profilePhotoId = profilePhoto?.publicId || profilePhoto?.url || '';
  const verification = profile?.profilePictureVerification || {};

  return Boolean(
    profilePhotoId &&
      verification.isVerified &&
      verification.profilePicturePublicId === profilePhotoId,
  );
};

export const isAadhaarNumberVerifiedForPrompt = (value: any) => {
  if (typeof value?.aadhaarNumberVerified === 'boolean') {
    return value.aadhaarNumberVerified;
  }

  const profile = getProfile(value);
  const aadhaarStatus = String(profile?.aadhaarVerification?.status || '').toUpperCase();
  const documentStatus = String(profile?.documents?.verificationStatus || '').toUpperCase();

  return aadhaarStatus === 'VERIFIED' || documentStatus === 'VERIFIED';
};

export const getVerificationPromptStatus = (
  value: any,
  membership?: any,
): VerificationPromptStatus => {
  const profilePhotoVerified = isProfilePictureVerifiedForPrompt(value);
  const aadhaarNumberVerified = isAadhaarNumberVerifiedForPrompt(value);
  const hasMembershipPlan = hasActivePaidMembershipForPrompt(value, membership);

  return {
    profilePhotoVerified,
    aadhaarNumberVerified,
    hasMembershipPlan,
    shouldShow: hasMembershipPlan && !profilePhotoVerified,
  };
};
