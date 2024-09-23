// Prompt the user for the damage formula and modifiers
let damageValues = await new Promise((resolve) => {
    new Dialog({
        title: "DSA 4.1 Schadenswurf",
        content: `
            <label for="damageFormula">Schaden:</label><input id="damageFormula" type="text" style="width: 100%;" placeholder="z.B. 1W+4 oder 1W6+4"><br>
            <label for="wuchtschlag">Wucht:</label><input id="wuchtschlag" type="number" style="width: 100%;" value="0"><br>
            <label for="kritisch">Kritisch:</label><input id="kritisch" type="checkbox">
        `,
        buttons: {
            roll: {
                label: "Würfeln",
                callback: (html) => {
                    resolve({
                        damageFormula: html.find('#damageFormula')[0].value,
                        wuchtschlag: parseInt(html.find('#wuchtschlag')[0].value) || 0,
                        kritisch: html.find('#kritisch')[0].checked
                    });
                }
            }
        },
        default: "roll"
    }).render(true);
});

// Function to perform a damage roll
function performDamageRoll(formula) {
    return new Roll(formula).roll({async: false});
}

// Parse the damage formula
let parsedFormula = damageValues.damageFormula.replace(/W/gi, 'd').replace(/(\d+)d(\d*)\+?(\d*)/, (match, p1, p2, p3) => {
    return `${p1}d${p2 || '6'}${p3 ? '+'+p3 : ''}`;
});

// Perform the initial damage roll
let damageRoll = performDamageRoll(parsedFormula);

// Calculate the total damage
let baseDamage = damageRoll.total;
let criticalMultiplier = damageValues.kritisch ? 2 : 1;
let totalDamage = (baseDamage * criticalMultiplier) + damageValues.wuchtschlag;

// Function to convert d6 results to Unicode dice faces
function getDiceFace(value) {
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return diceFaces[value - 1];
}

// Generate dice faces string if d6 are used
let diceRollString = '';
if (parsedFormula.includes('d6')) {
    const diceResults = damageRoll.dice[0].results.map(r => getDiceFace(r.result));
    diceRollString = diceResults.join('');
} else {
    diceRollString = damageRoll.dice[0].total;
}

// Extract the modifier from the original formula
let modifier = damageValues.damageFormula.match(/\+(\d+)/);
modifier = modifier ? `+${modifier[1]}` : '';

// Construct the message content
let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
messageContent += `<strong>Schaden:</strong> `;
if (damageValues.kritisch) {
    messageContent += `(${damageValues.damageFormula})x2(Krit)`;
} else {
    messageContent += `${damageValues.damageFormula}`;
}
if (damageValues.wuchtschlag > 0) messageContent += `+${damageValues.wuchtschlag}(Wucht)`;
messageContent += `<br>`;
messageContent += `<strong>Wurf:</strong> `;
if (damageValues.kritisch) {
    messageContent += `(${diceRollString}${modifier})x2`;
} else {
    messageContent += `${diceRollString}${modifier}`;
}
if (damageValues.wuchtschlag > 0) messageContent += `+${damageValues.wuchtschlag}`;
messageContent += ` = ${totalDamage} Schaden`;
messageContent += `</div>`;

// Send the result to the chat
ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: messageContent
});