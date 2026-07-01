const S3_BASE = 'https://shubhkalyan-bucket.s3.ap-south-1.amazonaws.com';

export function resolveImageUrl(url?: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;          // already full URL
  const clean = url.replace(/\\/g, '/').replace(/^\/+/, '');
  return `${S3_BASE}/${clean}`;                        // prefix S3 bucket
}