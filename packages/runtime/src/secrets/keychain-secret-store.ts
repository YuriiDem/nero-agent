import { Entry } from "@napi-rs/keyring";
import { NeroError, type SecretStore } from "@nero-agent/core";

export const KEYCHAIN_SERVICE = "nero-agent";

export type KeychainEntry = {
  getPassword(): string | null;
  setPassword(password: string): void;
  deletePassword(): boolean;
};

export type KeychainEntryFactory = (service: string, account: string) => KeychainEntry;

const SECRET_NAME = /^[a-z0-9-]{1,64}$/;

const defaultEntryFactory: KeychainEntryFactory = (service, account) => new Entry(service, account);

export const createKeychainSecretStore = (
  entryFactory: KeychainEntryFactory = defaultEntryFactory,
): SecretStore => {
  const entry = (name: string): KeychainEntry => {
    if (!SECRET_NAME.test(name)) {
      throw new NeroError("invalid_secret_name", `Invalid secret name "${name}"`);
    }
    return entryFactory(KEYCHAIN_SERVICE, name);
  };

  const guarded = <T>(action: string, run: () => T): T => {
    try {
      return run();
    } catch (error) {
      if (error instanceof NeroError) throw error;
      throw new NeroError("keychain_unavailable", `The OS keychain could not ${action}.`, [
        error instanceof Error ? error.message : String(error),
      ]);
    }
  };

  return {
    get: async (name) => guarded("be read", () => entry(name).getPassword() ?? undefined),
    set: async (name, value) => guarded("store the secret", () => entry(name).setPassword(value)),
    delete: async (name) => {
      guarded("delete the secret", () => entry(name).deletePassword());
    },
  };
};
