import { JsonProperty } from "json-object-mapper"

export class ShipClass {
    @JsonProperty({ name: "cn" })
    count = 0
    @JsonProperty({ name: "at" })
    attack = 0
    @JsonProperty({ name: "de" })
    defense = 0

    getMp(): number {
        return (this.attack + this.defense) / 200
    }
}
