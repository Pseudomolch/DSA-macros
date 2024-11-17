// DSA Damage Dialog
import { MeisterpersonParser } from '../utils/meisterpersonParser.js';

export class DamageDialog {
    static async execute(attackParams) {
        let { kritisch, wuchtschlag, damageFormula } = attackParams || {};
        return await this.createDialog(kritisch, wuchtschlag, damageFormula);
    }

    static parseArmorValues(actor) {
        const armorAbility = actor.items.find(item => item.type === "specialAbility" && item.name === "Rüstungswerte");
        if (armorAbility) {
            const regex = /Kopf (\d+), Brust (\d+\/?\d*), Arme (\d+\/?\d*), Bauch (\d+), Beine (\d+\/?\d*)/;
            const match = armorAbility.system.description.match(regex);
            if (!match) return null;

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
        } else {
            const parser = new MeisterpersonParser(actor);
            if (parser.hasMeisterpersonAbility()) {
                return parser.getArmorValues();
            }
        }

        return null;
    }

    static getTPFromMeisterperson(actor) {
        const parser = new MeisterpersonParser(actor);
        return parser.hasMeisterpersonAbility() ? parser.getFirstAttackTP() : null;
    }

    static parseArmorValue(value) {
        if (value.includes('/')) {
            return value.split('/').map(Number);
        }
        return parseInt(value) || 0;
    }

    static async createDialog(kritisch, wuchtschlag, passedDamageFormula) {
        let targetedToken = game.user.targets.first();
        let selectedToken = canvas.tokens.controlled[0];

        let armorValues = targetedToken ? this.parseArmorValues(targetedToken.actor) : null;
        let defaultDamageFormula = passedDamageFormula || (selectedToken ? this.getTPFromMeisterperson(selectedToken.actor) || "" : "");

        return new Promise((resolve) => {
            new Dialog({
                title: "DSA 4.1 Schadenswurf",
                content: this.getDialogHTML(defaultDamageFormula, wuchtschlag, kritisch, armorValues),
                buttons: {
                    roll: {
                        label: "Würfeln",
                        callback: (html) => resolve(this.processDialogResult(html))
                    }
                },
                default: "roll",
                render: html => setTimeout(() => html.find('#damageFormula').focus(), 0)
            }, {
                width: 300
            }).render(true);
        });
    }

    static getDialogHTML(defaultDamageFormula, wuchtschlag, kritisch, armorValues) {
        return `
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
            .dsa-dialog .top-row {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 8px;
                align-items: start;
            }
            .dsa-dialog .armor-row {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 8px;
            }
            .dialog-buttons {
                margin-top: 8px;
            }
            .crit-container {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .crit-container input[type="checkbox"] {
                margin-top: 5px;
            }
        </style>
        <form class="dsa-dialog">
            <div class="top-row">
                <div>
                    <label for="damageFormula">Schaden</label>
                    <input id="damageFormula" type="text" placeholder="z.B. 1W+4" value="${defaultDamageFormula}" required>
                </div>
                <div>
                    <label for="wuchtschlag">Wucht</label>
                    <input id="wuchtschlag" type="number" value="${wuchtschlag || 0}">
                </div>
                <div class="crit-container">
                    <label for="kritisch">Krit</label>
                    <input id="kritisch" type="checkbox" ${kritisch ? 'checked' : ''}>
                </div>
            </div>
            <div class="armor-row">
                <div>
                    <label for="kopf">Kopf</label>
                    <input id="kopf" type="number" value="${armorValues ? armorValues.kopf : 0}">
                </div>
                <div>
                    <label for="brust">Brust</label>
                    <input id="brust" type="text" value="${armorValues ? (Array.isArray(armorValues.brust) ? armorValues.brust.join('/') : armorValues.brust) : 0}">
                </div>
                <div>
                    <label for="arme">Arme</label>
                    <input id="arme" type="text" value="${armorValues ? (Array.isArray(armorValues.arme) ? armorValues.arme.join('/') : armorValues.arme) : 0}">
                </div>
                <div>
                    <label for="bauch">Bauch</label>
                    <input id="bauch" type="number" value="${armorValues ? armorValues.bauch : 0}">
                </div>
                <div>
                    <label for="beine">Beine</label>
                    <input id="beine" type="text" value="${armorValues ? (Array.isArray(armorValues.beine) ? armorValues.beine.join('/') : armorValues.beine) : 0}">
                </div>
            </div>
        </form>`;
    }

    static processDialogResult(html) {
        return {
            damageFormula: html.find('#damageFormula')[0].value,
            wuchtschlag: parseInt(html.find('#wuchtschlag')[0].value) || 0,
            kritisch: html.find('#kritisch')[0].checked,
            armor: {
                kopf: parseInt(html.find('#kopf')[0].value) || 0,
                brust: this.parseArmorValue(html.find('#brust')[0].value),
                arme: this.parseArmorValue(html.find('#arme')[0].value),
                bauch: parseInt(html.find('#bauch')[0].value) || 0,
                beine: this.parseArmorValue(html.find('#beine')[0].value)
            }
        };
    }
}
