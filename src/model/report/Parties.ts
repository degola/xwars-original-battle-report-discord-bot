import { JsonProperty } from "json-object-mapper";
import { Party } from "./Party";

export class Parties {
  @JsonProperty({ name: "defender", type: Party })
  private _defender?: Party;
  @JsonProperty({ name: "attacker", type: Party })
  private _attacker?: Party;

  get defender(): Party {
    if (this._defender == undefined) {
      throw new Error("defender property is required");
    }
    return this._defender;
  }

  get attacker(): Party {
    if (this._attacker == undefined) {
      throw new Error("attacker property is required");
    }
    return this._attacker;
  }
}
