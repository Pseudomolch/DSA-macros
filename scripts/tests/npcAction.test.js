// @jest/environment jsdom
import { jest } from '@jest/globals';
import { DSANPCAction } from '../macros/npcAction.js';

describe('DSANPCAction', () => {
    let mockCanvas;
    let mockGame;
    let mockUI;
    let mockToken;
    let mockNPCDialog;

    beforeEach(() => {
        // Mock canvas and tokens
        mockToken = {
            actor: {
                effects: [],
                name: 'Test NPC'
            },
            document: {
                setFlag: jest.fn()
            }
        };
        mockCanvas = {
            tokens: {
                controlled: [mockToken]
            }
        };
        global.canvas = mockCanvas;

        // Mock game object with module API
        mockGame = {
            modules: {
                get: jest.fn().mockReturnValue({
                    api: {
                        utils: {
                            MeisterpersonParser: class {
                                constructor(actor) {
                                    this.actor = actor;
                                }
                                hasMeisterpersonAbility() {
                                    return true;
                                }
                                parseAttacks() {
                                    return [
                                        { name: 'Test Attack', at: 10, tp: '1d6+4', dk: 'H' }
                                    ];
                                }
                                parseStats() {
                                    return {
                                        ini: 4,
                                        pa: 8,
                                        lep: 30,
                                        rs: 1,
                                        ko: 13,
                                        gs: 6,
                                        aup: 30,
                                        mr: 2,
                                        gw: 4
                                    };
                                }
                            }
                        },
                        dialogs: {
                            NPCDialog: {
                                execute: jest.fn()
                            }
                        },
                        macros: {
                            DSAAttack: { execute: jest.fn() },
                            DSAParade: { execute: jest.fn() },
                            DSADamage: { execute: jest.fn() },
                            DSAZoneWounds: { execute: jest.fn() }
                        }
                    }
                })
            }
        };
        global.game = mockGame;

        // Store reference to mock NPCDialog for easier access
        mockNPCDialog = mockGame.modules.get().api.dialogs.NPCDialog;

        // Mock UI notifications
        mockUI = {
            notifications: {
                error: jest.fn()
            }
        };
        global.ui = mockUI;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('execute() should fail if no token is selected', async () => {
        canvas.tokens.controlled = [];
        await DSANPCAction.execute();
        expect(ui.notifications.error).toHaveBeenCalledWith('Bitte wähle einen Token aus.');
    });

    test('execute() should fail if token has no Meisterperson ability', async () => {
        const mockParserNoAbility = {
            hasMeisterpersonAbility: () => false
        };
        game.modules.get().api.utils.MeisterpersonParser = jest.fn(() => mockParserNoAbility);
        
        await DSANPCAction.execute();
        expect(ui.notifications.error).toHaveBeenCalledWith('Der ausgewählte Token hat keine Meisterperson-Fähigkeit.');
    });

    test('execute() should fail if no attacks are found', async () => {
        const mockParserNoAttacks = {
            hasMeisterpersonAbility: () => true,
            parseAttacks: () => []
        };
        game.modules.get().api.utils.MeisterpersonParser = jest.fn(() => mockParserNoAttacks);
        
        await DSANPCAction.execute();
        expect(ui.notifications.error).toHaveBeenCalledWith('Keine Angriffe für diesen NSC gefunden.');
    });

    test('execute() should handle attack action with specific attack data', async () => {
        const testAttack = { name: 'Test Attack', at: 10, tp: '1d6+4', dk: 'H' };
        mockNPCDialog.execute.mockResolvedValue({ 
            action: 'attack',
            attack: testAttack
        });

        await DSANPCAction.execute();

        // Check if attack data was set
        expect(mockToken.document.setFlag).toHaveBeenCalledWith('world', 'attackData', {
            defaultAttackValue: testAttack.at,
            attackName: testAttack.name,
            damageFormula: testAttack.tp
        });

        // Check if attack macro was executed
        expect(game.modules.get().api.macros.DSAAttack.execute).toHaveBeenCalled();
    });

    test('execute() should handle parade action', async () => {
        mockNPCDialog.execute.mockResolvedValue({ action: 'parade' });

        await DSANPCAction.execute();
        expect(game.modules.get().api.macros.DSAParade.execute).toHaveBeenCalled();
    });

    test('execute() should handle damage action', async () => {
        mockNPCDialog.execute.mockResolvedValue({ action: 'damage' });

        await DSANPCAction.execute();
        expect(game.modules.get().api.macros.DSADamage.execute).toHaveBeenCalled();
    });

    test('execute() should handle zoneWounds action', async () => {
        mockNPCDialog.execute.mockResolvedValue({ action: 'zoneWounds' });

        await DSANPCAction.execute();
        expect(game.modules.get().api.macros.DSAZoneWounds.execute).toHaveBeenCalled();
    });
});
