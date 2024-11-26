// @jest/environment jsdom
import { DSANPCAction } from '../macros/npcAction.js';
import { jest } from '@jest/globals';
import {
    mockGame,
    mockToken,
    setupGlobalMocks,
    resetMocks,
    mockParserNoAbility,
    mockParserNoAttacks,
    mockCanvas,
    mockParser
} from './resources/mockData.js';

describe('DSANPCAction', () => {
    beforeAll(() => {
        setupGlobalMocks();
    });

    beforeEach(() => {
        resetMocks();
        // Set up default mock parser for tests that need it
        const moduleAPI = mockGame.modules.get().api;
        moduleAPI.utils.MeisterpersonParser.mockReturnValue(mockParser);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('execute() should fail if no token is selected', async () => {
        mockGame.user.targets.first.mockReturnValue(null);
        mockCanvas.tokens.controlled = [];
        await DSANPCAction.execute();
        const moduleAPI = mockGame.modules.get().api;
        expect(moduleAPI.dialogs.NPCDialog.execute).not.toHaveBeenCalled();
    });

    test('execute() should fail if token has no Meisterperson ability', async () => {
        const moduleAPI = mockGame.modules.get().api;
        moduleAPI.utils.MeisterpersonParser.mockReturnValue(mockParserNoAbility);
        await DSANPCAction.execute();
        expect(moduleAPI.dialogs.NPCDialog.execute).not.toHaveBeenCalled();
    });

    test('execute() should fail if no attacks are found', async () => {
        const moduleAPI = mockGame.modules.get().api;
        moduleAPI.utils.MeisterpersonParser.mockReturnValue(mockParserNoAttacks);
        await DSANPCAction.execute();
        expect(moduleAPI.dialogs.NPCDialog.execute).not.toHaveBeenCalled();
    });

    test('execute() should handle attack action with specific attack data', async () => {
        mockGame.currentAction = 'attack';
        await DSANPCAction.execute();

        // Get the expected attack data from the parser
        const expectedAttack = mockParser.parseAttacks()[0];
        const moduleAPI = mockGame.modules.get().api;

        // Check if dialog was executed
        expect(moduleAPI.dialogs.NPCDialog.execute).toHaveBeenCalled();
        
        // Check if attack data was set with the parsed data
        expect(mockToken.document.setFlag).toHaveBeenCalledWith('world', 'attackData', {
            defaultAttackValue: expectedAttack.at,
            attackName: expectedAttack.name,
            damageFormula: expectedAttack.tp
        });

        // Check if attack macro was executed
        expect(moduleAPI.macros.DSAAttack.execute).toHaveBeenCalled();
    });

    test('execute() should handle parade action', async () => {
        mockGame.currentAction = 'parade';
        await DSANPCAction.execute();
        const moduleAPI = mockGame.modules.get().api;
        expect(moduleAPI.dialogs.NPCDialog.execute).toHaveBeenCalled();
        expect(moduleAPI.macros.DSAParade.execute).toHaveBeenCalled();
    });

    test('execute() should handle damage action', async () => {
        mockGame.currentAction = 'damage';
        await DSANPCAction.execute();
        const moduleAPI = mockGame.modules.get().api;
        expect(moduleAPI.dialogs.NPCDialog.execute).toHaveBeenCalled();
        expect(moduleAPI.macros.DSADamage.execute).toHaveBeenCalled();
    });

    test('execute() should handle zoneWounds action', async () => {
        mockGame.currentAction = 'zoneWounds';
        await DSANPCAction.execute();
        const moduleAPI = mockGame.modules.get().api;
        expect(moduleAPI.dialogs.NPCDialog.execute).toHaveBeenCalled();
        expect(moduleAPI.macros.DSAZoneWounds.execute).toHaveBeenCalled();
    });
});
