import { JsonProperty } from "json-object-mapper";

export class Planet {
  @JsonProperty()
  position = "";
  @JsonProperty()
  name = "";
  @JsonProperty()
  alliance = "";
  @JsonProperty()
  user_alias = "";
}
