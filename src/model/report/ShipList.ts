import { JsonProperty } from "json-object-mapper"
import { ShipListParty } from "./ShipListParty.js"
import { PartyEnum, ShipClassEnum } from "./Enums.js"

export class ShipList {
    @JsonProperty({ name: "att", type: ShipListParty })
    attacker?: ShipListParty
    @JsonProperty({ name: "def", type: ShipListParty })
    defender?: ShipListParty

    getMp(party: PartyEnum, shipClass?: ShipClassEnum) {
        switch (party) {
            case PartyEnum.attacker:
                if (this.attacker == undefined) return 0
                return this.attacker.getMp(shipClass)
                break
            case PartyEnum.defender:
                if (this.defender == undefined) return 0
                return this.defender.getMp(shipClass)
                break
        }
    }

    getAttack(party: PartyEnum, shipClass?: ShipClassEnum) {
        switch (party) {
            case PartyEnum.attacker:
                if (this.attacker == undefined) return 0
                return this.attacker.getAttack(shipClass)
                break
            case PartyEnum.defender:
                if (this.defender == undefined) return 0
                return this.defender.getAttack(shipClass)
                break
        }
    }

    getDefense(party: PartyEnum, shipClass?: ShipClassEnum) {
        switch (party) {
            case PartyEnum.attacker:
                if (this.attacker == undefined) return 0
                return this.attacker.getDefense(shipClass)
                break
            case PartyEnum.defender:
                if (this.defender == undefined) return 0
                return this.defender.getDefense(shipClass)
                break
        }
    }

    getCount(party: PartyEnum, shipClass?: ShipClassEnum) {
        switch (party) {
            case PartyEnum.attacker:
                if (this.attacker == undefined) return 0
                return this.attacker.getCount(shipClass)
                break
            case PartyEnum.defender:
                if (this.defender == undefined) return 0
                return this.defender.getCount(shipClass)
                break
        }
    }
}
