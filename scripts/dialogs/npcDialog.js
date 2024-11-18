// DSA NPC Dialog Implementation
export class NPCDialog {
    static async execute(token, attacks, woundEffects, parser) {
        // Ensure we have valid objects
        const actor = token?.actor || {};
        const system = actor?.system?.base || {};
        const resources = system?.resources || {};
        const combatAttributes = system?.combatAttributes?.active || {};
        const basicAttributes = system?.basicAttributes || {};

        // Get stats with safe fallbacks
        const initiative = combatAttributes?.initiative?.value || 0;
        const parry = combatAttributes?.parry?.value || 0;
        const magicResistance = combatAttributes?.magicResistance?.value || 0;
        const mentalResistance = combatAttributes?.mentalResistance?.value || 0;
        const speed = basicAttributes?.speed?.value || 0;
        const armorValue = parser?.getArmorValue() || 0;
        const vitality = resources?.vitality || { value: 0, max: 0 };
        const endurance = resources?.endurance || { value: 0, max: 0 };

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
                    <img src="${token.document.texture.src}" alt="${token.name}" class="npc-dialog__image">
                    <h2 class="npc-dialog__title">${token.name}</h2>
                </div>

                <div class="npc-dialog__stats">
                    <div class="stat-item">
                        <span class="stat-label">INI</span>
                        <span class="stat-value">${initiative}</span>
                    </div>
                    <div class="stat-item clickable" data-action="parade">
                        <span class="stat-label">PA</span>
                        <span class="stat-value">${parry}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">MR</span>
                        <span class="stat-value">${magicResistance}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">KO</span>
                        <span class="stat-value">${mentalResistance}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">GS</span>
                        <span class="stat-value">${speed}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">RS</span>
                        <span class="stat-value">${armorValue}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">LE</span>
                        <span class="stat-value">${vitality.value}/${vitality.max}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">AE</span>
                        <span class="stat-value">${endurance.value}/${endurance.max}</span>
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
                html.find('.stat-item.clickable[data-action="parade"]').click(() => {
                    dialog.close();
                    return { action: 'parade' };
                });

                html.find('.attack-emoji').click(function() {
                    const attack = JSON.parse($(this).data('attack'));
                    dialog.close();
                    return { action: 'attack', attack };
                });
            }
        });

        return dialog.render(true);
    }
}
