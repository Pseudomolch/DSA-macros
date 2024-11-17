// Zone Wounds Dialog for DSA 4.1
export class ZoneWoundsDialog {
    static async execute(currentWounds = {}) {
        return new Promise((resolve) => {
            new Dialog({
                title: "DSA 4.1 Zonenwunden",
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
                    <div>
                        <label for="kopf">Kopf</label>
                        <input type="number" id="kopf" name="kopf" value="${currentWounds.kopf || 0}">
                    </div>
                    <div>
                        <label for="brust">Brust</label>
                        <input type="number" id="brust" name="brust" value="${currentWounds.brust || 0}">
                    </div>
                    <div>
                        <label for="ruecken">Rücken</label>
                        <input type="number" id="ruecken" name="ruecken" value="${currentWounds.ruecken || 0}">
                    </div>
                    <div>
                        <label for="bauch">Bauch</label>
                        <input type="number" id="bauch" name="bauch" value="${currentWounds.bauch || 0}">
                    </div>
                    <div>
                        <label for="linkerArm">Linker Arm</label>
                        <input type="number" id="linkerArm" name="linkerArm" value="${currentWounds.arme ? currentWounds.arme[0] : 0}">
                    </div>
                    <div>
                        <label for="rechterArm">Rechter Arm</label>
                        <input type="number" id="rechterArm" name="rechterArm" value="${currentWounds.arme ? currentWounds.arme[1] : 0}">
                    </div>
                    <div>
                        <label for="linkesBein">Linkes Bein</label>
                        <input type="number" id="linkesBein" name="linkesBein" value="${currentWounds.beine ? currentWounds.beine[0] : 0}">
                    </div>
                    <div>
                        <label for="rechtesBein">Rechtes Bein</label>
                        <input type="number" id="rechtesBein" name="rechtesBein" value="${currentWounds.beine ? currentWounds.beine[1] : 0}">
                    </div>
                </form>`,
                buttons: {
                    save: {
                        label: "Speichern",
                        callback: (html) => {
                            const zoneWounds = {
                                kopf: parseInt(html.find('#kopf').val()) || 0,
                                brust: parseInt(html.find('#brust').val()) || 0,
                                ruecken: parseInt(html.find('#ruecken').val()) || 0,
                                bauch: parseInt(html.find('#bauch').val()) || 0,
                                arme: [
                                    parseInt(html.find('#linkerArm').val()) || 0,
                                    parseInt(html.find('#rechterArm').val()) || 0
                                ],
                                beine: [
                                    parseInt(html.find('#linkesBein').val()) || 0,
                                    parseInt(html.find('#rechtesBein').val()) || 0
                                ]
                            };
                            resolve(zoneWounds);
                        }
                    },
                    cancel: {
                        label: "Abbrechen",
                        callback: () => resolve(null)
                    }
                },
                default: "save",
                render: html => setTimeout(() => html.find('#kopf').focus(), 0)
            }, {
                width: 300
            }).render(true);
        });
    }
}
