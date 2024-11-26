import { NPCDialog } from '../dialogs/npcDialog.js';
import { jest } from '@jest/globals';
import $ from 'jquery';
import {
    mockGame,
    mockToken,
    mockUI,
    mockChatMessage,
    setupGlobalMocks,
    resetMocks,
    mockParser,
    mockParserNoAbility,
    mockParserNoAttacks
} from './resources/mockData.js';

describe('NPCDialog', () => {
    beforeAll(() => {
        setupGlobalMocks();
    });

    beforeEach(() => {
        resetMocks();
        mockGame.user.targets.first.mockReturnValue(mockToken);
        global.$ = $;
        
        // Mock Dialog class
        global.Dialog = jest.fn().mockImplementation(dialogData => ({
            data: dialogData,
            render: jest.fn().mockResolvedValue(true),
            close: jest.fn()
        }));

        // Add name to token for dialog title
        mockToken.name = 'Test Token';
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete global.$;
        delete global.Dialog;
    });

    test('execute() should create dialog with correct stats', async () => {
        const dialog = await NPCDialog.execute(mockToken, [], [], mockParser);
        
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        expect(dialogArgs).toBeDefined();
        expect(dialogArgs.title).toBe('Test Token');
        
        document.body.innerHTML = dialogArgs.content;
        
        const stats = document.querySelector('.npc-dialog__stats');
        const statsText = stats.textContent.replace(/\s+/g, ' ').trim();
        expect(statsText).toContain('Initiative: 4');
        expect(statsText).toContain('Parade: 8');
        expect(statsText).toContain('Magieresistenz: 2');
        expect(statsText).toContain('Konstitution: 13');
        expect(statsText).toContain('Geschwindigkeit: 6');
        expect(statsText).toContain('Rüstungsschutz: 1');
        expect(statsText).toContain('LeP: 20/30');
        expect(statsText).toContain('AuP: 30/30');
    });

    test('execute() should display wound effects when present', async () => {
        const woundEffects = [
            { name: 'Wound 1', description: 'Test wound 1' },
            { name: 'Wound 2', description: 'Test wound 2' }
        ];

        const dialog = await NPCDialog.execute(mockToken, [], woundEffects, mockParser);
        
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        document.body.innerHTML = dialogArgs.content;
        
        expect(document.querySelector('.npc-dialog__wounds')).not.toBeNull();
        expect(document.body.textContent).toContain('Test wound 1');
        expect(document.body.textContent).toContain('Test wound 2');
    });

    test('execute() should display attacks with correct format', async () => {
        const attacks = [
            { name: 'Test', dk: 'H', at: 12, tp: '1W+4' }
        ];

        const dialog = await NPCDialog.execute(mockToken, attacks, [], mockParser);
        
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        document.body.innerHTML = dialogArgs.content;
        
        expect(document.querySelector('.npc-dialog__attacks')).not.toBeNull();
        expect(document.body.textContent).toContain('Test');
        expect(document.body.textContent).toContain('AT 12');
        expect(document.body.textContent).toContain('1W+4');
        expect(document.body.textContent).toContain('H');
    });

    test('execute() should create dialog with correct stats from meisterperson ability', async () => {
        const attacks = mockParser.parseAttacks();
        const dialog = await NPCDialog.execute(mockToken, attacks, [], mockParser);
        
        expect(global.Dialog).toHaveBeenCalled();
        const dialogArgs = global.Dialog.mock.calls[0][0];
        document.body.innerHTML = dialogArgs.content;
        
        const statsText = document.querySelector('.npc-dialog__stats').textContent.replace(/\s+/g, ' ').trim();
        
        expect(statsText).toContain('Initiative: 4');
        expect(statsText).toContain('Parade: 8');
        expect(statsText).toContain('Rüstungsschutz: 1');
        expect(statsText).toContain('Geschwindigkeit: 6');
        expect(statsText).toContain('Magieresistenz: 2');
        expect(statsText).toContain('Gefahrenwert: 4');
        expect(statsText).toContain('LeP: 20/30');
        expect(statsText).toContain('AuP: 30/30');
        expect(statsText).toContain('Konstitution: 13');

        const attacksSection = document.querySelector('.npc-dialog__attacks').textContent.replace(/\s+/g, ' ').trim();
        expect(attacksSection).toContain('Test');
        expect(attacksSection).toContain('DK H');
        expect(attacksSection).toContain('AT 12');
        expect(attacksSection).toContain('TP 1W+4');
    });

    describe('NPCDialog click handlers', () => {
        let $html;

        beforeEach(async () => {
            await NPCDialog.execute(mockToken, [], [], mockParser);
            const dialogArgs = global.Dialog.mock.calls[0][0];
            
            document.body.innerHTML = `
                <div class="npc-dialog">
                    <div class="stat-item clickable" data-action="parade">Parade</div>
                    <div class="attack-item">
                        <span class="attack-emoji" data-attack='{"name":"Test","at":12,"tp":"1W+4"}'>⚔️</span>
                    </div>
                </div>
            `;
            $html = $(document.body);
            
            // Call the render function if it exists in dialogArgs
            if (dialogArgs.render) {
                await dialogArgs.render($html);
            }
        });

        test('parade click should set correct flag and execute parade macro', async () => {
            $html.find('.stat-item[data-action="parade"]').click();
            
            expect(mockToken.document.setFlag).toHaveBeenCalledWith('world', 'paradeData', {
                defaultParadeValue: 8,
                paradeModifier: 0
            });
        });

        test('attack click should set correct flag and execute attack macro', async () => {
            $html.find('.attack-emoji').click();
            
            expect(mockToken.document.setFlag).toHaveBeenCalledWith('world', 'attackData', {
                defaultAttackValue: '12',
                attackName: 'Test',
                attackModifier: 0,
                damageFormula: '1W+4'
            });
        });
    });
});
