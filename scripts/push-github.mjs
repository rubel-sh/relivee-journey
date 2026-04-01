#!/usr/bin/env node
/**
 * Pushes the current branch to the GitHub mirror.
 * Run this ONLY from within Replit Agent (code_execution).
 *
 * The agent runs this by passing the GITHUB_TOKEN via env:
 *   GITHUB_TOKEN=<token> node scripts/push-github.mjs
 *
 * or set GITHUB_TOKEN as a Replit secret.
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const REPO = "rubel-sh/relivee-journey";
const REMOTE = "github";
const GIT_CONFIG = new URL("../.git/config", import.meta.url).pathname;

const branch = process.argv.find((_, i, a) => a[i - 1] === "--branch") ?? "main";
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error("❌  GITHUB_TOKEN env var is required.");
  console.error("   Set it as a Replit secret or pass it inline:");
  console.error("   GITHUB_TOKEN=ghp_... node scripts/push-github.mjs");
  process.exit(1);
}

const authedUrl = `https://oauth2:${token}@github.com/${REPO}.git`;

// Temporarily write token into remote URL
let config = readFileSync(GIT_CONFIG, "utf-8");
const hadRemote = config.includes(`[remote "${REMOTE}"]`);
const cleanUrl = `https://github.com/${REPO}.git`;

if (hadRemote) {
  config = config.replace(
    new RegExp(`(\\[remote "${REMOTE}"\\]\\n\\s*url = )[^\\n]+`),
    `$1${authedUrl}`
  );
} else {
  config += `\n[remote "${REMOTE}"]\n\turl = ${authedUrl}\n\tfetch = +refs/heads/*:refs/remotes/${REMOTE}/*\n`;
}
writeFileSync(GIT_CONFIG, config);

try {
  console.log(`🚀  Pushing '${branch}' → github.com/${REPO}...`);
  const out = execSync(`git push ${REMOTE} ${branch} 2>&1`, { encoding: "utf-8" });
  console.log(out || "Done.");
  console.log(`✅  Pushed successfully → https://github.com/${REPO}`);
} catch (e) {
  console.error("❌  Push failed:", e.message);
  process.exitCode = 1;
} finally {
  // Always strip token from config after push
  let cfg = readFileSync(GIT_CONFIG, "utf-8");
  cfg = cfg.replace(
    new RegExp(`(\\[remote "${REMOTE}"\\]\\n\\s*url = )https://oauth2:[^@]+@`),
    `$1https://`
  );
  writeFileSync(GIT_CONFIG, cfg);
}
