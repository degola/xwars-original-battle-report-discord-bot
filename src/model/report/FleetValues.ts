import { JsonProperty } from "json-object-mapper";

export class FleetValues {
  @JsonProperty({ name: "at" })
  private _attack = 0;
  @JsonProperty({ name: "de" })
  defense = 0;
  @JsonProperty({ name: "cn" })
  count = 0;

  /**
   * Ugly workaround. If the fleet is completely destroyed an
   * empty string will be injected into this object and overrides
   * _attack with string.at()
   */
  get attack(): number {
    if (typeof this._attack == "function") return 0;
    return this._attack;
  }
}
