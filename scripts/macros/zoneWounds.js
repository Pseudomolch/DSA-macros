// DSA Zone Wounds Macro
export class DSAZoneWounds {
    static async execute() {
        let selectedToken = canvas.tokens.controlled[0];
        
        if (!selectedToken) {
            ui.notifications.error("Bitte wähle einen Token aus.");
            return;
        }

        // Get current zone wounds values
        let currentWounds = selectedToken.actor.getFlag("world", "zoneWounds");

        // Show zone wounds dialog
        const zoneWounds = await game.modules.get('dsa-macros').api.dialogs.ZoneWoundsDialog.execute(currentWounds || {});
        if (!zoneWounds) return;

        // Save zone wounds values
        await selectedToken.actor.setFlag("world", "zoneWounds", zoneWounds);

        // Create chat message to display wounds values
        let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
        messageContent += `<strong>Zonenwunden für ${selectedToken.name}</strong><br>`;
        messageContent += `Kopf: ${zoneWounds.kopf}<br>`;
        messageContent += `Brust: ${zoneWounds.brust}<br>`;
        messageContent += `Rücken: ${zoneWounds.ruecken}<br>`;
        messageContent += `Bauch: ${zoneWounds.bauch}<br>`;
        messageContent += `Linker Arm: ${zoneWounds.arme[0]}<br>`;
        messageContent += `Rechter Arm: ${zoneWounds.arme[1]}<br>`;
        messageContent += `Linkes Bein: ${zoneWounds.beine[0]}<br>`;
        messageContent += `Rechtes Bein: ${zoneWounds.beine[1]}`;
        messageContent += `</div>`;

        await ChatMessage.create({
            content: messageContent,
            speaker: ChatMessage.getSpeaker({ token: selectedToken })
        });
    }
}
