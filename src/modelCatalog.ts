import * as fs from 'fs';
import { findHermesFile } from './hermesPaths';

export interface ModelMenuItem {
  id: string;
  label: string;
  command: string;
}

export interface ModelMenuGroup {
  group: string;
  items: ModelMenuItem[];
}

interface HermesModelRecord {
  id?: string;
  name?: string;
}

interface HermesProviderCache {
  models?: Record<string, HermesModelRecord>;
}

type HermesModelCache = Record<string, HermesProviderCache | undefined>;

const ANTHROPIC_MODEL_IDS = [
  'claude-opus-4-1-20250805',
  'claude-opus-4-20250514',
  'claude-opus-4-5-20251101',
  'claude-opus-4-6',
  'claude-sonnet-4-20250514',
  'claude-sonnet-4-5-20250929',
  'claude-sonnet-4-6',
  'claude-3-haiku-20240307',
  'claude-haiku-4-5-20251001',
];

const OPENAI_MODEL_IDS = [
  'gpt-5.5',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.2',
];

const OPENAI_CODEX_MODEL_IDS = [
  'gpt-5.4-mini',
  'gpt-5.4',
  'gpt-5.3-codex',
  'gpt-5.2-codex',
  'gpt-5.2',
  'gpt-5.1-codex-max',
  'gpt-5.1-codex-mini',
  'gpt-5.3-codex-spark',
];

const FALLBACK_LABELS: Record<string, string> = {
  'claude-opus-4-1-20250805': 'Claude Opus 4.1',
  'claude-opus-4-20250514': 'Claude Opus 4',
  'claude-opus-4-5-20251101': 'Claude Opus 4.5',
  'claude-opus-4-6': 'Claude Opus 4.6',
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
  'claude-sonnet-4-6': 'Claude Sonnet 4.6',
  'claude-3-haiku-20240307': 'Claude 3 Haiku',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'gpt-5.5': 'GPT-5.5',
  'gpt-5.4-mini': 'GPT-5.4 mini',
  'gpt-5.4': 'GPT-5.4',
  'gpt-5.3-codex': 'GPT-5.3 Codex',
  'gpt-5.2-codex': 'GPT-5.2 Codex',
  'gpt-5.2': 'GPT-5.2',
  'gpt-5.1-codex-max': 'GPT-5.1 Codex Max',
  'gpt-5.1-codex-mini': 'GPT-5.1 Codex mini',
  'gpt-5.3-codex-spark': 'GPT-5.3 Codex Spark',
};

const BUILT_IN_PROVIDERS = new Set(['anthropic', 'openai', 'openai-codex']);

function readCache(
  home?: string,
  env?: NodeJS.ProcessEnv,
  platform?: NodeJS.Platform,
): HermesModelCache | null {
  const cachePath = findHermesFile(['models_dev_cache.json'], home, env, platform);
  if (!cachePath) return null;

  try {
    const raw = fs.readFileSync(cachePath, 'utf8');
    return JSON.parse(raw) as HermesModelCache;
  } catch {
    return null;
  }
}

function itemLabel(modelId: string, record?: HermesModelRecord): string {
  const label = record?.name?.trim();
  return label || FALLBACK_LABELS[modelId] || modelId;
}

function buildGroup(
  group: string,
  commandPrefix: string,
  ids: readonly string[],
  models?: Record<string, HermesModelRecord>,
): ModelMenuGroup {
  const hasCache = !!models && Object.keys(models).length > 0;
  const selectedIds = hasCache ? ids.filter((id) => models[id]) : [...ids];
  return {
    group,
    items: (selectedIds.length > 0 ? selectedIds : [...ids]).map((id) => ({
      id,
      label: itemLabel(id, models?.[id]),
      command: `${commandPrefix}:${id}`,
    })),
  };
}

function providerLabel(provider: string): string {
  const knownLabels: Record<string, string> = {
    openrouter: 'OpenRouter',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
  };
  if (knownLabels[provider]) return knownLabels[provider];

  return provider
    .split(/[-_]/)
    .filter(Boolean)
    .map(part => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function buildProviderCacheGroups(cache: HermesModelCache | null): ModelMenuGroup[] {
  if (!cache) return [];

  return Object.entries(cache)
    .filter(([provider, value]) => !BUILT_IN_PROVIDERS.has(provider) && value?.models)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([provider, value]) => ({
      group: providerLabel(provider),
      items: Object.entries(value?.models ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([id, record]) => ({
          id,
          label: itemLabel(id, record),
          command: `${provider}:${id}`,
        })),
    }))
    .filter(group => group.items.length > 0);
}

function buildCustomGroup(customModels: readonly string[]): ModelMenuGroup | null {
  const unique = [...new Set(customModels.map(model => model.trim()).filter(Boolean))];
  if (unique.length === 0) return null;

  return {
    group: 'Custom',
    items: unique.map(model => ({
      id: model,
      label: model,
      command: model,
    })),
  };
}

export function loadHermesModelGroups(
  customModels: readonly string[] = [],
  home?: string,
  env?: NodeJS.ProcessEnv,
  platform?: NodeJS.Platform,
): ModelMenuGroup[] {
  const cache = readCache(home, env, platform);
  const anthropic = cache?.anthropic?.models;
  const openai = cache?.openai?.models;

  const groups = [
    buildGroup('Anthropic', 'anthropic', ANTHROPIC_MODEL_IDS, anthropic),
    buildGroup('OpenAI', 'openai', OPENAI_MODEL_IDS, openai),
    buildGroup('OpenAI Codex', 'openai-codex', OPENAI_CODEX_MODEL_IDS, openai),
    ...buildProviderCacheGroups(cache),
  ];

  const customGroup = buildCustomGroup(customModels);
  if (customGroup) groups.push(customGroup);

  return groups;
}
