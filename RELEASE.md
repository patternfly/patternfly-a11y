# Publishing a new version of patternfly-a11y to npm

**1. Create a new branch for the version bump:**
```bash
git checkout -b release-X.Y.Z
```
(Replace X.Y.Z with the version you want to publish)

**2. Update the version:**
```bash
yarn version X.Y.Z
```

**3. Push the branch:**
```bash
git push -u origin release-X.Y.Z
```

**4. Create a PR to merge into master**

**5. After the PR is merged, checkout master and pull:**
```bash
git checkout master
git pull
```

**6. Verify the version in package.json:**
```bash
grep '"version"' package.json
```
Should show `"version": "X.Y.Z"`

**7. See what files will be included (dry-run):**
```bash
yarn pack --dry-run
```
Check that:
- `cli.js` is included ✓
- `lib/` directory is included ✓
- `README.md` is included ✓
- `coverage/`, `report/`, and `test/` are excluded ✓

**8. Dry-run the publish:**
```bash
npm publish --dry-run
```
Verify the package name, version, and file list look correct.

**9. Create and push the git tag:**
```bash
git tag vX.Y.Z
git push --tags
```

**10. Publish to npm:**
```bash
npm publish
```

**11. Verify the publish succeeded:**
```bash
npm view @patternfly/patternfly-a11y
```
Also check https://www.npmjs.com/package/@patternfly/patternfly-a11y
