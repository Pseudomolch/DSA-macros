// Mock data for DSA Macros tests

// Base actor mock with common properties
export const mockActor = {
    system: {
        base: {
            resources: {
                vitality: { value: 30 },
                astralenergiePoints: { value: 30 }
            },
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
    },
    items: [],
    update: jest.fn()
};

// Token mock with common properties
export const mockToken = {
    actor: mockActor,
    document: {
        setFlag: jest.fn(),
        unsetFlag: jest.fn()
    },
    name: 'Test Token'
};

// Game mock with common properties
export const mockGame = {
    user: {
        targets: {
            first: jest.fn().mockReturnValue(mockToken),
            size: 1
        }
    },
    macros: {
        getName: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(true)
        })
    },
    modules: {
        get: jest.fn().mockReturnValue({
            api: {
                dialogs: {
                    DamageDialog: {
                        execute: jest.fn().mockResolvedValue({
                            damageFormula: '1d6+4',
                            kritisch: true,
                            wuchtschlag: 2
                        })
                    },
                    AttackDialog: {
                        execute: jest.fn()
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

// Chat message mock
export const mockChatMessage = {
    create: jest.fn().mockResolvedValue(true),
    getSpeaker: jest.fn().mockReturnValue({ alias: 'Test Speaker' })
};

// Roll mock
export const mockRoll = jest.fn().mockImplementation((formula) => ({
    roll: jest.fn().mockResolvedValue({
        total: 10,
        dice: [{ results: [{ result: 10 }] }]
    })
}));

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

// UI mock
export const mockUI = {
    notifications: {
        error: jest.fn(),
        warn: jest.fn()
    }
};

// Helper function to setup all global mocks
export function setupGlobalMocks() {
    global.game = mockGame;
    global.canvas = mockCanvas;
    global.ChatMessage = mockChatMessage;
    global.Roll = mockRoll;
    global.Hooks = { once: jest.fn(), on: jest.fn() };
    global.ui = mockUI;
}

// Helper function to reset all mocks
export function resetMocks() {
    jest.clearAllMocks();
    mockGame.user.targets.first.mockReturnValue(mockToken);
    mockGame.user.targets.size = 1;
    mockCanvas.tokens.controlled = [mockToken];
}
