// Check if only one token is selected
if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error("Bitte wähle genau einen Token aus.");
    return;
}

const token = canvas.tokens.controlled[0];
const tokenActor = token.actor;
const originalActor = game.actors.get(tokenActor.id);
const isUnlinkedToken = !token.document.actorLink;

// Use originalActor instead of actor in the rest of the code
const actor = originalActor;

// Function to parse existing NPC data
function parseExistingNPCData(description) {
    const lines = description.split('\n');
    if (lines.length >= 2) {
        const [line1, line2, ...attackLines] = lines;
        const regex1 = /INI (\d+), PA (\d+), LeP (\d+), RS (\d+), KO (\d+)/;
        const regex2 = /GS (\d+), AuP (\d+), MR (\d+), GW (\d+)/;
        const regexAttack = /Angriff (.+), DK ([A-Z]), AT (\d+), TP (.+)/;
        const match1 = line1.match(regex1);
        const match2 = line2.match(regex2);
        
        if (match1 && match2) {
            const attacks = attackLines
                .map(line => line.match(regexAttack))
                .filter(match => match !== null)
                .map(match => ({
                    name: match[1],
                    dk: match[2],
                    at: parseInt(match[3]),
                    tp: match[4]
                }));

            return {
                ini: parseInt(match1[1]),
                pa: parseInt(match1[2]),
                lep: parseInt(match1[3]),
                rs: parseInt(match1[4]),
                ko: parseInt(match1[5]),
                gs: parseInt(match2[1]),
                aup: parseInt(match2[2]),
                mr: parseInt(match2[3]),
                gw: parseInt(match2[4]),
                attacks: attacks.length > 0 ? attacks : [{ name: '', dk: '', at: 0, tp: '' }]
            };
        }
    }
    return null;
}

// Check for existing NPC data
let existingNPCData = null;
const existingAbility = actor.items.find(item => item.type === "specialAbility" && item.name === "Meisterperson");
if (existingAbility) {
    existingNPCData = parseExistingNPCData(existingAbility.system.description);
}

// Create the dialog
new Dialog({
    title: "DSA Meisterperson verwalten",
    content: `
    <style>
        .dsa-dialog-container {
            display: flex;
            flex-direction: column;
            height: 60vh;
            max-height: 600px;
        }
        .dsa-dialog { 
            flex: 1;
            overflow-y: auto;
            padding-right: 8px;
            margin-bottom: 8px;
        }
        .dsa-dialog input[type="number"], 
        .dsa-dialog input[type="text"] { 
            width: 100%; 
            text-align: center; 
        }
        .dsa-dialog label { 
            display: block; 
            text-align: center; 
            margin-bottom: 2px; 
            margin-top: 8px;
        }
        .dsa-dialog .token-header {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px;
            margin-bottom: 16px;
        }
        .dsa-dialog .token-image {
            width: 32px;
            height: 32px;
            border: none;
        }
        .dsa-dialog .token-name {
            font-size: 24px;
            flex: 1;
            margin: 0;
        }
        .dsa-dialog .npc-row {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
        }
        .dsa-dialog .attack-container {
            border: 1px solid #999;
            padding: 8px;
            margin-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .dsa-dialog .attacks-scroll-container {
            overflow-y: auto;
            padding-right: 8px;
        }
        .dsa-dialog .attack-headers {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 30px;
            gap: 8px;
            margin-bottom: 8px;
            font-weight: bold;
            text-align: center;
            position: sticky;
            top: 0;
            background: var(--color-bg, white);
            padding: 4px 0;
            z-index: 1;
        }
        .dsa-dialog .attack-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 30px;
            gap: 8px;
            align-items: center;
            margin-bottom: 8px;
        }
        .dsa-dialog .attack-row input {
            margin: 0;
        }
        .remove-attack {
            color: red;
            cursor: pointer;
        }
        .add-attack {
            width: 100%;
            margin-top: 8px;
        }
        .dialog-buttons {
            flex-shrink: 0;
            padding: 8px;
            border-top: 1px solid var(--color-border-light, #ddd);
            background: var(--color-bg, white);
        }
    </style>
    <div class="dsa-dialog-container">
        <form class="dsa-dialog">
            <div class="token-header">
                <img class="token-image" src="${token.document.texture.src}" alt="${token.name}">
                <h2 class="token-name">${token.name}</h2>
            </div>
            <div class="npc-row">
                <div>
                    <label for="ini">INI</label>
                    <input type="number" id="ini" name="ini" value="${existingNPCData?.ini || 0}">
                </div>
                <div>
                    <label for="pa">PA</label>
                    <input type="number" id="pa" name="pa" value="${existingNPCData?.pa || 0}">
                </div>
                <div>
                    <label for="lep">LeP</label>
                    <input type="number" id="lep" name="lep" value="${existingNPCData?.lep || 0}">
                </div>
                <div>
                    <label for="rs">RS</label>
                    <input type="number" id="rs" name="rs" value="${existingNPCData?.rs || 0}">
                </div>
                <div>
                    <label for="ko">KO</label>
                    <input type="number" id="ko" name="ko" value="${existingNPCData?.ko || 0}">
                </div>
            </div>
            <div class="npc-row">
                <div>
                    <label for="gs">GS</label>
                    <input type="number" id="gs" name="gs" value="${existingNPCData?.gs || 0}">
                </div>
                <div>
                    <label for="aup">AuP</label>
                    <input type="number" id="aup" name="aup" value="${existingNPCData?.aup || 0}">
                </div>
                <div>
                    <label for="mr">MR</label>
                    <input type="number" id="mr" name="mr" value="${existingNPCData?.mr || 0}">
                </div>
                <div>
                    <label for="gw">GW</label>
                    <input type="number" id="gw" name="gw" value="${existingNPCData?.gw || 0}">
                </div>
            </div>
            <div class="attack-container">
                <div class="attack-headers">
                    <div>Angriff</div>
                    <div>DK</div>
                    <div>AT</div>
                    <div>TP</div>
                    <div></div>
                </div>
                <div class="attacks-scroll-container">
                    <div id="attacks-container">
                        ${(existingNPCData?.attacks || [{ name: '', dk: '', at: 0, tp: '' }]).map((attack, index) => `
                            <div class="attack-row" data-index="${index}">
                                <div>
                                    <input type="text" name="attackName_${index}" value="${attack.name}">
                                </div>
                                <div>
                                    <input type="text" name="dk_${index}" maxlength="1" value="${attack.dk}">
                                </div>
                                <div>
                                    <input type="number" name="at_${index}" value="${attack.at}">
                                </div>
                                <div>
                                    <input type="text" name="tp_${index}" value="${attack.tp}">
                                </div>
                                ${index > 0 ? `<i class="fas fa-times remove-attack"></i>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <button type="button" class="add-attack">Angriff hinzufügen</button>
            </div>
        </form>
    </div>
    `,
    buttons: {
        save: {
            icon: '<i class="fas fa-save"></i>',
            label: "Speichern",
            callback: async (html) => {
                const parseNumber = (input) => {
                    const num = parseInt(input);
                    if (isNaN(num)) {
                        ui.notifications.error("Falscher Input, nutze eine Zahl.");
                        return null;
                    }
                    return num;
                };

                const ini = parseNumber(html.find('[name="ini"]').val());
                const pa = parseNumber(html.find('[name="pa"]').val());
                const lep = parseNumber(html.find('[name="lep"]').val());
                const rs = parseNumber(html.find('[name="rs"]').val());
                const ko = parseNumber(html.find('[name="ko"]').val());
                const gs = parseNumber(html.find('[name="gs"]').val());
                const aup = parseNumber(html.find('[name="aup"]').val());
                const mr = parseNumber(html.find('[name="mr"]').val());
                const gw = parseNumber(html.find('[name="gw"]').val());

                if ([ini, pa, lep, rs, ko, gs, aup, mr, gw].some(value => value === null)) {
                    return;
                }

                let description = `INI ${ini}, PA ${pa}, LeP ${lep}, RS ${rs}, KO ${ko}\nGS ${gs}, AuP ${aup}, MR ${mr}, GW ${gw}`;

                // Get all attacks
                const attackRows = html.find('.attack-row');
                const attacks = [];
                attackRows.each((newIndex, row) => {
                    const name = $(row).find('input[name^="attackName_"]').val();
                    const dk = $(row).find('input[name^="dk_"]').val().toUpperCase();
                    const at = parseNumber($(row).find('input[name^="at_"]').val());
                    const tp = $(row).find('input[name^="tp_"]').val();

                    if (name && dk && at !== null && tp) {
                        attacks.push({ name, dk, at, tp });
                    }
                });

                // Add each attack to the description
                attacks.forEach(attack => {
                    description += `\nAngriff ${attack.name}, DK ${attack.dk}, AT ${attack.at}, TP ${attack.tp}`;
                });

                // Update or create the special ability
                if (existingAbility) {
                    await originalActor.updateEmbeddedDocuments("Item", [{
                        _id: existingAbility.id,
                        "system.description": description
                    }]);
                    
                    if (isUnlinkedToken) {
                        const tokenAbility = tokenActor.items.find(item => item.type === "specialAbility" && item.name === "Meisterperson");
                        if (tokenAbility) {
                            await tokenActor.updateEmbeddedDocuments("Item", [{
                                _id: tokenAbility.id,
                                "system.description": description
                            }]);
                        } else {
                            await tokenActor.createEmbeddedDocuments("Item", [{
                                name: "Meisterperson",
                                type: "specialAbility",
                                system: {
                                    description: description
                                }
                            }]);
                        }
                    }
                } else {
                    await originalActor.createEmbeddedDocuments("Item", [{
                        name: "Meisterperson",
                        type: "specialAbility",
                        system: {
                            description: description
                        }
                    }]);
                    
                    if (isUnlinkedToken) {
                        await tokenActor.createEmbeddedDocuments("Item", [{
                            name: "Meisterperson",
                            type: "specialAbility",
                            system: {
                                description: description
                            }
                        }]);
                    }
                }

                // Update actor settings and attributes
                const updateData = {
                    "system.settings": {
                        autoCalcBaseAttack: false,
                        autoCalcBaseParry: false,
                        autoCalcBaseRangedAttack: false,
                        autoCalcInitiative: false,
                        autoCalcMagicResistance: false,
                        autoCalcWoundThresholds: false,
                        hasAstralEnergy: false,
                        hasKarmicEnery: false
                    },
                    "system.base.combatAttributes.active.baseInitiative.value": ini,
                    "system.base.combatAttributes.active.baseParry.value": pa,
                    "system.base.resources.vitality.value": lep,
                    "system.base.resources.vitality.max": lep,
                    "system.base.combatAttributes.passive.magicResistance.value": mr,
                    "system.base.basicAttributes.constitution.value": ko
                };

                await originalActor.update(updateData);
                
                if (isUnlinkedToken) {
                    await tokenActor.update(updateData);
                }

                ui.notifications.info("Meisterperson gespeichert und Einstellungen aktualisiert.");
            }
        },
        cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Abbrechen"
        }
    },
    default: "save",
    width: 600,
    height: "auto",
    jQuery: true
}).render(true);

// Add event listeners after dialog is rendered
Hooks.once('renderDialog', (dialog) => {
    const html = dialog.element;
    
    // Add attack button
    html.find('.add-attack').click(() => {
        const container = html.find('#attacks-container');
        const newIndex = container.children().length;
        
        const newAttackHtml = `
            <div class="attack-row" data-index="${newIndex}">
                <div>
                    <input type="text" name="attackName_${newIndex}" value="">
                </div>
                <div>
                    <input type="text" name="dk_${newIndex}" maxlength="1" value="">
                </div>
                <div>
                    <input type="number" name="at_${newIndex}" value="0">
                </div>
                <div>
                    <input type="text" name="tp_${newIndex}" value="">
                </div>
                <i class="fas fa-times remove-attack"></i>
            </div>
        `;
        
        container.append(newAttackHtml);
    });
    
    // Remove attack button
    html.on('click', '.remove-attack', function() {
        $(this).closest('.attack-row').remove();
        // Update indices of remaining rows
        html.find('.attack-row').each((newIndex, row) => {
            $(row).attr('data-index', newIndex);
            $(row).find('input[name^="attackName_"]').attr('name', `attackName_${newIndex}`);
            $(row).find('input[name^="dk_"]').attr('name', `dk_${newIndex}`);
            $(row).find('input[name^="at_"]').attr('name', `at_${newIndex}`);
            $(row).find('input[name^="tp_"]').attr('name', `tp_${newIndex}`);
        });
    });
});