import { JsonProperty } from "json-object-mapper"

export class ModifierValue {
    @JsonProperty({ name: "val" })
    value = 0
}
