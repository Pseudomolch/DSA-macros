// Interprets a 1-6 value as ASCII dice faces
function getDiceFace(value) {
    const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return diceFaces[value - 1];
}

// This does not do -2W6 Initiative or +1W6 SP. TODO: Those effects should be added to the damage macro.
// Check if exactly one token is targeted
if (game.user.targets.size !== 1) {
    ui.notifications.error("Genau ein Token muss als Ziel ausgewählt sein.");
    return;
}

const targetedToken = game.user.targets.first();

const woundChanges = {
    kopf: [
        { key: "system.base.basicAttributes.courage.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.cleverness.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.intuition.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.combatAttributes.active.baseInitiative.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    ],
    brust: [
        { key: "system.base.combatAttributes.active.baseAttack.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.combatAttributes.active.baseParry.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.constitution.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.strength.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    ],
    bauch: [
        { key: "system.base.combatAttributes.active.baseAttack.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.combatAttributes.active.baseParry.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.constitution.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.strength.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.movement.speed.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.combatAttributes.active.baseInitiative.value", value: -1, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    ],
    arm: [
        { key: "system.base.combatAttributes.active.baseAttack.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.combatAttributes.active.baseParry.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.strength.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.dexterity.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    ],
    bein: [
        { key: "system.base.combatAttributes.active.baseAttack.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.combatAttributes.active.baseParry.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.basicAttributes.agility.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD },
        { key: "system.base.combatAttributes.active.baseInitiative.value", value: -2, mode: CONST.ACTIVE_EFFECT_MODES.ADD }
    ]
};

const woundEffects = {
    kopf: {
        icon: "icons/svg/blood.svg",
        changes: woundChanges.kopf,
        baseDescriptions: [
            { attribute: "MU", value: -2 },
            { attribute: "KL", value: -2 },
            { attribute: "IN", value: -2 },
            { attribute: "INI-Basis", value: -2 }
        ],
        thirdWoundDescription: "bewusstlos, Blutverlust"
    },
    brust: {
        icon: "icons/svg/blood.svg",
        changes: woundChanges.brust,
        baseDescriptions: [
            { attribute: "AT", value: -1 },
            { attribute: "PA", value: -1 },
            { attribute: "KO", value: -1 },
            { attribute: "KK", value: -1 }
        ],
        thirdWoundDescription: "bewusstlos, Blutverlust"
    },
    bauch: {
        icon: "icons/svg/blood.svg",
        changes: woundChanges.bauch,
        baseDescriptions: [
            { attribute: "AT", value: -1 },
            { attribute: "PA", value: -1 },
            { attribute: "KO", value: -1 },
            { attribute: "KK", value: -1 },
            { attribute: "GS", value: -1 },
            { attribute: "INI-Basis", value: -1 }
        ],
        thirdWoundDescription: "bewusstlos, Blutverlust"
    },
    arm: {
        icon: "icons/svg/blood.svg",
        changes: woundChanges.arm,
        baseDescriptions: [
            { attribute: "AT", value: -2 },
            { attribute: "PA", value: -2 },
            { attribute: "KK", value: -2 },
            { attribute: "FF", value: -2 }
        ],
        thirdWoundDescription: "Arm handlungsunfähig"
    },
    bein: {
        icon: "icons/svg/blood.svg",
        changes: woundChanges.bein,
        baseDescriptions: [
            { attribute: "AT", value: -2 },
            { attribute: "PA", value: -2 },
            { attribute: "GE", value: -2 },
            { attribute: "INI-Basis", value: -2 },
            { attribute: "GS", value: -1 }
        ],
        thirdWoundDescription: "Sturz, kampfunfähig"
    }
};

// Function to add wound effect
async function addWoundEffect(location, side = "", count = 1) {
    console.log("Adding wound effect:", location, side, count);
    const effect = woundEffects[location];
    if (!effect) {
        console.error("No effect found for location:", location);
        return;
    }

    const sideText = getSideText(location, side);
    const label = getWoundLabel(count, sideText);

    console.log("Wound effect details:", { sideText, label });

    try {
        const existingEffect = findExistingEffect(location, side);
        let currentCount = 0;
        let newlyAppliedWounds = count;

        if (existingEffect) {
            console.log("Updating existing effect");
            const match = existingEffect.label.match(/(\d+)/);
            currentCount = match ? parseInt(match[1]) : 0;
            newlyAppliedWounds = Math.min(count, 3 - currentCount);
            count = Math.min(currentCount + count, 3);
            await updateExistingEffect(existingEffect, effect, label, count);
        } else {
            console.log("Creating new effect");
            await createNewEffect(effect, label, location, side, count);
        }

        let totalInitiativeReduction = 0;
        let totalDiceRollString = '';
        let additionalDamage = 0;
        let additionalDamageRollString = '';

        // Handle Kopfwunden initiative reduction and additional damage
        if (location === 'kopf') {
            for (let i = currentCount + 1; i <= Math.min(currentCount + newlyAppliedWounds, 2); i++) {
                const initiativeData = await reduceInitiative(1);
                if (initiativeData) {
                    totalInitiativeReduction += parseFloat(initiativeData.initiativeReduction);
                    totalDiceRollString += initiativeData.diceRollString;
                }
            }

            // Additional damage for third Kopfwunde
            if (currentCount < 3 && currentCount + newlyAppliedWounds >= 3) {
                const damageRoll = await new Roll('2d6').evaluate({async: true});
                additionalDamage = damageRoll.total;
                additionalDamageRollString = damageRoll.dice[0].results.map(r => getDiceFace(r.result)).join('');
                
                // Apply the additional damage
                const currentLeP = targetedToken.actor.system.base.resources.vitality.value;
                const newLeP = Math.max(0, currentLeP - additionalDamage);
                await targetedToken.actor.update({"system.base.resources.vitality.value": newLeP});
            }
        }

        // Handle additional damage for Bauchwunden and Brustwunden
        if ((location === 'bauch' || location === 'brust') && newlyAppliedWounds > 0 && currentCount < 2) {
            let damageRollFormula;
            if (currentCount === 0 && newlyAppliedWounds >= 2) {
                damageRollFormula = '2d6';
            } else {
                damageRollFormula = '1d6';
            }

            const damageRoll = await new Roll(damageRollFormula).evaluate({async: true});
            additionalDamage = damageRoll.total;
            additionalDamageRollString = damageRoll.dice[0].results.map(r => getDiceFace(r.result)).join('');
            
            // Apply the additional damage
            const currentLeP = targetedToken.actor.system.base.resources.vitality.value;
            const newLeP = Math.max(0, currentLeP - additionalDamage);
            await targetedToken.actor.update({"system.base.resources.vitality.value": newLeP});
        }

        let initiativeData = null;
        if (totalInitiativeReduction > 0) {
            const combat = game.combat;
            const combatant = combat?.getCombatantByToken(targetedToken.id);
            if (combatant) {
                const oldInitiative = combatant.initiative;
                const newInitiative = Math.max(0, oldInitiative - totalInitiativeReduction);
                await combat.setInitiative(combatant.id, Math.floor(newInitiative - targetedToken.actor.system.base.combatAttributes.active.baseInitiative.value));
                initiativeData = {
                    initiativeReduction: totalInitiativeReduction,
                    diceRollString: totalDiceRollString,
                    oldInitiative: oldInitiative.toFixed(2),
                    newInitiative: newInitiative.toFixed(2)
                };
            }
        }

        await createChatMessage(effect, count, sideText, initiativeData, additionalDamage, additionalDamageRollString);
        console.log("Wound effect process completed");
    } catch (error) {
        console.error("Error in addWoundEffect:", error);
        ui.notifications.error(`Error applying wound effect: ${error.message}`);
    }
}

async function reduceInitiative(woundCount) {
    const combat = game.combat;
    if (!combat) {
        console.warn("No active combat!");
        return null;
    }

    const combatant = combat.getCombatantByToken(targetedToken.id);
    if (!combatant) {
        console.warn("Selected token is not in combat!");
        return null;
    }

    const rollFormula = `${2 * woundCount}d6`;
    const roll = await new Roll(rollFormula).evaluate({async: true});

    const diceResults = roll.dice[0].results.map(r => getDiceFace(r.result));
    const diceRollString = diceResults.join('');

    const initiativeReduction = roll.total;

    return {
        initiativeReduction,
        diceRollString
    };
}

async function createChatMessage(effect, count, sideText, initiativeData, additionalDamage, additionalDamageRollString) {
    const descriptions = effect.baseDescriptions.map(desc => `${desc.attribute} ${desc.value * Math.min(count, 2)}`).join(", ");

    let initiativeMessage = '';
    if (initiativeData) {
        const newInitiativeValue = Math.floor(parseFloat(initiativeData.newInitiative));
        const oldInitiativeValue = Math.floor(parseFloat(initiativeData.oldInitiative));
        const initiativeColor = newInitiativeValue < 1 ? 'red' : 'inherit';
        initiativeMessage = `<br><strong>Initiative</strong>: ${oldInitiativeValue} - ${initiativeData.diceRollString} = <span style="color: ${initiativeColor};">${newInitiativeValue}</span>`;
    }

    let additionalDamageMessage = '';
    if (additionalDamage > 0) {
        const currentLeP = targetedToken.actor.system.base.resources.vitality.value;
        additionalDamageMessage = `<br><strong>${targetedToken.name}</strong> nimmt ${additionalDamageRollString} = ${additionalDamage} <strong>SP</strong> (${currentLeP} LeP übrig)`;
    }

    const messageContent = `
        <div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">
            <strong>${targetedToken.name}</strong>: ${count} Wunde${count > 1 ? 'n' : ''} ${sideText}<br>
            <strong>Effekte:</strong> ${descriptions}
            ${count === 3 ? `<br><span style="color: red;">${effect.thirdWoundDescription}</span>` : ''}
            ${initiativeMessage}
            ${additionalDamageMessage}
        </div>
    `;

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: targetedToken }),
        content: messageContent
    });
}

function getSideText(location, side) {
    const sideTexts = {
        kopf: "am Kopf",
        brust: "an der Brust",
        bauch: "am Bauch",
        arm: side ? `am ${side}en Arm` : "am Arm",
        bein: side ? `am ${side}en Bein` : "am Bein"
    };
    return sideTexts[location] || "an der ";
}

function getWoundLabel(count, sideText) {
    return `${count} Wunde${count > 1 ? 'n' : ''} ${sideText}`;
}

function findExistingEffect(location, side) {
    return targetedToken.actor.effects.find(e => e.flags.core?.statusId === `wound_${location}${side}`);
}

async function updateExistingEffect(existingEffect, effect, label, count) {
    await existingEffect.update({
        label: getWoundLabel(count, label.split(' ').slice(2).join(' ')),
        changes: getEffectChanges(effect, count)
    });
}

async function createNewEffect(effect, label, location, side, count) {
    const newEffect = {
        label: label,
        icon: effect.icon,
        changes: getEffectChanges(effect, count),
        flags: { core: { statusId: `wound_${location}${side}` } }
    };

    await targetedToken.actor.createEmbeddedDocuments("ActiveEffect", [newEffect]);
}

function getEffectChanges(effect, count) {
    return effect.changes.map(change => ({
        ...change,
        value: change.value * Math.min(count, 2)
    }));
}

// Function to normalize location
function normalizeLocation(location) {
    location = location.toLowerCase();
    if (location.includes("kopf")) return "kopf";
    if (location.includes("brust")) return "brust";
    if (location.includes("bauch")) return "bauch";
    if (location.includes("arm")) return "arm";
    if (location.includes("bein")) return "bein";
    return location;
}

// Check if we're auto-applying wounds from the damage macro
let woundValues;

if (targetedToken) {
    const autoApplyData = targetedToken.document.getFlag("world", "woundData");
    if (autoApplyData && autoApplyData.autoApply) {
        woundValues = {
            location: autoApplyData.location,
            count: autoApplyData.wounds
        };
        console.log("Wound values from auto-apply:", woundValues);
        // Clear the flag after use
        await targetedToken.document.unsetFlag("world", "woundData");
    }
}

if (!woundValues) {
    // Call the WoundsDialog macro to get input values
    let woundsDialogMacro = game.macros.getName("dsa_woundsDialog");
    if (!woundsDialogMacro) {
        ui.notifications.error("dsa_woundsDialog macro not found");
        return;
    }

    let executeWoundsDialog = await woundsDialogMacro.execute();
    if (typeof executeWoundsDialog !== 'function') {
        ui.notifications.error("dsa_woundsDialog macro did not return a function");
        return;
    }

    woundValues = await executeWoundsDialog();
}

// If woundValues is null or undefined, exit the macro
if (!woundValues) {
    console.log("No wound values, exiting macro");
    return;
}

console.log("Wound values before parsing:", woundValues);

// Parse the location and side
let baseLocation = normalizeLocation(woundValues.location);
let side = "";

if (woundValues.location.toLowerCase().includes("links")) {
    side = "link";
} else if (woundValues.location.toLowerCase().includes("rechts")) {
    side = "recht";
}

console.log("Parsed location:", baseLocation, "Side:", side);

// Ensure the baseLocation is valid
if (!woundEffects[baseLocation]) {
    console.error("Invalid wound location:", baseLocation);
    ui.notifications.error(`Invalid wound location: ${baseLocation}`);
    return;
}

try {
    await addWoundEffect(baseLocation, side, woundValues.count);
    console.log("Wound effect added successfully");
} catch (error) {
    console.error("Error adding wound effect:", error);
    ui.notifications.error(`Error adding wound effect: ${error.message}`);
}
