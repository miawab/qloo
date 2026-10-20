import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Qloo MCP server runs as a child process started by file path, so file
  // tracing can't see it; ship the launcher, the server and its one dependency.
  outputFileTracingIncludes: {
    "/api/run": ["./scripts/qloo-mcp.mjs", "./node_modules/@qloo/qloo-harness/dist/**/*", "./node_modules/typebox/**/*"],
    "/*": ["./src/data/runs/**/*"],
  },
};

export default nextConfig;
