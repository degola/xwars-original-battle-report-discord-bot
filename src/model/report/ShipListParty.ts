import { JsonProperty } from "json-object-mapper";
import { ShipClass } from "./ShipClass";
import { ShipClassEnum } from "./Enums";

export class ShipListParty {
  @JsonProperty({ name: "4", type: ShipClass })
  tactical?: ShipClass;
  @JsonProperty({ name: "1", type: ShipClass })
  light?: ShipClass;
  @JsonProperty({ name: "2", type: ShipClass })
  medium?: ShipClass;
  @JsonProperty({ name: "3", type: ShipClass })
  heavy?: ShipClass;
  @JsonProperty({ name: "5", type: ShipClass })
  orbital?: ShipClass;

  getMp(shipClass?: ShipClassEnum): number {
    if (shipClass == undefined) {
      return (
        this.getMp(ShipClassEnum.tactical) +
        this.getMp(ShipClassEnum.light) +
        this.getMp(ShipClassEnum.medium) +
        this.getMp(ShipClassEnum.heavy) +
        this.getMp(ShipClassEnum.orbital)
      );
    }
    switch (shipClass) {
      case ShipClassEnum.tactical:
        if (this.tactical == undefined) return 0;
        return this.tactical.getMp();
        break;
      case ShipClassEnum.light:
        if (this.light == undefined) return 0;
        return this.light.getMp();
        break;
      case ShipClassEnum.medium:
        if (this.medium == undefined) return 0;
        return this.medium.getMp();
        break;
      case ShipClassEnum.heavy:
        if (this.heavy == undefined) return 0;
        return this.heavy.getMp();
        break;
      case ShipClassEnum.orbital:
        if (this.orbital == undefined) return 0;
        return this.orbital.getMp();
        break;
    }
  }
  getAttack(shipClass?: ShipClassEnum): number {
    if (shipClass == null) {
      return (
        this.getAttack(ShipClassEnum.tactical) +
        this.getAttack(ShipClassEnum.light) +
        this.getAttack(ShipClassEnum.medium) +
        this.getAttack(ShipClassEnum.heavy) +
        this.getAttack(ShipClassEnum.orbital)
      );
    }
    switch (shipClass) {
      case ShipClassEnum.tactical:
        if (this.tactical == undefined) return 0;
        return this.tactical.attack;
        break;
      case ShipClassEnum.light:
        if (this.light == undefined) return 0;
        return this.light.attack;
        break;
      case ShipClassEnum.medium:
        if (this.medium == undefined) return 0;
        return this.medium.attack;
        break;
      case ShipClassEnum.heavy:
        if (this.heavy == undefined) return 0;
        return this.heavy.attack;
        break;
      case ShipClassEnum.orbital:
        if (this.orbital == undefined) return 0;
        return this.orbital.attack;
        break;
    }
  }
  getDefense(shipClass?: ShipClassEnum): number {
    if (shipClass == null) {
      return (
        this.getDefense(ShipClassEnum.tactical) +
        this.getDefense(ShipClassEnum.light) +
        this.getDefense(ShipClassEnum.medium) +
        this.getDefense(ShipClassEnum.heavy) +
        this.getDefense(ShipClassEnum.orbital)
      );
    }
    switch (shipClass) {
      case ShipClassEnum.tactical:
        if (this.tactical == undefined) return 0;
        return this.tactical.defense;
        break;
      case ShipClassEnum.light:
        if (this.light == undefined) return 0;
        return this.light.defense;
        break;
      case ShipClassEnum.medium:
        if (this.medium == undefined) return 0;
        return this.medium.defense;
        break;
      case ShipClassEnum.heavy:
        if (this.heavy == undefined) return 0;
        return this.heavy.defense;
        break;
      case ShipClassEnum.orbital:
        if (this.orbital == undefined) return 0;
        return this.orbital.defense;
        break;
    }
  }
  getCount(shipClass?: ShipClassEnum): number {
    if (shipClass == null) {
      return (
        this.getCount(ShipClassEnum.tactical) +
        this.getCount(ShipClassEnum.light) +
        this.getCount(ShipClassEnum.medium) +
        this.getCount(ShipClassEnum.heavy) +
        this.getCount(ShipClassEnum.orbital)
      );
    }
    switch (shipClass) {
      case ShipClassEnum.tactical:
        if (this.tactical == undefined) return 0;
        return this.tactical.count;
        break;
      case ShipClassEnum.light:
        if (this.light == undefined) return 0;
        return this.light.count;
        break;
      case ShipClassEnum.medium:
        if (this.medium == undefined) return 0;
        return this.medium.count;
        break;
      case ShipClassEnum.heavy:
        if (this.heavy == undefined) return 0;
        return this.heavy.count;
        break;
      case ShipClassEnum.orbital:
        if (this.orbital == undefined) return 0;
        return this.orbital.count;
        break;
    }
  }
}
