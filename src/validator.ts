/**
 * Provides validation for json data in batte reports.
 */

import _Ajv from "ajv"
const Ajv = _Ajv as unknown as typeof _Ajv.default

const ajv = new Ajv({
    removeAdditional: "all",
    useDefaults: "empty",
    coerceTypes: true,
})

const dataSchema = {
    $defs: {
        planet: {
            type: "object",
            required: ["position", "name", "alliance", "user_alias"],
            properties: {
                position: { type: "string" },
                name: { type: "string" },
                alliance: { type: "string" },
                user_alias: { type: "string" },
            },
        },
        party: {
            type: "object",
            required: ["planet"],
            properties: {
                planet: { $ref: "#/$defs/planet" },
            },
        },
        parties: {
            type: "object",
            required: ["defender", "attacker"],
            properties: {
                defender: { $ref: "#/$defs/party" },
                attacker: { $ref: "#/$defs/party" },
            },
        },
        shipClass: {
            type: "object",
            required: ["cn", "at", "de"],
            properties: {
                cn: { type: "number", default: 0 },
                at: { type: "number", default: 0 },
                de: { type: "number", default: 0 },
            },
        },
        shipListParty: {
            type: "object",
            required: ["0", "1", "2", "3", "4", "5"],
            properties: {
                0: {
                    $ref: "#/$defs/shipClass",
                    default: {},
                },
                1: {
                    $ref: "#/$defs/shipClass",
                    default: {},
                },
                2: {
                    $ref: "#/$defs/shipClass",
                    default: {},
                },
                3: {
                    $ref: "#/$defs/shipClass",
                    default: {},
                },
                4: {
                    $ref: "#/$defs/shipClass",
                    default: {},
                },
                5: {
                    $ref: "#/$defs/shipClass",
                    default: {},
                },
            },
        },
        shipList: {
            type: "object",
            required: ["att", "def"],
            properties: {
                att: {
                    $ref: "#/$defs/shipListParty",
                    default: {},
                },
                def: {
                    $ref: "#/$defs/shipListParty",
                    default: {},
                },
            },
        },
        modifierValue: {
            type: "object",
            required: ["val"],
            properties: { val: { type: "number", default: 0 } },
        },
        modifierClass: {
            type: "object",
            required: ["5"],
            properties: {
                5: { $ref: "#/$defs/modifierValue", default: {} },
            },
        },
        modifiers: {
            type: "object",
            required: ["shields", "mines"],
            properties: {
                shields: { $ref: "#/$defs/modifierClass", default: {} },
                mines: { $ref: "#/$defs/modifierClass", default: {} },
            },
        },
        ships: {
            type: "object",
            required: ["result", "g", "mod"],
            properties: {
                result: { $ref: "#/$defs/shipList", default: {} },
                g: { $ref: "#/$defs/shipList", default: {} },
                mod: {
                    $ref: "#/$defs/modifiers",
                    default: {},
                },
            },
        },
        lootValues: {
            type: "object",
            required: ["0", "1", "2", "3", "4", "5"],
            properties: {
                0: { type: "number", default: 0 },
                1: { type: "number", default: 0 },
                2: { type: "number", default: 0 },
                3: { type: "number", default: 0 },
                4: { type: "number", default: 0 },
                5: { type: "number", default: 0 },
            },
        },
        lootInfo: {
            type: "object",
            required: ["atter_couldloot"],
            properties: {
                atter_couldloot: { type: "boolean" },
            },
        },
        loot: {
            type: "object",
            required: ["info", "values"],
            properties: {
                info: { $ref: "#/$defs/lootInfo" },
                values: {
                    $ref: "#/$defs/lootValues",
                    default: {},
                },
            },
        },
    },
    type: "object",
    required: ["time", "parties", "ships", "loot"],
    properties: {
        time: { type: "number" },
        parties: { $ref: "#/$defs/parties" },
        ships: { $ref: "#/$defs/ships" },
        loot: { $ref: "#/$defs/loot" },
    },
}

const fleetDataSchema = {
    type: "array",
    items: {
        type: "object",
        required: [
            "fleetId",
            "fight",
            "org",
            "frest",
            "survived",
            "modified",
            "front",
            "type",
        ],
        properties: {
            fleetId: { type: "string" },
            fight: { $ref: "#/$defs/fleet" },
            org: { $ref: "#/$defs/fleet" },
            frest: { $ref: "#/$defs/fleet" },
            survived: { type: "boolean" },
            modified: { type: "boolean" },
            front: { type: "string" },
            type: { type: "string" },
        },
    },
    $defs: {
        fleet: {
            type: "object",
            required: ["at", "de", "cn"],
            properties: {
                at: { type: "number" },
                de: { type: "number" },
                cn: { type: "number" },
            },
        },
    },
}

/**
 * Validates JSON from battle report
 */
export const validateData = ajv.compile(dataSchema)

/**
 * Validates JSON2 from battle report
 */
export const validateFleetData = ajv.compile(fleetDataSchema)
