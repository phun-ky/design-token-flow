// Check the repository's own configuration, so a mistake fails here instead of
// a workflow failing later or a tool quietly ignoring a file:
// - .github/dependabot.yml against the Dependabot schema (SchemaStore)
// - vex.openvex.json against the OpenVEX 0.2.0 schema
// - security-insights.yml against the Security Insights 2.2.0 schema, with cue
// - the workflows with actionlint, which runs shellcheck on their scripts
// The schemas are vendored in scripts/schemas/, so nothing is fetched. cue,
// actionlint and shellcheck are binaries: CI installs pinned versions and
// requires them; locally, a check whose tool isn't installed is skipped.

import Ajv from 'ajv';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ROOT = new URL('../', import.meta.url);
const SCHEMAS = new URL('scripts/schemas/', ROOT);
const read = (path, base = ROOT) => readFileSync(new URL(path, base), 'utf8');
const problems = [];
const checked = [];
const skipped = [];
/** Validate a document against a JSON Schema, with the given Ajv class. */
const validate = (label, AjvClass, schemaFile, document) => {
  // SchemaStore schemas use keywords and formats Ajv doesn't know in strict mode
  const ajv = new AjvClass({ allErrors: true, strict: false });

  addFormats(ajv);
  // ajv-formats has no `iri`, which OpenVEX uses for its ids: an IRI is a URL
  // that may contain non-ASCII characters, which the URL parser accepts
  ajv.addFormat('iri', (value) => URL.canParse(value));

  const check = ajv.compile(JSON.parse(read(schemaFile, SCHEMAS)));

  checked.push(label);

  if (!check(document)) {
    for (const { instancePath, message, params } of check.errors) {
      problems.push(
        `${label}${instancePath || ''}: ${message} ${JSON.stringify(params)}`
      );
    }
  }
};
/** Run a binary, or note that it isn't installed. */
const run = (label, command, args) => {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8'
  });

  if (result.error?.code === 'ENOENT') {
    if (process.env.CI) problems.push(`${label}: ${command} is not installed`);
    else skipped.push(`${label} (${command} is not installed)`);

    return false;
  }

  checked.push(label);

  if (result.status !== 0) {
    problems.push(`${label}:\n${`${result.stdout}${result.stderr}`.trim()}`);
  }

  return true;
};

validate(
  '.github/dependabot.yml',
  Ajv,
  'dependabot-2.0.json',
  parse(read('.github/dependabot.yml'))
);
validate(
  'vex.openvex.json',
  Ajv2020,
  'openvex-0.2.0.json',
  JSON.parse(read('vex.openvex.json'))
);
run('security-insights.yml', 'cue', [
  'vet',
  '-c',
  '-d',
  '#SecurityInsights',
  'scripts/schemas/security-insights-2.2.0.cue',
  'security-insights.yml'
]);

// actionlint skips its shellcheck pass when shellcheck is missing, so look for
// it first: in CI, workflows must be checked with it
const shellcheck = spawnSync('shellcheck', ['--version']).error === undefined;

if (!shellcheck) {
  if (process.env.CI) problems.push('workflows: shellcheck is not installed');
  else skipped.push('shell scripts in workflows (shellcheck is not installed)');
}

run('workflows', 'actionlint', ['-no-color']);

if (problems.length > 0) {
  console.error('The repository configuration has problems:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`Valid: ${checked.join(', ')}.`);

if (skipped.length > 0) {
  console.log(
    `Skipped, install the tool to check it locally: ${skipped.join('; ')}`
  );
}
