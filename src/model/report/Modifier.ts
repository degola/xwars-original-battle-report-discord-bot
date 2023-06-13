import { JsonProperty } from "json-object-mapper"
import { ModifierClass } from "./ModifierClass"

export class Modifier {
    @JsonProperty({ name: "shields", type: ModifierClass })
    private _shields?: ModifierClass
    @JsonProperty({ name: "mines", type: ModifierClass })
    private _mines?: ModifierClass

    get shields(): ModifierClass {
        if (this._shields == undefined)
            throw new Error("shields property is required")
        return this._shields
    }

    get mines(): ModifierClass {
        if (this._mines == undefined)
            throw new Error("mines property is required")
        return this._mines
    }
}
