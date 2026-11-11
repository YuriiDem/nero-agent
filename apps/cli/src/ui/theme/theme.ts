import type { VerdictLevel } from "@nero-agent/runtime";

export type Theme = {
  readonly color: boolean;
  readonly accent?: string;
  readonly muted?: string;
  readonly warning?: string;
  readonly error?: string;
  readonly success?: string;
  readonly user?: string;
  readonly levels: Readonly<Record<VerdictLevel, string | undefined>>;
};

const palette = {
  accent: "#8b6dff",
  muted: "gray",
  warning: "#f5a524",
  error: "#f31260",
  success: "#17c964",
  user: "#7dd3fc",
} as const;

export const isColorDisabled = (env: NodeJS.ProcessEnv): boolean => (env["NO_COLOR"] ?? "") !== "";

export const createTheme = (env: NodeJS.ProcessEnv = process.env): Theme => {
  if (isColorDisabled(env)) {
    return {
      color: false,
      levels: {
        critical: undefined,
        high: undefined,
        medium: undefined,
        no_known_risks: undefined,
        insufficient_data: undefined,
      },
    };
  }
  return {
    color: true,
    ...palette,
    levels: {
      critical: palette.error,
      high: "#ff7a45",
      medium: palette.warning,
      no_known_risks: palette.success,
      insufficient_data: palette.muted,
    },
  };
};
