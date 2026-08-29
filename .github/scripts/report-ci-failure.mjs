const required = [
  'BUG_REPORT_TOKEN',
  'GITHUB_REPOSITORY',
  'GITHUB_WORKFLOW',
  'GITHUB_RUN_ID',
  'GITHUB_RUN_ATTEMPT',
  'GITHUB_SERVER_URL',
];

for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing required environment variable: ${name}`);
}

let needs = {};
try {
  needs = JSON.parse(process.env.WORKFLOW_NEEDS || '{}');
} catch {
  throw new Error('WORKFLOW_NEEDS was not valid JSON');
}

const payload = {
  repository: process.env.GITHUB_REPOSITORY,
  workflow: process.env.GITHUB_WORKFLOW,
  run_id: process.env.GITHUB_RUN_ID,
  run_attempt: process.env.GITHUB_RUN_ATTEMPT,
  run_url: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  sha: process.env.GITHUB_SHA,
  ref: process.env.GITHUB_REF_NAME,
  event_name: process.env.GITHUB_EVENT_NAME,
  actor: process.env.GITHUB_ACTOR,
  needs,
};

const endpoint = process.env.BUG_REPORT_ENDPOINT || 'https://hidustin-bug-intake.dusteallen.workers.dev/api/ci-failures';
const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${process.env.BUG_REPORT_TOKEN}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify(payload),
});
const result = await response.text();
if (!response.ok) throw new Error(`Bug intake returned ${response.status}: ${result}`);
console.log(`Created or updated issue ticket: ${result}`);
