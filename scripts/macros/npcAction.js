// DSA NPC Action Macro
export class DSANPCAction {
    static async execute() {
        let selectedToken = canvas.tokens.controlled[0];
        
        if (!selectedToken) {
            ui.notifications.error("Bitte wähle einen Token aus.");
            return;
        }

        // Get the NPC's abilities
        const abilitiesText = selectedToken.actor.getFlag("world", "abilities");
        if (!abilitiesText) {
            ui.notifications.error("Keine Fähigkeiten für diesen NSC gefunden.");
            return;
        }

        // Parse abilities using the NPCParser
        const abilities = game.modules.get('dsa-macros').api.utils.NPCParser.parseAbilities(abilitiesText);
        if (!abilities.length) {
            ui.notifications.error("Keine Fähigkeiten gefunden.");
            return;
        }

        // Get current ability from flag if it exists
        const currentAbility = selectedToken.document.getFlag("world", "currentAbility");

        // Show NPC dialog
        const result = await game.modules.get('dsa-macros').api.dialogs.NPCDialog.execute(abilities, currentAbility);
        if (!result) return;

        // Find the selected ability
        const selectedAbility = abilities.find(a => a.name === result.ability);
        if (!selectedAbility) {
            ui.notifications.error("Fähigkeit nicht gefunden.");
            return;
        }

        // Store the selected ability for next time
        await selectedToken.document.setFlag("world", "currentAbility", selectedAbility.name);

        // Parse attack/parade info
        const abilityText = [selectedAbility.name, ...selectedAbility.details].join(' ');
        const attackInfo = game.modules.get('dsa-macros').api.utils.NPCParser.parseAttackInfo(abilityText);

        if (result.action === 'attack') {
            // Set up attack data
            await selectedToken.document.setFlag("world", "attackData", {
                defaultAttackValue: attackInfo.attackValue,
                attackName: selectedAbility.name,
                damageFormula: attackInfo.damageFormula
            });

            // Execute attack macro
            await game.modules.get('dsa-macros').api.macros.DSAAttack.execute();
        } else if (result.action === 'parade') {
            // Set up parade data
            await selectedToken.document.setFlag("world", "paradeData", {
                defaultParadeValue: selectedToken.actor.system.base.combatAttributes.active.parade.value,
                paradeName: selectedAbility.name
            });

            // Execute parade macro
            await game.modules.get('dsa-macros').api.macros.DSAParade.execute();
        }
    }
}
