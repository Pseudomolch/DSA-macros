// DSA 4.1 Macros Module

class DSAMacros {
    static ID = 'dsa-macros';
    
    static initialize() {
        console.log('Initializing DSA 4.1 Macros');
        
        // Register module settings
        this.registerSettings();
        
        // Register macros
        this.registerMacros();
    }
    
    static registerSettings() {
        game.settings.register(this.ID, 'defaultDamageFormula', {
            name: 'Default Damage Formula',
            hint: 'Default formula to use for damage rolls',
            scope: 'client',
            config: true,
            type: String,
            default: '1W6'
        });
        
        // Add more settings as needed
    }
    
    static registerMacros() {
        const macros = {
            'DSA: Angriff': 'attack',
            'DSA: Parade': 'parade',
            'DSA: Schaden': 'damage',
            'DSA: Talent': 'talent',
            'DSA: Werte': 'werte',
            'DSA: Zonenwunden': 'zoneWounds',
            'DSA: NSC Verwaltung': 'nscManagement'
        };
        
        // Register each macro
        for (const [name, script] of Object.entries(macros)) {
            this.registerMacro(name, script);
        }
    }
    
    static registerMacro(name, script) {
        const command = `game.modules.get('${this.ID}').api.macros.${script}()`;
        
        // Create or update the macro
        Hooks.once('ready', async () => {
            let macro = game.macros.find(m => m.name === name);
            const data = {
                name: name,
                type: 'script',
                command: command,
                img: 'icons/svg/dice-target.svg'
            };
            
            if (macro) {
                await macro.update(data);
            } else {
                await Macro.create(data);
            }
        });
    }
    
    static get api() {
        return {
            utils: {
                MeisterpersonParser: globalThis.MeisterpersonParser
            },
            dialogs: {
                DamageDialog: globalThis.DamageDialog,
                WoundsDialog: globalThis.WoundsDialog
            },
            macros: {
                attack: globalThis.DSAAttack,
                damage: globalThis.DSADamage,
                parade: globalThis.DSAParade,
                talent: globalThis.DSATalent,
                werte: globalThis.DSAWerte,
                zoneWounds: globalThis.DSAZoneWounds,
                nscManagement: globalThis.DSANSCManagement
            }
        };
    }
}

// Initialize the module
Hooks.once('init', () => {
    DSAMacros.initialize();
});

// Export the module class
export default DSAMacros;
