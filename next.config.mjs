/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['undici'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'openweathermap.org',
        pathname: '/img/**',
      },
    ],
  },
};

export default nextConfig;
