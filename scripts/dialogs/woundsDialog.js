// DSA Wounds Dialog
export class WoundsDialog {
    static async execute(wounds, woundThresholds) {
        return await this.createDialog(wounds, woundThresholds);
    }

    static async createDialog(wounds, woundThresholds) {
        return new Promise((resolve) => {
            new Dialog({
                title: "DSA 4.1 Wunden",
                content: this.getDialogHTML(wounds, woundThresholds),
                buttons: {
                    confirm: {
                        label: "Bestätigen",
                        callback: (html) => resolve(this.processDialogResult(html))
                    }
                },
                default: "confirm"
            }, {
                width: 300
            }).render(true);
        });
    }

    static getDialogHTML(wounds, woundThresholds) {
        return `
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
            }
            .wound-thresholds {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-top: 8px;
            }
        </style>
        <form class="dsa-dialog">
            <div>
                <label for="wounds">Wunden</label>
                <input id="wounds" type="number" value="${wounds || 0}" min="0">
            </div>
            <div class="wound-thresholds">
                ${woundThresholds.map((threshold, index) => `
                    <div>
                        <label>Schwelle ${index + 1}</label>
                        <input type="number" value="${threshold}" disabled>
                    </div>
                `).join('')}
            </div>
        </form>`;
    }

    static processDialogResult(html) {
        return parseInt(html.find('#wounds')[0].value) || 0;
    }
}
