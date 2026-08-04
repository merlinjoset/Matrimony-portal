import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle for the Docker runtime image.
  output: "standalone",
  // Serve images as-is so the runtime image does not need the native `sharp` dependency.
  images: { unoptimized: true },
};

export default nextConfig;
