import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(__dirname, '..', '..');
const WORKFLOW_PATH = join(REPO_ROOT, '.github', 'workflows', 'test-visual.yml');

interface WorkflowStep {
  raw: string;
  uses: string | null;
  ifCondition: string | null;
  pathValue: string | null;
}

function readWorkflowText(): string {
  return readFileSync(WORKFLOW_PATH, 'utf-8');
}

function extractValue(block: string, key: string): string | null {
  const lines = block.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined) {
      continue;
    }
    const match = line.match(/^\s*([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match === null) {
      continue;
    }
    const foundKey = match[1];
    const valuePart = match[2];
    if (foundKey !== key || valuePart === undefined) {
      continue;
    }
    const trimmedValue = valuePart.trim();
    if (trimmedValue.length > 0) {
      return trimmedValue.replace(/^['"]/, '').replace(/['"]$/, '');
    }
    const next = lines[i + 1];
    if (next === undefined) {
      return '';
    }
    return next.trim();
  }
  return null;
}

function parseSteps(workflowText: string): WorkflowStep[] {
  const stepsHeaderMatch = workflowText.match(/(^|\n)\s*steps:\s*\n/);
  if (stepsHeaderMatch === null) {
    return [];
  }
  const stepsStart = stepsHeaderMatch.index! + stepsHeaderMatch[0].length;
  const stepsBlock = workflowText.slice(stepsStart);
  const stepChunks = stepsBlock.split(/\n\s{6}-\s/);
  const normalized = stepChunks.slice(1).map((chunk) => `- ${chunk}`);
  return normalized.map((raw) => ({
    raw,
    uses: extractValue(raw, 'uses'),
    ifCondition: extractValue(raw, 'if'),
    pathValue: extractValue(raw, 'path'),
  }));
}

describe('.github/workflows/test-visual.yml', () => {
  it('declares an upload-artifact@v4 step so test-results are inspectable after CI failures', () => {
    const text = readWorkflowText();
    const steps = parseSteps(text);
    const uploadSteps = steps.filter((step) => step.uses === 'actions/upload-artifact@v4');
    expect(uploadSteps).toHaveLength(1);
  });

  it('runs the upload-artifact step only when the suite fails', () => {
    const text = readWorkflowText();
    const steps = parseSteps(text);
    const uploadStep = steps.find((step) => step.uses === 'actions/upload-artifact@v4');
    expect(uploadStep).toBeDefined();
    if (uploadStep === undefined) {
      throw new Error('upload-artifact step is missing');
    }
    expect(uploadStep.ifCondition).toBe('failure()');
  });

  it('points the upload-artifact step at the Playwright test-results directory', () => {
    const text = readWorkflowText();
    const steps = parseSteps(text);
    const uploadStep = steps.find((step) => step.uses === 'actions/upload-artifact@v4');
    expect(uploadStep).toBeDefined();
    if (uploadStep === undefined) {
      throw new Error('upload-artifact step is missing');
    }
    expect(uploadStep.pathValue).toBe('test-results/');
  });

  it('names the artifact uniquely per run via github.run_id to avoid collisions across reruns', () => {
    const text = readWorkflowText();
    const steps = parseSteps(text);
    const uploadStep = steps.find((step) => step.uses === 'actions/upload-artifact@v4');
    expect(uploadStep).toBeDefined();
    if (uploadStep === undefined) {
      throw new Error('upload-artifact step is missing');
    }
    expect(uploadStep.raw).toMatch(
      /name:\s*playwright-test-results-\$\{\{\s*github\.run_id\s*\}\}/,
    );
  });

  it('sets a bounded retention so storage cost stays predictable', () => {
    const text = readWorkflowText();
    const steps = parseSteps(text);
    const uploadStep = steps.find((step) => step.uses === 'actions/upload-artifact@v4');
    expect(uploadStep).toBeDefined();
    if (uploadStep === undefined) {
      throw new Error('upload-artifact step is missing');
    }
    expect(uploadStep.raw).toMatch(/retention-days:\s*14/);
  });

  it('marks the upload as best-effort with if-no-files-found: ignore', () => {
    const text = readWorkflowText();
    const steps = parseSteps(text);
    const uploadStep = steps.find((step) => step.uses === 'actions/upload-artifact@v4');
    expect(uploadStep).toBeDefined();
    if (uploadStep === undefined) {
      throw new Error('upload-artifact step is missing');
    }
    expect(uploadStep.raw).toMatch(/if-no-files-found:\s*ignore/);
  });
});
