import { jest } from '@jest/globals';

// Mock data for DSA Macros tests

// Base actor mock with common properties
export const mockActor = {
    system: {
        base: {
            resources: {
                vitality: { 
                    value: 20,
                    min: 0,
                    max: 30
                },
                astralEnergy: {
                    value: 20,
                    min: 0,
                    max: 30
                },
                endurance: {
                    value: 20,
                    min: 0,
                    max: 30
                },
                karmicEnergy: {
                    value: 20,
                    min: 0,
                    max: 30
                }
            },
            basicAttributes: {
                constitution: { value: 12 },
                courage: { value: 10 },
                cleverness: { value: 10 },
                intuition: { value: 10 },
                charisma: { value: 10 },
                dexterity: { value: 10 },
                agility: { value: 10 },
                strength: { value: 10 }
            },
            combatAttributes: {
                passive: {
                    woundThresholds: {
                        first: 5,
                        second: 10,
                        third: 150,
                        mod: 0
                    },
                    magicResistance: { value: 2 },
                    physicalResistance: { value: 0 }
                },
                active: {
                    baseInitiative: { value: 10 },
                    baseAttack: { value: 10 },
                    baseParry: { value: 10 },
                    baseRangedAttack: { value: 10 },
                    dodge: { value: 10 }
                }
            }
        }
    },
    items: [{
        name: "Meisterperson",
        type: "specialAbility",
        system: {
            description: "INI 4, PA 8, LeP 30, RS 1, KO 13\nGS 6, AuP 30, MR 2, GW 4\nAngriff Test, DK H, AT 12, TP 1W+4\nAngriff Test Neu, DK S, AT 11, TP 12",
            isUniquelyOwnable: true,
            sid: "random-6HkX3mNHqyk56lK3",
            type: ""
        },
        _id: "6HkX3mNHqyk56lK3",
        img: "icons/svg/item-bag.svg",
        effects: [],
        folder: null,
        sort: 0,
        ownership: {
            default: 0,
            XccSgeh9DdERmUIW: 3
        },
        flags: {},
        _stats: {
            systemId: "dsa-41",
            systemVersion: "0.2.15",
            coreVersion: "11.315",
            createdTime: 1732034886585,
            modifiedTime: 1732034898089,
            lastModifiedBy: "XccSgeh9DdERmUIW"
        }
    }],
    effects: [],
    update: jest.fn()
};

// Mock parser implementations
export const mockParser = {
    actor: mockActor,
    ability: mockActor.items[0],
    description: mockActor.items[0].system.description,
    hasMeisterpersonAbility: jest.fn(() => true),
    parseAttacks: jest.fn(() => [{
        name: 'Test Attack',
        dk: 'H',
        at: 12,
        tp: '1W+4'
    }]),
    parseAttackLine: jest.fn((line) => {
        const nameMatch = line.match(/Angriff\s+([^,]+)/);
        const dkMatch = line.match(/DK\s+([^,]+)/);
        const atMatch = line.match(/AT\s+(\d+)/);
        const tpMatch = line.match(/TP\s+([^,\n]+)/);

        if (!nameMatch) return null;

        return {
            name: nameMatch[1].trim(),
            dk: dkMatch ? dkMatch[1].trim() : null,
            at: atMatch ? parseInt(atMatch[1]) : null,
            tp: tpMatch ? tpMatch[1].trim() : null
        };
    }),
    parseStats: jest.fn(() => {
        if (!mockParser.description) return {};

        const stats = {};
        const lines = mockParser.description.split('\n');
        const statRegex = /(\w+)\s+(\d+)/g;

        for (const line of lines) {
            if (line.trim().startsWith('Angriff')) continue;

            let match;
            while ((match = statRegex.exec(line)) !== null) {
                const [_, stat, value] = match;
                stats[stat.toLowerCase()] = parseInt(value);
            }
        }

        return stats;
    })
};

// Mock parser implementations
export const mockParserNoAbility = {
    description: '',
    hasMeisterpersonAbility: jest.fn(() => false),
    parseAttacks: jest.fn(() => []),
    parseStats: jest.fn(() => {})
};

// Mock parser implementations
export const mockParserNoAttacks = {
    description: '',
    hasMeisterpersonAbility: jest.fn(() => true),
    parseAttacks: jest.fn(() => []),
    parseStats: jest.fn(() => {})
};

// Mock Roll implementation
export const mockRoll = {
    rollSequence: [],
    setRollSequence: jest.fn((sequence) => {
        mockRoll.rollSequence = [...sequence];
    }),
    getRollValue: jest.fn(() => {
        return mockRoll.rollSequence.shift() || 10; // Default to 10 if no sequence set
    })
};

// Token mock with common properties
export const mockToken = {
    actor: mockActor,
    document: {
        getFlag: jest.fn().mockReturnValue({
            defaultAttackValue: 12,
            attackName: 'Test Attack',
            attackModifier: 2,
            damageFormula: '1d6+4'
        }),
        unsetFlag: jest.fn(),
        setFlag: jest.fn()
    }
};

// Dialog mocks
export const mockDialogs = {
    NPCDialog: {
        execute: jest.fn().mockImplementation(async (token, attacks, woundEffects, parser) => {
            // Default to attack action for most tests
            const defaultResponse = { action: 'attack', attack: parser.parseAttacks()[0] };
            
            // For specific action tests, return different responses
            if (mockGame.currentAction === 'parade') {
                return { action: 'parade' };
            } else if (mockGame.currentAction === 'damage') {
                return { action: 'damage' };
            } else if (mockGame.currentAction === 'zoneWounds') {
                return { action: 'zoneWounds' };
            }
            
            return defaultResponse;
        })
    },
    AttackDialog: {
        execute: jest.fn()
    }
};

// Mock game object
export const mockGame = {
    currentAction: 'attack',
    user: {
        targets: {
            first: jest.fn().mockReturnValue(mockToken),
            size: 1
        }
    },
    modules: {
        get: jest.fn().mockReturnValue({
            api: {
                dialogs: mockDialogs,
                utils: {
                    MeisterpersonParser: jest.fn(() => mockParser)
                },
                macros: {
                    DSAAttack: {
                        execute: jest.fn().mockResolvedValue(true)
                    },
                    DSAParade: {
                        execute: jest.fn().mockResolvedValue(true)
                    },
                    DSADamage: {
                        execute: jest.fn().mockResolvedValue(true)
                    },
                    DSAZoneWounds: {
                        execute: jest.fn().mockResolvedValue(true)
                    }
                }
            }
        })
    }
};

// Canvas mock
export const mockCanvas = {
    tokens: {
        controlled: [mockToken]
    }
};

// UI mock for notifications
export const mockUI = {
    notifications: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn()
    }
};

// Chat message mock
export const mockChatMessage = {
    create: jest.fn().mockResolvedValue(true),
    getSpeaker: jest.fn().mockReturnValue({ alias: 'Test Speaker' })
};

// Meisterperson mock data
export const mockMeisterpersonData = {
    ini: 4,
    pa: 8,
    lep: 30,
    rs: 1,
    ko: 13,
    gs: 6,
    aup: 30,
    mr: 2,
    gw: 4
};

// Armor mock data
export const mockArmor = {
    kopf: 2,
    brust: 3,
    bauch: 2,
    rechterArm: 1,
    linkerArm: 1,
    rechteBein: 2,
    linkeBein: 2
};

// Reset all mocks function
export function resetMocks() {
    jest.clearAllMocks();
    
    // Reset game state
    mockGame.currentAction = 'attack';
    mockGame.user.targets.first.mockReturnValue(mockToken);
    mockGame.user.targets.size = 1;
    
    // Reset canvas state
    mockCanvas.tokens.controlled = [mockToken];
    
    // Reset token state
    mockToken.actor = { ...mockActor, effects: [] };
    
    // Reset Roll mock
    mockRoll.rollSequence = [];
    mockToken.document.getFlag.mockClear();
    mockToken.document.unsetFlag.mockClear();
    mockToken.document.setFlag.mockClear();
    
    // Reset dialog mocks
    mockDialogs.NPCDialog.execute.mockReset();
    mockDialogs.NPCDialog.execute.mockImplementation(async (token, attacks, woundEffects, parser) => {
        const defaultResponse = { action: 'attack', attack: parser.parseAttacks()[0] };
        if (mockGame.currentAction === 'parade') {
            return { action: 'parade' };
        } else if (mockGame.currentAction === 'damage') {
            return { action: 'damage' };
        } else if (mockGame.currentAction === 'zoneWounds') {
            return { action: 'zoneWounds' };
        }
        return defaultResponse;
    });
    mockDialogs.AttackDialog.execute.mockReset();
    
    // Reset module API responses
    mockGame.modules.get.mockReturnValue({
        api: {
            dialogs: mockDialogs,
            utils: {
                MeisterpersonParser: jest.fn(() => mockParser)
            },
            macros: {
                DSAAttack: {
                    execute: jest.fn().mockResolvedValue(true)
                },
                DSAParade: {
                    execute: jest.fn().mockResolvedValue(true)
                },
                DSADamage: {
                    execute: jest.fn().mockResolvedValue(true)
                },
                DSAZoneWounds: {
                    execute: jest.fn().mockResolvedValue(true)
                }
            }
        }
    });
}

// Global mock setup function
export function setupGlobalMocks() {
    global.game = mockGame;
    global.canvas = mockCanvas;
    global.ui = mockUI;
    global.ChatMessage = mockChatMessage;
    global.Roll = jest.fn().mockImplementation(() => ({
        roll: jest.fn().mockImplementation(async () => ({ total: mockRoll.getRollValue() }))
    }));
    global.Hooks = { once: jest.fn(), on: jest.fn() };
    
    // Initial mock setup
    resetMocks();
}
