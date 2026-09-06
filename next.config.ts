import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the root to this project; otherwise Turbopack walks up and finds the
    // package-lock.json in the home directory, outside the repo.
    root: path.join(__dirname),
  },
};

export default nextConfig;
