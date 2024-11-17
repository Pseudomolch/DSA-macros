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

    // Register module to the global scope
    game.modules.get('dsa-macros').api = {
        macros: {
            DSAAttack,
            DSADamage,
            DSAParade,
            DSATalent,
            DSAZoneArmor,
            DSAZoneWounds,
            DSANPCAction
        },
        dialogs: {
            AttackDialog,
            DamageDialog,
            NPCDialog,
            ParadeDialog,
            TalentDialog,
            ZoneArmorDialog,
            ZoneWoundsDialog
        },
        utils: {
            NPCParser,
            MeisterpersonParser
        }
    };
});

Hooks.once('ready', async function() {
    console.log('DSA-Macros | Ready');
});

// Register macros with Foundry VTT
Hooks.on('hotbarDrop', async (bar, data, slot) => {
    if (data.type === 'Macro') return;

    // Create macro based on item type
    let command = '';
    switch (data.type) {
        case 'Attack':
            command = `game.modules.get('dsa-macros').api.macros.DSAAttack.execute()`;
            break;
        case 'Damage':
            command = `game.modules.get('dsa-macros').api.macros.DSADamage.execute()`;
            break;
        case 'Parade':
            command = `game.modules.get('dsa-macros').api.macros.DSAParade.execute()`;
            break;
        case 'Talent':
            command = `game.modules.get('dsa-macros').api.macros.DSATalent.execute()`;
            break;
        case 'ZoneArmor':
            command = `game.modules.get('dsa-macros').api.macros.DSAZoneArmor.execute()`;
            break;
        case 'ZoneWounds':
            command = `game.modules.get('dsa-macros').api.macros.DSAZoneWounds.execute()`;
            break;
        case 'NPCAction':
            command = `game.modules.get('dsa-macros').api.macros.DSANPCAction.execute()`;
            break;
        default:
            return;
    }

    // Create the macro
    let macro = await Macro.create({
        name: `DSA ${data.type}`,
        type: 'script',
        img: data.img || 'icons/svg/dice-target.svg',
        command: command,
        flags: { 'dsa-macros': { type: data.type } }
    });

    // Assign the macro to the hotbar slot
    game.user.assignHotbarMacro(macro, slot);

    return false;
});
