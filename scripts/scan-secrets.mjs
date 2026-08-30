import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const blocked = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /(?:api[_-]?key|secret|token)\s*[:=]\s*['"][^'"]{12,}['"]/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

const files = execFileSync("git", ["ls-files", "-co", "--exclude-standard"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => !file.endsWith("package-lock.json"));

const findings = [];
for (const file of files) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (blocked.some((pattern) => pattern.test(content))) findings.push(file);
}

if (findings.length > 0) {
  console.error(`Potential secret patterns found in: ${findings.join(", ")}`);
  process.exit(1);
}

console.log(
  `Secret scan passed (${files.length} tracked or untracked source files checked).`,
);
