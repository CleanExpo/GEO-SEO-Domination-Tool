#!/usr/bin/env node

/**
 * GEO Builders MCP Server
 * Simplified stdio-based implementation with Git snapshots
 */

import { stdin as input, stdout as output } from 'node:process';
import { join, resolve } from 'path';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import fg from 'fast-glob';
import yaml from 'js-yaml';
import { previewApply } from './tools/preview_apply.js';
import { applyBuilder } from './tools/apply_builder.js';

interface Call {
  id: string;
  tool: string;
  params?: any;
}

interface Resp {
  id: string;
  ok: boolean;
  result?: any;
  error?: { message: string };
}

// Navigate up to repo root from tools/geo-builders-mcp
const repoRoot = resolve(join(import.meta.dirname || __dirname, '..', '..', '..'));
const buildersRoot = join(repoRoot, 'builders');

async function list_builders(_params: any) {
  const entries = await fg(
    ['*/builder.manifest.json', '*/builder.manifest.yaml'],
    { cwd: buildersRoot, deep: 2 }
  );

  const out: any[] = [];
  for (const p of entries) {
    const full = join(buildersRoot, p);
    const raw = await readFile(full, 'utf8');
    const obj =
      p.endsWith('.yaml') || p.endsWith('.yml')
        ? yaml.load(raw)
        : JSON.parse(raw);
    const data: any = obj;

    out.push({
      id: data.id ?? p.split('/')[0],
      version: data.version ?? '0.0.0',
      title: data.title ?? data.id ?? 'builder',
      summary: data.summary ?? '',
      tags: data.tags ?? [],
    });
  }

  return { builders: out };
}

async function inspect_builder(params: any) {
  const id = params?.id as string;
  if (!id) throw new Error('id required');

  const json = join(buildersRoot, id, 'builder.manifest.json');
  const yamlPath = join(buildersRoot, id, 'builder.manifest.yaml');
  const existsJson = existsSync(json);
  const existsYaml = existsSync(yamlPath);

  if (!existsJson && !existsYaml) {
    throw new Error(`manifest not found for ${id}`);
  }

  const raw = await readFile(existsJson ? json : yamlPath, 'utf8');
  const data = existsJson ? JSON.parse(raw) : yaml.load(raw);

  return data;
}

async function handleCall(c: Call): Promise<Resp> {
  try {
    if (c.tool === 'list_builders') {
      return { id: c.id, ok: true, result: await list_builders(c.params) };
    }

    if (c.tool === 'inspect_builder') {
      return { id: c.id, ok: true, result: await inspect_builder(c.params) };
    }

    if (c.tool === 'preview_apply') {
      const res = await previewApply({
        repoRoot,
        buildersRoot,
        id: c.params?.id,
        variables: c.params?.variables,
        flags: c.params?.flags,
      });
      return { id: c.id, ok: true, result: res };
    }

    if (c.tool === 'apply_builder') {
      const res = await applyBuilder({
        repoRoot,
        buildersRoot,
        id: c.params?.id,
        variables: c.params?.variables,
        strategy: c.params?.strategy,
        engine: c.params?.engine,
      });
      return { id: c.id, ok: true, result: res };
    }

    throw new Error(`Unknown tool: ${c.tool}`);
  } catch (e: any) {
    return { id: c.id, ok: false, error: { message: e?.message || String(e) } };
  }
}

let buf = '';
input.setEncoding('utf8');
input.on('data', (chunk: string) => {
  buf += chunk;
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    (async () => {
      const call = JSON.parse(line) as Call;
      const resp = await handleCall(call);
      output.write(JSON.stringify(resp) + '\n');
    })();
  }
});

console.error('geo-builders-mcp v0.2.0 running on stdio');
