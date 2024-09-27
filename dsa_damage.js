// Initialize variables for targeted token and wound thresholds
let targetedToken = game.user.targets.first();
let wounds = 0;
let woundThresholds = [];

if (targetedToken) {
    const actor = targetedToken.actor;

    // Get actor attributes
    const constitution = actor.system.base.basicAttributes.constitution.value;
    const eisern = actor.items.find(item => item.name === "Eisern") ? 2 : 0;
    const glasknochen = actor.items.find(item => item.name === "Glasknochen") ? -2 : 0;

    // Set wound thresholds to fallback values
    woundThresholds = [
        Math.ceil(constitution / 2) + eisern + glasknochen,
        Math.ceil(constitution) + eisern + glasknochen,
        Math.ceil(constitution * 1.5) + eisern + glasknochen
    ];

    // Get defined wound thresholds if they exist
    const definedWoundThresholds = actor.system.base.combatAttributes.passive.woundThresholds;
    if (definedWoundThresholds) {
        const mod = definedWoundThresholds.mod || 0;

        // Overwrite wound thresholds with defined values if they exist and are non-zero
        const thresholdKeys = ['first', 'second', 'third'];
        thresholdKeys.forEach((key, index) => {
            if (definedWoundThresholds.hasOwnProperty(key) && 
                typeof definedWoundThresholds[key] === 'number' && 
                definedWoundThresholds[key] !== 0) {
                woundThresholds[index] = definedWoundThresholds[key] + mod;
            }
        });
    }
} else {
    // Show error if no token is targeted
    ui.notifications.error("Kein Token anvisiert. Verwende Standard-Makro.");
}

// Check for selected token (for default damage value)
let selectedToken = canvas.tokens.controlled[0];

// Initialize attackParams
let attackParams = game.user.getFlag("world", "macroData") || { kritisch: false, wuchtschlag: 0 };

// Call the DamageDialog macro to get input values
let damageDialogMacro = game.macros.getName("dsa_damageDialog");
if (!damageDialogMacro) {
    ui.notifications.error("dsa_damageDialog macro not found");
    return;
}

let executeDamageDialog = await damageDialogMacro.execute();
if (typeof executeDamageDialog !== 'function') {
    ui.notifications.error("dsa_damageDialog macro did not return a function");
    return;
}

let damageValues = await executeDamageDialog();

// If damageValues is null or undefined, exit the macro
if (!damageValues) return;

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