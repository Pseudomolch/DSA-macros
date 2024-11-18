# Release Checklist

## 1. Update Module Version
1. Open `module.json`
2. Update version number (e.g., "1.0.7" -> "1.0.8")
3. Update download URL to match new version (e.g., "v1.0.7.zip" -> "v1.0.8.zip")

## 2. Push Changes and Create Tag
```bash
# Add and commit module.json changes
git add module.json
git commit -m "chore: bump version to X.Y.Z"
git push origin main

# Create and push new version tag
git tag -a vX.Y.Z -m "Version X.Y.Z"
git push origin vX.Y.Z
```

## 3. Create GitHub Release
```bash
# Create release with pre-release flag and concise German notes (2 lines max)
gh release create vX.Y.Z \
  --prerelease \
  --title "Version X.Y.Z" \
  --notes "Hauptänderung in einem Satz.
Weitere Änderungen in einem Satz."
```

## Notes
- Keep changelog notes concise and in German
- Focus on user-facing changes
- Use present tense in changelog
- Version format: X.Y.Z (e.g., 1.0.8)
- Tag format: vX.Y.Z (e.g., v1.0.8)
