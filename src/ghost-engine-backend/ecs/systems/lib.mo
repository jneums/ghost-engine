import T "./Types";
import { MovementSystem } "./Movement";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Map "mo:stable-hash-map/Map/Map";
import ECSTypes "../manager/Types";

module {

  public let entries = [("movement", MovementSystem)];

  public func getSystems() : T.Systems {
    HashMap.fromIter<T.SystemType, T.System>(
      Array.vals(entries),
      entries.size(),
      Text.equal,
      Text.hash,
    );
  };

  public func update(ctx : ECSTypes.Context, ecs : ECSTypes.API, deltaTime : Time.Time) : () {
    let systems = getSystems();

    for ((systemId, entities) in Map.entries(ctx.systems)) {
      switch (systems.get(systemId)) {
        case (?exists) { exists.update(ctx, ecs, entities, deltaTime) };
        case (null) { return };
      };
    };
  };

  public let API : T.API = {
    update = update;
  };

  public let Types = T;
};
