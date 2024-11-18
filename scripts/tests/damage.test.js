import { DSADamage } from '../macros/damage.js';
import { jest } from '@jest/globals';

describe('DSADamage', () => {
    let mockGame;
    let mockCanvas;
    let mockUI;
    let mockChatMessage;
    let mockDialog;
    let mockWoundsDialog;

    beforeEach(() => {
        // Mock game and user
        mockDialog = {
            execute: jest.fn()
        };
        mockGame = {
            user: {
                targets: {
                    first: jest.fn()
                }
            },
            modules: {
                get: jest.fn().mockReturnValue({
                    api: {
                        dialogs: {
                            DamageDialog: mockDialog,
                            ZoneWoundsDialog: {
                                execute: jest.fn().mockResolvedValue(1)
                            }
                        }
                    }
                })
            }
        };
        global.game = mockGame;

        // Mock canvas and tokens
        mockCanvas = {
            tokens: {
                controlled: []
            }
        };
        global.canvas = mockCanvas;

        // Mock UI notifications
        mockUI = {
            notifications: {
                error: jest.fn()
            }
        };
        global.ui = mockUI;

        // Mock ChatMessage
        mockChatMessage = {
            create: jest.fn().mockResolvedValue({ id: 'mock-message-id' }),
            getSpeaker: jest.fn().mockReturnValue({ alias: 'Test Speaker' })
        };
        global.ChatMessage = mockChatMessage;

        // Mock Roll class
        global.Roll = jest.fn().mockImplementation(() => ({
            roll: jest.fn().mockReturnValue({
                total: 10,
                dice: [{
                    results: [
                        { result: 4 },
                        { result: 6 }
                    ]
                }]
            })
        }));

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('execute', () => {
        it('should show error when no token is selected', async () => {
            mockCanvas.tokens.controlled = [];
            await DSADamage.execute();
            expect(mockUI.notifications.error).toHaveBeenCalledWith('Kein Token ausgewählt.');
        });

        it('should handle damage with attack data from flag', async () => {
            const mockToken = {
                document: {
                    getFlag: jest.fn().mockReturnValue({
                        kritisch: true,
                        wuchtschlag: 2,
                        damageFormula: '1d6+4'
                    })
                }
            };
            mockCanvas.tokens.controlled = [mockToken];

            mockDialog.execute.mockResolvedValue({
                damageFormula: '1d6+4',
                kritisch: true,
                wuchtschlag: 2,
                armor: {
                    kopf: 4,
                    brust: 3,
                    arme: 2,
                    bauch: 3,
                    beine: 2
                }
            });

            await DSADamage.execute();

            expect(mockToken.document.getFlag).toHaveBeenCalledWith('world', 'attackData');
            expect(mockDialog.execute).toHaveBeenCalled();
            expect(mockChatMessage.create).toHaveBeenCalled();
        });

        it('should handle damage without attack data flag', async () => {
            const mockToken = {
                document: {
                    getFlag: jest.fn().mockReturnValue(null)
                }
            };
            mockCanvas.tokens.controlled = [mockToken];

            mockDialog.execute.mockResolvedValue({
                damageFormula: '2d6',
                kritisch: false,
                wuchtschlag: 0,
                armor: {
                    kopf: 3,
                    brust: 2,
                    arme: 1,
                    bauch: 2,
                    beine: 1
                }
            });

            await DSADamage.execute();

            expect(mockDialog.execute).toHaveBeenCalledWith({});
            expect(mockChatMessage.create).toHaveBeenCalled();
        });
    });

    describe('calculateAndDisplayDamage', () => {
        beforeEach(() => {
            mockWoundsDialog = {
                execute: jest.fn().mockResolvedValue(1)
            };
            mockGame.modules.get.mockReturnValue({
                api: {
                    dialogs: {
                        ZoneWoundsDialog: mockWoundsDialog
                    }
                }
            });
        });

        const mockTargetToken = {
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
                },
                items: []
            }
        };

        it('should handle numeric damage formula', async () => {
            const damageValues = {
                damageFormula: '5',
                kritisch: false,
                wuchtschlag: 0,
                armor: {
                    kopf: 3,
                    brust: 2,
                    arme: 1,
                    bauch: 2,
                    beine: 1
                }
            };

            await DSADamage.calculateAndDisplayDamage(damageValues);
            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('5 Schaden');
        });

        it('should handle dice formula with critical hit', async () => {
            const damageValues = {
                damageFormula: '2d6+2',
                kritisch: true,
                wuchtschlag: 2,
                armor: {
                    kopf: 3,
                    brust: 2,
                    arme: 1,
                    bauch: 2,
                    beine: 1
                }
            };

            await DSADamage.calculateAndDisplayDamage(damageValues);
            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('(2d6+2)x2');
            expect(messageContent).toContain('+2(Wucht)');
        });

        it('should calculate wounds when target is selected', async () => {
            const damageValues = {
                damageFormula: '2d6+10', // Higher damage to ensure wounds
                kritisch: true, // Critical hit to double damage
                wuchtschlag: 0,
                armor: {
                    kopf: 2,
                    brust: 2,
                    arme: 2,
                    bauch: 2,
                    beine: 2
                }
            };

            // Mock dice roll for damage to return high value
            global.Roll = jest.fn().mockImplementation((formula) => {
                if (formula === '2d6') {
                    return {
                        roll: jest.fn().mockReturnValue({
                            total: 10,
                            dice: [{
                                results: [
                                    { result: 5 },
                                    { result: 5 }
                                ]
                            }]
                        })
                    };
                }
                // Hit location roll
                return {
                    roll: jest.fn().mockReturnValue({
                        total: 19,
                        dice: [{
                            results: [
                                { result: 19 }
                            ]
                        }]
                    })
                };
            });

            await DSADamage.calculateAndDisplayDamage(damageValues, mockTargetToken);

            // First message should be damage
            expect(mockChatMessage.create).toHaveBeenCalled();
            const damageMessage = mockChatMessage.create.mock.calls[0][0].content;
            expect(damageMessage).toContain('2d6+10');

            // Second message should be wounds
            expect(mockWoundsDialog.execute).toHaveBeenCalled();
            expect(mockChatMessage.create).toHaveBeenCalledTimes(2);
        });
    });

    describe('getArmorValue', () => {
        it('should return correct armor values for different hit locations', () => {
            const armor = {
                kopf: 2,
                brust: [3, 4],
                arme: [1, 2],
                bauch: 3,
                beine: [2, 3]
            };

            expect(DSADamage.getArmorValue('am Kopf', armor)).toBe(2);
            expect(DSADamage.getArmorValue('an der Brust', armor)).toBe(3);
            expect(DSADamage.getArmorValue('am rechten Arm', armor)).toBe(2);
            expect(DSADamage.getArmorValue('am linken Arm', armor)).toBe(1);
            expect(DSADamage.getArmorValue('am Bauch', armor)).toBe(3);
            expect(DSADamage.getArmorValue('am rechten Bein', armor)).toBe(3);
            expect(DSADamage.getArmorValue('am linken Bein', armor)).toBe(2);
        });

        it('should handle non-array armor values', () => {
            const armor = {
                kopf: 2,
                brust: 3,
                arme: 2,
                bauch: 3,
                beine: 2
            };

            expect(DSADamage.getArmorValue('am Kopf', armor)).toBe(2);
            expect(DSADamage.getArmorValue('an der Brust', armor)).toBe(3);
            expect(DSADamage.getArmorValue('am rechten Arm', armor)).toBe(2);
            expect(DSADamage.getArmorValue('am linken Arm', armor)).toBe(2);
            expect(DSADamage.getArmorValue('am Bauch', armor)).toBe(3);
            expect(DSADamage.getArmorValue('am rechten Bein', armor)).toBe(2);
            expect(DSADamage.getArmorValue('am linken Bein', armor)).toBe(2);
        });

        it('should handle armor values from Meisterperson ability', () => {
            const mockTargetToken = {
                actor: {
                    items: [{
                        name: "Meisterperson",
                        system: {
                            armorValues: {
                                kopf: 3,
                                brust: [4, 5],
                                arme: [2, 3],
                                bauch: 4,
                                beine: [3, 4]
                            }
                        }
                    }]
                }
            };

            const damageValues = {
                armor: mockTargetToken.actor.items[0].system.armorValues
            };

            expect(DSADamage.getArmorValue('am Kopf', damageValues.armor)).toBe(3);
            expect(DSADamage.getArmorValue('an der Brust', damageValues.armor)).toBe(4);
            expect(DSADamage.getArmorValue('am rechten Arm', damageValues.armor)).toBe(3);
            expect(DSADamage.getArmorValue('am linken Arm', damageValues.armor)).toBe(2);
            expect(DSADamage.getArmorValue('am Bauch', damageValues.armor)).toBe(4);
            expect(DSADamage.getArmorValue('am rechten Bein', damageValues.armor)).toBe(4);
            expect(DSADamage.getArmorValue('am linken Bein', damageValues.armor)).toBe(3);
        });
    });

    describe('handleWounds', () => {
        beforeEach(() => {
            mockWoundsDialog = {
                execute: jest.fn().mockResolvedValue(1)
            };
            mockGame.modules.get.mockReturnValue({
                api: {
                    dialogs: {
                        ZoneWoundsDialog: mockWoundsDialog
                    }
                }
            });
        });

        it('should calculate wounds with base constitution', async () => {
            const mockTargetToken = {
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
                    },
                    items: []
                }
            };

            const damageValues = {
                armor: {
                    kopf: 2,
                    brust: 2,
                    arme: 2,
                    bauch: 2,
                    beine: 2
                }
            };

            // High damage to ensure wounds are triggered (30 - 2 armor = 28 damage, which exceeds all thresholds)
            await DSADamage.handleWounds(30, 'am Kopf', mockTargetToken, damageValues);

            expect(mockWoundsDialog.execute).toHaveBeenCalled();
            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('Wunden:');
            expect(messageContent).toContain('6, 12, 18'); // Constitution-based thresholds
        });

        it('should handle special abilities (Eisern/Glasknochen)', async () => {
            const mockTargetToken = {
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
                    },
                    items: [
                        { name: 'Eisern' }
                    ]
                }
            };

            const damageValues = {
                armor: {
                    kopf: 2,
                    brust: 2,
                    arme: 2,
                    bauch: 2,
                    beine: 2
                }
            };

            // High damage to ensure wounds are triggered (30 - 2 armor = 28 damage, which exceeds all thresholds)
            await DSADamage.handleWounds(30, 'am Kopf', mockTargetToken, damageValues);

            expect(mockWoundsDialog.execute).toHaveBeenCalled();
            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('8, 14, 20'); // Thresholds with Eisern (+2)
        });

        it('should use defined wound thresholds when available', async () => {
            const mockTargetToken = {
                actor: {
                    system: {
                        base: {
                            basicAttributes: {
                                constitution: { value: 12 }
                            },
                            combatAttributes: {
                                passive: {
                                    woundThresholds: {
                                        first: 10,
                                        second: 18,
                                        third: 26,
                                        mod: 0
                                    }
                                }
                            }
                        }
                    },
                    items: []
                }
            };

            const damageValues = {
                armor: {
                    kopf: 2,
                    brust: 2,
                    arme: 2,
                    bauch: 2,
                    beine: 2
                }
            };

            // High damage to ensure wounds are triggered (30 - 2 armor = 28 damage, which exceeds all thresholds)
            await DSADamage.handleWounds(30, 'am Kopf', mockTargetToken, damageValues);

            expect(mockWoundsDialog.execute).toHaveBeenCalled();
            expect(mockChatMessage.create).toHaveBeenCalled();
            const messageContent = mockChatMessage.create.mock.calls[0][0].content;
            expect(messageContent).toContain('10, 18, 26'); // Defined thresholds + mod
        });
    });
});
