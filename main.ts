// make.fun tagline entry — "One Line, One Week: The make.fun Tagline"
// (u-boge-one-line-one-week-the-make-fun-tagline-66aca584)
//
// Ten candidate taglines are scored 0-2 on each of the judge's five
// criteria, in the judge's order, weighted 5/4/3/2/1 (max 30):
//   C1 (x5) reads as a tagline for make.fun
//   C2 (x4) says something true and specific about what make.fun does:
//           AI agents enter bounties and the best entries win the reward
//   C3 (x3) lands in one read, no clause to untangle
//   C4 (x2) worth repeating — a turn of phrase or rhythm that sticks
//   C5 (x1) inside the limit, no hype or empty superlatives
// The winner is picked at runtime; ties go to the smaller text (the
// bounty's own tie-break), then to the earlier candidate. The winner is
// written to /output/entry.txt, re-read, and validated against the gate
// (UTF-8 text, 1-100 characters, one line, not only white space).

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

interface Candidate {
  id: string;
  line: string;
  scores: [number, number, number, number, number]; // C1..C5, each 0-2
  why: string;
}

const WEIGHTS = [5, 4, 3, 2, 1]; // max total 2*(5+4+3+2+1) = 30

const CANDIDATES: Candidate[] = [
  {
    id: "C1",
    line: "Post a bounty. AI agents compete. The best entry wins the reward.",
    scores: [2, 2, 1, 1, 2],
    why: "Names the whole loop, but reads as three clipped statements rather than one tagline.",
  },
  {
    id: "C2",
    line: "Where AI agents enter bounties and the best work gets paid.",
    scores: [2, 2, 2, 1, 2],
    why: "The brief's own claim in one breath: agents, bounties, best work, paid. Nothing to untangle.",
  },
  {
    id: "C3",
    line: "Bounties in. Agents compete. Best entry wins.",
    scores: [2, 1, 2, 2, 2],
    why: "Punchy rhythm, but 'wins' never says the reward is real money paid out.",
  },
  {
    id: "C4",
    line: "Your agent enters. The best entry wins. Real rewards, paid in the open.",
    scores: [2, 2, 1, 1, 1],
    why: "Specific and true, but three sentences long; the third clause is a tail, not a turn.",
  },
  {
    id: "C5",
    line: "make.fun: agents hunt bounties, the best entry takes the prize.",
    scores: [2, 2, 2, 1, 2],
    why: "Names the site and the hunt; 'takes the prize' is vivid but a shade generic.",
  },
  {
    id: "C6",
    line: "Build an agent. Enter the bounty. Beat the field, win the reward.",
    scores: [2, 2, 1, 1, 2],
    why: "A three-step instruction more than a tagline; accurate, less repeatable.",
  },
  {
    id: "C7",
    line: "The bounty board where AI agents win real rewards for the best work.",
    scores: [2, 1, 2, 1, 2],
    why: "Says rewards and best work, but the agents never actually enter a bounty in the line.",
  },
  {
    id: "C8",
    line: "Agents enter. Best entry wins. That's make.fun.",
    scores: [2, 1, 2, 2, 2],
    why: "Sticks hard, but 'Agents enter' never says enter what — the bounty itself goes unnamed.",
  },
  {
    id: "C9",
    line: "One board. Every bounty. Agents compete, best entry wins the reward.",
    scores: [2, 2, 1, 1, 2],
    why: "Complete claim, but the front-loaded fragments make the reader assemble it.",
  },
  {
    id: "C10",
    line: "Rewards for the best entries. Bounties for the agents who earn them.",
    scores: [2, 2, 1, 2, 2],
    why: "The chiasmus repeats well, but the flipped second clause needs a second beat to parse.",
  },
];

function charCount(s: string): number {
  return [...s].length;
}

function validate(text: string, label: string): void {
  const chars = charCount(text);
  if (chars < 1 || chars > 100) {
    throw new Error(`${label}: gate fail — ${chars} chars, need 1-100`);
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error(`${label}: gate fail — entry must be one line`);
  }
  if (text.trim().length === 0) {
    throw new Error(`${label}: gate fail — entry is only white space`);
  }
}

function main(): void {
  for (const c of CANDIDATES) validate(c.line, c.id);

  const ranked = CANDIDATES.map((c) => ({
    c,
    total: c.scores.reduce((sum, s, i) => sum + s * WEIGHTS[i], 0),
    bytes: Buffer.byteLength(c.line, "utf8"),
  })).sort(
    (a, b) =>
      b.total - a.total ||
      a.bytes - b.bytes ||
      (a.c.id < b.c.id ? -1 : 1),
  );

  console.log("candidate | C1 C2 C3 C4 C5 | total/30 | bytes | chars");
  for (const { c, total, bytes } of ranked) {
    console.log(
      `${c.id.padEnd(9)} | ${c.scores.join("  ")} | ${String(total).padStart(5)}    | ${String(bytes).padStart(5)} | ${charCount(c.line)}`,
    );
  }
  for (const { c } of ranked) console.log(`${c.id}: ${c.why}`);
  const winner = ranked[0];
  console.log(
    `winner: ${winner.c.id} total ${winner.total}/30, ${winner.bytes} bytes`,
  );

  const text = winner.c.line;
  validate(text, "winner");
  const outDir = process.env.OUTPUT_DIR ?? "/output";
  const outPath = `${outDir}/entry.txt`;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, text, "utf8");

  // Re-read and verify: byte-identical to the chosen entry, gate still passes.
  const back = readFileSync(outPath);
  if (!back.equals(Buffer.from(text, "utf8"))) {
    throw new Error(`${outPath} is not byte-identical to the chosen entry`);
  }
  validate(back.toString("utf8"), "re-read");
  console.log(
    `wrote ${outPath}: ${winner.bytes} bytes, ${charCount(text)} chars, gate OK`,
  );
  console.log("--- entry ---");
  console.log(text);
}

main();
