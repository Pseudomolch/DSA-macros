// DSA NPC Dialog Implementation
export class NPCDialog {
    static async execute(token, attacks, woundEffects, parser) {
        // Ensure we have valid objects
        const actor = token?.actor || {};
        // Get stats with safe fallbacks
        const stats = parser?.parseStats() || {};
        const armorValue = stats.rs || 0;
        // Get current LeP
        const vitality = { 
            value: actor?.system?.base?.resources?.vitality?.value ?? 0, 
            max: stats.lep || 0 
        };
        const endurance = { value: stats.aup || 0, max: stats.aup || 0 };
        const initiative = stats.ini || 0;
        const parry = stats.pa || 0;
        const magicResistance = stats.mr || 0;
        const challengeRating = stats.gw || 0;
        const speed = stats.gs || 0;
        const constitution = stats.ko || 0;

        // Create dialog content
        const content = `
            <style>
                .npc-dialog {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    padding-bottom: 8px;
                }
                .npc-dialog__header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .npc-dialog__image {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                }
                .npc-dialog__title {
                    font-size: 18px;
                    font-weight: bold;
                }
                .npc-dialog__stats {
                    background-color: #f0f0f0;
                    border: 1px solid #ccc;
                    padding: 10px;
                    border-radius: 3px;
                }
                .stat-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 4px 8px;
                    background-color: rgba(0, 0, 0, 0.05);
                    border-radius: 3px;
                }
                .stat-label { font-weight: bold; }
                .stat-value { font-weight: normal; }
                .clickable {
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                .clickable:hover {
                    background-color: rgba(0, 0, 0, 0.1);
                }
                .npc-dialog__wounds {
                    color: #c41e3a;
                    background-color: rgba(196, 30, 58, 0.1);
                    padding: 8px;
                    border-radius: 3px;
                    margin-bottom: 10px;
                }
                .npc-dialog__attacks {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 10px;
                }
                .attack-item {
                    display: grid;
                    grid-template-columns: auto 1fr auto;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 8px;
                    background-color: rgba(0, 0, 0, 0.05);
                    border-radius: 3px;
                }
                .attack-name { font-weight: bold; }
                .attack-stats {
                    display: flex;
                    gap: 8px;
                    color: #666;
                }
                .attack-emoji {
                    cursor: pointer;
                    user-select: none;
                    transition: transform 0.2s;
                }
                .attack-emoji:hover { transform: scale(1.2); }
            </style>
            <div class="npc-dialog">
                <div class="npc-dialog__header">
                    <img class="npc-dialog__image" src="${token.document?.texture?.src || ''}" alt="${actor.name}">
                    <div class="npc-dialog__title">${actor.name}</div>
                </div>

                <div class="npc-dialog__stats">
                    <div class="stat-item">
                        <span class="stat-label">Initiative:</span>
                        <span class="stat-value">${initiative}</span>
                    </div>
                    <div class="stat-item clickable" data-action="parade">
                        <span class="stat-label">Parade:</span>
                        <span class="stat-value">${parry}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Rüstungsschutz:</span>
                        <span class="stat-value">${armorValue}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Geschwindigkeit:</span>
                        <span class="stat-value">${speed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Magieresistenz:</span>
                        <span class="stat-value">${magicResistance}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Gefahrenwert:</span>
                        <span class="stat-value">${challengeRating}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">LeP:</span>
                        <span class="stat-value">${vitality.value}/${vitality.max}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">AuP:</span>
                        <span class="stat-value">${endurance.value}/${endurance.max}</span>
                    </div>                    
                    <div class="stat-item">
                        <span class="stat-label">Konstitution:</span>
                        <span class="stat-value">${constitution}</span>
                    </div>                    
                </div>

                ${woundEffects?.length > 0 ? `
                <div class="npc-dialog__wounds">
                    <strong>Wunden:</strong><br>
                    ${woundEffects.map(wound => `• ${wound.name} (${wound.description})`).join('<br>')}
                </div>` : ''}

                ${attacks?.length > 0 ? `
                <div class="npc-dialog__attacks">
                    ${attacks.map(attack => `
                    <div class="attack-item">
                        <span class="attack-name">${attack.name}</span>
                        <span class="attack-stats">
                            AT ${attack.at} | TP ${attack.tp} | DK ${attack.dk}
                        </span>
                        <span class="attack-emoji" data-attack='${JSON.stringify(attack)}'>⚔️</span>
                    </div>
                    `).join('')}
                </div>` : ''}
            </div>
        `;

        // Create and render dialog
        const dialog = new Dialog({
            title: token.name,
            content: content,
            buttons: {},
            render: html => {
                // Add click handlers
                html.find('.stat-item.clickable[data-action="parade"]').click(async () => {
                    // Set parade data on the token
                    await token.document.setFlag("world", "paradeData", {
                        defaultParadeValue: parry,
                        paradeModifier: 0
                    });
                    
                    dialog.close();
                    // Execute the parade macro
                    const module = game.modules.get('dsa-macros');
                    await module.api.macros.DSAParade.execute();
                });

                html.find('.attack-emoji').click(async function() {
                    const attack = JSON.parse($(this).attr('data-attack'));
                    
                    // Set attack data on the token
                    await token.document.setFlag("world", "attackData", {
                        defaultAttackValue: String(attack.at),
                        attackName: attack.name,
                        attackModifier: 0,
                        damageFormula: attack.tp
                    });
                    
                    dialog.close();
                    // Execute the attack macro
                    const module = game.modules.get('dsa-macros');
                    await module.api.macros.DSAAttack.execute();
                });
            }
        });

        return dialog.render(true);
    }
}
