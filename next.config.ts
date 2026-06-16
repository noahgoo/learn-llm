import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "mdx"],
  turbopack: {
    root: projectRoot,
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
