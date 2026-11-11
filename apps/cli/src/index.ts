import { wiredPackages } from "@nero-agent/runtime";

export const CLI_PACKAGE = "@nero-agent/cli";

export const describeBuild = (): string => [CLI_PACKAGE, ...wiredPackages()].join(", ");
