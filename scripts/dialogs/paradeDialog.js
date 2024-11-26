// Parade Dialog for DSA 4.1
export class ParadeDialog {
    static async execute(defaultParadeValue = "", paradeModifier = 0) {
        return new Promise((resolve) => {
            new Dialog({
                title: "DSA 4.1 Parade",
                content: `
                <style>
                    .dsa-dialog { 
                        display: grid; 
                        grid-template-columns: 1fr; 
                        gap: 10px; 
                        padding-bottom: 10px;
                    }
                    .dsa-dialog input[type="number"] { 
                        width: 100%; 
                        text-align: center; 
                    }
                    .dsa-dialog label { 
                        display: block; 
                        text-align: center; 
                        margin-bottom: 2px; 
                    }
                </style>
                <form class="dsa-dialog">
                    <div>
                        <label for="paradeValue">Paradewert</label>
                        <input type="number" id="paradeValue" name="paradeValue" value="${defaultParadeValue}">
                    </div>
                    <div>
                        <label for="modifier">Modifikator</label>
                        <input type="number" id="modifier" name="modifier" value="${paradeModifier}">
                    </div>
                </form>`,
                buttons: {
                    roll: {
                        label: "Würfeln",
                        callback: (html) => {
                            const paradeValue = parseInt(html.find('#paradeValue').val()) || 0;
                            const modifier = parseInt(html.find('#modifier').val()) || 0;
                            
                            resolve({
                                paradeValue,
                                modifier
                            });
                        }
                    },
                    cancel: {
                        label: "Abbrechen",
                        callback: () => resolve(null)
                    }
                },
                default: "roll",
                render: html => setTimeout(() => html.find('#paradeValue').focus(), 0)
            }, {
                width: 300
            }).render(true);
        });
    }
}
