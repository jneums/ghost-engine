import T "Types";
import Float "mo:base/Float";

module {
  public let Types = T;

  public func eulerToQuaternion(euler : T.Vector3) : T.Quaternion {
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

  public func normalize(vector : T.Vector3) : T.Vector3 {
    let length = Float.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    return {
      x = vector.x / length;
      y = vector.y / length;
      z = vector.z / length;
    };
  };

  public func calculateYaw(direction : T.Vector3) : Float {
    // Calculate yaw (rotation around the y-axis) based on the direction vector
    return Float.arctan2(direction.z, direction.x);
  };

  /// Euclidean distance between two points in 3D space
  public func distance(a : T.Vector3, b : T.Vector3) : Float {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let dz = a.z - b.z;
    return Float.sqrt(dx * dx + dy * dy + dz * dz);
  };
};
