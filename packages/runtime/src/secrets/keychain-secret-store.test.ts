import { describe, expect, it } from "vitest";
import {
  createKeychainSecretStore,
  KEYCHAIN_SERVICE,
  type KeychainEntryFactory,
} from "./keychain-secret-store.js";

const fakeKeychain = () => {
  const vault = new Map<string, string>();
  const calls: string[] = [];
  const factory: KeychainEntryFactory = (service, account) => {
    calls.push(`${service}/${account}`);
    const key = `${service}/${account}`;
    return {
      getPassword: () => vault.get(key) ?? null,
      setPassword: (password) => {
        vault.set(key, password);
      },
      deletePassword: () => vault.delete(key),
    };
  };
  return { vault, calls, factory };
};

describe("keychain secret store", () => {
  it("stores, reads and deletes secrets under the nero-agent service", async () => {
    const { factory, calls } = fakeKeychain();
    const store = createKeychainSecretStore(factory);
    expect(await store.get("anthropic")).toBeUndefined();
    await store.set("anthropic", "test-value");
    expect(await store.get("anthropic")).toBe("test-value");
    await store.delete("anthropic");
    expect(await store.get("anthropic")).toBeUndefined();
    expect(calls[0]).toBe(`${KEYCHAIN_SERVICE}/anthropic`);
  });

  it.each(["", "Anthropic", "../etc", "a b", "x".repeat(65)])("rejects invalid name %j", async (name) => {
    const store = createKeychainSecretStore(fakeKeychain().factory);
    await expect(store.get(name)).rejects.toMatchObject({ code: "invalid_secret_name" });
  });

  it("maps keychain failures to a clear error without leaking the value", async () => {
    const store = createKeychainSecretStore(() => ({
      getPassword: () => {
        throw new Error("Platform secure storage failure: no Secret Service");
      },
      setPassword: () => {
        throw new Error("Platform secure storage failure");
      },
      deletePassword: () => false,
    }));
    await expect(store.get("openai")).rejects.toMatchObject({
      code: "keychain_unavailable",
      details: ["Platform secure storage failure: no Secret Service"],
    });
    const error = await store.set("openai", "test-secret-value").catch((e: unknown) => e);
    expect(JSON.stringify(error)).not.toContain("test-secret-value");
    expect(String(error)).not.toContain("test-secret-value");
  });
});
