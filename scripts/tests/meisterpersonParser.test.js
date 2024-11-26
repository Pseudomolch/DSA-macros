// @jest/environment jsdom
import { jest } from '@jest/globals';
import { MeisterpersonParser } from '../utils/meisterpersonParser.js';

describe('MeisterpersonParser', () => {
    let mockActor;
    const sampleAbilityText = `
        INI 4, PA 8, LeP 30, RS 1, KO 13
        GS 6, AuP 30, MR 2, GW 4
        Angriff Test, DK H, AT 12, TP 1W+4
        Angriff Test Neu, DK S, AT 11, TP 12
    `;

    beforeEach(() => {
        mockActor = {
            items: [{
                type: "specialAbility",
                name: "Meisterperson",
                system: {
                    description: sampleAbilityText
                }
            }]
        };
    });

    test('hasMeisterpersonAbility() should return true when ability exists', () => {
        const parser = new MeisterpersonParser(mockActor);
        expect(parser.hasMeisterpersonAbility()).toBe(true);
    });

    test('hasMeisterpersonAbility() should return false when ability does not exist', () => {
        mockActor.items = [];
        const parser = new MeisterpersonParser(mockActor);
        expect(parser.hasMeisterpersonAbility()).toBe(false);
    });

    test('parseAttacks() should correctly parse multiple attack lines', () => {
        const parser = new MeisterpersonParser(mockActor);
        const attacks = parser.parseAttacks();

        expect(attacks).toHaveLength(2);
        expect(attacks[0]).toEqual({
            name: 'Test',
            dk: 'H',
            at: 12,
            tp: '1W+4'
        });
        expect(attacks[1]).toEqual({
            name: 'Test Neu',
            dk: 'S',
            at: 11,
            tp: '12'
        });
    });

    test('getArmorValue() should return correct RS value', () => {
        const parser = new MeisterpersonParser(mockActor);
        expect(parser.getArmorValue()).toBe(1);
    });

    test('getArmorValues() should return uniform RS values for all locations', () => {
        const parser = new MeisterpersonParser(mockActor);
        const armorValues = parser.getArmorValues();
        
        expect(armorValues).toEqual({
            kopf: 1,
            brust: 1,
            arme: 1,
            bauch: 1,
            beine: 1
        });
    });

    test('parseStats() should correctly parse all stat values', () => {
        const parser = new MeisterpersonParser(mockActor);
        const stats = parser.parseStats();

        expect(stats).toEqual({
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
    });
});
