import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Math "mo:noise/Math";
import Const "Const";

module {
  // Define a variant type to represent either a Spline or a FixedSpline
  public type SplineValue = {
    #Spline : Spline;
    #Fixed : FixedSpline;
  };

  // Define the Spline type
  public type Spline = {
    length : Nat;
    splineType : Nat;
    loc : [Float];
    der : [Float];
    value : [SplineValue];
  };

  // Define the FixedSpline type
  public type FixedSpline = {
    length : Nat;
    value : Float;
  };

  // Define the SplineStack type
  public type SplineStack = {
    length : Nat;
    stack : [Spline];
    fixedStack : [FixedSpline];
  };

  /// Calculates an offset value based on weirdness and continentalness.
  ///
  /// Arguments:
  /// - `weirdness`: The weirdness factor.
  /// - `continentalness`: The continentalness factor.
  ///
  /// Returns:
  /// A calculated offset value.
  public func calculateOffset(weirdness : Float, continentalness : Float) : Float {
    let f0 = 1.0 - (1.0 - continentalness) * 0.5;
    let f1 = 0.5 * (1.0 - continentalness);
    let f2 = (weirdness + 1.17) * 0.46082947;
    let offset = f2 * f0 - f1;

    if (weirdness < -0.7) {
      return if (offset > -0.2222) offset else -0.2222;
    };

    return if (offset > 0) offset else 0;
  };

  /// Adds a new value to a spline at a specified location with a given derivative.
  ///
  /// Arguments:
  /// - `spline`: The spline to which the value is added.
  /// - `loc`: The location of the new value.
  /// - `val`: The value to add.
  /// - `der`: The derivative at the location.
  ///
  /// Returns:
  /// A new spline with the added value.
  public func addValueToSpline(spline : Spline, loc : Float, val : SplineValue, der : Float) : Spline {
    let newSpline = {
      length = spline.length + 1;
      splineType = spline.splineType;
      loc = Array.append(spline.loc, [loc]);
      der = Array.append(spline.der, [der]);
      value = Array.append(spline.value, [val]);
    };
    return newSpline;
  };

  /// Evaluates a spline at a given set of values.
  ///
  /// Arguments:
  /// - `vals`: The input values for evaluation.
  /// - `sp`: The spline to evaluate.
  ///
  /// Returns:
  /// The evaluated spline value.
  public func evaluateSpline(vals : [Float], sp : Spline) : Float {
    assert (sp.length > 0 and sp.length < 12);

    if (sp.length == 1) {
      switch (sp.value[0]) {
        case (#Fixed(fixed)) { return fixed.value };
        case (#Spline(spline)) { return evaluateSpline(vals, spline) };
      };
    };

    let f = vals[sp.splineType];
    var i = 0;

    while (i < sp.length and sp.loc[i] < f) {
      i += 1;
    };

    if (i == 0 or i == sp.length) {
      if (i > 0) i -= 1;
      let v = switch (sp.value[i]) {
        case (#Fixed(fixed)) { fixed.value };
        case (#Spline(spline)) { evaluateSpline(vals, spline) };
      };
      return v + sp.der[i] * (f - sp.loc[i]);
    };

    let sp1 = sp.value[i - 1];
    let sp2 = sp.value[i];
    let g = sp.loc[i - 1];
    let h = sp.loc[i];
    let k = (f - g) / (h - g);
    let l = sp.der[i - 1];
    let m = sp.der[i];

    let n = switch (sp1) {
      case (#Fixed(fixed)) { fixed.value };
      case (#Spline(spline)) { evaluateSpline(vals, spline) };
    };
    let o = switch (sp2) {
      case (#Fixed(fixed)) { fixed.value };
      case (#Spline(spline)) { evaluateSpline(vals, spline) };
    };
    let p = l * (h - g) - (o - n);
    let q = -m * (h - g) + (o - n);

    return Math.lerp(k, n, o) + k * (1.0 - k) * Math.lerp(k, p, q);
  };

  /// Creates a fixed spline with a specified value.
  ///
  /// Arguments:
  /// - `value`: The value for the fixed spline.
  ///
  /// Returns:
  /// A new fixed spline.
  public func createFixedSpline(value : Float) : SplineValue {
    #Fixed({
      length = 1;
      value = value;
    });
  };

  /// Creates a flat offset spline based on input offsets.
  ///
  /// Arguments:
  /// - `offsets`: The offsets for the spline.
  ///
  /// Returns:
  /// A new spline.
  public func createFlatOffsetSpline(offsets : [Float]) : Spline {
    let o = offsets;
    let sp = {
      length = 0;
      splineType = Const.Land.PeaksAndValleys;
      loc = [];
      der = [];
      value = [];
    };

    var l = 0.5 * (o[1] - o[0]);

    if (l < o[5]) {
      l := o[5];
    };

    let m = 5 * (o[2] - o[1]);

    var updatedSp = addValueToSpline(sp, -1.0, createFixedSpline(o[0]), l);
    updatedSp := addValueToSpline(updatedSp, -0.4, createFixedSpline(o[1]), if (l < m) l else m);
    updatedSp := addValueToSpline(updatedSp, 0.0, createFixedSpline(o[2]), m);
    updatedSp := addValueToSpline(updatedSp, 0.4, createFixedSpline(o[3]), 2 * (o[3] - o[2]));
    updatedSp := addValueToSpline(updatedSp, 1.0, createFixedSpline(o[4]), 0.7 * (o[4] - o[3]));

    return updatedSp;
  };

  /// Creates a spline with specific parameters for terrain generation.
  ///
  /// Arguments:
  /// - `continentalness`: The continentalness factor.
  /// - `depth`: The depth factor.
  ///
  /// Returns:
  /// A new spline.
  public func createTerrainSpline(continentalness : Float, depth : Nat) : Spline {
    let sp : Spline = {
      length = 0;
      splineType = Const.Land.PeaksAndValleys;
      loc = [];
      der = [];
      value = [];
    };

    let i = calculateOffset(-1.0, continentalness);
    let k = calculateOffset(1.0, continentalness);
    var l = 1.0 - (1.0 - continentalness) * 0.5;
    var u = 0.5 * (1.0 - continentalness);
    l := u / (0.46082947 * l) - 1.17;

    if (-0.65 < l and l < 1.0) {
      u := calculateOffset(-0.65, continentalness);
      let p = calculateOffset(-0.75, continentalness);
      let q = (p - i) * 4.0;
      let r = calculateOffset(l, continentalness);
      let s = (k - r) / (1.0 - l);

      var updatedSp = addValueToSpline(sp, -1.0, createFixedSpline(i), q);
      updatedSp := addValueToSpline(updatedSp, -0.75, createFixedSpline(p), 0);
      updatedSp := addValueToSpline(updatedSp, -0.65, createFixedSpline(u), 0);
      updatedSp := addValueToSpline(updatedSp, l - 0.01, createFixedSpline(r), 0);
      updatedSp := addValueToSpline(updatedSp, l, createFixedSpline(r), s);
      updatedSp := addValueToSpline(updatedSp, 1.0, createFixedSpline(k), s);

      return updatedSp;
    };

    u := (k - i) * 0.5;
    var updatedSp = sp;
    if (depth > 0) {
      updatedSp := addValueToSpline(sp, -1.0, createFixedSpline(if (i > 0.2) i else 0.2), 0);
      updatedSp := addValueToSpline(updatedSp, 0.0, createFixedSpline(Math.lerp(0.5, i, k)), u);
    } else {
      updatedSp := addValueToSpline(sp, -1.0, createFixedSpline(i), u);
    };

    updatedSp := addValueToSpline(updatedSp, 1.0, createFixedSpline(k), u);

    return updatedSp;
  };

  /// Creates a land spline for terrain generation.
  ///
  /// Arguments:
  /// - `offsets`: The offsets for the spline.
  /// - `depth`: The depth factor.
  ///
  /// Returns:
  /// A new spline.
  public func createLandSpline(offsets : [Float], depth : Nat) : Spline {
    let o = offsets;

    let sp1 = createTerrainSpline(Math.lerp(o[3], 0.6, 1.5), depth);
    let sp2 = createTerrainSpline(Math.lerp(o[3], 0.6, 1.0), depth);
    let sp3 = createTerrainSpline(o[3], depth);

    let ih = 0.5 * o[3];

    let sp4 = createFlatOffsetSpline([o[0] - 0.15, ih, ih, ih, o[3] * 0.6, 0.5]);
    let sp5 = createFlatOffsetSpline([o[0], o[4] * o[3], o[1] * o[3], ih, o[3] * 0.6, 0.5]);
    let sp6 = createFlatOffsetSpline([o[0], o[4], o[4], o[1], o[2], 0.5]);
    let sp7 = createFlatOffsetSpline([o[0], o[4], o[4], o[1], o[2], 0.5]);

    let sp8 = {
      length = 0;
      splineType = Const.Land.PeaksAndValleys;
      loc = [];
      der = [];
      value = [];
    };

    var updatedSp8 = addValueToSpline(sp8, -1.0, createFixedSpline(o[0]), 0.0);
    updatedSp8 := addValueToSpline(updatedSp8, -0.4, #Spline(sp6), 0.0);
    updatedSp8 := addValueToSpline(updatedSp8, 0.0, createFixedSpline(o[2] + 0.07), 0.0);

    let sp9 = createFlatOffsetSpline([-0.02, o[5], o[5], o[1], o[2], 0.0]);
    let sp = {
      length = 0;
      splineType = Const.Land.Erosion;
      loc = [];
      der = [];
      value = [];
    };

    var updatedSp = addValueToSpline(sp, -0.85, #Spline(sp1), 0.0);
    updatedSp := addValueToSpline(updatedSp, -0.7, #Spline(sp2), 0.0);
    updatedSp := addValueToSpline(updatedSp, -0.4, #Spline(sp3), 0.0);
    updatedSp := addValueToSpline(updatedSp, -0.35, #Spline(sp4), 0.0);
    updatedSp := addValueToSpline(updatedSp, -0.1, #Spline(sp5), 0.0);
    updatedSp := addValueToSpline(updatedSp, 0.2, #Spline(sp6), 0.0);

    if (depth > 0) {
      updatedSp := addValueToSpline(updatedSp, 0.4, #Spline(sp7), 0.0);
      updatedSp := addValueToSpline(updatedSp, 0.45, #Spline(updatedSp8), 0.0);
      updatedSp := addValueToSpline(updatedSp, 0.55, #Spline(updatedSp8), 0.0);
      updatedSp := addValueToSpline(updatedSp, 0.58, #Spline(sp7), 0.0);
    };

    updatedSp := addValueToSpline(updatedSp, 0.7, #Spline(sp9), 0.0);

    return updatedSp;
  };

  /// Initializes a spline for terrain noise.
  ///
  /// Returns:
  /// The initialized spline value.
  public func initSpline() : Spline {
    // Create initial spline
    var spline = {
      length = 0;
      splineType = Const.Land.PeaksAndValleys;
      loc = [];
      der = [];
      value = [];
    };

    // Create land splines
    let sp1 = createLandSpline([-0.15, 0.0, 0.0, 0.1, 0.0, -0.03], 0);
    let sp2 = createLandSpline([-0.1, 0.03, 0.1, 0.1, 0.01, -0.03], 0);
    let sp3 = createLandSpline([-0.1, 0.03, 0.1, 0.7, 0.01, -0.03], 1);
    let sp4 = createLandSpline([-0.05, 0.03, 0.1, 1.0, 0.01, 0.01], 1);

    // Add values to the spline
    var updatedSpline = addValueToSpline(spline, -1.1, createFixedSpline(0.044), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, -1.02, createFixedSpline(-0.2222), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, -0.51, createFixedSpline(-0.2222), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, -0.44, createFixedSpline(-0.12), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, -0.18, createFixedSpline(-0.12), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, -0.16, #Spline(sp1), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, -0.15, #Spline(sp1), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, -0.1, #Spline(sp2), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, 0.25, #Spline(sp3), 0.0);
    updatedSpline := addValueToSpline(updatedSpline, 1.0, #Spline(sp4), 0.0);

    // Return the updated spline as a SplineValue
    updatedSpline;
  };
};
