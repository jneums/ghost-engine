import Float "mo:base/Float";
import Map "mo:stable-hash-map/Map/Map";

module {
  // Define a Vector3 type
  public type Vector3 = {
    x : Float;
    y : Float;
    z : Float;
  };

  // Equal function
  public func equal(v1 : Vector3, v2 : Vector3) : Bool {
    v1.x == v2.x and v1.y == v2.y and v1.z == v2.z;
  };

  // Function to calculate the length (magnitude) of a vector
  public func length(v : Vector3) : Float {
    Float.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
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

  // Hash function for Vector3
  public func hashVector3(key : Vector3) : Nat32 {
    // Convert each float component to an Int for hashing
    let xHash = Map.hashInt(Float.toInt(key.x));
    let yHash = Map.hashInt(Float.toInt(key.y));
    let zHash = Map.hashInt(Float.toInt(key.z));

    // Combine the hashes
    return xHash ^ (yHash *% 31) ^ (zHash *% 31 *% 31);
  };

  // HashUtils for Vector3
  public let v3hash : Map.HashUtils<Vector3> = (
    hashVector3,
    equal,
    func() = { x = 0.0; y = 0.0; z = 0.0 },
  );
};
