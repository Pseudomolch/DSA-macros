// Check if a token is targeted
let targetedToken = null;
let wounds = 0;
let woundThresholds = [];

const targets = game.user.targets;
if (targets.size > 1) {
    ui.notifications.error("Mehrere Tokens anvisiert. Verwende Standard-Makro.");
} else if (targets.size === 1) {
    targetedToken = targets.first();
    const actor = targetedToken.actor;

    // Get constitution and other relevant attributes
    const constitution = actor.system.base.basicAttributes.constitution.value;
    const eisern = (actor.items.find(item => item.name === "Eisern") === undefined) ? 0 : 2;
    const glasknochen = (actor.items.find(item => item.name === "Glasknochen") === undefined) ? 0 : -2;

    // Check if wound thresholds are defined in actor.system.base.combatAttributes.passive
    const definedWoundThresholds = actor.system.base.combatAttributes.passive.woundThresholds;
    
    if (definedWoundThresholds && 
        definedWoundThresholds.first !== 0 && 
        definedWoundThresholds.second !== 0 && 
        definedWoundThresholds.third !== 0) {
        const mod = definedWoundThresholds.mod || 0;
        woundThresholds = [
            definedWoundThresholds.first + mod,
            definedWoundThresholds.second + mod,
            definedWoundThresholds.third + mod
        ];
    } else {
        // Calculate wound thresholds if not defined
        woundThresholds = [
            Math.ceil(constitution / 2) + eisern + glasknochen,
            Math.ceil(constitution) + eisern + glasknochen,
            Math.ceil(constitution * 1.5) + eisern + glasknochen
        ];
    }
}

// Check for selected token (for default damage value)
let selectedToken = null;
if (canvas.tokens.controlled.length === 1) {
    selectedToken = canvas.tokens.controlled[0];
}

// Function to parse armor values from the actor's special abilities
function parseArmorValues(actor) {
    const armorAbility = actor.items.find(item => item.type === "specialAbility" && item.name === "Rüstungswerte");
    if (armorAbility) {
        const regex = /Kopf (\d+), Brust (\d+\/?\d*), Arme (\d+\/?\d*), Bauch (\d+), Beine (\d+\/?\d*)/;
        const match = armorAbility.system.description.match(regex);
        if (!match) return null;

        const parseValue = (value) => {
            const parts = value.split('/').map(Number);
            return parts.length === 1 ? parts[0] : parts;
        };

        return {
            kopf: parseInt(match[1]),
            brust: parseValue(match[2]),
            arme: parseValue(match[3]),
            bauch: parseInt(match[4]),
            beine: parseValue(match[5])
        };
    } else {
        // If no Rüstungswerte ability, check for Meisterperson ability
        const meisterpersonAbility = actor.items.find(item => item.type === "specialAbility" && item.name === "Meisterperson");
        if (meisterpersonAbility) {
            const match = meisterpersonAbility.system.description.match(/RS (\d+)/);
            if (match) {
                const rs = parseInt(match[1]);
                return {
                    kopf: rs,
                    brust: rs,
                    arme: rs,
                    bauch: rs,
                    beine: rs
                };
            }
        }
    }

    return null;
}

// Function to get TP value from Meisterperson ability
function getTPFromMeisterperson(actor) {
    const meisterpersonAbility = actor.items.find(item => item.type === "specialAbility" && item.name === "Meisterperson");
    if (!meisterpersonAbility) return null;

    const match = meisterpersonAbility.system.description.match(/TP (.+)$/m);
    return match ? match[1] : null;
}

// Prompt the user for the damage formula and modifiers
let damageValues = await new Promise((resolve) => {
    let armorValues = targetedToken ? parseArmorValues(targetedToken.actor) : null;
    let defaultDamageFormula = selectedToken ? getTPFromMeisterperson(selectedToken.actor) || "" : "";

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
                    <input id="damageFormula" type="text" placeholder="z.B. 1W+4" value="${defaultDamageFormula}" required>
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
                    <input id="kopf" type="number" value="${armorValues ? armorValues.kopf : 0}">
                </div>
                <div>
                    <label for="brust">Brust</label>
                    <input id="brust" type="text" value="${armorValues ? (Array.isArray(armorValues.brust) ? armorValues.brust.join('/') : armorValues.brust) : 0}">
                </div>
                <div>
                    <label for="arme">Arme</label>
                    <input id="arme" type="text" value="${armorValues ? (Array.isArray(armorValues.arme) ? armorValues.arme.join('/') : armorValues.arme) : 0}">
                </div>
                <div>
                    <label for="bauch">Bauch</label>
                    <input id="bauch" type="number" value="${armorValues ? armorValues.bauch : 0}">
                </div>
                <div>
                    <label for="beine">Beine</label>
                    <input id="beine" type="text" value="${armorValues ? (Array.isArray(armorValues.beine) ? armorValues.beine.join('/') : armorValues.beine) : 0}">
                </div>
            </div>
        </form>
        `,
        buttons: {
            roll: {
                label: "Würfeln",
                callback: (html) => {
                    const parseArmorValue = (value) => {
                        const parts = value.split('/').map(Number);
                        return parts.length === 1 ? parts[0] : parts;
                    };

                    resolve({
                        damageFormula: html.find('#damageFormula')[0].value,
                        wuchtschlag: parseInt(html.find('#wuchtschlag')[0].value) || 0,
                        kritisch: html.find('#kritisch')[0].checked,
                        armor: {
                            kopf: parseInt(html.find('#kopf')[0].value) || 0,
                            brust: parseArmorValue(html.find('#brust')[0].value),
                            arme: parseArmorValue(html.find('#arme')[0].value),
                            bauch: parseInt(html.find('#bauch')[0].value) || 0,
                            beine: parseArmorValue(html.find('#beine')[0].value)
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
        armorValue = Array.isArray(damageValues.armor.brust) ? damageValues.armor.brust[0] : damageValues.armor.brust;
        break;
    case "am rechten Arm":
        armorValue = Array.isArray(damageValues.armor.arme) ? damageValues.armor.arme[1] : damageValues.armor.arme;
        break;
    case "am linken Arm":
        armorValue = Array.isArray(damageValues.armor.arme) ? damageValues.armor.arme[0] : damageValues.armor.arme;
        break;
    case "am Bauch":
        armorValue = damageValues.armor.bauch;
        break;
    case "am rechten Bein":
        armorValue = Array.isArray(damageValues.armor.beine) ? damageValues.armor.beine[1] : damageValues.armor.beine;
        break;
    case "am linken Bein":
        armorValue = Array.isArray(damageValues.armor.beine) ? damageValues.armor.beine[0] : damageValues.armor.beine;
        break;
}

messageContent += `<br><strong>Rüstung:</strong> ${armorValue} ${hitLocation} (${hitLocationRoll.total})`;

// Calculate wounds based on damage and wound thresholds
if (targetedToken && woundThresholds.length > 0) {
    let woundsInflicted = 0;
    let damageAfterArmor = Math.max(0, totalDamage - armorValue);
    if (damageAfterArmor > woundThresholds[2]) {
        woundsInflicted = 3;
    } else if (damageAfterArmor > woundThresholds[1]) {
        woundsInflicted = 2;
    } else if (damageAfterArmor > woundThresholds[0]) {
        woundsInflicted = 1;
    }
    
    messageContent += `<br>${damageAfterArmor} <strong>TP</strong> <a class="apply-damage" data-damage="${damageAfterArmor}"><i class="fas fa-heart"></i></a>`;
    if (woundsInflicted > 0) {
        messageContent += `, ${woundsInflicted} <strong>${woundsInflicted === 1 ? 'Wunde' : 'Wunden'}</strong>`;
    }
} else {
    let damageAfterArmor = Math.max(0, totalDamage - armorValue);
    messageContent += `<br>${damageAfterArmor} <strong>TP</strong>`;
    if (game.user.targets.size == 1) {
        messageContent += ` <a class="apply-damage" data-damage="${damageAfterArmor}"><i class="fas fa-heart"></i></a>`;
    }
}

messageContent += `</div>`;

// Send the result to the chat
let chatMessage = await ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: messageContent
});

// Add click event listener to the heart icon
if (targetedToken && game.user.targets.size === 1) {
    setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${chatMessage.id}"]`);
        if (messageElement) {
            const applyDamageButton = messageElement.querySelector('.apply-damage');
            if (applyDamageButton) {
                const clickHandler = async (event) => {
                    event.preventDefault();
                    const damage = parseInt(event.currentTarget.dataset.damage);
                    const currentLeP = targetedToken.actor.system.base.resources.vitality.value;
                    const newLeP = Math.max(0, currentLeP - damage);
                    await targetedToken.actor.update({"system.base.resources.vitality.value": newLeP});
                    
                    // Create a new chat message for confirmation
                    let confirmationContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
                    confirmationContent += `<strong>${damage} Schaden</strong> auf ${targetedToken.name} angewendet.`;
                    confirmationContent += `<br>Neue LeP: ${newLeP}`;
                    confirmationContent += `</div>`;
                    
                    await ChatMessage.create({
                        speaker: ChatMessage.getSpeaker(),
                        content: confirmationContent
                    });
                };

                applyDamageButton.addEventListener('click', clickHandler);

                // Clean up the event listener when the message is deleted
                Hooks.once(`deleteMessage${chatMessage.id}`, () => {
                    applyDamageButton.removeEventListener('click', clickHandler);
                });
            }
        }
    }, 100);
}