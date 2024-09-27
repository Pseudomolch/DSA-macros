// This does not do -2W6 Initiative or +1W6 SP. TODO: Those effects should be added to the damage macro.
// Check if exactly one token is targeted
if (game.user.targets.size !== 1) {
    ui.notifications.error("Bitte wähle genau einen Token aus.");
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
    const effect = woundEffects[location];
    if (!effect) return;

    const sideText = getSideText(location, side);
    const label = getWoundLabel(count, sideText);

    const existingEffect = findExistingEffect(location, side);
    if (existingEffect) {
        const match = existingEffect.data.label.match(/(\d+)/);
        const currentCount = match ? parseInt(match[1]) : 0;
        count = Math.min(currentCount + count, 3);
        await updateExistingEffect(existingEffect, effect, label, count);
    } else {
        await createNewEffect(effect, label, location, side, count);
    }

    await createChatMessage(effect, count, sideText);
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
    return targetedToken.actor.effects.find(e => e.data.flags.core?.statusId === `wound_${location}${side}`);
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

async function createChatMessage(effect, count, sideText) {
    const descriptions = effect.baseDescriptions.map(desc => `${desc.attribute} ${desc.value * Math.min(count, 2)}`).join(", ");

    const messageContent = `
        <div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">
            <strong>${targetedToken.name}</strong>: ${count} Wunde${count > 1 ? 'n' : ''} ${sideText}<br>
            <strong>Effekte:</strong> ${descriptions}
            ${count === 3 ? `<br><span style="color: red;">${effect.thirdWoundDescription}</span>` : ''}
        </div>
    `;

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: targetedToken }),
        content: messageContent
    });
}

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

let woundValues = await executeWoundsDialog({targetedToken});

// If woundValues is null or undefined, exit the macro
if (!woundValues) return;

const [baseLocation, side] = woundValues.location.includes('Links') || woundValues.location.includes('Rechts')
    ? [woundValues.location.replace('Links', '').replace('Rechts', ''), woundValues.location.includes('Links') ? 'link' : 'recht']
    : [woundValues.location, ''];

await addWoundEffect(baseLocation, side, woundValues.count);