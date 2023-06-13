import { JsonProperty } from "json-object-mapper"
import { LootInfo } from "./LootInfo"
import { LootValues } from "./LootValues"

export class Loot {
    @JsonProperty({ name: "info", type: LootInfo })
    private _info?: LootInfo
    @JsonProperty({ type: LootValues })
    values?: LootValues

    get info(): LootInfo {
        if (this._info == undefined) {
            throw new Error("info property is required")
        }
        return this._info
    }
}
