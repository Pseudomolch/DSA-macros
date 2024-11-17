// DSA Attack Macro
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
        const rollTotal = roll.total;
        
        // Calculate the final attack value
        const finalAttackValue = attackValues.attackValue - totalModifier;
        
        // Determine success and critical hits
        const isCriticalSuccess = rollTotal === 1;
        const isCriticalFailure = rollTotal === 20;
        const isSuccess = rollTotal <= finalAttackValue || isCriticalSuccess;
        
        // Create the chat message content
        let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
        messageContent += `<strong>Attacke${attackValues.attackName ? ` (${attackValues.attackName})` : ''}</strong><br>`;
        messageContent += `Würfelwurf: ${rollTotal}<br>`;
        messageContent += `Attackewert: ${attackValues.attackValue}`;
        
        if (totalModifier !== 0) {
            messageContent += ` ${totalModifier >= 0 ? '+' : ''}${totalModifier}`;
        }
        
        if (attackValues.wuchtschlag !== 0) {
            messageContent += `<br>Wuchtschlag: ${attackValues.wuchtschlag}`;
        }
        
        if (attackValues.finte !== 0) {
            messageContent += `<br>Finte: ${attackValues.finte}`;
        }
        
        messageContent += `<br><strong>Ergebnis: ${isSuccess ? 'Erfolg' : 'Misserfolg'}</strong>`;
        
        if (isCriticalSuccess) {
            messageContent += `<br><em>Meisterliche Attacke!</em>`;
        } else if (isCriticalFailure) {
            messageContent += `<br><em>Patzer!</em>`;
        }
        
        messageContent += `</div>`;

        // Add damage button if attack was successful and damage formula exists
        if (isSuccess && damageFormula) {
            messageContent += `
            <div class="card-buttons">
                <button class="call-damage">
                    Schaden würfeln (${damageFormula})
                </button>
            </div>`;
        }

        // Create and send the chat message
        const chatData = {
            content: messageContent,
            speaker: ChatMessage.getSpeaker({ token: selectedToken })
        };

        const chatMessage = await ChatMessage.create(chatData);

        // Add event listener for damage button if it exists
        if (isSuccess && damageFormula) {
            const messageElement = document.querySelector(`[data-message-id="${chatMessage.id}"]`);
            const callDamageButton = messageElement.querySelector('.call-damage');

            if (callDamageButton) {
                const clickHandler = async () => {
                    // Store attack data for damage calculation
                    await selectedToken.document.setFlag("world", "attackData", {
                        damageFormula: damageFormula,
                        kritisch: isCriticalSuccess
                    });

                    // Call the damage macro
                    await game.modules.get('dsa-macros').api.macros.DSADamage.execute();
                };

                callDamageButton.addEventListener('click', clickHandler);
                Hooks.once(`deleteMessage${chatMessage.id}`, () => {
                    callDamageButton.removeEventListener('click', clickHandler);
                });
            }
        }
    }
}
