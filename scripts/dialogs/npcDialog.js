// DSA NPC Dialog Implementation
export class NPCDialog {
    static async execute(token, attacks, woundEffects, parser) {
        const actor = token.actor;
        
        const dialogContent = `
        <style>
            .dsa-dialog {
                display: flex;
                flex-direction: column;
                gap: 8px;
                padding-bottom: 8px;
            }
            .header {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 10px;
                align-items: center;
                margin-bottom: 10px;
            }
            .token-image {
                width: 48px;
                height: 48px;
                border-radius: 4px;
                border: 1px solid #ccc;
            }
            .header h2 {
                margin: 0;
                padding: 0;
            }
            .dsa-stats {
                background-color: #f0f0f0;
                border: 1px solid #ccc;
                padding: 10px;
                border-radius: 3px;
            }
            .stat-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
                margin-bottom: 10px;
            }
            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 4px 8px;
                background-color: rgba(0, 0, 0, 0.05);
                border-radius: 3px;
            }
            .stat-label { font-weight: bold; }
            .clickable {
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .clickable:hover {
                background-color: rgba(0, 0, 0, 0.1);
            }
            .wounds-list {
                color: #c41e3a;
                background-color: rgba(196, 30, 58, 0.1);
                padding: 8px;
                border-radius: 3px;
                margin-bottom: 10px;
            }
            .attack-list {
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
            .attack-emoji {
                cursor: pointer;
                user-select: none;
                transition: transform 0.2s;
            }
            .attack-emoji:hover { transform: scale(1.2); }
            .attack-name { font-weight: bold; }
            .action-buttons {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
            .action-button {
                padding: 8px;
                background: #2b2b2b;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .action-button:hover { background: #3f3f3f; }
            .attack-stats {
                display: flex;
                gap: 8px;
                color: #666;
            }
        </style>
        <div class="dsa-dialog">
            <div class="header">
                <img class="token-image" src="${token.document.texture.src}" alt="${token.name}">
                <h2>${token.name}</h2>
            </div>
            <div class="dsa-stats">
                <div class="stat-grid">
                    <div class="stat-item">
                        <span class="stat-label">INI</span>
                        <span>${actor.system.base.combatAttributes.active.initiative.value}</span>
                    </div>
                    <div class="stat-item clickable" data-action="parade">
                        <span class="stat-label">PA</span>
                        <span>${actor.system.base.combatAttributes.active.parry.value}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">LeP</span>
                        <span>${actor.system.base.resources.vitality.value}/${actor.system.base.resources.vitality.max}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">RS</span>
                        <span>${parser.getArmorValue() || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">GS</span>
                        <span>${actor.system.base.basicAttributes.speed.value}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">AuP</span>
                        <span>${actor.system.base.resources.endurance.value}/${actor.system.base.resources.endurance.max}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">MR</span>
                        <span>${actor.system.base.combatAttributes.active.magicResistance.value}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">GW</span>
                        <span>${actor.system.base.combatAttributes.active.mentalResistance.value}</span>
                    </div>
                </div>

                ${woundEffects.length > 0 ? `
                <div class="wounds-list">
                    <strong>Wunden:</strong><br>
                    ${woundEffects.map(wound => `• ${wound.label} (${wound.modifiers.join(', ')})`).join('<br>')}
                </div>` : ''}

                <div class="attack-list">
                    ${attacks.map(attack => `
                        <div class="attack-item">
                            <span class="attack-emoji" data-attack='${JSON.stringify(attack)}'>⚔️</span>
                            <span class="attack-name">${attack.name}</span>
                            <div class="attack-stats">
                                <span>DK ${attack.dk}</span>
                                <span>AT ${attack.at}</span>
                                <span>TP ${attack.tp}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="action-buttons">
                <button class="action-button" data-action="damage">Schaden</button>
                <button class="action-button" data-action="zoneWounds">Wunden</button>
            </div>
        </div>`;

        return new Promise((resolve) => {
            new Dialog({
                title: token.name,
                content: dialogContent,
                buttons: {},
                render: (html) => {
                    html.find('.attack-emoji').click(function(event) {
                        event.preventDefault();
                        const attackData = JSON.parse(this.dataset.attack);
                        resolve({ action: 'attack', attack: attackData });
                    });

                    html.find('.action-button').click(function() {
                        resolve({ action: this.dataset.action });
                    });

                    html.find('.stat-item.clickable').click(function() {
                        resolve({ action: this.dataset.action });
                    });
                },
                close: () => resolve(null)
            }, {
                width: 400
            }).render(true);
        });
    }
}
