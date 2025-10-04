/**
 * Builder Registry - Discovers and manages builders
 */

import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Ajv from "ajv";
import yaml from "js-yaml";
import type {
  BuilderManifest,
  RegistryConfig,
  BuilderSummary,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// JSON Schema for builder manifest validation
const BUILDER_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  title: "Builder Manifest",
  type: "object",
  required: ["id", "version", "title", "templates"],
  properties: {
    id: { type: "string", pattern: "^[a-z0-9-]+$" },
    version: { type: "string" },
    title: { type: "string" },
    summary: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    targetPaths: { type: "array", items: { type: "string" } },
    variables: {
      type: "array",
      items: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          required: { type: "boolean", default: false },
          example: { type: "string" },
          description: { type: "string" },
          default: {},
        },
        additionalProperties: false,
      },
    },
    templates: {
      type: "array",
      items: {
        type: "object",
        required: ["from", "to"],
        properties: {
          from: { type: "string" },
          to: { type: "string" },
          engine: {
            type: "string",
            enum: ["eta", "handlebars"],
            default: "eta",
          },
        },
        additionalProperties: false,
      },
    },
    conflicts: {
      type: "array",
      items: {
        type: "object",
        required: ["glob", "strategy"],
        properties: {
          glob: { type: "string" },
          strategy: { type: "string", enum: ["fail", "overwrite", "rename"] },
        },
        additionalProperties: false,
      },
    },
    hooks: {
      type: "object",
      properties: {
        pre: { type: "array", items: { type: "string" } },
        post: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
    validators: { type: "array", items: { type: "string" } },
    licenses: {
      type: "array",
      items: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          url: { type: "string" },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

export class BuilderRegistry {
  private config: RegistryConfig;
  private ajv: Ajv;
  private manifestCache: Map<string, BuilderManifest> = new Map();

  constructor(config: RegistryConfig) {
    this.config = config;
    this.ajv = new Ajv();
  }

  /**
   * Get the absolute path to the builders directory
   */
  private getBuildersPath(): string {
    // Navigate up from tools/geo-builders-mcp/src to repo root
    const repoRoot = join(__dirname, "..", "..", "..");
    return join(repoRoot, "builders");
  }

  /**
   * Discover all builders from configured sources
   */
  async discoverBuilders(): Promise<BuilderSummary[]> {
    const builders: BuilderSummary[] = [];

    for (const source of this.config.sources) {
      if (source.type === "local") {
        const localBuilders = await this.discoverLocalBuilders(source.path);
        builders.push(...localBuilders);
      }
    }

    return builders;
  }

  /**
   * Discover builders from a local directory
   */
  private async discoverLocalBuilders(
    relativePath: string
  ): Promise<BuilderSummary[]> {
    const buildersPath = this.getBuildersPath();
    const builders: BuilderSummary[] = [];

    try {
      const entries = await readdir(buildersPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const builderPath = join(buildersPath, entry.name);
          const manifest = await this.loadManifest(builderPath);

          if (manifest) {
            builders.push({
              id: manifest.id,
              version: manifest.version,
              title: manifest.title,
              summary: manifest.summary,
              tags: manifest.tags,
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error discovering builders from ${buildersPath}:`, error);
    }

    return builders;
  }

  /**
   * Load and validate a builder manifest
   */
  private async loadManifest(
    builderPath: string
  ): Promise<BuilderManifest | null> {
    try {
      // Try manifest.json first
      const jsonPath = join(builderPath, "manifest.json");
      try {
        const content = await readFile(jsonPath, "utf-8");
        const manifest = JSON.parse(content);
        if (this.validateManifest(manifest)) {
          return manifest;
        }
      } catch {
        // Try manifest.yaml
        const yamlPath = join(builderPath, "manifest.yaml");
        try {
          const content = await readFile(yamlPath, "utf-8");
          const manifest = yaml.load(content) as BuilderManifest;
          if (this.validateManifest(manifest)) {
            return manifest;
          }
        } catch {
          // No valid manifest found
          return null;
        }
      }
    } catch (error) {
      console.error(`Error loading manifest from ${builderPath}:`, error);
      return null;
    }

    return null;
  }

  /**
   * Validate a builder manifest against the schema
   */
  private validateManifest(manifest: any): boolean {
    const validate = this.ajv.compile(BUILDER_SCHEMA);
    const valid = validate(manifest);

    if (!valid) {
      console.error("Invalid manifest:", validate.errors);
      return false;
    }

    return true;
  }

  /**
   * Get a specific builder by ID
   */
  async getBuilder(id: string): Promise<BuilderManifest | null> {
    // Check cache first
    if (this.manifestCache.has(id)) {
      return this.manifestCache.get(id)!;
    }

    // Search in all sources
    const buildersPath = this.getBuildersPath();
    const builderPath = join(buildersPath, id);

    const manifest = await this.loadManifest(builderPath);
    if (manifest) {
      this.manifestCache.set(id, manifest);
    }

    return manifest;
  }

  /**
   * Filter builders by tags
   */
  async filterByTags(tags: string[]): Promise<BuilderSummary[]> {
    const allBuilders = await this.discoverBuilders();

    if (!tags || tags.length === 0) {
      return allBuilders;
    }

    return allBuilders.filter((builder) => {
      if (!builder.tags) return false;
      return tags.some((tag) => builder.tags!.includes(tag));
    });
  }
}
