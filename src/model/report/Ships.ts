import { JsonProperty } from "json-object-mapper";

import { ShipList } from "./ShipList";
import { Modifier } from "./Modifier";

export class Ships {
  @JsonProperty({ name: "result", type: ShipList })
  private _survivingShips?: ShipList;
  @JsonProperty({ name: "g", type: ShipList })
  private _fightingShips?: ShipList;
  @JsonProperty({ name: "mod", type: Modifier })
  private _modifiers?: Modifier;

  get survivingShips(): ShipList {
    if (this._survivingShips == undefined) {
      throw new Error("survivingShips property is required");
    }
    return this._survivingShips;
  }

  get fightingShips(): ShipList {
    if (this._fightingShips == undefined) {
      throw new Error("fightingShips property is required");
    }
    return this._fightingShips;
  }

  get modifiers(): Modifier {
    if (this._modifiers == undefined)
      throw new Error("modifier property is required");
    return this._modifiers;
  }
}
