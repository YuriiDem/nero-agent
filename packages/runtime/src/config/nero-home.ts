import { homedir } from "node:os";
import { join } from "node:path";

export const CONFIG_FILE = "config.json";

export const resolveNeroHome = (env: NodeJS.ProcessEnv = process.env): string => {
  const override = env["NERO_HOME"]?.trim();
  return override ? override : join(homedir(), ".nero");
};
