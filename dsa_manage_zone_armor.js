// Check if only one token is selected
if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error("Bitte wähle genau einen Token aus.");
    return;
}

const token = canvas.tokens.controlled[0];
const actor = token.actor;

// Function to parse existing armor data
function parseExistingArmorData(description) {
    const regex = /Kopf (\d+), Brust (\d+\/?\d*), Arme (\d+\/?\d*), Bauch (\d+), Beine (\d+\/?\d*)/;
    const match = description.match(regex);
    if (match) {
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
    }
    return null;
}

// Check for existing armor data
let existingArmorData = null;
const existingAbility = actor.items.find(item => item.type === "specialAbility" && item.name === "Rüstungswerte");
if (existingAbility) {
    existingArmorData = parseExistingArmorData(existingAbility.system.description);
}

// Create the dialog
new Dialog({
    title: "DSA Zonenrüstung verwalten",
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
        .dsa-dialog .armor-row {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
        }
    </style>
    <form class="dsa-dialog">
        <div class="armor-row">
            <div>
                <label for="kopf">Kopf</label>
                <input type="text" id="kopf" name="kopf" value="${existingArmorData?.kopf || 0}">
            </div>
            <div>
                <label for="brust">Brust</label>
                <input type="text" id="brust" name="brust" value="${Array.isArray(existingArmorData?.brust) ? existingArmorData.brust.join('/') : existingArmorData?.brust || 0}">
            </div>
            <div>
                <label for="arme">Arme</label>
                <input type="text" id="arme" name="arme" value="${Array.isArray(existingArmorData?.arme) ? existingArmorData.arme.join('/') : existingArmorData?.arme || 0}">
            </div>
            <div>
                <label for="bauch">Bauch</label>
                <input type="text" id="bauch" name="bauch" value="${existingArmorData?.bauch || 0}">
            </div>
            <div>
                <label for="beine">Beine</label>
                <input type="text" id="beine" name="beine" value="${Array.isArray(existingArmorData?.beine) ? existingArmorData.beine.join('/') : existingArmorData?.beine || 0}">
            </div>
        </div>
    </form>
    `,
    buttons: {
        save: {
            icon: '<i class="fas fa-save"></i>',
            label: "Speichern",
            callback: async (html) => {
                const parseSingleValue = (input) => {
                    const num = parseInt(input);
                    if (isNaN(num)) {
                        ui.notifications.error("Falscher Input, nutze eine Zahl.");
                        return null;
                    }
                    return num;
                };

                const parseDoubleValue = (input) => {
                    const parts = input.split('/').map(part => parseInt(part));
                    if (parts.some(isNaN) || parts.length > 2) {
                        ui.notifications.error("Falscher Input, nutze x oder x/x.");
                        return null;
                    }
                    return parts.length === 1 ? parts[0] : parts;
                };

                const formatValue = (value) => {
                    return Array.isArray(value) ? value.join('/') : value.toString();
                };

                const kopf = parseSingleValue(html.find('[name="kopf"]').val());
                const brust = parseDoubleValue(html.find('[name="brust"]').val());
                const arme = parseDoubleValue(html.find('[name="arme"]').val());
                const bauch = parseSingleValue(html.find('[name="bauch"]').val());
                const beine = parseDoubleValue(html.find('[name="beine"]').val());

                if ([kopf, brust, arme, bauch, beine].some(value => value === null)) {
                    return; // Stop execution if any input is invalid
                }

                const description = `Kopf ${formatValue(kopf)}, Brust ${formatValue(brust)}, Arme ${formatValue(arme)}, Bauch ${formatValue(bauch)}, Beine ${formatValue(beine)}`;

                if (existingAbility) {
                    await existingAbility.update({
                        "system.description": description
                    });
                } else {
                    await actor.createEmbeddedDocuments("Item", [{
                        name: "Rüstungswerte",
                        type: "specialAbility",
                        system: {
                            description: description
                        }
                    }]);
                }
            }
        },
        cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Abbrechen"
        }
    },
    default: "save",
    width: 400 // Adjusted width to accommodate the new layout
}).render(true);