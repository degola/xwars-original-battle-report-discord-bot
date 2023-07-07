import { JsonProperty } from "json-object-mapper"
import { FleetValues } from "./FleetValues.js"

export class Fleet {
    @JsonProperty()
    fleetId = ""
    @JsonProperty({ name: "fight", type: FleetValues })
    private _fightingShips?: FleetValues
    @JsonProperty({ name: "frest", type: FleetValues })
    private _survivingShips?: FleetValues
    @JsonProperty()
    survived = false
    @JsonProperty()
    modified = false
    @JsonProperty()
    front = ""
    @JsonProperty()
    type = ""

    get fightingShips(): FleetValues {
        if (this._fightingShips == undefined) return new FleetValues()
        return this._fightingShips
    }

    get survivingShips(): FleetValues {
        if (this._survivingShips == undefined) return new FleetValues()
        return this._survivingShips
    }
}
