// @jest/environment jsdom
import { jest } from '@jest/globals';
import { NPCDialog } from '../dialogs/npcDialog.js';
import $ from 'jquery';

describe('NPCDialog', () => {
    let mockToken;
    let mockActor;
    let mockDialog;
    let mockParser;

    beforeEach(() => {
        // Mock jQuery
        global.$ = $;
        
        // Mock token and actor
        mockActor = {
            system: {
                base: {
                    resources: {
                        vitality: { value: 30, max: 30 },
                        endurance: { value: 30, max: 30 }
                    },
                    basicAttributes: {
                        speed: { value: 6 }
                    },
                    combatAttributes: {
                        active: {
                            initiative: { value: 4 },
                            parry: { value: 8 },
                            magicResistance: { value: 2 },
                            mentalResistance: { value: 4 }
                        }
                    }
                }
            }
        };
        mockToken = {
            name: 'Test NPC',
            actor: mockActor,
            document: {
                texture: {
                    src: 'path/to/image.png'
                }
            }
        };

        // Mock parser
        mockParser = {
            getArmorValue: () => 1
        };

        // Mock Dialog class
        mockDialog = jest.fn().mockReturnValue({
            render: jest.fn().mockReturnValue(true),
            close: jest.fn()
        });
        global.Dialog = mockDialog;
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete global.$;
    });

    test('execute() should create dialog with correct stats', async () => {
        const attacks = [
            { name: 'Test Attack', at: 12, tp: '1W+4', dk: 'H' }
        ];
        const woundEffects = [];

        const dialogPromise = NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
        
        expect(Dialog).toHaveBeenCalled();
        const dialogArgs = Dialog.mock.calls[0][0];
        
        // Check title
        expect(dialogArgs.title).toBe('Test NPC');

        // Create a DOM element to parse the content
        const content = $(dialogArgs.content);
        
        // Check stats using jQuery
        expect(content.find('.stat-label:contains("INI")').next().text()).toBe('4');
        expect(content.find('.stat-label:contains("PA")').next().text()).toBe('8');
        expect(content.find('.stat-label:contains("LeP")').next().text()).toBe('30/30');
        expect(content.find('.stat-label:contains("RS")').next().text()).toBe('1');
        expect(content.find('.stat-label:contains("GS")').next().text()).toBe('6');
        expect(content.find('.stat-label:contains("AuP")').next().text()).toBe('30/30');
        expect(content.find('.stat-label:contains("MR")').next().text()).toBe('2');
        expect(content.find('.stat-label:contains("GW")').next().text()).toBe('4');

        // Check token image
        expect(content.find('.token-image').attr('src')).toBe('path/to/image.png');
    });

    test('execute() should display wound effects when present', async () => {
        const attacks = [];
        const woundEffects = [{
            label: '1 Wunde',
            modifiers: ['AT -2', 'PA -2']
        }];

        const dialogPromise = NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
        
        expect(Dialog).toHaveBeenCalled();
        const dialogArgs = Dialog.mock.calls[0][0];
        const content = $(dialogArgs.content);
        
        expect(content.find('.wounds-list').length).toBe(1);
        expect(content.find('.wounds-list').text()).toContain('1 Wunde');
        expect(content.find('.wounds-list').text()).toContain('AT -2, PA -2');
    });

    test('execute() should display attacks with correct format', async () => {
        const attacks = [
            { name: 'Sword', at: 12, tp: '1W+4', dk: 'H' },
            { name: 'Dagger', at: 10, tp: '1W+2', dk: 'N' }
        ];
        const woundEffects = [];

        const dialogPromise = NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
        
        expect(Dialog).toHaveBeenCalled();
        const dialogArgs = Dialog.mock.calls[0][0];
        const content = $(dialogArgs.content);
        
        const attackItems = content.find('.attack-item');
        expect(attackItems.length).toBe(2);
        
        attacks.forEach((attack, index) => {
            const attackItem = $(attackItems[index]);
            expect(attackItem.find('.attack-name').text()).toBe(attack.name);
            expect(attackItem.find('.attack-stats').text()).toContain(`DK ${attack.dk}`);
            expect(attackItem.find('.attack-stats').text()).toContain(`AT ${attack.at}`);
            expect(attackItem.find('.attack-stats').text()).toContain(`TP ${attack.tp}`);
            expect(attackItem.find('.attack-emoji').data('attack')).toEqual(attack);
        });
    });

    test('execute() should resolve with correct action when PA is clicked', async () => {
        const attacks = [];
        const woundEffects = [];

        // Mock the Dialog class to immediately trigger click event
        mockDialog.mockImplementation(function({ render, content }) {
            // Call render immediately and store the jQuery object
            const $html = $(content);
            render($html);
            
            // Trigger click on PA stat
            $html.find('.stat-item.clickable[data-action="parade"]').trigger('click');
            
            return { 
                render: () => true,
                close: jest.fn()
            };
        });

        const result = await NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
        expect(result).toEqual({ action: 'parade' });
    });

    test('execute() should resolve with correct action and attack data when attack emoji is clicked', async () => {
        const attacks = [
            { name: 'Sword', at: 12, tp: '1W+4', dk: 'H' }
        ];
        const woundEffects = [];

        // Mock the Dialog class to immediately trigger click event
        mockDialog.mockImplementation(function({ render, content }) {
            // Call render immediately and store the jQuery object
            const $html = $(content);
            render($html);
            
            // Trigger click on attack emoji
            $html.find('.attack-emoji').trigger('click');
            
            return { 
                render: () => true,
                close: jest.fn()
            };
        });

        const result = await NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
        expect(result).toEqual({
            action: 'attack',
            attack: attacks[0]
        });
    });
});
