// Check for selected token with Meisterperson ability
let selectedToken = null;
let meisterpersonAbility = null;
let defaultParadeValue = "";
let defaultModifier = 0;

if (canvas.tokens.controlled.length === 1) {
    selectedToken = canvas.tokens.controlled[0];
    meisterpersonAbility = selectedToken.actor.items.find(item => item.type === "specialAbility" && item.name === "Meisterperson");
    
    // Get parade modifiers from active effects
    const paradeEffects = selectedToken.actor.effects.filter(e => 
        e.changes.some(c => c.key === "system.base.combatAttributes.active.baseParry.value")
    );
    
    for (const effect of paradeEffects) {
        const paradeChanges = effect.changes.filter(c => 
            c.key === "system.base.combatAttributes.active.baseParry.value"
        );
        for (const change of paradeChanges) {
            // Flip the sign of the modifier (e.g. -4 becomes +4)
            defaultModifier -= Number(change.value);
        }
    }
    
    if (meisterpersonAbility) {
        const match = meisterpersonAbility.system.description.match(/INI \d+, PA (\d+),/);
        if (match) {
            defaultParadeValue = match[1];
        }
    }
}

// Prompt the user for the parade value and modifiers
let paradeValues = await new Promise((resolve) => {
    new Dialog({
        title: "DSA 4.1 Paradewurf",
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
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }
        </style>
        <form class="dsa-dialog">
            <div>
                <label for="paradeValue">Parade</label>
                <input id="paradeValue" type="number" value="${defaultParadeValue}" required>
            </div>
            <div class="modifiers">
                <div>
                    <label for="modifier">Mod</label>
                    <input id="modifier" type="number" value="${defaultModifier}">
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
                    const finte = parseInt(html.find('#finte')[0].value) || 0;
                    if (finte < 0) {
                        ui.notifications.error("Negative Finte ist nicht unterstützt.");
                        return;
                    }
                    resolve({
                        paradeValue: parseInt(html.find('#paradeValue')[0].value),
                        modifier: parseInt(html.find('#modifier')[0].value) || 0,
                        finte: finte
                    });
                }
            }
        },
        default: "roll",
        render: html => setTimeout(() => html.find('#paradeValue').focus(), 0)
    }, {
        width: 225
    }).render(true);
});

// If dialog was closed without resolving (due to negative finte), exit the macro
if (!paradeValues) return;

// Function to perform a parade roll
function performParadeRoll() {
    return new Roll('1d20').roll({async: false}).total;
}

// Calculate the total modifier
let totalModifier = paradeValues.modifier + paradeValues.finte;

// Perform the initial parade roll
let naturalRoll = performParadeRoll();
let finalRoll = naturalRoll + totalModifier;

// Determine the result
let result;
let confirmationRoll;
let confirmationFinalRoll;

if (naturalRoll === 1 || naturalRoll === 20) {
    confirmationRoll = performParadeRoll();
    confirmationFinalRoll = confirmationRoll + totalModifier;
}

if (naturalRoll === 1) {
    result = confirmationFinalRoll <= paradeValues.paradeValue ? "Kritischer Erfolg" : "Erfolg";
} else if (naturalRoll === 20) {
    result = confirmationFinalRoll > paradeValues.paradeValue ? "Patzer" : "Fehlschlag";
} else {
    result = finalRoll <= paradeValues.paradeValue ? "Erfolg" : "Fehlschlag";
}

// Construct the message content
let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;

// Add just the character name if available
if (selectedToken && meisterpersonAbility) {
    messageContent += `<strong>${selectedToken.name}</strong> pariert<br>`;
}

messageContent += `<strong>Parade:</strong> ${paradeValues.paradeValue}<br>`;

if (naturalRoll === 1 || naturalRoll === 20) {
    messageContent += `<strong>Wurf:</strong> ${naturalRoll}<br>`;
    messageContent += `<strong>Bestätigungswurf:</strong> ${confirmationRoll}`;
    
    let modParts = [];
    if (paradeValues.modifier !== 0) modParts.push(`${paradeValues.modifier} Mod`);
    if (paradeValues.finte !== 0) modParts.push(`${paradeValues.finte} Finte`);
    
    if (modParts.length > 0) {
        messageContent += ` + ${modParts.join(' + ')} = ${confirmationFinalRoll}`;
    }
    
    messageContent += `<br>`;
} else {
    messageContent += `<strong>Wurf:</strong> ${naturalRoll}`;
    
    let modParts = [];
    if (paradeValues.modifier !== 0) modParts.push(`${paradeValues.modifier} Mod`);
    if (paradeValues.finte !== 0) modParts.push(`${paradeValues.finte} Finte`);
    
    if (modParts.length > 0) {
        messageContent += ` + ${modParts.join(' + ')} = ${finalRoll}`;
    }
    
    messageContent += `<br>`;
}

messageContent += `<span style="color: ${result.includes("Erfolg") ? "green" : "red"};">${result}</span>`;

// Send the result to the chat
await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: messageContent
}); 