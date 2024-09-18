import Types "./Types";
import ComponentTypes "../components/Types";
import Map "mo:stable-hash-map";

module {
  func initialEntities() : Types.Entities {
    Map.new<Types.EntityId, ComponentTypes.ComponentContainer>(Map.nhash);
  };

  public let Entities = {
    new = initialEntities;
  };

  func initialSystems() : Types.Systems {
    Map.new<Text, [Types.EntityId]>(Map.thash);
  };

  public let Systems = {
    new = initialSystems;
  };
};
