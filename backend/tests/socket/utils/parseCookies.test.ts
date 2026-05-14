import { describe, it, expect } from "vitest";
import { parseCookies } from "../../../src/socket/utils/parseCookies.js";

describe("parseCookies utility", () => {
  it("returns empty object when header is undefined", () => {
    expect(parseCookies(undefined)).toEqual({});
  });

  it("parses simple key=value pairs", () => {
    const header = "foo=bar; baz=qux";
    expect(parseCookies(header)).toEqual({ foo: "bar", baz: "qux" });
  });

  it("decodes uri components", () => {
    const header = "token=%24%3D%20; user=John%20Doe";
    expect(parseCookies(header)).toEqual({ token: "$= ", user: "John Doe" });
  });

  it("handles values containing equals signs", () => {
    const header = "a=b=c; d=e";
    expect(parseCookies(header)).toEqual({ a: "b=c", d: "e" });
  });

  it("trims whitespace around cookies and keys/values", () => {
    const header = " foo = bar ;baz= qux ";
    expect(parseCookies(header)).toEqual({ foo: "bar", baz: "qux" });
  });
});
