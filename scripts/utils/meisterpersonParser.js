// Parser class for Meisterperson abilities
export class MeisterpersonParser {
    constructor(actor) {
        this.actor = actor;
        this.ability = actor?.items.find(item => 
            item.type === "specialAbility" && 
            item.name === "Meisterperson"
        );
        this.description = this.ability?.system.description || '';
    }

    hasMeisterpersonAbility() {
        return !!this.ability;
    }

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

    parseStats() {
        if (!this.description) return {};

        const stats = {};
        const lines = this.description.split('\n');
        const statRegex = /(\w+)\s+(\d+)/g;

        for (const line of lines) {
            if (line.trim().startsWith('Angriff')) continue;

            let match;
            while ((match = statRegex.exec(line)) !== null) {
                const [_, stat, value] = match;
                stats[stat.toLowerCase()] = parseInt(value);
            }
        }

        return stats;
    }

    getArmorValue() {
        const stats = this.parseStats();
        return stats.rs || null;
    }

    getFirstAttackTP() {
        const attacks = this.parseAttacks();
        return attacks.length > 0 ? attacks[0].tp : null;
    }

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
