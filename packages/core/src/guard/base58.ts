const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const INDEX = new Map([...ALPHABET].map((char, index) => [char, index]));

export const decodeBase58 = (input: string): Uint8Array | undefined => {
  const bytes: number[] = [];
  for (const char of input) {
    let carry = INDEX.get(char);
    if (carry === undefined) return undefined;
    for (let i = 0; i < bytes.length; i++) {
      carry += (bytes[i] ?? 0) * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of input) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return Uint8Array.from(bytes.reverse());
};
