# Troubleshooting Guide

## Webpack Cache Errors

If you encounter errors like:
- `Cannot find module './682.js'`
- `Cannot find module './948.js'`
- `TypeError: e[o] is not a function`

### Quick Fix

Run this command:
```bash
npm run fix
```

Or manually:
```bash
rm -rf .next node_modules/.cache
npm run build
```

### Prevention

1. **Always stop the dev server properly** (Ctrl+C) before restarting
2. **Use clean build** when switching branches or after major changes:
   ```bash
   npm run build:clean
   ```
3. **If errors persist**, use the clean dev command:
   ```bash
   npm run dev:clean
   ```

### Why This Happens

Next.js webpack cache can get corrupted when:
- Dev server crashes unexpectedly
- Hot reload gets out of sync
- Dependencies change without clean rebuild
- Multiple dev servers run simultaneously

### Permanent Solution

The `next.config.js` has been updated with webpack optimizations to prevent this issue. If it still occurs, use the `npm run fix` command.



