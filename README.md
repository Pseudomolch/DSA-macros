# DSA Makros für FoundryVTT

Diese Sammlung von Makros ist für die Verwendung in FoundryVTT, speziell für die DSA 4.1 Kampagne "Der Wurm von Bodrinsfurt" entwickelt worden. Sie automatisieren verschiedene Aspekte des Spielsystems und erleichtern den Spielfluss.

## Makro-Übersicht und Workflow

### 1. Kampfabwicklung

#### a. Angriff (dsa_attack.js)
- Führt einen Angriffswurf für den ausgewählten Token durch.
- Berücksichtigt Modifikatoren wie Wuchtschlag und Finte.
- Bei Erfolg wird ein klickbares Icon angezeigt, das zum Schadenmakro führt.

#### b. Schaden (dsa_damage.js)
- Wird nach einem erfolgreichen Angriff aufgerufen.
- Öffnet einen Dialog (DamageDialog) zur Eingabe von Schadenswerten.
- Berechnet den Schaden unter Berücksichtigung von Rüstungswerten.
- Zeigt ein klickbares Icon an, das zum Wundenmakro führt.

#### c. Wunden (dsa_zone_wounds.js)
- Wird nach der Schadensberechnung aufgerufen.
- Öffnet einen Dialog (WoundsDialog) zur Auswahl der getroffenen Körperzone.
- Fügt Wunden zur entsprechenden Zone hinzu und berechnet die zusätzlichen Auswirkungen:
  - Kopfwunden: Reduziert Initiative um 1W6
  - Bauch- und Brustwunden: Verursacht 1W6 zusätzlichen Schaden
  - Dritte Kopfwunde: Verursacht 2W6 zusätzlichen Schaden

### 2. Charakterverwaltung

#### a. NSC-Verwaltung (dsa_manage_nscs.js)
- Ermöglicht die Eingabe und Speicherung von Attributen und Kampfwerten für NSCs.

#### b. Zonenrüstung verwalten (dsa_manage_zone_armor.js)
- Bietet eine Benutzeroberfläche zur Verwaltung von Rüstungswerten für verschiedene Körperzonen.

#### c. Werte anzeigen und bearbeiten (dsa_werte.js)
- Zeigt aktuelle Werte (LeP, AsP, Sonderfertigkeiten) für ausgewählte Tokens an.
- Ermöglicht die direkte Bearbeitung dieser Werte aus dem Chat heraus.

### 3. Talentproben

#### Talentprobe (dsa_talent.js)
- Führt Talentproben unter Berücksichtigung relevanter Attribute, Talentwerte und Modifikatoren durch.

## Makro-Interaktion

1. Der Spieler initiiert einen Angriff mit dem Angriffsmakro.
2. Bei Erfolg kann der Spieler das Schadenmakro über ein Icon aufrufen.
3. Nach der Schadensberechnung kann der Spieler das Wundenmakro über ein weiteres Icon aktivieren.
4. Wunden werden angewandt und zusätzliche Effekte (Initiative, Zusatzschaden) berechnet.

Die anderen Makros dienen der Charakterverwaltung und können unabhängig vom Kampfablauf verwendet werden.

## Hinweise zur Verwendung

- Stellen Sie sicher, dass für jede Aktion der entsprechende Token ausgewählt ist.
- Die Makros verwenden Flags auf dem angewählten Token, um Daten zu speichern.