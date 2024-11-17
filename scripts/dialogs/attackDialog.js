// Attack Dialog for DSA 4.1
export class AttackDialog {
    static async execute(defaultAttackValue = "", attackName = "", attackModifier = 0) {
        return new Promise((resolve) => {
            new Dialog({
                title: "DSA 4.1 Attacke",
                content: `
                <style>
                    .dsa-dialog { 
                        display: grid; 
                        grid-template-columns: repeat(2, 1fr); 
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
                    .full-width {
                        grid-column: 1 / -1;
                    }
                </style>
                <form class="dsa-dialog">
                    <div class="full-width">
                        <label for="attackValue">Attackewert</label>
                        <input type="number" id="attackValue" name="attackValue" value="${defaultAttackValue}">
                    </div>
                    <div>
                        <label for="modifier">Modifikator</label>
                        <input type="number" id="modifier" name="modifier" value="${attackModifier}">
                    </div>
                    <div>
                        <label for="wuchtschlag">Wuchtschlag</label>
                        <input type="number" id="wuchtschlag" name="wuchtschlag" value="0">
                    </div>
                    <div class="full-width">
                        <label for="finte">Finte</label>
                        <input type="number" id="finte" name="finte" value="0">
                    </div>
                </form>`,
                buttons: {
                    roll: {
                        label: "Würfeln",
                        callback: (html) => {
                            const attackValue = parseInt(html.find('#attackValue').val()) || 0;
                            const modifier = parseInt(html.find('#modifier').val()) || 0;
                            const wuchtschlag = parseInt(html.find('#wuchtschlag').val()) || 0;
                            const finte = parseInt(html.find('#finte').val()) || 0;
                            
                            resolve({
                                attackValue,
                                modifier,
                                wuchtschlag,
                                finte,
                                attackName
                            });
                        }
                    },
                    cancel: {
                        label: "Abbrechen",
                        callback: () => resolve(null)
                    }
                },
                default: "roll",
                render: html => setTimeout(() => html.find('#attackValue').focus(), 0)
            }, {
                width: 300
            }).render(true);
        });
    }
}
