import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getRoyalInquestLevel, royalInquestLevels } from '../../src/features/royal-inquest/levels';
import type { InquestDefinition } from '../../src/features/royal-inquest/types';
import { buildSolveReport, type SolveReport } from './report';

async function loadFileDefinition(path: string): Promise<InquestDefinition> {
  const module = await import(pathToFileURL(resolve(path)).href);
  const definition = module.definition ?? module.default;
  if (!definition) {
    throw new Error(`${path} must export a definition (default export or named "definition" export).`);
  }
  return definition as InquestDefinition;
}

async function loadDefinitions(argv: string[]): Promise<InquestDefinition[]> {
  const fileFlagIndex = argv.indexOf('--file');
  if (fileFlagIndex !== -1) {
    const path = argv[fileFlagIndex + 1];
    if (!path) throw new Error('--file requires a path argument.');
    return [await loadFileDefinition(path)];
  }

  const [levelId] = argv;
  if (levelId) return [getRoyalInquestLevel(levelId)];

  return royalInquestLevels;
}

function printReport(definition: InquestDefinition, report: SolveReport): void {
  const status = report.issues.length === 0 ? 'PASS' : 'FAIL';
  console.log(`\n${definition.title} (${report.id}) — ${status}`);

  if (report.issues.length > 0) {
    for (const issue of report.issues) console.log(`  - ${issue}`);
    return;
  }

  const [solution] = report.solutions;
  console.log(`  unique solution, matches authored solution: ${report.matchesAuthoredSolution}`);
  console.log(`  victim elimination check: ${report.victimEliminationOk ? 'ok' : 'FAILED'}`);
  for (const character of definition.characters) {
    const position = solution![character.id]!;
    console.log(`    ${character.name.padEnd(20)} row ${position.row}, column ${position.column}`);
  }
}

async function main(): Promise<void> {
  const definitions = await loadDefinitions(process.argv.slice(2));
  let hasIssues = false;

  for (const definition of definitions) {
    const report = buildSolveReport(definition);
    if (report.issues.length > 0) hasIssues = true;
    printReport(definition, report);
  }

  process.exitCode = hasIssues ? 1 : 0;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
