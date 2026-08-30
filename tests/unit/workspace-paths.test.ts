import { describe, expect, it } from "vitest";
import { parseProjectPath } from "../../src/domain/workspace/paths";

describe("project paths", () => {
  it.each([
    "src/App.tsx",
    "src/components/Card.tsx",
    "package.json",
    "README.md",
    "public/mark.svg",
    ".gitignore",
  ])("accepts canonical text path %s", (path) => {
    expect(parseProjectPath(path)).toEqual({ ok: true, value: path });
  });

  it.each([
    "",
    "/src/App.tsx",
    "C:/src/App.tsx",
    "../App.tsx",
    "src/../App.tsx",
    "src/./App.tsx",
    "src//App.tsx",
    "src\\App.tsx",
    "https://example.test/file.ts",
    "src/%2e%2e/App.tsx",
    "src/%2F/App.tsx",
    "src/App.tsx?raw",
    "src/App.exe",
    ".env",
    "keys/private.pem",
    " src/App.tsx",
  ])("rejects dangerous or unsupported path %s", (path) => {
    expect(parseProjectPath(path).ok).toBe(false);
  });
});
