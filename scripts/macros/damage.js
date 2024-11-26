// DSA Damage Macro
export class DSADamage {
    static async execute() {
        let targetedToken = game.user.targets.first();
        let selectedToken = canvas.tokens.controlled[0];
        
        if (!selectedToken) {
            ui.notifications.error("Kein Token ausgewählt.");
            return;
        }
        
        // Get attack data from the token
        const attackData = selectedToken.document.getFlag("world", "attackData") || {};
        console.log(`DSA Damage: Retrieved attack data:`, attackData);
        
        // Get damage values from dialog
        const damageValues = await game.modules.get('dsa-macros').api.dialogs.DamageDialog.execute(attackData);
        if (!damageValues) return;
        
        // Calculate and display damage
        await this.calculateAndDisplayDamage(damageValues, targetedToken);
    }
    
    static async calculateAndDisplayDamage(damageValues, targetedToken) {
        // Parse the damage formula
        const result = await this.parseDamageFormula(damageValues.damageFormula);
        if (!result) return;
        
        const { baseDamage, diceRollString } = result;
        
        // Calculate total damage with critical and wuchtschlag
        const criticalMultiplier = damageValues.kritisch ? 2 : 1;
        const totalDamage = (baseDamage * criticalMultiplier) + damageValues.wuchtschlag;
        
        // Get hit location
        const hitLocationRoll = new Roll("1d20").roll({async: false});
        const hitLocation = this.getHitLocation(hitLocationRoll.total);
        
        // Create and send chat message
        await this.createChatMessage({
            damageFormula: damageValues.damageFormula,
            diceRoll: diceRollString,
            kritisch: damageValues.kritisch,
            wuchtschlag: damageValues.wuchtschlag,
            total: totalDamage,
            hitLocation: hitLocation,
            locationRoll: hitLocationRoll.total,
            armor: damageValues.armor,
            finalDamage: totalDamage,
            showWoundButton: true
        });
        
        // Handle wounds if there's a target
        if (targetedToken) {
            await this.handleWounds(totalDamage, hitLocation, targetedToken, damageValues);
        }
    }
    
    static async parseDamageFormula(formula) {
        // If it's just a number
        if (/^\d+$/.test(formula)) {
            return {
                baseDamage: parseInt(formula),
                diceRollString: formula
            };
        }
        
        // Handle dice notation
        const diceRegex = /^(\d+)([dDwW])(\d+)?([+-]\d+)?$/;
        const match = formula.match(diceRegex);
        
        if (!match) {
            ui.notifications.error("Ungültiges Würfel-Format. Bitte verwende z.B. '2d20', '3W6+2' oder eine einfache Zahl.");
            return null;
        }
        
        const [_, count, diceType, sides = '6', modStr = ''] = match;
        const modifier = modStr ? parseInt(modStr) : 0;
        
        // Create the roll formula
        const rollFormula = `${count}d${sides}`;
        const roll = new Roll(rollFormula).roll({async: false});
        
        // Format the results
        let diceRollString;
        if (sides === '6') {
            // For d6, use ASCII dice faces
            const diceResults = roll.dice[0].results.map(r => this.getDiceFace(r.result));
            diceRollString = diceResults.join('');
        } else {
            // For other dice, show individual results
            const diceResults = roll.dice[0].results.map(r => r.result);
            diceRollString = diceResults.join('+');
        }
        
        // Add modifier to string and total
        const baseDamage = roll.total + modifier;
        if (modifier) {
            diceRollString += ` ${modifier >= 0 ? '+' : ''}${modifier} = ${baseDamage}`;
        } else {
            diceRollString += ` = ${baseDamage}`;
        }
        
        return { baseDamage, diceRollString };
    }
    
    static getHitLocation(roll) {
        if (roll <= 6) return roll % 2 === 0 ? "am rechten Bein" : "am linken Bein";
        if (roll <= 8) return "am Bauch";
        if (roll <= 14) return roll % 2 === 0 ? "am rechten Arm" : "am linken Arm";
        if (roll <= 18) return "an der Brust";
        return "am Kopf";
    }
    
    static getDiceFace(value) {
        const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return diceFaces[value - 1];
    }
    
    static async createChatMessage(damageData) {
        const targetedToken = game.user.targets.first();
        if (!targetedToken) {
            ui.notifications.warn("Bitte wähle ein Ziel aus.");
            return;
        }

        const showWoundButton = damageData.showWoundButton !== false;
        const wounds = await this.calculateWounds(damageData.finalDamage, targetedToken);

        let content = `<div class="dsa-damage">`;
        content += `<div class="damage-info">`;
        content += `<strong>Schaden:</strong> ${damageData.finalDamage}`;
        if (damageData.hitLocation) {
            content += ` (${damageData.hitLocation})`;
        }
        content += `</div>`;

        if (wounds > 0) {
            content += `<div class="wound-info">`;
            content += `<strong>Wunden:</strong> ${wounds}`;
            content += `</div>`;
        }

        content += `<div class="damage-buttons">`;
        content += `<a class="apply-damage" data-damage="${damageData.finalDamage}">🩸 Schaden anwenden</a>`;
        if (showWoundButton && wounds > 0) {
            content += `<a class="apply-wounds" data-wounds="${wounds}" data-location="${damageData.hitLocation}">🩹 Wunden anwenden</a>`;
        }
        content += `</div>`;
        content += `</div>`;

        const message = await ChatMessage.create({
            speaker: ChatMessage.getSpeaker(),
            content: content
        });

        // Add event listeners
        const damageButton = document.querySelector(`[data-message-id="${message.id}"] .apply-damage`);
        if (damageButton) {
            const boundClickHandler = async (event) => {
                event.preventDefault();
                const targetedToken = game.user.targets.first();
                if (!targetedToken) return;

                const damage = parseInt(event.currentTarget.dataset.damage);
                const currentLeP = targetedToken.actor.system.base.resources.vitality.value;
                const newLeP = Math.max(0, currentLeP - damage);
                await targetedToken.actor.update({"system.base.resources.vitality.value": newLeP});
                
                // Create confirmation message
                let confirmationContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
                confirmationContent += `<strong>${damage} Schaden</strong> auf ${targetedToken.name} angewendet.`;
                confirmationContent += `<br>Neue LeP: ${newLeP}`;
                confirmationContent += `</div>`;
                
                await ChatMessage.create({
                    speaker: ChatMessage.getSpeaker(),
                    content: confirmationContent
                });
            };
            damageButton.addEventListener('click', boundClickHandler);
            Hooks.once(`deleteMessage.${message.id}`, () => {
                damageButton.removeEventListener('click', boundClickHandler);
            });
        }

        const woundButton = document.querySelector(`[data-message-id="${message.id}"] .apply-wounds`);
        if (woundButton) {
            const boundWoundClickHandler = async (event) => {
                event.preventDefault();
                const targetedToken = game.user.targets.first();
                if (!targetedToken) return;

                const wounds = parseInt(event.currentTarget.dataset.wounds);
                const location = event.currentTarget.dataset.location;
                
                try {
                    await targetedToken.document.setFlag("world", "woundData", {
                        wounds: wounds,
                        location: location,
                        autoApply: true
                    });
                    
                    let woundsMacro = game.macros.getName("dsa_zone_wounds");
                    if (woundsMacro) {
                        woundsMacro.execute();
                    } else {
                        ui.notifications.error("dsa_zone_wounds macro not found");
                    }
                } finally {
                    if (targetedToken) {
                        await targetedToken.document.unsetFlag("world", "woundData");
                    }
                }
            };
            woundButton.addEventListener('click', boundWoundClickHandler);
            Hooks.once(`deleteMessage.${message.id}`, () => {
                woundButton.removeEventListener('click', boundWoundClickHandler);
            });
        }

        return message;
    }
    
    static async calculateWounds(damageAfterArmor, targetedToken) {
        const actor = targetedToken.actor;
        const constitution = actor.system.base.basicAttributes.constitution.value;
        const eisern = actor.items.find(item => item.name === "Eisern") ? 2 : 0;
        const glasknochen = actor.items.find(item => item.name === "Glasknochen") ? -2 : 0;
        
        // Calculate wound thresholds
        let woundThresholds = [
            Math.ceil(constitution / 2) + eisern + glasknochen,
            Math.ceil(constitution) + eisern + glasknochen,
            Math.ceil(constitution * 1.5) + eisern + glasknochen
        ];
        
        // Check for defined wound thresholds
        const definedWoundThresholds = actor.system.base.combatAttributes.passive.woundThresholds;
        if (definedWoundThresholds) {
            const mod = definedWoundThresholds.mod || 0;
            const thresholdKeys = ['first', 'second', 'third'];
            thresholdKeys.forEach((key, index) => {
                if (definedWoundThresholds.hasOwnProperty(key) && 
                    typeof definedWoundThresholds[key] === 'number' && 
                    definedWoundThresholds[key] !== 0) {
                    woundThresholds[index] = definedWoundThresholds[key] + mod;
                }
            });
        }
        
        // Calculate wounds based on damage
        let wounds = 0;
        if (damageAfterArmor > woundThresholds[2]) {
            wounds = 3;
        } else if (damageAfterArmor > woundThresholds[1]) {
            wounds = 2;
        } else if (damageAfterArmor > woundThresholds[0]) {
            wounds = 1;
        }
        
        return wounds;
    }
    
    static getArmorKey(hitLocation) {
        switch (hitLocation) {
            case "am Kopf": return "kopf";
            case "an der Brust": return "brust";
            case "am rechten Arm": return "arme";
            case "am linken Arm": return "arme";
            case "am Bauch": return "bauch";
            case "am rechten Bein": return "beine";
            case "am linken Bein": return "beine";
            default: return "kopf";
        }
    }

    static getArmorValue(hitLocation, armor) {
        const armorKey = this.getArmorKey(hitLocation);
        const armorValue = armor[armorKey];

        // Return 0 if no armor value exists
        if (armorValue === undefined) return 0;

        // For locations that can have different values for left/right
        if (Array.isArray(armorValue)) {
            switch (hitLocation) {
                case "an der Brust": return armorValue[0];
                case "am rechten Arm":
                case "am rechten Bein": return armorValue[1];
                case "am linken Arm":
                case "am linken Bein": return armorValue[0];
                default: return armorValue[0];
            }
        }

        // For single armor values
        return armorValue;
    }
    
    static async handleWounds(totalDamage, hitLocation, targetedToken, damageValues) {
        const actor = targetedToken.actor;
        const constitution = actor.system.base.basicAttributes.constitution.value;
        const eisern = actor.items.find(item => item.name === "Eisern") ? 2 : 0;
        const glasknochen = actor.items.find(item => item.name === "Glasknochen") ? -2 : 0;
        
        // Calculate wound thresholds
        let woundThresholds = [
            Math.ceil(constitution / 2) + eisern + glasknochen,
            Math.ceil(constitution) + eisern + glasknochen,
            Math.ceil(constitution * 1.5) + eisern + glasknochen
        ];
        
        // Check for defined wound thresholds
        const definedWoundThresholds = actor.system.base.combatAttributes.passive.woundThresholds;
        if (definedWoundThresholds) {
            const mod = definedWoundThresholds.mod || 0;
            const thresholdKeys = ['first', 'second', 'third'];
            thresholdKeys.forEach((key, index) => {
                if (definedWoundThresholds.hasOwnProperty(key) && 
                    typeof definedWoundThresholds[key] === 'number' && 
                    definedWoundThresholds[key] !== 0) {
                    woundThresholds[index] = definedWoundThresholds[key] + mod;
                }
            });
        }
        
        // Calculate wounds based on damage
        let wounds = 0;
        const armorValue = this.getArmorValue(hitLocation, damageValues.armor);
        const effectiveDamage = Math.max(0, totalDamage - armorValue);
        woundThresholds.forEach(threshold => {
            if (effectiveDamage >= threshold) wounds++;
        });
        
        if (wounds > 0) {
            // Show wounds dialog
            wounds = await game.modules.get('dsa-macros').api.dialogs.ZoneWoundsDialog.execute(wounds, woundThresholds);
            
            // Create wounds message
            const messageContent = `
                <div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">
                    <strong>Wunden:</strong> ${wounds} ${hitLocation}<br>
                    <strong>Schwellen:</strong> ${woundThresholds.join(', ')}
                </div>`;
            
            await ChatMessage.create({
                content: messageContent,
                speaker: ChatMessage.getSpeaker()
            });
        }
    }
}
