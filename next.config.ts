import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const isGHPages = process.env.DEPLOY_TARGET === "gh-pages";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "mdx"],
  ...(isGHPages && {
    basePath: "/learn-llm",
    assetPrefix: "/learn-llm/",
  }),
  turbopack: {
    root: projectRoot,
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
