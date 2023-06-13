import { JsonProperty } from "json-object-mapper";
import { ModifierValue } from "./ModifierValue";

export class ModifierClass {
  @JsonProperty({ name: "5", type: ModifierValue })
  private _modifier?: ModifierValue;

  get modifier(): ModifierValue {
    if (this._modifier == undefined)
      throw new Error("modifier property is required");
    return this._modifier;
  }
}
