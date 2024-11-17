// Initialize DSA Macros Module
import { DSAAttack } from './macros/attack.js';
import { DSADamage } from './macros/damage.js';
import { DSAParade } from './macros/parade.js';
import { DSATalent } from './macros/talent.js';
import { DSAZoneArmor } from './macros/zoneArmor.js';
import { DSAZoneWounds } from './macros/zoneWounds.js';
import { DSANPCAction } from './macros/npcAction.js';

// Import dialogs
import { AttackDialog } from './dialogs/attackDialog.js';
import { DamageDialog } from './dialogs/damageDialog.js';
import { NPCDialog } from './dialogs/npcDialog.js';
import { ParadeDialog } from './dialogs/paradeDialog.js';
import { TalentDialog } from './dialogs/talentDialog.js';
import { ZoneArmorDialog } from './dialogs/zoneArmorDialog.js';
import { ZoneWoundsDialog } from './dialogs/zoneWoundsDialog.js';

// Import utilities
import { NPCParser } from './utils/npcParser.js';
import { MeisterpersonParser } from './utils/meisterpersonParser.js';

Hooks.once('init', async function() {
    console.log('DSA-Macros | Initializing DSA Macros Module');

    // Register module settings if needed
    game.settings.register('dsa-macros', 'moduleSettings', {
        name: 'DSA Macros Settings',
        scope: 'world',
        config: false,
        default: {},
        type: Object
    });
});

Hooks.once('ready', async function() {
    console.log('DSA-Macros | Ready');

    // Create macros in the compendium
    const pack = game.packs.get('dsa-macros.dsa-macros');
    if (pack) {
        const macros = [
            {
                name: "Angriff",
                type: "script",
                command: "DSAMacros.DSAAttack.execute()",
                img: "icons/svg/sword.svg"
            },
            {
                name: "Parade",
                type: "script",
                command: "DSAMacros.DSAParade.execute()",
                img: "icons/svg/shield.svg"
            },
            {
                name: "Schaden",
                type: "script",
                command: "DSAMacros.DSADamage.execute()",
                img: "icons/svg/blood.svg"
            },
            {
                name: "Talent",
                type: "script",
                command: "DSAMacros.DSATalent.execute()",
                img: "icons/svg/dice-target.svg"
            },
            {
                name: "Zonenrüstung",
                type: "script",
                command: "DSAMacros.DSAZoneArmor.execute()",
                img: "icons/svg/armor.svg"
            },
            {
                name: "Zonenwunden",
                type: "script",
                command: "DSAMacros.DSAZoneWounds.execute()",
                img: "icons/svg/heal.svg"
            },
            {
                name: "NPC Aktion",
                type: "script",
                command: "DSAMacros.DSANPCAction.execute()",
                img: "icons/svg/mystery-man.svg"
            }
        ];

        // Create each macro in the compendium
        for (let macro of macros) {
            const exists = await pack.getDocument(macro.name);
            if (!exists) {
                await Macro.create(macro, {pack: pack.collection});
            }
        }
    }
});

// Make classes available globally
window.DSAMacros = {
    DSAAttack,
    DSADamage,
    DSAParade,
    DSATalent,
    DSAZoneArmor,
    DSAZoneWounds,
    DSANPCAction,
    AttackDialog,
    DamageDialog,
    NPCDialog,
    ParadeDialog,
    TalentDialog,
    ZoneArmorDialog,
    ZoneWoundsDialog,
    NPCParser,
    MeisterpersonParser
};
