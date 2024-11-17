// DSA Parade Macro
export class DSAParade {
    static async execute() {
        let selectedToken = null;
        let defaultParadeValue = "";
        let paradeName = "";
        let paradeModifier = 0;

        if (canvas.tokens.controlled.length === 1) {
            selectedToken = canvas.tokens.controlled[0];
            
            // Get passed parade data if available
            const paradeData = selectedToken.document.getFlag("world", "paradeData");
            if (paradeData && paradeData.defaultParadeValue !== undefined) {
                defaultParadeValue = String(paradeData.defaultParadeValue);
                paradeName = paradeData.paradeName || "";
                paradeModifier = paradeData.paradeModifier || 0;
                
                // Clear the flag after reading
                selectedToken.document.unsetFlag("world", "paradeData");
            }
        } else {
            ui.notifications.error("Bitte wähle genau einen Token aus.");
            return;
        }

        // Get parade values from dialog
        const paradeValues = await game.modules.get('dsa-macros').api.dialogs.ParadeDialog.execute(
            defaultParadeValue,
            paradeName,
            paradeModifier
        );
        
        if (!paradeValues) return;

        await this.performParadeRoll(paradeValues, selectedToken);
    }

    static async performParadeRoll(paradeValues, selectedToken) {
        // Calculate the total modifier
        const totalModifier = paradeValues.modifier;

        // Perform the parade roll
        const roll = await new Roll("1d20").roll({async: true});
        const rollTotal = roll.total;
        
        // Calculate the final parade value
        const finalParadeValue = paradeValues.paradeValue - totalModifier;
        
        // Determine success and critical hits
        const isCriticalSuccess = rollTotal === 1;
        const isCriticalFailure = rollTotal === 20;
        const isSuccess = rollTotal <= finalParadeValue || isCriticalSuccess;
        
        // Create the chat message content
        let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
        messageContent += `<strong>Parade${paradeValues.paradeName ? ` (${paradeValues.paradeName})` : ''}</strong><br>`;
        messageContent += `Würfelwurf: ${rollTotal}<br>`;
        messageContent += `Paradewert: ${paradeValues.paradeValue}`;
        
        if (totalModifier !== 0) {
            messageContent += ` ${totalModifier >= 0 ? '+' : ''}${totalModifier}`;
        }
        
        messageContent += `<br><strong>Ergebnis: ${isSuccess ? 'Erfolg' : 'Misserfolg'}</strong>`;
        
        if (isCriticalSuccess) {
            messageContent += `<br><em>Meisterliche Parade!</em>`;
        } else if (isCriticalFailure) {
            messageContent += `<br><em>Patzer!</em>`;
        }
        
        messageContent += `</div>`;

        // Create and send the chat message
        const chatData = {
            content: messageContent,
            speaker: ChatMessage.getSpeaker({ token: selectedToken })
        };

        await ChatMessage.create(chatData);
    }
}
