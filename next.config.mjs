
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mongoose'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  // TODO: BEFORE GOING LIVE - Restore strict CSP headers
  // Current: CSP removed for testing phase
  // Production CSP should whitelist only: msg91.com, razorpay.com, fonts.googleapis.com
  // Remove this comment and restore headers when going live
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: '',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
