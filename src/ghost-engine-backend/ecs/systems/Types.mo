import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import ECSTypes "../manager/Types";

module {

  public type EntityId = Nat;
  public type ComponentType = Text;

  public type SystemType = Text;
  public type System = {
    systemType : SystemType;
    components : [ComponentType];
    update : (ECSTypes.Context, ECSTypes.API, [EntityId], Time.Time) -> ();
  };

  public type Systems = HashMap.HashMap<SystemType, System>;

  public type API = {
    update : (ECSTypes.Context, ECSTypes.API, Time.Time) -> ();
  };
};
