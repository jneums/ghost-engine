import Types "./Types";
import ContainerTypes "../container/Types";
import Map "mo:stable-hash-map";

module {
  func initialContainers() : Types.Containers {
    Map.new<Types.EntityId, ContainerTypes.Container>(Map.nhash);
  };

  public let Containers = {
    new = initialContainers;
  };

  func initialSystemEntities() : Types.SystemEntities {
    Map.new<Text, [Types.EntityId]>(Map.thash);
  };

  public let SystemEntities = {
    new = initialSystemEntities;
  };

  func initialSystemRegistry() : Types.SystemRegistry {
    Map.new<Text, Types.System>(Map.thash);
  };

  public let SystemRegistry = {
    new = initialSystemRegistry;
  };
};
