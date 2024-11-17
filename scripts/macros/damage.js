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
        await this.createChatMessage(damageValues, diceRollString, totalDamage, hitLocation, hitLocationRoll.total);
        
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
    
    static async createChatMessage(damageValues, diceRollString, totalDamage, hitLocation, hitLocationRoll) {
        let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
        messageContent += `<strong>Schaden:</strong> `;
        
        if (/^\d+$/.test(damageValues.damageFormula)) {
            messageContent += `${damageValues.kritisch ? `${damageValues.damageFormula}x2` : damageValues.damageFormula}`;
        } else {
            messageContent += `${damageValues.kritisch ? `(${damageValues.damageFormula})x2` : damageValues.damageFormula}`;
            messageContent += `<br><strong>Wurf:</strong> `;
            messageContent += damageValues.kritisch ? `(${diceRollString})x2` : diceRollString;
        }
        
        if (damageValues.wuchtschlag > 0) {
            messageContent += `+${damageValues.wuchtschlag}(Wucht)`;
        }
        
        messageContent += ` Schaden`;
        
        // Add armor and hit location
        const armorValue = this.getArmorValue(hitLocation, damageValues.armor);
        messageContent += `<br><strong>Rüstung:</strong> ${armorValue} ${hitLocation} (${hitLocationRoll})`;
        
        await ChatMessage.create({
            content: messageContent,
            speaker: ChatMessage.getSpeaker()
        });
    }
    
    static getArmorValue(hitLocation, armor) {
        switch (hitLocation) {
            case "am Kopf": return armor.kopf;
            case "an der Brust": return Array.isArray(armor.brust) ? armor.brust[0] : armor.brust;
            case "am rechten Arm": return Array.isArray(armor.arme) ? armor.arme[1] : armor.arme;
            case "am linken Arm": return Array.isArray(armor.arme) ? armor.arme[0] : armor.arme;
            case "am Bauch": return armor.bauch;
            case "am rechten Bein": return Array.isArray(armor.beine) ? armor.beine[1] : armor.beine;
            case "am linken Bein": return Array.isArray(armor.beine) ? armor.beine[0] : armor.beine;
            default: return 0;
        }
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
                if (definedWoundThresholds[key] && typeof definedWoundThresholds[key] === 'number' && definedWoundThresholds[key] !== 0) {
                    woundThresholds[index] = definedWoundThresholds[key] + mod;
                }
            });
        }
        
        // Calculate wounds based on damage
        let wounds = 0;
        const effectiveDamage = Math.max(0, totalDamage - damageValues.armor[hitLocation]);
        woundThresholds.forEach(threshold => {
            if (effectiveDamage >= threshold) wounds++;
        });
        
        if (wounds > 0) {
            // Show wounds dialog
            wounds = await game.modules.get('dsa-macros').api.dialogs.WoundsDialog.execute(wounds, woundThresholds);
            
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
