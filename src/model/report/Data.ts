import { JsonProperty } from "json-object-mapper"
import { Parties } from "./Parties.js"
import { Loot } from "./Loot.js"
import { MpType, PartyEnum, ShipClassEnum } from "./Enums.js"
import { Ships } from "./Ships.js"

export class Data {
    @JsonProperty({ name: "time" })
    private _time?: number
    @JsonProperty({ name: "parties", type: Parties })
    private _parties?: Parties
    @JsonProperty({ name: "ships", type: Ships })
    private _ships?: Ships
    @JsonProperty({ name: "loot", type: Loot })
    private _loot?: Loot

    get time(): number {
        if (this._time == undefined) {
            throw new Error("time property is required")
        }
        return this._time
    }

    get parties(): Parties {
        if (this._parties == undefined) {
            throw new Error("parties property is required")
        }
        return this._parties
    }

    get ships(): Ships {
        if (this._ships == undefined) {
            throw new Error("ships property is required")
        }
        return this._ships
    }

    get loot(): Loot {
        if (this._loot == undefined) {
            throw new Error("loot property is required")
        }
        return this._loot
    }

    getMp(type: MpType, party: PartyEnum, shipClass?: ShipClassEnum): number {
        switch (type) {
            case MpType.fighting:
                return this.ships.fightingShips.getMp(party, shipClass)
                break
            case MpType.surviving:
                return this.ships.survivingShips.getMp(party, shipClass)
                break
            case MpType.destroyed:
                return (
                    this.ships.fightingShips.getMp(party, shipClass) -
                    this.ships.survivingShips.getMp(party, shipClass)
                )
                break
        }
    }

    getAttack(
        type: MpType,
        party: PartyEnum,
        shipClass?: ShipClassEnum
    ): number {
        switch (type) {
            case MpType.fighting:
                return this.ships.fightingShips.getAttack(party, shipClass)
                break
            case MpType.surviving:
                return this.ships.survivingShips.getAttack(party, shipClass)
                break
            case MpType.destroyed:
                return (
                    this.ships.fightingShips.getAttack(party, shipClass) -
                    this.ships.survivingShips.getAttack(party, shipClass)
                )
                break
        }
    }
    getDefense(
        type: MpType,
        party: PartyEnum,
        shipClass?: ShipClassEnum
    ): number {
        switch (type) {
            case MpType.fighting:
                return this.ships.fightingShips.getDefense(party, shipClass)
                break
            case MpType.surviving:
                return this.ships.survivingShips.getDefense(party, shipClass)
                break
            case MpType.destroyed:
                return (
                    this.ships.fightingShips.getDefense(party, shipClass) -
                    this.ships.survivingShips.getDefense(party, shipClass)
                )
                break
        }
    }
    getCount(
        type: MpType,
        party: PartyEnum,
        shipClass?: ShipClassEnum
    ): number {
        switch (type) {
            case MpType.fighting:
                return this.ships.fightingShips.getCount(party, shipClass)
                break
            case MpType.surviving:
                return this.ships.survivingShips.getCount(party, shipClass)
                break
            case MpType.destroyed:
                return (
                    this.ships.fightingShips.getCount(party, shipClass) -
                    this.ships.survivingShips.getCount(party, shipClass)
                )
                break
        }
    }
}
