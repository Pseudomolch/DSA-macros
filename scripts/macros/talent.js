// DSA Talent Macro
export class DSATalent {
    static async execute() {
        // Get talent values from dialog
        const talentValues = await game.modules.get('dsa-macros').api.dialogs.TalentDialog.execute();
        if (!talentValues) return;

        await this.performTalentCheck(talentValues);
    }

    static async performTalentCheck(talentValues) {
        // Perform the three attribute rolls
        const rolls = await Promise.all([
            new Roll("1d20").roll({async: true}),
            new Roll("1d20").roll({async: true}),
            new Roll("1d20").roll({async: true})
        ]);

        const rollResults = rolls.map(r => r.total);
        
        // Calculate effective attributes with modifier
        const effectiveAttributes = talentValues.attributes.map(attr => attr - talentValues.modifier);
        
        // Calculate remaining points and success levels
        let remainingPoints = talentValues.taw;
        const checks = rollResults.map((roll, index) => {
            const attribute = effectiveAttributes[index];
            if (roll === 1) return { success: true, points: 0 };
            if (roll === 20) return { success: false, points: Infinity };
            
            const success = roll <= attribute;
            const points = success ? 0 : roll - attribute;
            return { success, points };
        });

        // Use remaining points to compensate failed checks
        checks.forEach(check => {
            if (!check.success && check.points !== Infinity) {
                if (remainingPoints >= check.points) {
                    remainingPoints -= check.points;
                    check.success = true;
                    check.compensated = true;
                }
            }
        });

        // Determine overall success and quality level
        const isSuccess = checks.every(check => check.success);
        let qualityLevel = 0;
        
        if (isSuccess) {
            qualityLevel = Math.floor(remainingPoints / 3) + 1;
        }

        // Create chat message
        let messageContent = `<div style="background-color: #f0f0f0; border: 1px solid #ccc; padding: 5px; border-radius: 3px;">`;
        messageContent += `<strong>Talentprobe</strong><br>`;
        
        // Add attribute checks
        talentValues.attributes.forEach((attr, index) => {
            const roll = rollResults[index];
            const effectiveAttr = effectiveAttributes[index];
            const check = checks[index];
            
            messageContent += `Eigenschaft ${index + 1} (${attr}${talentValues.modifier ? ` - ${talentValues.modifier}` : ''} = ${effectiveAttr}): `;
            messageContent += `${roll} ${check.success ? '✓' : '✗'}`;
            if (check.compensated) messageContent += ' (ausgeglichen)';
            messageContent += '<br>';
        });

        // Add TaW and modifier
        messageContent += `<br>TaW: ${talentValues.taw}`;
        if (talentValues.modifier !== 0) {
            messageContent += `<br>Modifikator: ${talentValues.modifier}`;
        }

        // Add result
        messageContent += `<br><strong>Ergebnis: ${isSuccess ? 'Erfolg' : 'Misserfolg'}</strong>`;
        if (isSuccess) {
            messageContent += `<br>Qualitätsstufe: ${qualityLevel}`;
            if (remainingPoints > 0) {
                messageContent += `<br>Übrige Punkte: ${remainingPoints}`;
            }
        }

        messageContent += `</div>`;

        // Send chat message
        await ChatMessage.create({
            content: messageContent,
            speaker: ChatMessage.getSpeaker()
        });
    }
}
