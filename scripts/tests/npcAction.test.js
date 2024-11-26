// @jest/environment jsdom
import { DSANPCAction } from '../macros/npcAction.js';
import { jest } from '@jest/globals';
import {
    mockGame,
    mockToken,
    mockUI,
    mockChatMessage,
    setupGlobalMocks,
    resetMocks
} from './resources/mockData.js';

describe('DSANPCAction', () => {
    beforeAll(() => {
        setupGlobalMocks();
    });

    beforeEach(() => {
        resetMocks();
        // Any specific setup for NPC Action tests
        mockGame.user.targets.first.mockReturnValue(mockToken);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('execute() should fail if no token is selected', async () => {
        mockGame.user.targets.first.mockReturnValue(null);
        await DSANPCAction.execute();
        expect(mockUI.notifications.error).toHaveBeenCalledWith('Bitte wähle einen Token aus.');
    });

    test('execute() should fail if token has no Meisterperson ability', async () => {
        const mockParserNoAbility = {
            hasMeisterpersonAbility: () => false
        };
        mockGame.modules.get().api.utils.MeisterpersonParser = jest.fn(() => mockParserNoAbility);
        
        await DSANPCAction.execute();
        expect(mockUI.notifications.error).toHaveBeenCalledWith('Der ausgewählte Token hat keine Meisterperson-Fähigkeit.');
    });

    test('execute() should fail if no attacks are found', async () => {
        const mockParserNoAttacks = {
            hasMeisterpersonAbility: () => true,
            parseAttacks: () => []
        };
        mockGame.modules.get().api.utils.MeisterpersonParser = jest.fn(() => mockParserNoAttacks);
        
        await DSANPCAction.execute();
        expect(mockUI.notifications.error).toHaveBeenCalledWith('Keine Angriffe für diesen NSC gefunden.');
    });

    test('execute() should handle attack action with specific attack data', async () => {
        const testAttack = { name: 'Test Attack', at: 10, tp: '1d6+4', dk: 'H' };
        mockGame.modules.get().api.dialogs.NPCDialog.execute.mockResolvedValue({ 
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
        expect(mockGame.modules.get().api.macros.DSAAttack.execute).toHaveBeenCalled();
    });

    test('execute() should handle parade action', async () => {
        mockGame.modules.get().api.dialogs.NPCDialog.execute.mockResolvedValue({ action: 'parade' });

        await DSANPCAction.execute();
        expect(mockGame.modules.get().api.macros.DSAParade.execute).toHaveBeenCalled();
    });

    test('execute() should handle damage action', async () => {
        mockGame.modules.get().api.dialogs.NPCDialog.execute.mockResolvedValue({ action: 'damage' });

        await DSANPCAction.execute();
        expect(mockGame.modules.get().api.macros.DSADamage.execute).toHaveBeenCalled();
    });

    test('execute() should handle zoneWounds action', async () => {
        mockGame.modules.get().api.dialogs.NPCDialog.execute.mockResolvedValue({ action: 'zoneWounds' });

        await DSANPCAction.execute();
        expect(mockGame.modules.get().api.macros.DSAZoneWounds.execute).toHaveBeenCalled();
    });
});
