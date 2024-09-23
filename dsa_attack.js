// Prompt the user for the attack value and modifiers
let attackValues = await new Promise((resolve) => {
    new Dialog({
        title: "DSA 4.1 Angriffsprobe",
        content: `
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center;">
                <label for="attackValue">Attacke:</label>
                <input id="attackValue" type="number" style="width: 100%;">
                <label for="modifier">Mod:</label>
                <input id="modifier" type="number" style="width: 100%;">
                <label for="wuchtschlag">Wuchtschlag:</label>
                <input id="wuchtschlag" type="number" style="width: 100%;">
                <label for="finte">Finte:</label>
                <input id="finte" type="number" style="width: 100%;">
            </div>
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
        render: html => {
            const inputs = html.find('input');
            inputs.on('keydown', function(e) {
                if (e.which === 9) { // Tab key
                    e.preventDefault();
                    const nextInput = inputs.eq((inputs.index(this) + 1) % inputs.length);
                    nextInput.focus();
                }
            });
            setTimeout(() => html.find('#attackValue').focus(), 0);
        }
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
messageContent += `<strong>Attacke:</strong> ${attackValues.attackValue}<br>`;

if (naturalRoll === 1 || naturalRoll === 20) {
    messageContent += `<strong>Wurf:</strong> ${naturalRoll}<br>`;
    messageContent += `<strong>Bestätigungswurf:</strong> ${confirmationRoll}`;
    
    let modParts = [];
    if (totalModifier !== 0) modParts.push(`${totalModifier} Mod`);
    
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

if (attackValues.finte > 0 && (result.includes("Erfolg"))) {
    messageContent += `<br>Mit Finte (${attackValues.finte})`;
}
if (attackValues.wuchtschlag > 0 && (result.includes("Erfolg"))) {
    messageContent += `<br>Mit Wuchtschlag (${attackValues.wuchtschlag})`;
}
messageContent += `</div>`;

// Send the result to the chat
ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: messageContent
});