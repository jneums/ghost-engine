import Tokens "Tokens";

module {

  public let Air = {
    symbol = "AIR";
    name = "Air";
    cid = "aaaaa-aa";
    amount = 100_000_000;
    decimals = 0;
    logo = "";
    fee = 10_000;
  };

  public let Stone = {
    symbol = "STN";
    name = "Stone";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Water = {
    symbol = "WTR";
    name = "Water";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cba";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Dirt = {
    symbol = "DRT";
    name = "Dirt";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cda";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Bedrock = {
    symbol = "BDR";
    name = "Bedrock";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cea";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Grass = {
    symbol = "GRS";
    name = "Grass";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cfa";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Lava = {
    symbol = "LVA";
    name = "Lava";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cga";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Sand = {
    symbol = "SND";
    name = "Sand";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cha";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Gravel = {
    symbol = "GVL";
    name = "Gravel";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cia";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let GoldOre = {
    symbol = "GDO";
    name = "Gold Ore";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cja";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let IronOre = {
    symbol = "IRO";
    name = "Iron Ore";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cka";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let CoalOre = {
    symbol = "CLO";
    name = "Coal Ore";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cla";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Log = {
    symbol = "LOG";
    name = "Log";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cma";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Leaves = {
    symbol = "LVS";
    name = "Leaves";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cna";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let Sandstone = {
    symbol = "SSN";
    name = "Sandstone";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-coa";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let DeadBush = {
    symbol = "DDB";
    name = "Dead Bush";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cpa";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
  };

  public let GeneratedBlocks : [(Nat16, Tokens.Token)] = [
    (0, Air),
    (1, Stone),
    (2, Water),
    (3, Dirt),
    (4, Bedrock),
    (5, Grass),
    (6, Lava),
    (7, Sand),
    (8, Gravel),
    (9, GoldOre),
    (10, IronOre),
    (11, CoalOre),
    (12, Log),
    (13, Leaves),
    (14, Sandstone),
    (15, DeadBush),
  ];
};
