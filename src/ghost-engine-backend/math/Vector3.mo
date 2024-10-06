import Float "mo:base/Float";

module {
  // Define a Vector3 type
  public type Vector3 = {
    x : Float;
    y : Float;
    z : Float;
  };

  // Function to floor each component of a Vector3
  public func floor(v : Vector3) : Vector3 {
    return {
      x = Float.floor(v.x);
      y = Float.floor(v.y);
      z = Float.floor(v.z);
    };
  };

  // Example distance function for Vector3 (if needed)
  public func distance(v1 : Vector3, v2 : Vector3) : Float {
    let dx = v1.x - v2.x;
    let dy = v1.y - v2.y;
    let dz = v1.z - v2.z;
    return Float.sqrt(dx * dx + dy * dy + dz * dz);
  };

  public func normalize(vector : Vector3) : Vector3 {
    let length = Float.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
    return {
      x = vector.x / length;
      y = vector.y / length;
      z = vector.z / length;
    };
  };

  public func calculateYaw(direction : Vector3) : Float {
    // Calculate yaw (rotation around the y-axis) based on the direction vector
    return Float.arctan2(direction.z, direction.x);
  };
};
