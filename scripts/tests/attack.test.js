import { DSAAttack } from '../macros/attack.js';
import { MeisterpersonParser } from '../utils/meisterpersonParser.js';
import { jest } from '@jest/globals';
import {
    mockGame,
    mockCanvas,
    mockUI,
    mockChatMessage,
    mockMeisterpersonData,
    setupGlobalMocks,
    resetMocks
} from './resources/mockData.js';

// Mock MeisterpersonParser
const mockMeisterpersonParser = {
    hasMeisterpersonAbility: jest.fn(),
    parseAttacks: jest.fn(),
    parseStats: jest.fn().mockReturnValue(mockMeisterpersonData)
};

jest.mock('../utils/meisterpersonParser.js', () => ({
    MeisterpersonParser: jest.fn().mockImplementation(() => mockMeisterpersonParser)
}));

describe('DSAAttack', () => {
    beforeAll(() => {
        setupGlobalMocks();
    });

    beforeEach(() => {
        resetMocks();
        // Reset MeisterpersonParser mocks
        mockMeisterpersonParser.hasMeisterpersonAbility.mockReset();
        mockMeisterpersonParser.parseAttacks.mockReset();
        mockMeisterpersonParser.parseStats.mockReset().mockReturnValue(mockMeisterpersonData);
    });

    describe('execute', () => {
        it('should show error when no token is selected', async () => {
            await DSAAttack.execute();
            expect(mockUI.notifications.error).toHaveBeenCalledWith('Bitte wähle genau einen Token aus.');
        });

        it('should handle token with attack data flag', async () => {
            const mockToken = {
                document: {
                    getFlag: jest.fn().mockReturnValue({
                        defaultAttackValue: 12,
                        attackName: 'Test Attack',
                        attackModifier: 2,
                        damageFormula: '1d6+4'
                    }),
                    unsetFlag: jest.fn(),
                    setFlag: jest.fn()
                },
                name: 'Test Token',
                actor: {
                    effects: []
                }
            };
            mockCanvas.tokens.controlled = [mockToken];

            mockDialog.execute.mockResolvedValue({
                attackValue: 12,
                modifier: 2,
                wuchtschlag: 0,
                finte: 0,
                attackName: 'Test Attack'
            });

            await DSAAttack.execute();

            expect(mockToken.document.getFlag).toHaveBeenCalledWith('world', 'attackData');
            expect(mockToken.document.unsetFlag).toHaveBeenCalledWith('world', 'attackData');
            expect(mockDialog.execute).toHaveBeenCalledWith('12', 'Test Attack', 2);
        });

        it('should handle token with Meisterperson abilities', async () => {
            const mockToken = {
                document: {
                    getFlag: jest.fn().mockReturnValue(null),
                    setFlag: jest.fn()
                },
                name: 'Test Token',
                actor: {
                    effects: [],
                    items: [{
                        type: "specialAbility",
                        name: "Meisterperson",
                        system: {
                            description: "Angriff MP Attack, DK N, AT 14, TP 1d6+2"
                        }
                    }]
                }
            };
            mockCanvas.tokens.controlled = [mockToken];

            mockDialog.execute.mockResolvedValue({
                attackValue: 14,
                modifier: 0,
                wuchtschlag: 0,
                finte: 0,
                attackName: 'MP Attack'
            });

            await DSAAttack.execute();

            expect(mockDialog.execute).toHaveBeenCalledWith('14', 'MP Attack', 0);
        });
    });

    describe('performAttackRoll', () => {
        const mockToken = {
            document: {
                setFlag: jest.fn()
            },
            name: 'Test Token'
        };

        it('should handle normal success', async () => {
            global.Roll = jest.fn().mockImplementation(() => ({
                roll: jest.fn().mockResolvedValue({ total: 10 })
            }));

            const attackValues = {
                attackValue: 12,
                modifier: 2,
                wuchtschlag: 0,
                finte: 0,
                attackName: 'Test Attack'
            };

            await DSAAttack.performAttackRoll(attackValues, mockToken, '1d6+4');

            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Erfolg');
            expect(messageContent).toContain('⚔️');
        });

        it('should handle critical hit', async () => {
            let rollCount = 0;
            global.Roll = jest.fn().mockImplementation(() => ({
                roll: jest.fn().mockResolvedValue({ total: rollCount++ === 0 ? 1 : 5 })
            }));

            const attackValues = {
                attackValue: 12,
                modifier: 0,
                wuchtschlag: 0,
                finte: 0,
                attackName: 'Test Attack'
            };

            await DSAAttack.performAttackRoll(attackValues, mockToken, '1d6+4');

            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Kritischer Erfolg');
            expect(messageContent).toContain('Bestätigungswurf');
        });

        it('should handle critical failure', async () => {
            let rollCount = 0;
            global.Roll = jest.fn().mockImplementation(() => ({
                roll: jest.fn().mockResolvedValue({ total: rollCount++ === 0 ? 20 : 15 })
            }));

            const attackValues = {
                attackValue: 12,
                modifier: 0,
                wuchtschlag: 0,
                finte: 0,
                attackName: 'Test Attack'
            };

            await DSAAttack.performAttackRoll(attackValues, mockToken, '1d6+4');

            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Patzer');
            expect(messageContent).toContain('Bestätigungswurf');
        });

        it('should display modifiers correctly', async () => {
            global.Roll = jest.fn().mockImplementation(() => ({
                roll: jest.fn().mockResolvedValue({ total: 10 })
            }));

            const attackValues = {
                attackValue: 12,
                modifier: 2,
                wuchtschlag: 4,
                finte: 3,
                attackName: 'Test Attack'
            };

            await DSAAttack.performAttackRoll(attackValues, mockToken, '1d6+4');

            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('2 Mod');
            expect(messageContent).toContain('4 Wuchtschlag');
            expect(messageContent).toContain('3 Finte');
        });
    });
});
