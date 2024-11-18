// DSA NPC Action Macro
export class DSANPCAction {
    static async execute() {
        let selectedToken = canvas.tokens.controlled[0];
        
        if (!selectedToken) {
            ui.notifications.error("Bitte wähle einen Token aus.");
            return;
        }

        const actor = selectedToken.actor;
        const module = game.modules.get('dsa-macros');
        const parser = new module.api.utils.MeisterpersonParser(actor);

        if (!parser.hasMeisterpersonAbility()) {
            ui.notifications.error("Der ausgewählte Token hat keine Meisterperson-Fähigkeit.");
            return;
        }

        // Get NPC data from the parser
        const attacks = parser.parseAttacks();
        if (!attacks.length) {
            ui.notifications.error("Keine Angriffe für diesen NSC gefunden.");
            return;
        }

        // Get active wound effects with their modifiers
        const woundEffects = actor.effects.filter(e => 
            e.flags.core?.statusId?.startsWith('wound_')
        ).map(e => {
            const label = e.label;
            const countMatch = label.match(/^(\d+) Wunden?/);
            const count = countMatch ? parseInt(countMatch[1]) : 1;
            const location = e.flags.core.statusId.replace('wound_', '').split('_').pop().toLowerCase();
            
            const modifiers = [];
            const modifierCount = Math.min(count, 2);
            
            if (location.includes('kopf')) {
                modifiers.push(
                    `MU ${-2 * modifierCount}`,
                    `KL ${-2 * modifierCount}`,
                    `IN ${-2 * modifierCount}`,
                    `INI-Basis ${-2 * modifierCount}`
                );
                if (count >= 3) modifiers.push('bewusstlos, Blutverlust');
            } else if (location.includes('brust')) {
                modifiers.push(
                    `AT ${-1 * modifierCount}`,
                    `PA ${-1 * modifierCount}`,
                    `KO ${-1 * modifierCount}`,
                    `KK ${-1 * modifierCount}`
                );
                if (count >= 3) modifiers.push('bewusstlos, Blutverlust');
            } else if (location.includes('bauch')) {
                modifiers.push(
                    `AT ${-1 * modifierCount}`,
                    `PA ${-1 * modifierCount}`,
                    `KO ${-1 * modifierCount}`,
                    `KK ${-1 * modifierCount}`,
                    `GS ${-1 * modifierCount}`,
                    `INI-Basis ${-1 * modifierCount}`
                );
                if (count >= 3) modifiers.push('bewusstlos, Blutverlust');
            } else if (location.includes('arm')) {
                modifiers.push(
                    `AT ${-2 * modifierCount}`,
                    `PA ${-2 * modifierCount}`,
                    `KK ${-2 * modifierCount}`,
                    `FF ${-2 * modifierCount}`
                );
                if (count >= 3) modifiers.push('Arm handlungsunfähig');
            } else if (location.includes('bein')) {
                modifiers.push(
                    `AT ${-2 * modifierCount}`,
                    `PA ${-2 * modifierCount}`,
                    `GE ${-2 * modifierCount}`,
                    `INI-Basis ${-2 * modifierCount}`
                );
                if (count >= 3) modifiers.push('Bein handlungsunfähig');
            }
            
            return {
                label: label,
                modifiers: modifiers
            };
        });

        // Show dialog and get result
        const result = await module.api.dialogs.NPCDialog.execute(selectedToken, attacks, woundEffects, parser);
        if (!result) return;

        // Handle actions
        switch (result.action) {
            case 'attack':
                if (result.attack) {
                    await selectedToken.document.setFlag("world", "attackData", {
                        defaultAttackValue: result.attack.at,
                        attackName: result.attack.name,
                        damageFormula: result.attack.tp
                    });
                }
                await module.api.macros.DSAAttack.execute();
                break;
            case 'parade':
                await module.api.macros.DSAParade.execute();
                break;
            case 'damage':
                await module.api.macros.DSADamage.execute();
                break;
            case 'zoneWounds':
                await module.api.macros.DSAZoneWounds.execute();
                break;
        }
    }
}
