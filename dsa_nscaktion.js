// Check if exactly one token is selected
if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error("Bitte wähle genau einen Token aus.");
    return;
}

const token = canvas.tokens.controlled[0];
const actor = token.actor;

// Check for Meisterperson ability
const meisterpersonAbility = actor.items.find(item => item.type === "specialAbility" && item.name === "Meisterperson");
if (!meisterpersonAbility) {
    ui.notifications.error("Der ausgewählte Token hat keine Meisterperson-Fähigkeit.");
    return;
}

// Parse NPC data from the ability description
function parseNPCData(description) {
    const lines = description.split('\n');
    const data = {};
    
    if (lines.length >= 2) {
        // Parse first line (INI, PA, LeP, RS, KO)
        const match1 = lines[0].match(/INI (\d+), PA (\d+), LeP (\d+), RS (\d+), KO (\d+)/);
        if (match1) {
            [, data.ini, data.pa, data.maxLep, data.rs, data.ko] = match1.map(v => v ? parseInt(v) : null);
        }

        // Parse second line (GS, AuP, MR, GW)
        const match2 = lines[1].match(/GS (\d+), AuP (\d+), MR (\d+), GW (\d+)/);
        if (match2) {
            [, data.gs, data.aup, data.mr, data.gw] = match2.map(v => v ? parseInt(v) : null);
        }

        // Parse third line if it exists (attack information)
        if (lines[2]) {
            const match3 = lines[2].match(/Angriff (.+), DK ([A-Z]), AT (\d+), TP (.+)/);
            if (match3) {
                [, data.attackName, data.dk, data.at, data.tp] = match3;
                data.at = parseInt(data.at);
            }
        }
    }
    return data;
}

// Get NPC data
const npcData = parseNPCData(meisterpersonAbility.system.description);

// Get current LeP
const currentLep = actor.system.base.resources.vitality.value;

// Get active wound effects
const woundEffects = actor.effects.filter(e => 
    e.flags.core?.statusId?.startsWith('wound_')
).map(e => e.label);

// Create the dialog content
const dialogContent = `
<style>
    .dsa-dialog {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-bottom: 8px;
    }
    .dsa-stats {
        background-color: #f0f0f0;
        border: 1px solid #ccc;
        padding: 10px;
        border-radius: 3px;
        margin-bottom: 10px;
    }
    .header-container {
        margin: 0 0 10px 0;
        padding: 0;
        border-bottom: 1px solid #ccc;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
    }
    .header-container h2 {
        margin: 0;
        padding: 0;
    }
    .refresh-button {
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        font-size: 1.2em;
        width: 1.5em;
        text-align: center;
    }
    .refresh-button:hover {
        transform: rotate(180deg);
        transition: transform 0.5s;
    }
    .stat-line {
        margin: 5px 0;
    }
    .wounds-list {
        margin-top: 10px;
        color: red;
    }
    .action-buttons {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
    }
    .action-button {
        padding: 5px;
        text-align: center;
        background: #4b4a44;
        color: #ffffff;
        border: 1px solid #7a7971;
        border-radius: 3px;
        cursor: pointer;
    }
    .action-button:hover {
        background: #7a7971;
    }
</style>
<div class="dsa-dialog">
    <div class="dsa-stats">
        <div class="header-container">
            <h2>${token.name}</h2>
            <button class="refresh-button" title="Aktualisieren">🔄</button>
        </div>
        <div class="stat-line">
            INI ${npcData.ini}, PA ${npcData.pa}, LeP ${currentLep}/${npcData.maxLep}, RS ${npcData.rs}, KO ${npcData.ko}
        </div>
        <div class="stat-line">
            GS ${npcData.gs}, AuP ${npcData.aup}, MR ${npcData.mr}, GW ${npcData.gw}
        </div>
        ${npcData.attackName ? `
        <div class="stat-line">
            Angriff ${npcData.attackName}, DK ${npcData.dk}, AT ${npcData.at}, TP ${npcData.tp}
        </div>
        ` : ''}
        ${woundEffects.length > 0 ? `
        <div class="wounds-list">
            <strong>Wunden:</strong><br>
            ${woundEffects.map(wound => `• ${wound}`).join('<br>')}
        </div>
        ` : ''}
    </div>
    <div class="action-buttons">
        <button class="action-button" data-macro="dsa_attack">Attacke</button>
        <button class="action-button" data-macro="dsa_parade">Parade</button>
        <button class="action-button" data-macro="dsa_damage">Schaden</button>
        <button class="action-button" data-macro="dsa_zone_wounds">Wunden</button>
        <button class="action-button" data-macro="dsa_manage_nscs">Verwalten</button>
    </div>
</div>
`;

// Create and render the dialog
let currentDialog = new Dialog({
    title: "DSA NSC Aktionen",
    content: dialogContent,
    buttons: {},
    render: (html) => {
        // Add click handler for refresh button
        html.find('.refresh-button').click(async () => {
            const macro = game.macros.getName("dsa_nscaktion");
            if (macro) {
                currentDialog.close();
                await macro.execute();
            } else {
                ui.notifications.error("dsa_nscaktion macro not found");
            }
        });

        // Existing click handlers for action buttons
        html.find('.action-button').click(async (event) => {
            const macroName = event.currentTarget.dataset.macro;
            const macro = game.macros.getName(macroName);
            if (macro) {
                await macro.execute();
            } else {
                ui.notifications.error(`Makro ${macroName} nicht gefunden`);
            }
        });
    }
}, {
    width: 400
}).render(true); 