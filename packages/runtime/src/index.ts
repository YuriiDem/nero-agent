import { CORE_PACKAGE } from "@nero-agent/core";
import { PROVIDERS_PACKAGE } from "@nero-agent/providers";

export const RUNTIME_PACKAGE = "@nero-agent/runtime";

export const wiredPackages = (): readonly string[] => [CORE_PACKAGE, PROVIDERS_PACKAGE, RUNTIME_PACKAGE];
