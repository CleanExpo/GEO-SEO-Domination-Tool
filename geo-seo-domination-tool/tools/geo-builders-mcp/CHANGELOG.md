# Changelog

## [0.1.1] - 2025-01-03

### Changed

**Build System Overhaul**: Replaced bundler-based build with pure TypeScript compilation

#### Before (v0.1.0)
- Used `tsup` for bundling
- Had optional dependencies (esbuild, rollup) causing Windows installation issues
- Build command: `tsup src/index.ts --format esm --dts --out-dir dist --clean`

#### After (v0.1.1)
- Uses pure TypeScript compiler (`tsc`)
- Removed tsup and rollup from devDependencies
- Build command: `tsc -p tsconfig.build.json`
- Added `--no-optional` flag to npm install in setup scripts

### Added
- `tsconfig.build.json` - Dedicated build configuration
- `scripts/fix-build.ps1` - Automated Windows build fix script
- `npm run fix:build` - Command to clean and rebuild on Windows

### Fixed
- Windows installation failures due to optional dependency compilation errors
- Long path issues on Windows with node_modules depth
- esbuild/rollup native binary build failures

### Migration Guide

If you already have v0.1.0 installed:

```powershell
# Navigate to the package
cd tools/geo-builders-mcp

# Run the automated fix
npm run fix:build

# Or manually:
rm -rf node_modules package-lock.json
npm install --no-optional
npm run build
```

### Technical Details

**New Build Pipeline**:
1. TypeScript compiles `src/**/*.ts` to `dist/**/*.js`
2. Outputs ESM modules (matching package.json `"type": "module"`)
3. Generates `.d.ts` declaration files
4. No bundling - preserves module structure
5. Faster builds, fewer dependencies

**Why This Change?**:
- Optional dependencies (esbuild, rollup) fail on Windows when:
  - Native binaries can't compile
  - Paths exceed Windows MAX_PATH limit
  - npm tries to build optional deps even when not needed
- Pure TypeScript compiler is more reliable across platforms
- MCP servers don't need bundling (run in Node.js, not browser)
- Simpler build = fewer failure points

---

## [0.1.0] - 2025-01-03

### Added
- Initial MCP server implementation
- Builder registry system with JSON/YAML manifest support
- Two MCP tools: `list_builders`, `inspect_builder`
- Three sample builders:
  - `nextjs-api-route` - Generate Next.js API routes
  - `database-schema` - Generate SQL schemas
  - `mcp-tool` - Generate new MCP tools
- Eta template engine support (Handlebars as alternative)
- Ajv schema validation for builder manifests
- Comprehensive documentation
- Setup scripts for Windows and Unix

### Infrastructure
- TypeScript strict mode
- ESM modules
- stdio transport for MCP
- Builder caching for performance
- Tag-based filtering
