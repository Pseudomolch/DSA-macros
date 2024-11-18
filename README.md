# DSA 4.1 Makros für Foundry VTT

**WARNUNG: EXPERIMENTELL UND UNGETESTET - Dieses Modul befindet sich derzeit in der Entwicklung und wurde noch nicht gründlich getestet. Benutzung auf eigene Gefahr!**

## Entwicklung

### Setup
1. Repository klonen
2. Dependencies installieren:
```bash
npm install
```

### Tests
Das Projekt verwendet Jest für Tests. Die Tests befinden sich im Verzeichnis `scripts/tests/`.

Tests ausführen:
```bash
npm test
```

Neue Tests erstellen:
1. Erstelle eine neue Datei `*.test.js` im Verzeichnis `scripts/tests/`
2. Folge dem vorhandenen Testmuster (siehe `npcAction.test.js` als Beispiel)

### Entwicklungsrichtlinien
- Schreibe Tests für neue Funktionalität
- Führe Tests aus, bevor du Änderungen commitest
- Halte die Tests aktuell, wenn sich die Funktionalität ändert
