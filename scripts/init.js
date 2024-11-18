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
import { MeisterpersonParser } from './utils/meisterpersonParser.js';

// Create API object
const api = {
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
        MeisterpersonParser
    }
};

// Function to clean up old macros
async function cleanupOldMacros() {
    const currentVersion = game.modules.get('dsa-macros').version;
    
    // Get all macros in the world
    const worldMacros = game.macros.filter(m => 
        m.name === "NPC Aktion" && 
        (!m.flags["dsa-macros"]?.version || m.flags["dsa-macros"].version < currentVersion)
    );

    // Delete old versions
    for (const macro of worldMacros) {
        await macro.delete();
        ui.notifications.info(`Alte Version von "${macro.name}" wurde entfernt.`);
    }
}

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
    
    // Clean up old macros when the module is updated
    await cleanupOldMacros();
});

// Make classes available globally
window.DSAMacros = api;
