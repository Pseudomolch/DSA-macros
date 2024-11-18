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

        // Create dialog content
        const dialogContent = `
        <style>
            .dsa-dialog {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding-bottom: 8px;
            }
            .dsa-stats {
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                padding: 10px;
                border-radius: 3px;
                margin-bottom: 10px;
            }
            .header-container {
                align-items: center;
                margin: 0 0 10px 0;
                padding: 0;
                border-bottom: 1px solid #ccc;
                display: grid;
                grid-template-columns: 1fr auto;
                align-items: center;
            }
            .header-container h2 {
                margin: 0;
                padding: 0;
            }
            .refresh-button {
                cursor: pointer;
                background: none;
                border: none;
                padding: 0;
                font-size: 1.2em;
                width: 1.5em;
                text-align: center;
            }
            .refresh-button:hover {
                transform: rotate(180deg);
                transition: transform 0.5s;
            }
            .stat-line { margin: 5px 0; }
            .wounds-list {
                margin-top: 10px;
                color: red;
            }
            .action-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            .action-button {
                padding: 5px;
                text-align: center;
                background: #4b4a44;
                color: #ffffff;
                border: 1px solid #7a7971;
                border-radius: 3px;
                cursor: pointer;
            }
            .action-button:hover {
                background: #7a7971;
            }
            .attack-list { margin-top: 10px; }
            .attack-item {
                display: flex;
                align-items: center;
                margin: 5px 0;
                gap: 8px;
            }
            .attack-emoji {
                cursor: pointer;
                user-select: none;
            }
            .attack-emoji:hover {
                transform: scale(1.2);
            }
            .attack-name { flex: 1; }
        </style>
        <div class="dsa-dialog">
            <div class="dsa-stats">
                <div class="header-container">
                    <h2>${selectedToken.name}</h2>
                    <button class="refresh-button" title="Aktualisieren">🔄</button>
                </div>

                <div class="attack-list">
                    ${attacks.map(attack => `
                        <div class="attack-item">
                            <span class="attack-emoji" data-attack='${JSON.stringify(attack)}'>⚔️</span>
                            <span class="attack-name">${attack.name}</span>
                            <span class="attack-stats">DK ${attack.dk}, AT ${attack.at}, TP ${attack.tp}</span>
                        </div>
                    `).join('')}
                </div>

                ${woundEffects.length > 0 ? `
                <div class="wounds-list">
                    <strong>Wunden:</strong><br>
                    ${woundEffects.map(wound => `• ${wound.label} (${wound.modifiers.join(', ')})`).join('<br>')}
                </div>
                ` : ''}
            </div>
            <div class="action-buttons">
                <button class="action-button" data-macro="attack">Attacke</button>
                <button class="action-button" data-macro="parade">Parade</button>
                <button class="action-button" data-macro="damage">Schaden</button>
                <button class="action-button" data-macro="zoneWounds">Wunden</button>
            </div>
        </div>`;

        // Create and render the dialog
        let currentDialog = new Dialog({
            title: "DSA NSC Aktionen",
            content: dialogContent,
            buttons: {},
            render: (html) => {
                // Add click handler for refresh button
                html.find('.refresh-button').click(async () => {
                    currentDialog.close();
                    await this.execute();
                });

                // Add click handlers for action buttons
                html.find('.action-button').click(async (event) => {
                    const macroName = event.currentTarget.dataset.macro;
                    const macro = game.macros.getName(macroName);
                    if (macro) {
                        await macro.execute();
                    } else {
                        ui.notifications.error(`Makro ${macroName} nicht gefunden`);
                    }
                });

                // Add event listeners for attack rolls
                html.find('.attack-emoji').click(async function(event) {
                    event.preventDefault();
                    const attackData = JSON.parse(this.dataset.attack);
                    await selectedToken.document.setFlag("world", "attackData", {
                        attackName: attackData.name || "",
                        defaultAttackValue: parseInt(attackData.at) || 0,
                        attackModifier: 0,
                        damageFormula: attackData.tp || ""
                    });

                    const attackMacro = game.macros.getName("attack");
                    if (attackMacro) {
                        attackMacro.execute();
                    } else {
                        ui.notifications.error("attack macro not found");
                    }
                });
            }
        }, {
            width: 400
        }).render(true);
    }
}
