// @jest/environment jsdom
import { jest } from '@jest/globals';
import { NPCDialog } from '../dialogs/npcDialog.js';
import $ from 'jquery';

// Mock Dialog class
const mockDialogInstance = {
    render: jest.fn().mockReturnValue(true),
    close: jest.fn()
};

describe('NPCDialog', () => {
    let mockToken;
    let mockActor;
    let mockParser;

    beforeEach(() => {
        // Mock jQuery
        global.$ = $;

        // Reset Dialog mock for each test
        mockDialogInstance.render.mockClear();
        mockDialogInstance.close.mockClear();

        // Mock Dialog class
        global.Dialog = jest.fn().mockReturnValue(mockDialogInstance);

        // Mock token and actor
        mockActor = {
            system: {
                base: {
                    resources: {
                        vitality: { value: 30, max: 30 },
                        endurance: { value: 30, max: 30 }
                    },
                    combatAttributes: {
                        active: {
                            initiative: { value: 10 },
                            parry: { value: 15 },
                            magicResistance: { value: 5 },
                            mentalResistance: { value: 5 }
                        }
                    },
                    basicAttributes: {
                        speed: { value: 8 }
                    }
                }
            },
            effects: []
        };

        mockToken = {
            name: 'Test Token',
            document: { texture: { src: 'test.png' } },
            actor: mockActor
        };

        mockParser = {
            hasMeisterpersonAbility: () => true,
            getArmorValue: () => 2
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete global.$;
        delete global.Dialog;
    });

    test('execute() should create dialog with correct stats', async () => {
        const attacks = [];
        const woundEffects = [];

        const dialogPromise = NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
        
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        
        // Check title
        expect(dialogArgs.title).toBe('Test Token');
        
        // Check content - create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = dialogArgs.content.trim();
        
        // Remove style tag for text content checks
        const styleTag = tempDiv.querySelector('style');
        if (styleTag) {
            styleTag.remove();
        }
        
        const content = $(tempDiv);
        
        // Check structure
        expect(content.find('.npc-dialog').length).toBe(1);
        expect(content.find('.npc-dialog__stats').length).toBe(1);
        
        // Check stats text
        const statsText = content.find('.npc-dialog__stats').text().replace(/\s+/g, ' ').trim();
        expect(statsText).toContain('INI 10');
        expect(statsText).toContain('PA 15');
        expect(statsText).toContain('MR 5');
        expect(statsText).toContain('KO 5');
        expect(statsText).toContain('GS 8');
        expect(statsText).toContain('RS 2');
        expect(statsText).toContain('LE 30/30');
        expect(statsText).toContain('AE 30/30');
    });

    test('execute() should display wound effects when present', async () => {
        const attacks = [];
        const woundEffects = [
            { name: 'Wound 1', description: 'Test wound 1' },
            { name: 'Wound 2', description: 'Test wound 2' }
        ];

        const dialogPromise = NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
        
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        const content = $(dialogArgs.content);
        
        expect(content.find('.npc-dialog__wounds').length).toBe(1);
        expect(content.text()).toContain('Test wound 1');
        expect(content.text()).toContain('Test wound 2');
    });

    test('execute() should display attacks with correct format', async () => {
        const attacks = [
            { name: 'Sword', at: 12, tp: '1W+4', dk: 'H' }
        ];
        const woundEffects = [];

        const dialogPromise = NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
        
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        const content = $(dialogArgs.content);
        
        expect(content.find('.npc-dialog__attacks').length).toBe(1);
        expect(content.text()).toContain('Sword');
        expect(content.text()).toContain('AT 12');
        expect(content.text()).toContain('1W+4');
        expect(content.text()).toContain('H');
    });

    test('should handle null or undefined actor data gracefully', async () => {
        // Mock token with minimal/null data
        const minimalToken = {
            name: 'Test Token',
            document: { texture: { src: 'test.png' } },
            actor: {
                system: {},  // Empty system object
                effects: []  // Empty effects array
            }
        };

        // Empty attacks and wound effects
        const emptyAttacks = [];
        const emptyWoundEffects = [];

        // Execute dialog
        await NPCDialog.execute(minimalToken, emptyAttacks, emptyWoundEffects, mockParser);

        // Verify dialog was created with expected content
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        expect(dialogArgs).toBeDefined();
        expect(dialogArgs.title).toBe('Test Token');
        expect(dialogArgs.content).toContain('Test Token');
    });

    test('should handle completely missing actor data', async () => {
        // Mock token with no actor data at all
        const tokenWithoutActor = {
            name: 'Test Token',
            document: { texture: { src: 'test.png' } }
        };

        // Empty attacks and wound effects
        const emptyAttacks = [];
        const emptyWoundEffects = [];

        // Execute dialog
        await NPCDialog.execute(tokenWithoutActor, emptyAttacks, emptyWoundEffects, mockParser);

        // Verify dialog was created with expected content
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        expect(dialogArgs).toBeDefined();
        expect(dialogArgs.title).toBe('Test Token');
        expect(dialogArgs.content).toContain('Test Token');
    });
});
