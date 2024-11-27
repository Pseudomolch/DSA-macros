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
        await this.calculateAndDisplayDamage(damageValues);
    }
    
    static async calculateAndDisplayDamage(damageValues) {
        // Calculate total damage
        let totalDamage = damageValues.total;
        
        // Apply critical hit multiplier if not already applied
        if (damageValues.kritisch) {
            // Critical hit multiplier: doubles the total damage
            totalDamage *= 2;
        }
        
        // Get target token and armor
        const targetToken = game.user.targets.first();
        
        // Add wuchtschlag bonus
        if (damageValues.wuchtschlag) {
            totalDamage += 3;  // Fixed wuchtschlag bonus value
        }
        
        // Create chat message with final damage
        await this.createChatMessage({
            finalDamage: totalDamage,
            damageFormula: damageValues.damageFormula,
            hitLocation: damageValues.hitLocation,
            showWoundButton: totalDamage > 0
        });
        
        // Handle wounds if damage was dealt
        if (totalDamage > 0) {
            await this.handleWounds(totalDamage, damageValues.hitLocation, targetToken, damageValues);
        }
        
        return totalDamage;
    }
    
    static async createChatMessage(damageData) {
        let messageContent = '<div class="dsa damage-roll">';
        
        // Add damage information
        messageContent += `<div class="damage-info">Schaden: ${damageData.finalDamage}`;
        if (damageData.damageFormula) {
            messageContent += ` (${damageData.damageFormula})`;
        }
        messageContent += '</div>';
        
        // Add hit location
        if (damageData.hitLocation) {
            messageContent += `<div class="location-info">Trefferzone: ${damageData.hitLocation}</div>`;
            
            // Add armor information if available
            const targetToken = game.user.targets.first();
            if (targetToken) {
                const armor = targetToken?.actor?.system?.base?.armor || {};
                const armorValue = this.getArmorValue(damageData.hitLocation, armor);
                if (armorValue > 0) {
                    messageContent += `<div class="armor-info">Rüstung: ${armorValue}</div>`;
                }
            }
        }
        
        // Add apply wounds button if needed
        if (damageData.showWoundButton && damageData.finalDamage > 0) {
            messageContent += '<button class="apply-wounds">Wunden anwenden</button>';
        }
        
        messageContent += '</div>';
        
        await ChatMessage.create({
            content: messageContent,
            speaker: ChatMessage.getSpeaker()
        });
    }
    
    static getHitLocation(roll) {
        if (roll <= 2) return "am rechten Bein";
        if (roll <= 4) return "am linken Bein";
        if (roll <= 6) return "am Bauch";
        if (roll <= 8) return "am rechten Arm";
        if (roll <= 10) return "am linken Arm";
        if (roll <= 15) return "an der Brust";
        return "am Kopf";
    }
    
    static getDiceFace(value) {
        const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        return diceFaces[value - 1];
    }
    
    static async calculateWounds(damage, hitLocation, isCritical = false) {
        let wounds = Math.floor(damage / 5);
        if (isCritical) {
            wounds = Math.floor(damage / 4);  // Critical hits cause more wounds
        }
        return wounds;
    }
    
    static async handleWounds(totalDamage, hitLocation, targetedToken, damageValues) {
        if (!targetedToken) return;

        const wounds = await this.calculateWounds(totalDamage, hitLocation, damageValues.kritisch);
        if (wounds <= 0) return;

        // Show wounds dialog if available
        const woundsModule = game.modules.get('dsa-macros');
        if (!woundsModule?.api?.dialogs?.ZoneWoundsDialog) {
            ui.notifications.error("dsa_zone_wounds macro not found");
            return;
        }

        try {
            await woundsModule.api.dialogs.ZoneWoundsDialog.execute(wounds, hitLocation);
        } catch (error) {
            console.error("Error executing wounds dialog:", error);
            ui.notifications.error("dsa_zone_wounds macro not found");
        }
    }
    
    static getArmorKey(hitLocation) {
        const locationMap = {
            "am Kopf": "head",
            "an der Brust": "chest",
            "am Bauch": "abdomen",
            "am rechten Arm": "rightArm",
            "am linken Arm": "leftArm",
            "am rechten Bein": "rightLeg",
            "am linken Bein": "leftLeg"
        };
        return locationMap[hitLocation] || "head";
    }

    static getArmorValue(hitLocation, armor) {
        if (!armor) return 0;
        const key = this.getArmorKey(hitLocation);
        return armor[key] || 0;
    }
}
