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

// Create API object
const api = {
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

    // Make API available to other modules
    game.modules.get('dsa-macros').api = api;
});

Hooks.once('ready', async function() {
    console.log('DSA-Macros | Ready');
});

// Make classes available globally
window.DSAMacros = api;
