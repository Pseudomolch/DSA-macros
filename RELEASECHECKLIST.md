# Release Checklist

## 1. Pre-Release Checks
- Run tests and ensure all pass
- Check for uncommitted changes
- Review changes and update changelog

## 2. Update Version Numbers
- Update version in `module.json`
- Update version in `package.json`
- Update version flag in `packs/macros.db` for NPC Aktion macro
    - Example line: "{"_id":"npcaktion","name":"NPC Aktion","type":"script","author":"dsa4macros16char","img":"icons/svg/mystery-man.svg","scope":"global","command":"DSAMacros.macros.DSANPCAction.execute()","folder":null,"sort":0,"ownership":{"default":3},"flags":{"dsa-macros":{"version":"[The Version Number]"}}}"
- Update download URL in `module.json` to match new version

## 3. Release Process
- Commit and push all changes to main branch
- Create and push new version tag
- Create GitHub release with pre-release flag using GitHub CLI
    - Add concise German release notes (max 2 lines)   

## Notes
- Keep changelog notes concise and in German
- Focus on user-facing changes
- Use present tense in changelog
- Version format: X.Y.Z (e.g., 1.0.11)
- Tag format: vX.Y.Z (e.g., v1.0.11)
