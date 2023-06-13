import { JsonProperty } from "json-object-mapper";

import { ShipList } from "./ShipList";

export class Ships {
  @JsonProperty({ name: "result", type: ShipList })
  private _survivingShips?: ShipList;
  @JsonProperty({ name: "g", type: ShipList })
  private _fightingShips?: ShipList;

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
}
