// Check if only one token is selected
if (canvas.tokens.controlled.length !== 1) {
    ui.notifications.error("Bitte wähle genau einen Token aus.");
    return;
}

const token = canvas.tokens.controlled[0];
const actor = token.actor;

// Function to parse existing armor data
function parseExistingArmorData(description) {
    const regex = /Rüstung: Kopf (\d+), Brust (\d+), Rücken (\d+), Linker Arm (\d+), Rechter Arm (\d+), Bauch (\d+), Linkes Bein (\d+), Rechtes Bein (\d+)/;
    const match = description.match(regex);
    if (match) {
        return {
            kopf: parseInt(match[1]),
            brust: parseInt(match[2]),
            ruecken: parseInt(match[3]),
            linkerArm: parseInt(match[4]),
            rechterArm: parseInt(match[5]),
            bauch: parseInt(match[6]),
            linkesBein: parseInt(match[7]),
            rechtesBein: parseInt(match[8])
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
    <form>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div>
                <label for="kopf">Kopf:</label>
                <input type="number" id="kopf" name="kopf" value="${existingArmorData?.kopf || 0}" min="0">
            </div>
            <div>
                <label for="brust">Brust:</label>
                <input type="number" id="brust" name="brust" value="${existingArmorData?.brust || 0}" min="0">
            </div>
            <div>
                <label for="ruecken">Rücken:</label>
                <input type="number" id="ruecken" name="ruecken" value="${existingArmorData?.ruecken || 0}" min="0">
            </div>
            <div>
                <label for="linkerArm">Linker Arm:</label>
                <input type="number" id="linkerArm" name="linkerArm" value="${existingArmorData?.linkerArm || 0}" min="0">
            </div>
            <div>
                <label for="rechterArm">Rechter Arm:</label>
                <input type="number" id="rechterArm" name="rechterArm" value="${existingArmorData?.rechterArm || 0}" min="0">
            </div>
            <div>
                <label for="bauch">Bauch:</label>
                <input type="number" id="bauch" name="bauch" value="${existingArmorData?.bauch || 0}" min="0">
            </div>
            <div>
                <label for="linkesBein">Linkes Bein:</label>
                <input type="number" id="linkesBein" name="linkesBein" value="${existingArmorData?.linkesBein || 0}" min="0">
            </div>
            <div>
                <label for="rechtesBein">Rechtes Bein:</label>
                <input type="number" id="rechtesBein" name="rechtesBein" value="${existingArmorData?.rechtesBein || 0}" min="0">
            </div>
        </div>
    </form>
    `,
    buttons: {
        save: {
            icon: '<i class="fas fa-save"></i>',
            label: "Speichern",
            callback: async (html) => {
                const armorData = {
                    kopf: parseInt(html.find('[name="kopf"]').val()) || 0,
                    brust: parseInt(html.find('[name="brust"]').val()) || 0,
                    ruecken: parseInt(html.find('[name="ruecken"]').val()) || 0,
                    linkerArm: parseInt(html.find('[name="linkerArm"]').val()) || 0,
                    rechterArm: parseInt(html.find('[name="rechterArm"]').val()) || 0,
                    bauch: parseInt(html.find('[name="bauch"]').val()) || 0,
                    linkesBein: parseInt(html.find('[name="linkesBein"]').val()) || 0,
                    rechtesBein: parseInt(html.find('[name="rechtesBein"]').val()) || 0
                };

                const description = `Rüstung: Kopf ${armorData.kopf}, Brust ${armorData.brust}, Rücken ${armorData.ruecken}, Linker Arm ${armorData.linkerArm}, Rechter Arm ${armorData.rechterArm}, Bauch ${armorData.bauch}, Linkes Bein ${armorData.linkesBein}, Rechtes Bein ${armorData.rechtesBein}`;

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

                ui.notifications.info("Rüstungswerte wurden gespeichert.");
            }
        },
        cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Abbrechen"
        }
    },
    default: "save"
}).render(true);