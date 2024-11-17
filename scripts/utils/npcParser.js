// NPC Parser Utility for DSA 4.1
export class NPCParser {
    static parseAbilities(text) {
        const abilities = [];
        const lines = text.split('\n');
        
        let currentAbility = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // Check if this is a new ability
            if (!trimmedLine.startsWith(' ') && !trimmedLine.startsWith('\t')) {
                if (currentAbility) {
                    abilities.push(currentAbility);
                }
                currentAbility = {
                    name: trimmedLine,
                    details: []
                };
            } else if (currentAbility) {
                currentAbility.details.push(trimmedLine);
            }
        }
        
        // Add the last ability if it exists
        if (currentAbility) {
            abilities.push(currentAbility);
        }
        
        return abilities;
    }
    
    static parseAttackInfo(abilityText) {
        const attackRegex = /AT\s*(\d+)/i;
        const damageRegex = /TP\s*(\d+W\d+(?:\+\d+)?|\d+)/i;
        
        const attackMatch = abilityText.match(attackRegex);
        const damageMatch = abilityText.match(damageRegex);
        
        return {
            attackValue: attackMatch ? parseInt(attackMatch[1]) : null,
            damageFormula: damageMatch ? damageMatch[1].replace(/W/g, 'd') : null
        };
    }
    
    static parseArmorInfo(text) {
        const armorRegex = /RS\s*(\d+)/i;
        const match = text.match(armorRegex);
        return match ? parseInt(match[1]) : 0;
    }
    
    static parseZoneArmorInfo(text) {
        const zoneArmorRegex = /RS:\s*Ko\s*(\d+)\s*\/\s*Br\s*(\d+)\s*\/\s*R(?:ü|ue)\s*(\d+)\s*\/\s*Ba\s*(\d+)\s*\/\s*LA\s*(\d+)\s*\/\s*RA\s*(\d+)\s*\/\s*LB\s*(\d+)\s*\/\s*RB\s*(\d+)/i;
        const match = text.match(zoneArmorRegex);
        
        if (match) {
            return {
                kopf: parseInt(match[1]),
                brust: parseInt(match[2]),
                ruecken: parseInt(match[3]),
                bauch: parseInt(match[4]),
                arme: [parseInt(match[5]), parseInt(match[6])], // [LA, RA]
                beine: [parseInt(match[7]), parseInt(match[8])] // [LB, RB]
            };
        }
        
        return null;
    }
    
    static parseAttributes(text) {
        const attributes = {};
        const attributeRegex = {
            mu: /MU\s*(\d+)/i,
            kl: /KL\s*(\d+)/i,
            in: /IN\s*(\d+)/i,
            ch: /CH\s*(\d+)/i,
            ff: /FF\s*(\d+)/i,
            ge: /GE\s*(\d+)/i,
            ko: /KO\s*(\d+)/i,
            kk: /KK\s*(\d+)/i,
            le: /LE\s*(\d+)/i,
            ae: /AE\s*(\d+)/i,
            ke: /KE\s*(\d+)/i,
            mr: /MR\s*(\d+)/i,
            rs: /RS\s*(\d+)/i,
            ini: /INI\s*(\d+)/i,
            pa: /PA\s*(\d+)/i
        };
        
        for (const [key, regex] of Object.entries(attributeRegex)) {
            const match = text.match(regex);
            if (match) {
                attributes[key] = parseInt(match[1]);
            }
        }
        
        return attributes;
    }
}
