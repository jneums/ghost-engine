import ECS "mo:geecs";
import Components "../components";
import Vector "mo:vector";
import Time "mo:base/Time";

module {
  public func filterUpdatesForClient(components : Vector.Vector<ECS.Types.Update<Components.Component>>) : Vector.Vector<ECS.Types.Update<Components.Component>> {
    // Iterate through the players and send them the updates
    let updates = Vector.new<ECS.Types.Update<Components.Component>>();

    // Filter out 'Server Only' components, e.g. MoveTargetComponent
    label filterUpdates for (update in Vector.vals(components)) {
      switch (update) {
        case (#Insert({ component })) {
          switch (component) {
            case (#MoveTargetComponent(_)) {
              continue filterUpdates;
            };
            case (_) {};
          };
        };
        case (#Delete({ componentType })) {
          switch (componentType) {
            case ("MoveTargetComponent") {
              continue filterUpdates;
            };
            case (_) {};
          };
        };
      };
      Vector.add(updates, update);
    };
    updates;
  };

  public func filterByTimestamp(components : Vector.Vector<ECS.Types.Update<Components.Component>>, since : Time.Time) : Vector.Vector<ECS.Types.Update<Components.Component>> {
    let updates = Vector.new<ECS.Types.Update<Components.Component>>();
    for (component in Vector.vals(components)) {
      let timestamp = switch (component) {
        case (#Insert({ timestamp })) {
          timestamp;
        };
        case (#Delete({ timestamp })) {
          timestamp;
        };
      };

      if (timestamp > since) {
        Vector.add(updates, component);
      };
    };
    updates;
  };
};
