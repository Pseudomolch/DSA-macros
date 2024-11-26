import { DSADamage } from '../macros/damage.js';
import { jest } from '@jest/globals';
import { 
    mockGame, 
    mockToken, 
    mockActor,
    setupGlobalMocks,
    resetMocks
} from './resources/mockData.js';

describe('DSADamage', () => {
    beforeAll(() => {
        setupGlobalMocks();
    });

    beforeEach(() => {
        resetMocks();
    });

    describe('execute', () => {
        it('should show error when no token is selected', async () => {
            // Clear controlled tokens
            global.canvas.tokens.controlled = [];

            await DSADamage.execute();
            expect(ui.notifications.error).toHaveBeenCalledWith("Kein Token ausgewählt.");
        });

        it('should handle damage with attack data from flag', async () => {
            // Mock selected token with attack data
            const selectedToken = {
                document: {
                    getFlag: jest.fn().mockReturnValue({
                        kritisch: true,
                        wuchtschlag: 2,
                        damageFormula: '1d6+4'
                    })
                }
            };
            global.canvas.tokens.controlled = [selectedToken];

            await DSADamage.execute();
            expect(game.modules.get('dsa-macros').api.dialogs.DamageDialog.execute).toHaveBeenCalledWith({
                kritisch: true,
                wuchtschlag: 2,
                damageFormula: '1d6+4'
            });
        });

        it('should handle damage without attack data flag', async () => {
            // Mock selected token without attack data
            const selectedToken = {
                document: {
                    getFlag: jest.fn().mockReturnValue(null)
                }
            };
            global.canvas.tokens.controlled = [selectedToken];

            await DSADamage.execute();
            expect(game.modules.get('dsa-macros').api.dialogs.DamageDialog.execute).toHaveBeenCalledWith({});
        });
    });

    describe('calculateAndDisplayDamage', () => {
        beforeEach(() => {
            // Mock game.user.targets
            global.game.user.targets.first = jest.fn().mockReturnValue({
                actor: {
                    system: {
                        base: {
                            basicAttributes: {
                                constitution: { value: 12 }
                            },
                            combatAttributes: {
                                passive: {
                                    woundThresholds: null
                                }
                            }
                        }
                    }
                }
            });
        });

        it('should handle numeric damage formula', async () => {
            const damageValues = {
                damageFormula: '5',
                kritisch: false,
                wuchtschlag: 0,
                total: 5,
                hitLocation: 'am rechten Arm',
                locationRoll: { total: 2 },
                armor: { rechterArm: 3 },
                finalDamage: 5
            };

            await DSADamage.calculateAndDisplayDamage(damageValues);
            expect(ChatMessage.create).toHaveBeenCalled();
            const messageContent = ChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Schaden:</strong> 5');
            expect(messageContent).toContain('am rechten Arm');
        });

        it('should handle dice formula with critical hit', async () => {
            const damageValues = {
                damageFormula: '2d6+2',
                kritisch: true,
                wuchtschlag: 2,
                total: 26,
                hitLocation: 'am rechten Arm',
                locationRoll: { total: 2 },
                armor: { rechterArm: 3 },
                finalDamage: 26
            };

            await DSADamage.calculateAndDisplayDamage(damageValues);
            expect(ChatMessage.create).toHaveBeenCalled();
            const messageContent = ChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Schaden:</strong> 26');
            expect(messageContent).toContain('am rechten Arm');
        });

        it('should calculate wounds when target is selected', async () => {
            const damageValues = {
                damageFormula: '2d6+10',
                kritisch: false,
                wuchtschlag: 0,
                total: 40,
                hitLocation: 'am linken Bein',
                locationRoll: { total: 1 },
                armor: { beine: 4 },
                finalDamage: 40
            };

            // Mock dice roll for damage
            global.Roll = jest.fn().mockImplementation((formula) => ({
                roll: jest.fn().mockReturnValue({
                    total: formula === '2d6' ? 30 : 1, // 30 for damage, 1 for location
                    dice: [{
                        results: formula === '2d6' ? [
                            { result: 15 },
                            { result: 15 }
                        ] : [
                            { result: 1 }
                        ]
                    }]
                })
            }));

            // Mock wounds macro
            const mockWoundsMacro = {
                execute: jest.fn()
            };
            game.macros.getName.mockReturnValue(mockWoundsMacro);

            await DSADamage.calculateAndDisplayDamage(damageValues);
            expect(ChatMessage.create).toHaveBeenCalled();
            const damageMessage = ChatMessage.create.mock.calls[0][0].content;
            expect(damageMessage).toContain('Schaden:</strong> 40');
            expect(damageMessage).toContain('am linken Bein');

            // Second message should be wounds
            expect(mockWoundsMacro.execute).toHaveBeenCalled();
        });
    });

    describe('calculateWounds', () => {
        beforeEach(() => {
            global.game.user.targets.first = jest.fn().mockReturnValue({
                actor: {
                    system: {
                        base: {
                            basicAttributes: {
                                constitution: { value: 12 }
                            },
                            combatAttributes: {
                                passive: {
                                    woundThresholds: {
                                        head: 5,
                                        torso: 6,
                                        leftArm: 4,
                                        rightArm: 4,
                                        leftLeg: 4,
                                        rightLeg: 4
                                    }
                                }
                            }
                        }
                    }
                }
            });
        });

        it('should calculate basic wounds', async () => {
            const damage = 15;
            const location = 'Kopf';
            const wounds = await DSADamage.calculateWounds(damage, location);
            expect(wounds).toBe(3);
        });

        it('should handle critical hits', async () => {
            const damage = 20;
            const location = 'Torso';
            const wounds = await DSADamage.calculateWounds(damage, location, true);
            expect(wounds).toBe(6);
        });
    });

    describe('getArmorValue', () => {
        it('should return correct armor values for different hit locations', () => {
            const armor = {
                kopf: 2,
                brust: 3,
                bauch: 2,
                rechterArm: 1,
                linkerArm: 1,
                rechteBein: 2,
                linkeBein: 2
            };

            expect(DSADamage.getArmorValue(armor, 'Kopf')).toBe(2);
            expect(DSADamage.getArmorValue(armor, 'Brust')).toBe(3);
            expect(DSADamage.getArmorValue(armor, 'Bauch')).toBe(2);
            expect(DSADamage.getArmorValue(armor, 'Rechter Arm')).toBe(1);
            expect(DSADamage.getArmorValue(armor, 'Linker Arm')).toBe(1);
            expect(DSADamage.getArmorValue(armor, 'Rechtes Bein')).toBe(2);
            expect(DSADamage.getArmorValue(armor, 'Linkes Bein')).toBe(2);
        });

        it('should handle missing armor values', () => {
            const armor = {
                kopf: 2,
                brust: 3
            };

            expect(DSADamage.getArmorValue(armor, 'Bauch')).toBe(0);
            expect(DSADamage.getArmorValue(armor, 'Rechter Arm')).toBe(0);
        });

        it('should handle null or undefined armor', () => {
            expect(DSADamage.getArmorValue(null, 'Kopf')).toBe(0);
            expect(DSADamage.getArmorValue(undefined, 'Kopf')).toBe(0);
        });

        it('should handle invalid locations', () => {
            const armor = {
                kopf: 2,
                brust: 3
            };

            expect(DSADamage.getArmorValue(armor, 'Invalid Location')).toBe(0);
            expect(DSADamage.getArmorValue(armor, '')).toBe(0);
            expect(DSADamage.getArmorValue(armor, null)).toBe(0);
        });
    });

    describe('handleWounds', () => {
        let mockActor;
        let mockToken;
        let mockWoundsMacro;

        beforeEach(() => {
            mockActor = {
                system: {
                    base: {
                        basicAttributes: {
                            constitution: { value: 12 }
                        },
                        combatAttributes: {
                            passive: {
                                woundThresholds: {
                                    head: 5,
                                    torso: 6,
                                    leftArm: 4,
                                    rightArm: 4,
                                    leftLeg: 4,
                                    rightLeg: 4
                                }
                            }
                        }
                    }
                }
            };

            mockToken = {
                actor: mockActor
            };

            mockWoundsMacro = {
                execute: jest.fn().mockResolvedValue(true)
            };

            global.game.user.targets.first = jest.fn().mockReturnValue(mockToken);
            global.game.macros.getName = jest.fn().mockReturnValue(mockWoundsMacro);
        });

        it('should handle basic wound application', async () => {
            const damage = 15;
            const location = 'Kopf';
            await DSADamage.handleWounds(damage, location);
            
            expect(mockWoundsMacro.execute).toHaveBeenCalledWith(3, location);
        });

        it('should handle critical wound application', async () => {
            const damage = 20;
            const location = 'Torso';
            const kritisch = true;
            await DSADamage.handleWounds(damage, location, kritisch);
            
            expect(mockWoundsMacro.execute).toHaveBeenCalledWith(6, location);
        });

        it('should handle no wounds when damage is below threshold', async () => {
            const damage = 2;
            const location = 'Rechter Arm';
            await DSADamage.handleWounds(damage, location);
            
            expect(mockWoundsMacro.execute).not.toHaveBeenCalled();
        });

        it('should handle missing target', async () => {
            global.game.user.targets.first = jest.fn().mockReturnValue(null);
            
            const damage = 15;
            const location = 'Kopf';
            await DSADamage.handleWounds(damage, location);
            
            expect(mockWoundsMacro.execute).not.toHaveBeenCalled();
        });

        it('should handle missing wounds macro', async () => {
            global.game.macros.getName = jest.fn().mockReturnValue(null);
            
            const damage = 15;
            const location = 'Kopf';
            await DSADamage.handleWounds(damage, location);
            
            expect(mockWoundsMacro.execute).not.toHaveBeenCalled();
        });
    });

    describe('createChatMessage', () => {
        beforeEach(() => {
            global.ChatMessage = {
                create: jest.fn().mockResolvedValue(true)
            };
        });

        it('should create basic damage message', async () => {
            const damageValues = {
                damageFormula: '2d6+2',
                total: 10,
                hitLocation: 'Kopf',
                finalDamage: 8,
                armor: { kopf: 2 }
            };

            await DSADamage.createChatMessage(damageValues);
            
            expect(ChatMessage.create).toHaveBeenCalled();
            const messageContent = ChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Schaden:</strong> 10');
            expect(messageContent).toContain('Kopf');
            expect(messageContent).toContain('RS:</strong> 2');
            expect(messageContent).toContain('Finaler Schaden:</strong> 8');
        });

        it('should handle critical hits', async () => {
            const damageValues = {
                damageFormula: '2d6+2',
                total: 20,
                hitLocation: 'Torso',
                finalDamage: 17,
                armor: { brust: 3 },
                kritisch: true
            };

            await DSADamage.createChatMessage(damageValues);
            
            expect(ChatMessage.create).toHaveBeenCalled();
            const messageContent = ChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Kritischer Treffer!');
            expect(messageContent).toContain('Schaden:</strong> 20');
            expect(messageContent).toContain('Torso');
        });

        it('should handle wuchtschlag', async () => {
            const damageValues = {
                damageFormula: '2d6+2',
                total: 15,
                hitLocation: 'Rechter Arm',
                finalDamage: 13,
                armor: { rechterArm: 2 },
                wuchtschlag: 2
            };

            await DSADamage.createChatMessage(damageValues);
            
            expect(ChatMessage.create).toHaveBeenCalled();
            const messageContent = ChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Wuchtschlag');
            expect(messageContent).toContain('Schaden:</strong> 15');
            expect(messageContent).toContain('Rechter Arm');
        });

        it('should handle zero damage', async () => {
            const damageValues = {
                damageFormula: '1d6-2',
                total: 0,
                hitLocation: 'Linker Arm',
                finalDamage: 0,
                armor: { linkerArm: 2 }
            };

            await DSADamage.createChatMessage(damageValues);
            
            expect(ChatMessage.create).toHaveBeenCalled();
            const messageContent = ChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Schaden:</strong> 0');
            expect(messageContent).toContain('Linker Arm');
            expect(messageContent).toContain('Finaler Schaden:</strong> 0');
        });

        it('should handle missing armor', async () => {
            const damageValues = {
                damageFormula: '2d6+2',
                total: 10,
                hitLocation: 'Kopf',
                finalDamage: 10
            };

            await DSADamage.createChatMessage(damageValues);
            
            expect(ChatMessage.create).toHaveBeenCalled();
            const messageContent = ChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Schaden:</strong> 10');
            expect(messageContent).toContain('Kopf');
            expect(messageContent).toContain('RS:</strong> 0');
        });
    });
});
