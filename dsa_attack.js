// Check for selected token with Meisterperson ability
let selectedToken = null;
let meisterpersonAbility = null;
let defaultAttackValue = "";
let attackName = "";
let attackModifier = 0;
let damageFormula = "";

if (canvas.tokens.controlled.length === 1) {
    selectedToken = canvas.tokens.controlled[0];
    
    // Get passed attack data if available
    const attackData = selectedToken.document.getFlag("world", "attackData");
    if (attackData && attackData.defaultAttackValue !== undefined) {
        defaultAttackValue = String(attackData.defaultAttackValue);
        attackName = attackData.attackName || "";
        attackModifier = attackData.attackModifier || 0;
        damageFormula = attackData.damageFormula || "";
        
        // Clear the flag after reading
        selectedToken.document.unsetFlag("world", "attackData");
    } else {
        // If no passed data, try to get from Meisterperson
        meisterpersonAbility = selectedToken.actor.items.find(item => item.type === "specialAbility" && item.name === "Meisterperson");
        
        // Get attack modifiers from active effects
        const attackEffects = selectedToken.actor.effects.filter(e => 
            e.changes.some(c => c.key === "system.base.combatAttributes.active.baseAttack.value")
        );
        
        for (const effect of attackEffects) {
            const attackChanges = effect.changes.filter(c => 
                c.key === "system.base.combatAttributes.active.baseAttack.value"
            );
            for (const change of attackChanges) {
                // Flip the sign of the modifier (e.g. -4 becomes +4)
                attackModifier -= Number(change.value);
            }
        }
        
        if (meisterpersonAbility) {
            const lines = meisterpersonAbility.system.description.split('\n');
            const attackRegex = /Angriff (.+), DK ([A-Z]), AT (\d+), TP (.+)/;
            
            // Find the first valid attack line
            for (const line of lines) {
                const match = line.match(attackRegex);
                if (match) {
                    attackName = match[1];
                    defaultAttackValue = match[3];
                    damageFormula = match[4];
                    break;
                }
            }
        }
    }
}

// Prompt the user for the attack value and modifiers
let attackValues = await new Promise((resolve) => {
    new Dialog({
        title: "DSA 4.1 Angriffsprobe",
        content: `
        <style>
            .dsa-dialog { 
                display: grid; 
                grid-template-columns: 1fr; 
                gap: 8px; 
                padding-bottom: 8px;
            }
            .dsa-dialog input[type="number"] { 
                width: 100%; 
                text-align: center; 
            }
            .dsa-dialog label { 
                display: block; 
                text-align: center; 
                margin-bottom: 2px; 
                margin-top: 8px;
            }
            .dsa-dialog .modifiers {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }
            .dialog-buttons {
                margin-top: 8px;
            }
        </style>
        <form class="dsa-dialog">
            <div>
                <label for="attackValue">Attacke</label>
                <input id="attackValue" type="number" value="${defaultAttackValue}" required>
            </div>
            <div class="modifiers">
                <div>
                    <label for="modifier">Mod</label>
                    <input id="modifier" type="number" value="${attackModifier}">
                </div>
                <div>
                    <label for="wuchtschlag">Wuchtschlag</label>
                    <input id="wuchtschlag" type="number" value="0">
                </div>
                <div>
                    <label for="finte">Finte</label>
                    <input id="finte" type="number" value="0">
                </div>
            </div>
        </form>
        `,
        buttons: {
            roll: {
                label: "Würfeln",
                callback: (html) => {
                    resolve({
                        attackValue: parseInt(html.find('#attackValue')[0].value),
                        modifier: parseInt(html.find('#modifier')[0].value) || 0,
                        wuchtschlag: parseInt(html.find('#wuchtschlag')[0].value) || 0,
                        finte: parseInt(html.find('#finte')[0].value) || 0
                    });
                }
            }
        },
        default: "roll",
        render: html => setTimeout(() => html.find('#attackValue').focus(), 0)
    }, {
        width: 225 // Reduced width by about 25%
    }).render(true);
});

// Function to perform an attack roll
function performAttackRoll() {
    return new Roll('1d20').roll({async: false}).total;
}

// Calculate the total modifier
let totalModifier = attackValues.modifier + attackValues.wuchtschlag + attackValues.finte;

// Perform the initial attack roll
let naturalRoll = performAttackRoll();
let finalRoll = naturalRoll + totalModifier;

// Determine the result
let result;
let confirmationRoll;
let confirmationFinalRoll;

if (naturalRoll === 1 || naturalRoll === 20) {
    confirmationRoll = performAttackRoll();
    confirmationFinalRoll = confirmationRoll + totalModifier;
}

if (naturalRoll === 1) {
    result = confirmationFinalRoll <= attackValues.attackValue ? "Kritischer Erfolg" : "Erfolg";
} else if (naturalRoll === 20) {
    result = confirmationFinalRoll > attackValues.attackValue ? "Patzer" : "Fehlschlag";
} else {
    result = finalRoll <= attackValues.attackValue ? "Erfolg" : "Fehlschlag";
}

// Construct the message content
let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;

// Add the new line for selected token and attack name if available
if (selectedToken && meisterpersonAbility && attackName) {
    messageContent += `<strong>${selectedToken.name}</strong> attackiert mit <strong>${attackName}</strong><br>`;
}

messageContent += `<strong>Attacke:</strong> ${attackValues.attackValue}<br>`;

if (naturalRoll === 1 || naturalRoll === 20) {
    messageContent += `<strong>Wurf:</strong> ${naturalRoll}<br>`;
    messageContent += `<strong>Bestätigungswurf:</strong> ${confirmationRoll}`;
    
    let modParts = [];
    if (attackValues.modifier !== 0) modParts.push(`${attackValues.modifier} Mod`);
    if (attackValues.wuchtschlag !== 0) modParts.push(`${attackValues.wuchtschlag} Wuchtschlag`);
    if (attackValues.finte !== 0) modParts.push(`${attackValues.finte} Finte`);
    
    if (modParts.length > 0) {
        messageContent += ` + ${modParts.join(' + ')} = ${confirmationFinalRoll}`;
    }
    
    messageContent += `<br>`;
} else {
    messageContent += `<strong>Wurf:</strong> ${naturalRoll}`;
    
    let modParts = [];
    if (attackValues.modifier !== 0) modParts.push(`${attackValues.modifier} Mod`);
    if (attackValues.wuchtschlag !== 0) modParts.push(`${attackValues.wuchtschlag} Wuchtschlag`);
    if (attackValues.finte !== 0) modParts.push(`${attackValues.finte} Finte`);
    
    if (modParts.length > 0) {
        messageContent += ` + ${modParts.join(' + ')} = ${finalRoll}`;
    }
    
    messageContent += `<br>`;
}

messageContent += `<span style="color: ${result.includes("Erfolg") ? "green" : "red"};">${result}</span>`;

// Add clickable icon for successful attacks
if (result.includes("Erfolg")) {
    messageContent += ` <a class="call-damage" data-crit="${result === "Kritischer Erfolg"}" data-wuchtschlag="${attackValues.wuchtschlag}">⚔️</a>`;
}

if (attackValues.finte > 0 && result.includes("Erfolg")) {
    messageContent += `<br>Mit Finte (${attackValues.finte})`;
}
messageContent += `</div>`;

// Send the result to the chat
let chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: messageContent
});

// If it's a success, store the data for the damage roll and add click handler
if (result.includes("Erfolg")) {
    if (selectedToken) {
        await selectedToken.document.setFlag("world", "attackData", {
            kritisch: result === "Kritischer Erfolg",
            wuchtschlag: attackValues.wuchtschlag,
            damageFormula: damageFormula
        });
    }

    setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${chatMessage.id}"]`);
        if (messageElement) {
            const callDamageButton = messageElement.querySelector('.call-damage');
            if (callDamageButton) {
                const clickHandler = async (event) => {
                    event.preventDefault();
                    const damageMacro = game.macros.getName("dsa_damage");
                    if (damageMacro) {
                        damageMacro.execute();
                    } else {
                        ui.notifications.error("dsa_damage macro not found");
                    }
                };

                callDamageButton.addEventListener('click', clickHandler);
                Hooks.once(`deleteMessage${chatMessage.id}`, () => {
                    callDamageButton.removeEventListener('click', clickHandler);
                });
            }
        }
    }, 100);
}
