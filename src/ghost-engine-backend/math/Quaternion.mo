import Vector3 "Vector3";
import Float "mo:base/Float";

module {
  public type Quaternion = {
    x : Float;
    y : Float;
    z : Float;
    w : Float;
  };

  public func eulerToQuaternion(euler : Vector3.Vector3) : Quaternion {
    let c1 = Float.cos(euler.y / 2.0);
    let c2 = Float.cos(euler.x / 2.0);
    let c3 = Float.cos(euler.z / 2.0);
    let s1 = Float.sin(euler.y / 2.0);
    let s2 = Float.sin(euler.x / 2.0);
    let s3 = Float.sin(euler.z / 2.0);

    return {
      x = s1 * s2 * c3 + c1 * c2 * s3;
      y = s1 * c2 * c3 + c1 * s2 * s3;
      z = c1 * s2 * c3 - s1 * c2 * s3;
      w = c1 * c2 * c3 - s1 * s2 * s3;
    };
  };
};