// Parser class for Meisterperson abilities
class MeisterpersonParser {
    constructor(actor) {
        this.actor = actor;
        this.ability = actor?.items.find(item => 
            item.type === "specialAbility" && 
            item.name === "Meisterperson"
        );
        this.description = this.ability?.system.description || '';
    }

    // Check if actor has Meisterperson ability
    hasMeisterpersonAbility() {
        return !!this.ability;
    }

    // Parse all attacks from the description
    parseAttacks() {
        if (!this.description) return [];

        const attacks = [];
        const lines = this.description.split('\n');

        for (const line of lines) {
            if (line.trim().startsWith('Angriff')) {
                const attack = this.parseAttackLine(line);
                if (attack) attacks.push(attack);
            }
        }

        return attacks;
    }

    // Parse a single attack line
    parseAttackLine(line) {
        const nameMatch = line.match(/Angriff\s+([^,]+)/);
        const dkMatch = line.match(/DK\s+([^,]+)/);
        const atMatch = line.match(/AT\s+(\d+)/);
        const tpMatch = line.match(/TP\s+([^,\n]+)/);

        if (!nameMatch) return null;

        return {
            name: nameMatch[1].trim(),
            dk: dkMatch ? dkMatch[1].trim() : null,
            at: atMatch ? parseInt(atMatch[1]) : null,
            tp: tpMatch ? tpMatch[1].trim() : null
        };
    }

    // Get armor value (RS)
    getArmorValue() {
        const match = this.description.match(/RS\s+(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    // Get TP value of first attack
    getFirstAttackTP() {
        const attacks = this.parseAttacks();
        return attacks.length > 0 ? attacks[0].tp : null;
    }

    // Get all armor values
    getArmorValues() {
        const rs = this.getArmorValue();
        if (!rs) return null;

        return {
            kopf: rs,
            brust: rs,
            arme: rs,
            bauch: rs,
            beine: rs
        };
    }
}

// Register the parser as a global module
Hooks.once('init', () => {
    globalThis.MeisterpersonParser = MeisterpersonParser;
});
