// DSA Zone Armor Macro
export class DSAZoneArmor {
    static async execute() {
        let selectedToken = canvas.tokens.controlled[0];
        
        if (!selectedToken) {
            ui.notifications.error("Bitte wähle einen Token aus.");
            return;
        }

        // Get current zone armor values
        let currentArmor = selectedToken.actor.getFlag("world", "zoneArmor");
        
        // If no zone armor exists, try to parse from abilities
        if (!currentArmor) {
            const abilitiesText = selectedToken.actor.getFlag("world", "abilities");
            if (abilitiesText) {
                currentArmor = game.modules.get('dsa-macros').api.utils.NPCParser.parseZoneArmorInfo(abilitiesText);
            }
        }

        // Show zone armor dialog
        const zoneArmor = await game.modules.get('dsa-macros').api.dialogs.ZoneArmorDialog.execute(currentArmor || {});
        if (!zoneArmor) return;

        // Save zone armor values
        await selectedToken.actor.setFlag("world", "zoneArmor", zoneArmor);

        // Create chat message to display armor values
        let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
        messageContent += `<strong>Zonenrüstung für ${selectedToken.name}</strong><br>`;
        messageContent += `Kopf: ${zoneArmor.kopf}<br>`;
        messageContent += `Brust: ${zoneArmor.brust}<br>`;
        messageContent += `Rücken: ${zoneArmor.ruecken}<br>`;
        messageContent += `Bauch: ${zoneArmor.bauch}<br>`;
        messageContent += `Linker Arm: ${zoneArmor.arme[0]}<br>`;
        messageContent += `Rechter Arm: ${zoneArmor.arme[1]}<br>`;
        messageContent += `Linkes Bein: ${zoneArmor.beine[0]}<br>`;
        messageContent += `Rechtes Bein: ${zoneArmor.beine[1]}`;
        messageContent += `</div>`;

        await ChatMessage.create({
            content: messageContent,
            speaker: ChatMessage.getSpeaker({ token: selectedToken })
        });
    }
}
