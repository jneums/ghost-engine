import { test; suite } "mo:test";
import Debug "mo:base/Debug";

import Splines "../../utils/Splines";
import Const "../../utils/Const";

suite(
  "Splines",
  func() {
    // Test for calculateOffset function
    test(
      "calculateOffset should return correct offset",
      func() {
        let offset1 = Splines.calculateOffset(-0.8, 0.5);
        let offset2 = Splines.calculateOffset(0.0, 0.5);
        let offset3 = Splines.calculateOffset(0.8, 0.5);

        assert offset1 == -0.122_119_822_075_000_05;
        assert offset2 > 0;
        assert offset3 > 0;
      },
    );

    // Test for createFixedSpline function
    test(
      "createFixedSpline should create a fixed spline with the correct value",
      func() {
        let fixedSpline = Splines.createFixedSpline(1.0);
        switch (fixedSpline) {
          case (#Fixed(fixed)) {
            assert fixed.value == 1.0;
          };
          case (#Spline(_)) {
            assert false; // Should not be a Spline
          };
        };
      },
    );

    // Test for addValueToSpline function
    test(
      "addValueToSpline should add a value to the spline",
      func() {
        let initialSpline = {
          length = 0;
          splineType = Const.Land.Continentalness;
          loc = [];
          der = [];
          value = [];
        };

        let updatedSpline = Splines.addValueToSpline(
          initialSpline,
          0.5,
          Splines.createFixedSpline(2.0),
          0.1,
        );

        assert updatedSpline.length == 1;
        assert updatedSpline.loc[0] == 0.5;
        assert updatedSpline.der[0] == 0.1;
        switch (updatedSpline.value[0]) {
          case (#Fixed(fixed)) {
            assert fixed.value == 2.0;
          };
          case (#Spline(_)) {
            assert false; // Should not be a Spline
          };
        };
      },
    );

    // Test for evaluateSpline function
    test(
      "evaluateSpline should correctly evaluate a simple spline",
      func() {
        let spline = {
          length = 1;
          splineType = Const.Land.Continentalness;
          loc = [0.0];
          der = [0.0];
          value = [Splines.createFixedSpline(3.0)];
        };

        let result = Splines.evaluateSpline([0.0, 0.0, 0.0], spline);
        assert result == 3.0;
      },
    );

    // Test for createFlatOffsetSpline function
    test(
      "createFlatOffsetSpline should create a spline with specified offsets",
      func() {
        let offsets = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5];
        let spline = Splines.createFlatOffsetSpline(offsets);

        assert spline.length > 0;
        assert spline.splineType == Const.Land.PeaksAndValleys;
      },
    );

    // Test for createTerrainSpline function
    test(
      "createTerrainSpline should create a terrain spline",
      func() {
        let spline = Splines.createTerrainSpline(0.5, 1);

        assert spline.length > 0;
        assert spline.splineType == Const.Land.PeaksAndValleys;
      },
    );

    // Test for createLandSpline function
    test(
      "createLandSpline should create a land spline",
      func() {
        let offsets = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5];
        let spline = Splines.createLandSpline(offsets, 1);

        assert spline.length > 0;
        assert spline.splineType == Const.Land.Erosion;
      },
    );
  },
);
