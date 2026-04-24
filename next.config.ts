import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    'app/api/**/*': ['./data/**/*'],
  },
};

export default nextConfig;
