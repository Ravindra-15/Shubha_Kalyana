const ACCEPTED_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ACCEPTED_PROFILE_PHOTO_EXTENSIONS = /\.(jpe?g|png)$/i;
const MAX_PROFILE_PHOTO_BYTES = 2 * 1024 * 1024;

export const validateProfilePhotoAsset = (asset: any) => {
  const type = String(asset?.type || '').toLowerCase();
  const fileName = String(asset?.fileName || asset?.name || '').toLowerCase();

  if (type && !ACCEPTED_PROFILE_PHOTO_TYPES.includes(type)) {
    return 'Only JPG, JPEG and PNG profile photos are allowed';
  }

  if (!type && fileName && !ACCEPTED_PROFILE_PHOTO_EXTENSIONS.test(fileName)) {
    return 'Only JPG, JPEG and PNG profile photos are allowed';
  }

  if (asset?.fileSize && asset.fileSize > MAX_PROFILE_PHOTO_BYTES) {
    return 'Image must be under 2MB';
  }

  return '';
};
