// Check if only one token is selected
if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error("Bitte wähle genau einen Token aus.");
    return;
}

const token = canvas.tokens.controlled[0];
const actor = token.actor;

// Function to parse existing NPC data
function parseExistingNPCData(description) {
    const lines = description.split('\n');
    if (lines.length === 2) {
        const [line1, line2] = lines;
        const regex1 = /INI (\d+), PA (\d+), LeP (\d+), RS (\d+), KO (\d+)/;
        const regex2 = /GS (\d+), AuP (\d+), MR (\d+), GW (\d+)/;
        const match1 = line1.match(regex1);
        const match2 = line2.match(regex2);
        
        if (match1 && match2) {
            return {
                ini: parseInt(match1[1]),
                pa: parseInt(match1[2]),
                lep: parseInt(match1[3]),
                rs: parseInt(match1[4]),
                ko: parseInt(match1[5]),
                gs: parseInt(match2[1]),
                aup: parseInt(match2[2]),
                mr: parseInt(match2[3]),
                gw: parseInt(match2[4])
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
        .dsa-dialog .npc-row {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
        }
    </style>
    <form class="dsa-dialog">
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
    </form>
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
                    return; // Stop execution if any input is invalid
                }

                const description = `INI ${ini}, PA ${pa}, LeP ${lep}, RS ${rs}, KO ${ko}\nGS ${gs}, AuP ${aup}, MR ${mr}, GW ${gw}`;

                if (existingAbility) {
                    await existingAbility.update({
                        "system.description": description
                    });
                } else {
                    await actor.createEmbeddedDocuments("Item", [{
                        name: "Meisterperson",
                        type: "specialAbility",
                        system: {
                            description: description
                        }
                    }]);
                }

                // Update actor settings and attributes
                await actor.update({
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
                    "system.combatAttributes.active.baseInitiative": ini,
                    "system.combatAttributes.active.baseParry": pa,
                    "system.status.wounds.value": lep,
                    "system.status.wounds.max": lep,
                    "system.combatAttributes.passive.magicResistance": mr,
                    "system.basicAttributes.constitution.value": ko
                });

                ui.notifications.info("Meisterperson gespeichert und Einstellungen aktualisiert.");
            }
        },
        cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Abbrechen"
        }
    },
    default: "save",
    width: 400
}).render(true);