// DSA Attack Macro
import { MeisterpersonParser } from '../utils/meisterpersonParser.js';

export class DSAAttack {
    static async execute() {
        let selectedToken = null;
        let defaultAttackValue = "";
        let attackName = "";
        let attackModifier = 0;
        let damageFormula = "";

        if (canvas.tokens.controlled.length === 1) {
            selectedToken = canvas.tokens.controlled[0];
            
            // Get passed attack data if available
            const attackData = selectedToken.document.getFlag("world", "attackData");
            if (attackData && attackData.defaultAttackValue !== undefined) {
                defaultAttackValue = String(attackData.defaultAttackValue);
                attackName = attackData.attackName || "";
                attackModifier = attackData.attackModifier || 0;
                damageFormula = attackData.damageFormula || "";
                
                // Clear the flag after reading
                selectedToken.document.unsetFlag("world", "attackData");
            } else {
                // Use MeisterpersonParser to get attack data
                const parser = new MeisterpersonParser(selectedToken.actor);
                if (parser.hasMeisterpersonAbility()) {
                    const attacks = parser.parseAttacks();
                    if (attacks.length > 0) {
                        const firstAttack = attacks[0];
                        attackName = firstAttack.name;
                        defaultAttackValue = String(firstAttack.at);
                        damageFormula = firstAttack.tp;
                    }
                }
                
                // Get attack modifiers from active effects
                const attackEffects = selectedToken.actor.effects.filter(e => 
                    e.changes.some(c => c.key === "system.base.combatAttributes.active.baseAttack.value")
                );
                
                for (const effect of attackEffects) {
                    const attackChanges = effect.changes.filter(c => 
                        c.key === "system.base.combatAttributes.active.baseAttack.value"
                    );
                    for (const change of attackChanges) {
                        // Flip the sign of the modifier (e.g. -4 becomes +4)
                        attackModifier -= Number(change.value);
                    }
                }
            }
        } else {
            ui.notifications.error("Bitte wähle genau einen Token aus.");
            return;
        }

        // Get attack values from dialog
        const attackValues = await game.modules.get('dsa-macros').api.dialogs.AttackDialog.execute(
            defaultAttackValue,
            attackName,
            attackModifier
        );
        
        if (!attackValues) return;

        await this.performAttackRoll(attackValues, selectedToken, damageFormula);
    }

    static async performAttackRoll(attackValues, selectedToken, damageFormula) {
        // Calculate the total modifier
        const totalModifier = attackValues.modifier + attackValues.wuchtschlag + attackValues.finte;

        // Perform the initial attack roll
        const roll = await new Roll("1d20").roll({async: true});
        const naturalRoll = roll.total;
        const finalRoll = naturalRoll + totalModifier;

        // Handle critical hits and failures
        let result;
        let confirmationRoll;
        let confirmationFinalRoll;

        if (naturalRoll === 1 || naturalRoll === 20) {
            const confirmRoll = await new Roll("1d20").roll({async: true});
            confirmationRoll = confirmRoll.total;
            confirmationFinalRoll = confirmationRoll + totalModifier;
        }

        if (naturalRoll === 1) {
            result = confirmationFinalRoll <= attackValues.attackValue ? "Kritischer Erfolg" : "Erfolg";
        } else if (naturalRoll === 20) {
            result = confirmationFinalRoll > attackValues.attackValue ? "Patzer" : "Fehlschlag";
        } else {
            result = finalRoll <= attackValues.attackValue ? "Erfolg" : "Fehlschlag";
        }

        // Create message content
        let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;

        if (selectedToken && attackValues.attackName) {
            messageContent += `<strong>${selectedToken.name}</strong> attackiert mit <strong>${attackValues.attackName}</strong><br>`;
        }

        messageContent += `<strong>Attacke:</strong> ${attackValues.attackValue}<br>`;

        if (naturalRoll === 1 || naturalRoll === 20) {
            messageContent += `<strong>Wurf:</strong> ${naturalRoll}<br>`;
            messageContent += `<strong>Bestätigungswurf:</strong> ${confirmationRoll}`;
            
            let modParts = [];
            if (attackValues.modifier !== 0) modParts.push(`${attackValues.modifier} Mod`);
            if (attackValues.wuchtschlag !== 0) modParts.push(`${attackValues.wuchtschlag} Wuchtschlag`);
            if (attackValues.finte !== 0) modParts.push(`${attackValues.finte} Finte`);
            
            if (modParts.length > 0) {
                messageContent += ` + ${modParts.join(' + ')} = ${confirmationFinalRoll}`;
            }
            
            messageContent += `<br>`;
        } else {
            messageContent += `<strong>Wurf:</strong> ${naturalRoll}`;
            
            let modParts = [];
            if (attackValues.modifier !== 0) modParts.push(`${attackValues.modifier} Mod`);
            if (attackValues.wuchtschlag !== 0) modParts.push(`${attackValues.wuchtschlag} Wuchtschlag`);
            if (attackValues.finte !== 0) modParts.push(`${attackValues.finte} Finte`);
            
            if (modParts.length > 0) {
                messageContent += ` + ${modParts.join(' + ')} = ${finalRoll}`;
            }
            
            messageContent += `<br>`;
        }

        messageContent += `<span style="color: ${result.includes("Erfolg") ? "green" : "red"};">${result}</span>`;

        // Add clickable icon for successful attacks
        if (result.includes("Erfolg")) {
            messageContent += ` <a class="call-damage" data-crit="${result === "Kritischer Erfolg"}" data-wuchtschlag="${attackValues.wuchtschlag}">⚔️</a>`;
        }

        if (attackValues.finte > 0 && result.includes("Erfolg")) {
            messageContent += `<br>Mit Finte (${attackValues.finte})`;
        }
        messageContent += `</div>`;

        // Create and send the chat message
        const chatMessage = await ChatMessage.create({
            content: messageContent,
            speaker: ChatMessage.getSpeaker({ token: selectedToken })
        });

        // Handle damage roll setup if successful
        if (result.includes("Erfolg")) {
            if (selectedToken) {
                await selectedToken.document.setFlag("world", "attackData", {
                    kritisch: result === "Kritischer Erfolg",
                    wuchtschlag: attackValues.wuchtschlag,
                    damageFormula: damageFormula
                });
            }

            setTimeout(() => {
                const messageElement = document.querySelector(`[data-message-id="${chatMessage.id}"]`);
                if (messageElement) {
                    const callDamageButton = messageElement.querySelector('.call-damage');
                    if (callDamageButton) {
                        const clickHandler = async (event) => {
                            event.preventDefault();
                            const damageMacro = game.macros.getName("dsa_damage");
                            if (damageMacro) {
                                damageMacro.execute();
                            } else {
                                ui.notifications.error("dsa_damage macro not found");
                            }
                        };

                        callDamageButton.addEventListener('click', clickHandler);
                        Hooks.once(`deleteMessage${chatMessage.id}`, () => {
                            callDamageButton.removeEventListener('click', clickHandler);
                        });
                    }
                }
            }, 100);
        }
    }
}
