import path from "node:path";

// Writable storage: the project's .cache folder locally, /tmp on serverless
// hosts where the deployment itself is read-only.
export const DATA_DIR = process.env.VERCEL ? "/tmp/overture" : path.join(process.cwd(), ".cache");
