// @jest/environment jsdom
import { jest } from '@jest/globals';
import { NPCDialog } from '../dialogs/npcDialog.js';
import $ from 'jquery';

// Mock Dialog class
let mockDialogInstance;
let mockToken;
let mockParser;

beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock Dialog class
    global.Dialog = jest.fn().mockImplementation(dialogData => {
        return {
            data: dialogData,
            render: jest.fn().mockResolvedValue(true),
            close: jest.fn()
        };
    });

    // Mock token with test data
    mockToken = {
        name: 'Test Token',
        document: {
            texture: {
                src: 'test.png'
            }
        },
        actor: {
            name: 'Test Token',
            img: 'test.png',
            data: {
                data: {
                    stats: {
                        initiative: { value: 10 },
                        parade: { value: 15 },
                        magicresistance: { value: 5 },
                        constitution: { value: 5 },
                        speed: { value: 8 },
                        armor: { value: 2 },
                        lifepoints: { value: 30, max: 30 },
                        endurance: { value: 30, max: 30 }
                    }
                }
            }
        }
    };

    // Mock parser
    mockParser = {
        hasMeisterpersonAbility: jest.fn().mockReturnValue(true),
        parseAttacks: jest.fn().mockReturnValue([]),
        parseStats: jest.fn().mockReturnValue({
            ini: 4,
            pa: 8,
            lep: 30,
            rs: 1,
            ko: 13,
            gs: 6,
            aup: 30,
            mr: 2,
            gw: 4
        })
    };

    // Mock jQuery
    global.$ = $;
});

afterEach(() => {
    jest.clearAllMocks();
    delete global.$;
    delete global.Dialog;
});

test('execute() should create dialog with correct stats', async () => {
    // Mock parser with test data
    mockParser.parseStats = jest.fn().mockReturnValue({
        ini: 10,
        pa: 15,
        mr: 5,
        ko: 5,
        gs: 8,
        rs: 2,
        lep: 30,
        aup: 30
    });

    // Execute dialog
    const dialog = await NPCDialog.execute(mockToken, [], [], mockParser);
    
    // Check dialog was created with correct args
    expect(global.Dialog).toHaveBeenCalled();
    const dialogArgs = global.Dialog.mock.calls[0][0];
    expect(dialogArgs).toBeDefined();
    expect(dialogArgs.title).toBe('Test Token');
    
    // Create a DOM element from the content string
    document.body.innerHTML = dialogArgs.content;
    
    // Check stats
    const stats = document.querySelector('.npc-dialog__stats');
    const statsText = stats.textContent.replace(/\s+/g, ' ').trim();
    expect(statsText).toContain('Initiative: 10');
    expect(statsText).toContain('Parade: 15');
    expect(statsText).toContain('Magieresistenz: 5');
    expect(statsText).toContain('Konstitution: 5');
    expect(statsText).toContain('Geschwindigkeit: 8');
    expect(statsText).toContain('Rüstungsschutz: 2');
    expect(statsText).toContain('LeP: 30/30');
    expect(statsText).toContain('AuP: 30/30');
});

test('execute() should display wound effects when present', async () => {
    const attacks = [];
    const woundEffects = [
        { name: 'Wound 1', description: 'Test wound 1' },
        { name: 'Wound 2', description: 'Test wound 2' }
    ];

    const dialog = await NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
    
    expect(global.Dialog).toHaveBeenCalled();
    const dialogArgs = global.Dialog.mock.calls[0][0];
    const content = dialogArgs.content;
    
    // Create a DOM element from the content string
    document.body.innerHTML = content;
    
    expect(document.querySelector('.npc-dialog__wounds')).not.toBeNull();
    expect(document.body.textContent).toContain('Test wound 1');
    expect(document.body.textContent).toContain('Test wound 2');
});

test('execute() should display attacks with correct format', async () => {
    const attacks = [
        { name: 'Sword', at: 12, tp: '1W+4', dk: 'H' }
    ];
    const woundEffects = [];

    const dialog = await NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
    
    expect(global.Dialog).toHaveBeenCalled();
    const dialogArgs = global.Dialog.mock.calls[0][0];
    const content = dialogArgs.content;
    
    // Create a DOM element from the content string
    document.body.innerHTML = content;
    
    expect(document.querySelector('.npc-dialog__attacks')).not.toBeNull();
    expect(document.body.textContent).toContain('Sword');
    expect(document.body.textContent).toContain('AT 12');
    expect(document.body.textContent).toContain('1W+4');
    expect(document.body.textContent).toContain('H');
});

test('execute() should create dialog with correct stats from meisterperson ability', async () => {
    // Mock parser with sample ability stats
    mockParser.parseStats = jest.fn().mockReturnValue({
        ini: 4,
        pa: 8,
        lep: 30,
        rs: 1,
        ko: 13,
        gs: 6,
        aup: 30,
        mr: 2,
        gw: 4
    });

    const attacks = [
        { name: 'Test', dk: 'H', at: 12, tp: '1W+4' },
        { name: 'Test Neu', dk: 'S', at: 11, tp: '12' }
    ];
    const woundEffects = [];

    const dialog = await NPCDialog.execute(mockToken, attacks, woundEffects, mockParser);
    
    expect(global.Dialog).toHaveBeenCalled();
    const dialogArgs = global.Dialog.mock.calls[0][0];
    
    // Check content
    const content = dialogArgs.content;
    
    // Create a DOM element from the content string
    document.body.innerHTML = content;
    
    const statsText = document.querySelector('.npc-dialog__stats').textContent.replace(/\s+/g, ' ').trim();
    
    // Check all stats from meisterperson ability are present
    expect(statsText).toContain('Initiative: 4');
    expect(statsText).toContain('Parade: 8');
    expect(statsText).toContain('Rüstungsschutz: 1');
    expect(statsText).toContain('Geschwindigkeit: 6');
    expect(statsText).toContain('Magieresistenz: 2');
    expect(statsText).toContain('Gewandtheit: 4');
    expect(statsText).toContain('LeP: 30/30');
    expect(statsText).toContain('AuP: 30/30');
    expect(statsText).toContain('Konstitution: 13');

    // Check attacks are present
    const attacksSection = document.querySelector('.npc-dialog__attacks').textContent.replace(/\s+/g, ' ').trim();
    expect(attacksSection).toContain('Test');
    expect(attacksSection).toContain('DK H');
    expect(attacksSection).toContain('AT 12');
    expect(attacksSection).toContain('TP 1W+4');
    expect(attacksSection).toContain('Test Neu');
    expect(attacksSection).toContain('DK S');
    expect(attacksSection).toContain('AT 11');
    expect(attacksSection).toContain('TP 12');
});

test('should handle null or undefined actor data gracefully', async () => {
    // Mock token with null actor data
    const nullActorToken = {
        name: 'Unbekannt'
    };
    
    // Mock parser to return empty stats
    mockParser.parseStats = jest.fn().mockReturnValue({});
    
    // Execute dialog
    const dialog = await NPCDialog.execute(nullActorToken, [], [], mockParser);
    
    // Check dialog was created with correct args
    expect(global.Dialog).toHaveBeenCalled();
    const dialogArgs = global.Dialog.mock.calls[0][0];
    expect(dialogArgs).toBeDefined();
    expect(dialogArgs.title).toBe('Unbekannt');
    
    // Create a DOM element from the content string
    document.body.innerHTML = dialogArgs.content;
    
    // Check default stats
    const stats = document.querySelector('.npc-dialog__stats');
    const statsText = stats.textContent.replace(/\s+/g, ' ').trim();
    expect(statsText).toContain('Initiative: 0');
    expect(statsText).toContain('Parade: 0');
});

test('should handle completely missing actor data', async () => {
    // Mock token with completely missing actor
    const missingActorToken = {
        name: 'Unbekannt'
    };
    
    // Mock parser to return empty stats
    mockParser.parseStats = jest.fn().mockReturnValue({});
    
    // Execute dialog
    const dialog = await NPCDialog.execute(missingActorToken, [], [], mockParser);
    
    // Check dialog was created with correct args
    expect(global.Dialog).toHaveBeenCalled();
    const dialogArgs = global.Dialog.mock.calls[0][0];
    expect(dialogArgs).toBeDefined();
    expect(dialogArgs.title).toBe('Unbekannt');
    
    // Create a DOM element from the content string
    document.body.innerHTML = dialogArgs.content;
    
    // Check default stats
    const stats = document.querySelector('.npc-dialog__stats');
    const statsText = stats.textContent.replace(/\s+/g, ' ').trim();
    expect(statsText).toContain('Initiative: 0');
    expect(statsText).toContain('Parade: 0');
});
