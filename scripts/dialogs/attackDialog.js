// Attack Dialog for DSA 4.1
export class AttackDialog {
    static async execute(defaultAttackValue = "", attackName = "", attackModifier = 0) {
        return new Promise((resolve) => {
            new Dialog({
                title: "DSA 4.1 Angriffsprobe",
                content: `
                <style>
                    .dsa-dialog { 
                        display: grid; 
                        grid-template-columns: 1fr; 
                        gap: 8px; 
                        padding-bottom: 8px;
                    }
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
                    .dsa-dialog .modifiers {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 8px;
                    }
                    .dialog-buttons {
                        margin-top: 8px;
                    }
                </style>
                <form class="dsa-dialog">
                    <div>
                        <label for="attackValue">Attacke</label>
                        <input id="attackValue" type="number" value="${defaultAttackValue}" required>
                    </div>
                    <div class="modifiers">
                        <div>
                            <label for="modifier">Mod</label>
                            <input id="modifier" type="number" value="${attackModifier}">
                        </div>
                        <div>
                            <label for="wuchtschlag">Wuchtschlag</label>
                            <input id="wuchtschlag" type="number" value="0">
                        </div>
                        <div>
                            <label for="finte">Finte</label>
                            <input id="finte" type="number" value="0">
                        </div>
                    </div>
                </form>`,
                buttons: {
                    roll: {
                        label: "Würfeln",
                        callback: (html) => {
                            resolve({
                                attackValue: parseInt(html.find('#attackValue')[0].value),
                                modifier: parseInt(html.find('#modifier')[0].value) || 0,
                                wuchtschlag: parseInt(html.find('#wuchtschlag')[0].value) || 0,
                                finte: parseInt(html.find('#finte')[0].value) || 0,
                                attackName: attackName
                            });
                        }
                    }
                },
                default: "roll",
                render: html => setTimeout(() => html.find('#attackValue').focus(), 0)
            }, {
                width: 225
            }).render(true);
        });
    }
}
