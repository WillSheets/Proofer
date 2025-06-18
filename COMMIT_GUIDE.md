# Commit Guide for Proofer Transformation

This guide outlines the recommended commit strategy for finalizing the transformation from Bolt CEP template to Proofer.

## Pre-commit Checklist

- [ ] Create or remove icon files referenced in `cep.config.ts`
- [ ] Regenerate package-lock.json: `rm package-lock.json && npm install`
- [ ] Run `npm run build` to verify everything compiles
- [ ] Test the extension in Adobe Illustrator

## Recommended Commit Sequence

### 1. Package Metadata Updates
```bash
git add package.json tsconfig.json
git commit -m "refactor: Update package metadata and remove template references

- Update package.json with Proofer branding and SheetLabels.com URLs
- Remove template-* exclude pattern from tsconfig.json
- Change all BOLT_ACTION references to PROOFER_ACTION"
```

### 2. Configuration Cleanup
```bash
git add cep.config.ts vite.config.ts config/
git commit -m "refactor: Clean up configuration files

- Remove BOLT_*_ONLY comments from vite.config.ts
- Ensure all configs use Proofer branding
- Update environment variable references"
```

### 3. Source Code Renaming
```bash
git add src/js/lib/utils/proofer.ts
git rm src/js/lib/utils/bolt.ts
git add src/js/lib/utils/*.ts src/js/main/*.tsx
git commit -m "refactor: Rename bolt.ts to proofer.ts and update imports

- Rename initBolt() to initProofer()
- Update all imports from './bolt' to './proofer'
- Update function calls throughout codebase"
```

### 4. Documentation and Comments
```bash
git add src/js/lib/cep/*.js
git add implementation-updates.md README.md docs/
git commit -m "docs: Clean up comments and documentation

- Remove boilerplate comments from CEP library files
- Update implementation progress documentation
- Ensure all docs reference Proofer only"
```

### 5. Final Cleanup
```bash
git add -A
git commit -m "chore: Final cleanup and verification

- Verify no template references remain in source
- Document missing icon files issue
- Complete transformation to Proofer codebase"
```

### 6. Regenerate Dependencies
```bash
rm package-lock.json
npm install
git add package-lock.json
git commit -m "chore: Regenerate package-lock.json

- Remove final bolt references from package-lock.json
- Fresh dependency tree for Proofer"
```

## Post-commit Actions

1. **Update GitHub repository**:
   - Update repository description
   - Add appropriate topics (adobe-illustrator, cep, extension, label-printing)
   - Update any badges in README if needed

2. **Create release**:
   - Tag as v1.0.0
   - Build ZXP file: `npm run zxp`
   - Create GitHub release with ZXP attached

3. **Clean up this guide**:
   - Delete `COMMIT_GUIDE.md` after commits are complete
   - Keep `implementation-updates.md` for historical reference

## Notes

- Each commit represents a logical unit of the transformation
- The commit messages follow conventional commit format
- Test the extension after each major commit to ensure functionality 