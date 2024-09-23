// Check if a token is selected
let token = null;
let wounds = 0;
let woundThresholds = [];

if (canvas.tokens.controlled.length > 0) {
    token = canvas.tokens.controlled[0];
    const actor = token.actor;

    // Get constitution and other relevant attributes
    const constitution = actor.system.base.basicAttributes.constitution.value;
    const eisern = (actor.items.find(item => item.name === "Eisern") === undefined) ? 0 : 2;
    const glasknochen = (actor.items.find(item => item.name === "Glasknochen") === undefined) ? 0 : -2;

    // Calculate wound thresholds
    woundThresholds = [
        Math.ceil(constitution / 2) + eisern + glasknochen,
        Math.ceil(constitution) + eisern + glasknochen,
        Math.ceil(constitution * 1.5) + eisern + glasknochen
    ];
}

// Prompt the user for the damage formula and modifiers
let damageValues = await new Promise((resolve) => {
    new Dialog({
        title: "DSA 4.1 Schadenswurf",
        content: `
        <style>
            .dsa-dialog { 
                display: grid; 
                grid-template-columns: 1fr; 
                gap: 8px; 
                padding-bottom: 8px;
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
            .dsa-dialog .top-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 8px;
                align-items: start;
            }
            .dsa-dialog .armor-row {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 8px;
            }
            .dialog-buttons {
                margin-top: 8px;
            }
            .crit-container {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .crit-container input[type="checkbox"] {
                margin-top: 5px;
            }
        </style>
        <form class="dsa-dialog">
            <div class="top-row">
                <div>
                    <label for="damageFormula">Schaden</label>
                    <input id="damageFormula" type="text" placeholder="z.B. 1W+4" required>
                </div>
                <div>
                    <label for="wuchtschlag">Wucht</label>
                    <input id="wuchtschlag" type="number" value="0">
                </div>
                <div class="crit-container">
                    <label for="kritisch">Krit</label>
                    <input id="kritisch" type="checkbox">
                </div>
            </div>
            <div class="armor-row">
                <div>
                    <label for="kopf">Kopf</label>
                    <input id="kopf" type="number" value="0">
                </div>
                <div>
                    <label for="brust">Brust</label>
                    <input id="brust" type="number" value="0">
                </div>
                <div>
                    <label for="arme">Arme</label>
                    <input id="arme" type="number" value="0">
                </div>
                <div>
                    <label for="bauch">Bauch</label>
                    <input id="bauch" type="number" value="0">
                </div>
                <div>
                    <label for="beine">Beine</label>
                    <input id="beine" type="number" value="0">
                </div>
            </div>
        </form>
        `,
        buttons: {
            roll: {
                label: "Würfeln",
                callback: (html) => {
                    resolve({
                        damageFormula: html.find('#damageFormula')[0].value,
                        wuchtschlag: parseInt(html.find('#wuchtschlag')[0].value) || 0,
                        kritisch: html.find('#kritisch')[0].checked,
                        armor: {
                            kopf: parseInt(html.find('#kopf')[0].value) || 0,
                            brust: parseInt(html.find('#brust')[0].value) || 0,
                            arme: parseInt(html.find('#arme')[0].value) || 0,
                            bauch: parseInt(html.find('#bauch')[0].value) || 0,
                            beine: parseInt(html.find('#beine')[0].value) || 0
                        }
                    });
                }
            }
        },
        default: "roll",
        render: html => setTimeout(() => html.find('#damageFormula').focus(), 0)
    }, {
        width: 300 // Adjusted width to accommodate the new layout
    }).render(true);
});

// Function to perform a damage roll
function performDamageRoll(formula) {
    return new Roll(formula).roll({async: false});
}

// Function to get hit location based on d20 roll
function getHitLocation(roll) {
    if (roll <= 6) return roll % 2 === 0 ? "am rechten Bein" : "am linken Bein";
    if (roll <= 8) return "am Bauch";
    if (roll <= 14) return roll % 2 === 0 ? "am rechten Arm" : "am linken Arm";
    if (roll <= 18) return "an der Brust";
    return "am Kopf";
}

// Roll for hit location
let hitLocationRoll = new Roll("1d20").roll({async: false});
let hitLocation = getHitLocation(hitLocationRoll.total);

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
let modifier = damageValues.damageFormula.match(/([+-]?\d+)$/);
modifier = modifier ? parseInt(modifier[1]) : 0;

// Construct the message content
let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
messageContent += `<strong>Schaden:</strong> ${damageValues.kritisch ? `(${damageValues.damageFormula})x2` : damageValues.damageFormula}`;
if (damageValues.wuchtschlag > 0) messageContent += `+${damageValues.wuchtschlag}(Wucht)`;
messageContent += `<br><strong>Wurf:</strong> `;
if (damageValues.kritisch) {
    messageContent += `(${diceRollString}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''})x2`;
} else {
    messageContent += `${diceRollString}${modifier !== 0 ? (modifier > 0 ? '+' : '') + modifier : ''}`;
}
if (damageValues.wuchtschlag > 0) messageContent += `+${damageValues.wuchtschlag}`;
messageContent += ` = ${totalDamage} Schaden`;

// Get the armor value based on hit location
let armorValue = 0;
switch (hitLocation) {
    case "am Kopf":
        armorValue = damageValues.armor.kopf;
        break;
    case "an der Brust":
        armorValue = damageValues.armor.brust;
        break;
    case "am rechten Arm":
    case "am linken Arm":
        armorValue = damageValues.armor.arme;
        break;
    case "am Bauch":
        armorValue = damageValues.armor.bauch;
        break;
    case "am rechten Bein":
    case "am linken Bein":
        armorValue = damageValues.armor.beine;
        break;
}

messageContent += `<br><strong>Rüstung:</strong> ${armorValue} ${hitLocation} (${hitLocationRoll.total})`;

// Calculate wounds based on damage and wound thresholds
if (token && woundThresholds.length > 0) {
    let woundsInflicted = 0;
    let damageAfterArmor = Math.max(0, totalDamage - armorValue);
    if (damageAfterArmor > woundThresholds[2]) {
        woundsInflicted = 3;
    } else if (damageAfterArmor > woundThresholds[1]) {
        woundsInflicted = 2;
    } else if (damageAfterArmor > woundThresholds[0]) {
        woundsInflicted = 1;
    }
    
    messageContent += `<br>${damageAfterArmor} <strong>TP</strong>`;
    if (woundsInflicted > 0) {
        messageContent += `, ${woundsInflicted} <strong>${woundsInflicted === 1 ? 'Wunde' : 'Wunden'}</strong>`;
    }
} else {
    let damageAfterArmor = Math.max(0, totalDamage - armorValue);
    messageContent += `<br>${damageAfterArmor} <strong>TP</strong>`;
}

messageContent += `</div>`;

// Send the result to the chat
ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: messageContent
});