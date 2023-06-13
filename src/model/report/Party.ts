import { JsonProperty } from "json-object-mapper";
import { Planet } from "./Planet";

export class Party {
  @JsonProperty({ name:"planet", type: Planet })
  private _planet?: Planet;

  get planet(): Planet {
    if (this._planet == undefined) {
      throw new Error("planet property is required");
    }
    return this._planet;
  }
}
