import NoiseTypes "mo:noise/Types";
import Random "mo:noise/Random";
import Noise "mo:noise/Noise";
import Float "mo:base/Float";
import Int64 "mo:base/Int64";
import Const "Const";
import Splines "Splines";

module {

  public func initClimateSeed(seed : Nat64) : [NoiseTypes.DoublePerlinNoise] {
    // Initialize noise layers
    let xr = Random.xSetSeed(seed);

    let xLow = Random.xNextNat64(xr);
    let xHigh = Random.xNextNat64(xr);

    let temperatureXr = {
      var low = xLow ^ 0x5c7e6b29735f0d7f;
      var high = xHigh ^ 0xf7d86f1bbc734988;
    };
    let temperatureAmps = [1.5, 0.0, 1.0, 0.0, 0.0, 0.0];
    let temperature = Noise.xDoublePerlinInit(temperatureXr, temperatureAmps, -10, temperatureAmps.size(), -1);

    let humidityXr = {
      var low = xLow ^ 0x81bb4d22e8dc168e;
      var high = xHigh ^ 0xf1c8b4bea16303cd;
    };
    let humidityAmps = [1.0, 1.0, 0.0, 0.0, 0.0, 0.0];
    let humidity = Noise.xDoublePerlinInit(humidityXr, humidityAmps, -8, humidityAmps.size(), -1);

    let continentalnessXr = {
      var low = xLow ^ 0x83886c9d0ae3a662;
      var high = xHigh ^ 0xafa638a61b42e8ad;
    };
    let continentalnessAmps = [1.0, 1.0, 2.0, 2.0, 2.0, 1.0, 1.0, 1.0, 1.0];
    let continentalness = Noise.xDoublePerlinInit(continentalnessXr, continentalnessAmps, -9, continentalnessAmps.size(), -1);

    let erosionXr = {
      var low = xLow ^ 0xd02491e6058f6fd8;
      var high = xHigh ^ 0x4792512c94c17a80;
    };
    let erosionAmps = [1.0, 1.0, 0.0, 1.0, 1.0];
    let erosion = Noise.xDoublePerlinInit(erosionXr, erosionAmps, -9, erosionAmps.size(), -1);

    let peaksAndValleysXr = {
      var low = xLow ^ 0x080518cf6af25384;
      var high = xHigh ^ 0x3f3dfb40a54febd5;
    };
    let peaksAndValleysAmps = [1.0, 1.0, 1.0, 0.0];
    let peaksAndValleys = Noise.xDoublePerlinInit(peaksAndValleysXr, peaksAndValleysAmps, -3, peaksAndValleysAmps.size(), -1);

    let weirdnessXr = {
      var low = xLow ^ 0xefc8ef4d36102b34;
      var high = xHigh ^ 0x1beeeb324a0f24ea;
    };
    let weirdnessAmps = [1.0, 2.0, 1.0, 0.0, 0.0, 0.0];
    let weirdness = Noise.xDoublePerlinInit(weirdnessXr, weirdnessAmps, -7, weirdnessAmps.size(), -1);

    [
      temperature,
      humidity,
      continentalness,
      erosion,
      peaksAndValleys,
      weirdness,
    ];
  };

  public func sampleClimateNoise(climate : [NoiseTypes.DoublePerlinNoise], climateType : Nat, x : Float, y : Float, z : Float) : Float {
    if (climateType == Const.Climate.PeaksAndValleys) {
      let c = Noise.sampleDoublePerlinNoise(climate[Const.Climate.Continentalness], x, y, z);
      let e = Noise.sampleDoublePerlinNoise(climate[Const.Climate.Erosion], x, y, z);
      let w = Noise.sampleDoublePerlinNoise(climate[Const.Climate.Weirdness], x, y, z);
      let newSamples = [c, e, -3.0 * (Float.abs(Float.abs(w) - 0.6666667) - 0.33333334), w];
      let s = Splines.evaluateSpline(newSamples, Splines.initSpline());
      let off = s + 0.015;

      let d = 1.0 - Float.fromInt64(Int64.bitshiftLeft(Float.toInt64(y), 2)) / 128 - 83 / 160 + off;

      return d;
    };

    let p = Noise.sampleDoublePerlinNoise(climate[climateType], x, y, z);
    return p;
  };
};
