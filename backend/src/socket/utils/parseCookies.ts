export function parseCookies(cookieHeader?: string) {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((cookie) => {
      // 1. Split by the first "="
      const [rawKey, ...rawValueParts] = cookie.split("=");

      // 2. Trim the key and the raw joined value string
      const key = rawKey.trim();
      const rawValue = rawValueParts.join("=").trim();

      // 3. Decode AFTER trimming the raw string
      return [key, decodeURIComponent(rawValue)];
    }),
  );
}
