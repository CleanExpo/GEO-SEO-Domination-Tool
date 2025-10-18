# Tree-Shaking Fix Documentation

## Problem Summary

**Issue:** `/api/onboarding/save` endpoint returning `500 Internal Server Error` with `TypeError: h.get is not a function` in production.

**Root Cause:** Webpack's aggressive tree-shaking and Terser minification removed the `get()`, `run()`, and `all()` convenience methods from the DatabaseClient class during production builds, even though they were defined in the source code.

---

## Research Findings from Official Documentation

### 1. **Webpack Tree-Shaking Behavior**

**Source:** [Webpack Tree Shaking Guide](https://webpack.js.org/guides/tree-shaking/)

Tree-shaking is a term commonly used in the JavaScript context for dead-code elimination. It relies on the static structure of ES2015 module syntax (i.e., `import` and `export`). In production mode, webpack uses Terser to perform tree-shaking and minification.

**Key Points:**
- Tree-shaking removes code it determines to be "unused"
- Operates based on static analysis of imports/exports
- Can be overly aggressive with class methods

### 2. **Terser Minification and Class Methods**

**Source:** [Next.js Issue #59594 - Class names are minified breaking libraries](https://github.com/vercel/next.js/issues/59594)

Next.js production builds minify class names by default, which can break libraries that depend on class names or methods. This issue appeared in Next.js 14+.

**Workaround Solutions:**
1. Use TerserPlugin with `keep_classnames: true`
2. Set `keep_fnames: true` to preserve function names
3. Modify webpack configuration to control Terser behavior

### 3. **Next.js Custom Terser Options**

**Source:** [Next.js Discussion #24275 - Support for custom terser options](https://github.com/vercel/next.js/discussions/24275)

Next.js doesn't officially expose an easy way to customize Terser options. Developers need to manually patch webpack configuration.

**Example Configuration:**
```javascript
// next.config.js
module.exports = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.minimizer[0].options.terserOptions.mangle = {
        keep_fnames: true,
        keep_classnames: true,
      };
    }
    return config;
  },
};
```

### 4. **sideEffects Configuration**

**Source:** [Webpack sideEffects Documentation](https://github.com/webpack/webpack/blob/main/examples/side-effects/README.md)

The `sideEffects` property in `package.json` indicates whether a package's modules have side effects. Setting `"sideEffects": false` enables more aggressive tree-shaking.

**Warning:** Database clients often have initialization code that constitutes side effects. Setting `sideEffects: false` inappropriately can cause methods to be removed.

### 5. **Next.js 15 Optimization Changes**

**Source:** [Next.js 15.5 Release Notes](https://nextjs.org/blog/next-15-5)

Next.js 15 includes Turbopack as a Rust-based bundler and uses advanced optimization strategies. Production builds automatically enable:
- Code splitting
- Tree-shaking via webpack 5
- Terser minification
- Dead code elimination

---

## Our Solution: Pragmatic Approach

Based on the research, we implemented a **pragmatic workaround** instead of fighting webpack optimization:

### **Implementation (Commit 80223da)**

Instead of using tree-shaken convenience methods:
```typescript
// ❌ These get removed by webpack/Terser
const existing = await db.get('SELECT...', [params]);
await db.run('INSERT...', [params]);
await db.all('SELECT...', [params]);
```

Use base methods that webpack preserves:
```typescript
// ✅ These are kept in production bundle
const existing = await db.queryOne('SELECT...', [params]);
await db.query('INSERT...', [params]);
const results = await db.query('SELECT...', [params]);
```

### **Why This Works**

1. **Base Methods Are Used Internally:** The `query()` and `queryOne()` methods are called by other class methods, creating a dependency chain that webpack recognizes.

2. **Leaf Methods Get Removed:** Convenience methods like `get()`, `run()`, and `all()` are "leaf nodes" in the dependency tree - they only wrap base methods and aren't called by anything else.

3. **Terser's Analysis:** Terser's static analysis sees these leaf methods as unused and removes them during minification.

---

## Alternative Solutions (For Future Consideration)

### **Option 1: Configure Terser to Preserve Methods**

```javascript
// next.config.js
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: (config, { isServer, dev }) => {
    if (!dev && !isServer) {
      // Find existing TerserPlugin
      const terserPlugin = config.optimization.minimizer.find(
        plugin => plugin.constructor.name === 'TerserPlugin'
      );

      if (terserPlugin) {
        terserPlugin.options.terserOptions.mangle = {
          ...terserPlugin.options.terserOptions.mangle,
          keep_classnames: true,
          keep_fnames: true,
        };
      }
    }
    return config;
  },
};
```

**Pros:** Preserves all class methods
**Cons:** Larger bundle size, requires custom webpack configuration

### **Option 2: Add PURE Annotations**

```typescript
/**
 * @preserve
 * @__PURE__
 */
async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const result = await this.queryOne(sql, params);
  return result || undefined;
}
```

**Pros:** Fine-grained control
**Cons:** Annotations may be ignored by Terser, maintenance overhead

### **Option 3: Add sideEffects Configuration**

```json
// package.json
{
  "sideEffects": [
    "lib/db.ts"
  ]
}
```

**Pros:** Standard webpack configuration
**Cons:** Affects entire module, may prevent other optimizations

---

## Production Verification

**Test Results:**
```bash
✅ POST /api/onboarding/save: 200 OK
   Response: {"success":true,"message":"Progress saved successfully"}

✅ GET /api/debug/db-config: 200 OK
   Response: {"success":true,"config":{"dbType":"Supabase PostgreSQL",...}}
```

**Diagnostic Endpoint:**
```json
{
  "hasQuery": "function",    // ✅ Present
  "hasQueryOne": "function", // ✅ Present
  "hasGet": "undefined",     // ❌ Tree-shaken (expected)
  "hasRun": "undefined",     // ❌ Tree-shaken (expected)
  "hasAll": "undefined"      // ❌ Tree-shaken (expected)
}
```

---

## Lessons Learned

1. **Tree-Shaking Can Be Overly Aggressive:** Even defined class methods can be removed if webpack deems them "unused"

2. **Production ≠ Development:** Issues that don't appear in dev builds can manifest in production due to optimization differences

3. **Diagnostic Endpoints Are Invaluable:** Creating `/api/test-db-methods` immediately identified the exact methods being removed

4. **Dead Code Blocks Don't Help:** Using `if (false) { db.get() }` doesn't prevent tree-shaking because dead code elimination happens first

5. **Pragmatic Solutions Win:** Sometimes working around the build system is more efficient than fighting it

---

## References

- [Webpack Tree Shaking Guide](https://webpack.js.org/guides/tree-shaking/)
- [Next.js Issue #59594 - Class Name Minification](https://github.com/vercel/next.js/issues/59594)
- [Next.js Discussion #24275 - Custom Terser Options](https://github.com/vercel/next.js/discussions/24275)
- [Webpack sideEffects Documentation](https://github.com/webpack/webpack/blob/main/examples/side-effects/README.md)
- [Terser Documentation](https://github.com/terser/terser)
- [Next.js Webpack Configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js)

---

## Status

✅ **RESOLVED** - Production system fully operational with base method approach (Commit 80223da)

**Last Updated:** October 18, 2025
**Next.js Version:** 15.5.6
**Webpack Version:** 5.x (bundled with Next.js)
**Node Version:** 18.17.0
