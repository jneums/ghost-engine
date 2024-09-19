import Types "./Types";
import ContainerTypes "../container/Types";
import Map "mo:stable-hash-map";
import Vector "mo:vector";

module {
  func initialContainers() : Types.Containers {
    Map.new<Types.EntityId, ContainerTypes.Container>(Map.thash);
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

  func initialUpdated() : Types.Updated {
    Vector.new<Types.Update>();
  };

  public let Updated = {
    new = initialUpdated;
  };
};
