import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildSolveReport } from '../royal-inquest-solver/report';
import { emitLevelFile } from './emitLevelFile';
import { generateInquestDefinition } from './generate';

interface ParsedArgs {
  difficulty: number;
  seed?: number;
  out?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  let difficulty: number | undefined;
  let seed: number | undefined;
  let out: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--difficulty') {
      const value = argv[i + 1];
      difficulty = value ? Number(value) : NaN;
      i += 1;
    } else if (arg === '--seed') {
      const value = argv[i + 1];
      seed = value ? Number(value) : NaN;
      i += 1;
    } else if (arg === '--out') {
      out = argv[i + 1];
      i += 1;
    }
  }

  if (difficulty === undefined || !Number.isInteger(difficulty) || difficulty < 1 || difficulty > 3) {
    throw new Error('Usage: --difficulty <1|2|3> is required. Optional: --seed <number>, --out <path>.');
  }
  if (seed !== undefined && !Number.isInteger(seed)) {
    throw new Error('--seed must be an integer.');
  }

  return { difficulty, seed, out };
}

function printReport(title: string, id: string, report: ReturnType<typeof buildSolveReport>): void {
  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log(`\n${title} (${id}) — ${status}`);
  if (report.issues.length > 0) {
    for (const issue of report.issues) console.log(`  - ${issue}`);
    return;
  }
  console.log(`  unique solution, matches authored solution: ${report.matchesAuthoredSolution}`);
  console.log(`  victim elimination check: ${report.victimEliminationOk ? 'ok' : 'FAILED'}`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const { definition, seed } = generateInquestDefinition({ difficulty: args.difficulty, seed: args.seed });

  console.log(`Generated with seed ${seed} (rerun with --seed ${seed} to reproduce this exact case).`);
  console.log(`Board: ${definition.rows}x${definition.columns}, ${definition.characters.length} characters, ${Object.keys(definition.chamberEnvironments).length} chambers, ${definition.clues.length} clues.`);

  const report = buildSolveReport(definition);
  printReport(definition.title, definition.id, report);

  const { fileContent, exportName } = emitLevelFile(definition);

  if (args.out) {
    mkdirSync(dirname(args.out), { recursive: true });
    writeFileSync(args.out, fileContent, 'utf8');
    console.log(`\nWrote ${args.out} (export const ${exportName}).`);
  } else {
    console.log(`\n// export const ${exportName}\n${fileContent}`);
  }

  process.exitCode = report.issues.length > 0 ? 1 : 0;
}

main();
