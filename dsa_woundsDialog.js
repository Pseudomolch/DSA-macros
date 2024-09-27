// Function to create and return the wounds dialog
async function createWoundsDialog(targetedToken) {
    return new Promise((resolve) => {
        new Dialog({
            title: "DSA 4.1 Wunden hinzufügen",
            content: `
            <style>
                .dsa-dialog { 
                    display: grid; 
                    grid-template-columns: 1fr; 
                    gap: 8px; 
                    padding-bottom: 8px;
                }
                .dsa-dialog select, 
                .dsa-dialog input[type="number"] { 
                    width: 100%; 
                    text-align: center; 
                }
                .dsa-dialog label { 
                    display: block; 
                    text-align: center; 
                    margin-bottom: 2px; 
                    margin-top: 8px;
                }
                .dialog-buttons {
                    margin-top: 8px;
                }
            </style>
            <form class="dsa-dialog">
                <div>
                    <label for="anzahlWunden">Anzahl der Wunden</label>
                    <input id="anzahlWunden" type="number" min="1" max="3" value="1">
                </div>
                <div>
                    <label for="trefferzone">Trefferzone</label>
                    <select id="trefferzone">
                        <option value="kopf">Kopf</option>
                        <option value="brust">Brust</option>
                        <option value="bauch">Bauch</option>
                        <option value="armLinks">Linker Arm</option>
                        <option value="armRechts">Rechter Arm</option>
                        <option value="beinLinks">Linkes Bein</option>
                        <option value="beinRechts">Rechtes Bein</option>
                    </select>
                </div>
            </form>
            `,
            buttons: {
                apply: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Anwenden",
                    callback: (html) => {
                        resolve({
                            count: Math.min(parseInt(html.find('#anzahlWunden').val()), 3),
                            location: html.find('#trefferzone').val()
                        });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Abbrechen",
                    callback: () => resolve(null)
                }
            },
            default: "apply",
            render: html => setTimeout(() => html.find('#anzahlWunden').focus(), 0)
        }, {
            width: 300
        }).render(true);
    });
}

// Execute the dialog and return the result
async function executeWoundsDialog({targetedToken}) {
    let woundValues = await createWoundsDialog(targetedToken);
    return woundValues;
}

// Return the executeWoundsDialog function as the result of the macro
return executeWoundsDialog;