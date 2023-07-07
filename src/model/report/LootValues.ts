import { JsonProperty } from "json-object-mapper"

export class LootValues {
    @JsonProperty({ name: "0" })
    pigiron = 0
    @JsonProperty({ name: "1" })
    crystal = 0
    @JsonProperty({ name: "2" })
    frubin = 0
    @JsonProperty({ name: "3" })
    orizin = 0
    @JsonProperty({ name: "4" })
    frurozin = 0
    @JsonProperty({ name: "5" })
    gold = 0

    values(): number[] {
        return [
            this.pigiron,
            this.crystal,
            this.frubin,
            this.orizin,
            this.frurozin,
            this.gold,
        ]
    }
}
