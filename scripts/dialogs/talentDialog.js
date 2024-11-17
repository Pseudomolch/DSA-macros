// Talent Dialog for DSA 4.1
export class TalentDialog {
    static async execute() {
        return new Promise((resolve) => {
            new Dialog({
                title: "DSA 4.1 Talentprobe",
                content: `
                <style>
                    .dsa-dialog { 
                        display: grid; 
                        grid-template-columns: repeat(3, 1fr); 
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
                        margin-top: 10px;
                    }
                    .full-width {
                        grid-column: 1 / -1;
                    }
                </style>
                <form class="dsa-dialog">
                    <div>
                        <label for="attribute1">Eigenschaft 1</label>
                        <input type="number" id="attribute1" name="attribute1" value="10">
                    </div>
                    <div>
                        <label for="attribute2">Eigenschaft 2</label>
                        <input type="number" id="attribute2" name="attribute2" value="10">
                    </div>
                    <div>
                        <label for="attribute3">Eigenschaft 3</label>
                        <input type="number" id="attribute3" name="attribute3" value="10">
                    </div>
                    <div class="full-width">
                        <label for="taw">TaW</label>
                        <input type="number" id="taw" name="taw" value="0">
                    </div>
                    <div class="full-width">
                        <label for="modifier">Modifikator</label>
                        <input type="number" id="modifier" name="modifier" value="0">
                    </div>
                </form>`,
                buttons: {
                    roll: {
                        label: "Würfeln",
                        callback: (html) => {
                            const attribute1 = parseInt(html.find('#attribute1').val()) || 10;
                            const attribute2 = parseInt(html.find('#attribute2').val()) || 10;
                            const attribute3 = parseInt(html.find('#attribute3').val()) || 10;
                            const taw = parseInt(html.find('#taw').val()) || 0;
                            const modifier = parseInt(html.find('#modifier').val()) || 0;
                            
                            resolve({
                                attributes: [attribute1, attribute2, attribute3],
                                taw,
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
                render: html => setTimeout(() => html.find('#attribute1').focus(), 0)
            }, {
                width: 300
            }).render(true);
        });
    }
}
