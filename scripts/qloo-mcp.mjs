// Starts the canonical Qloo MCP server from @qloo/qloo-harness (the same
// server as `qloo mcp`) without loading the harness's chat runtime, so it
// fits in a serverless function. Imported by file path because the package
// only exports its full CLI entry point.
import path from "node:path";
import { pathToFileURL } from "node:url";

const entry = path.join(process.cwd(), "node_modules", "@qloo", "qloo-harness", "dist", "mcp.js");
const { runQlooMcp } = await import(pathToFileURL(entry).href);
process.exitCode = runQlooMcp([]);
