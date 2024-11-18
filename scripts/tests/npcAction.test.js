// @jest/environment jsdom
import { jest } from '@jest/globals';
import { DSANPCAction } from '../macros/npcAction.js';

describe('DSANPCAction', () => {
    let mockCanvas;
    let mockGame;
    let mockUI;
    let mockDialog;
    let mockToken;
    let mockActor;

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

        // Mock game object with single attack
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
                            }
                        }
                    }
                })
            }
        };
        global.game = mockGame;

        // Mock DSAMacros global
        global.DSAMacros = {
            macros: {
                DSAAttack: { execute: jest.fn() },
                DSAParade: { execute: jest.fn() },
                DSADamage: { execute: jest.fn() },
                DSAZoneWounds: { execute: jest.fn() }
            }
        };

        // Mock UI notifications
        mockUI = {
            notifications: {
                error: jest.fn()
            }
        };
        global.ui = mockUI;

        // Mock Dialog class
        mockDialog = jest.fn().mockReturnValue({
            render: jest.fn().mockReturnValue(true),
            close: jest.fn()
        });
        global.Dialog = mockDialog;
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

    test('execute() should create dialog with wound effects if present', async () => {
        mockToken.actor.effects = [
            {
                label: '1 Wunde',
                flags: {
                    core: {
                        statusId: 'wound_kopf'
                    }
                }
            }
        ];

        await DSANPCAction.execute();
        expect(Dialog).toHaveBeenCalled();
        const dialogArgs = Dialog.mock.calls[0][0];
        expect(dialogArgs.content).toContain('Wunden:');
        expect(dialogArgs.content).toContain('1 Wunde');
    });

    test('execute() should create dialog with attack options', async () => {
        await DSANPCAction.execute();
        expect(Dialog).toHaveBeenCalled();
        const dialogArgs = Dialog.mock.calls[0][0];
        expect(dialogArgs.content).toContain('Test Attack');
        expect(dialogArgs.content).toContain('DK H, AT 10, TP 1d6+4');
    });

    test('execute() should handle multiple attacks correctly', async () => {
        // Mock multiple attacks
        const mockParserMultipleAttacks = {
            hasMeisterpersonAbility: () => true,
            parseAttacks: () => [
                { name: 'Sword Attack', at: 12, tp: '1d6+6', dk: 'N' },
                { name: 'Claw Attack', at: 10, tp: '1d6+2', dk: 'H' },
                { name: 'Bite Attack', at: 8, tp: '2d6+4', dk: 'N' }
            ]
        };
        game.modules.get().api.utils.MeisterpersonParser = jest.fn(() => mockParserMultipleAttacks);

        await DSANPCAction.execute();
        expect(Dialog).toHaveBeenCalled();
        const dialogArgs = Dialog.mock.calls[0][0];
        
        // Check if all attacks are present in the dialog
        const attacks = mockParserMultipleAttacks.parseAttacks();
        attacks.forEach(attack => {
            // Check attack name
            expect(dialogArgs.content).toContain(attack.name);
            
            // Check attack stats
            const statsText = `DK ${attack.dk}, AT ${attack.at}, TP ${attack.tp}`;
            expect(dialogArgs.content).toContain(statsText);
            
            // Check data attribute
            const dataAttribute = `data-attack='{"name":"${attack.name}","at":${attack.at},"tp":"${attack.tp}","dk":"${attack.dk}"}'`;
            expect(dialogArgs.content).toContain(dataAttribute);
        });

        // Check that we have the correct number of attack entries
        const attackDivCount = (dialogArgs.content.match(/<div class="attack-item">/g) || []).length;
        expect(attackDivCount).toBe(3);

        // Check that action buttons are present
        expect(dialogArgs.content).toContain('data-macro="attack"');
        expect(dialogArgs.content).toContain('data-macro="parade"');
        expect(dialogArgs.content).toContain('data-macro="damage"');
        expect(dialogArgs.content).toContain('data-macro="zoneWounds"');
    });
});
