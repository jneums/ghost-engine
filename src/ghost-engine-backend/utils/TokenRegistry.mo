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
    density = 0;
  };

  public let Stone = {
    symbol = "STONE";
    name = "Stone";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90BDhcbKtQvTGsAAAFuSURBVDjLZZLhioMwEIS/qwmotJFWEPrCfVUhIEKaWhtrcz8ke7E3IKhMZmYn+3O73SJAjFGeoihQSjHPM6/Xi4Tz+Uzf91yvVwD6vkcVRQGAc455ngEoy5JlWeRg13V47/Heczqd8N5TVRVd16ES0RiDMYYkOI6j/F/XlaqqAER4WRbGcUTd73dxUkoJsaoqyrLkG8nAWruNGmPEGCOE9/st7977nWsOrTXLsqDatgVgGAaJnOCco65rIedC6Zyy1tI0ze5gKjIfYRxHtNaSyFq7CRhjiDHyfD53Aun7O77WmnVdOR6Pm8Dj8aBtW3EbhkGc8lnzhKlo59xfB8mprmshTtO0E8qROlM5wTn3L27awARrLW3b/pU4DANd1/0jpq38fjfGSFrn3FbiPM+7EtOM+U7ky5aLqRCCOORFaa13c6eZE+QWPp+PFJenyO88F5+micPhQAhhEwghEELgcrmIal5YvnUATdPsUv0CbIbPrWvq8PwAAAAASUVORK5CYII=";
    fee = 10_000;
    density = 25;
  };

  public let Water = {
    symbol = "WTR";
    name = "Water";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cba";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 1;
  };

  public let Dirt = {
    symbol = "DRT";
    name = "Dirt";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cda";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 15;
  };

  public let Bedrock = {
    symbol = "BDR";
    name = "Bedrock";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cea";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 100; // Assuming Bedrock is very hard to mine
  };

  public let Grass = {
    symbol = "GRS";
    name = "Grass";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cfa";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 10;
  };

  public let Lava = {
    symbol = "LVA";
    name = "Lava";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cga";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 5; // Assuming Lava is fluid and less dense
  };

  public let Sand = {
    symbol = "SND";
    name = "Sand";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cha";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 20;
  };

  public let Gravel = {
    symbol = "GVL";
    name = "Gravel";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cia";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 22;
  };

  public let GoldOre = {
    symbol = "GDO";
    name = "Gold Ore";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cja";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 50; // Assuming Gold Ore is dense
  };

  public let IronOre = {
    symbol = "IRO";
    name = "Iron Ore";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cka";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 45;
  };

  public let CoalOre = {
    symbol = "CLO";
    name = "Coal Ore";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cla";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 30;
  };

  public let Log = {
    symbol = "LOG";
    name = "Log";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cma";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 15;
  };

  public let Leaves = {
    symbol = "LVS";
    name = "Leaves";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cna";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 5;
  };

  public let Sandstone = {
    symbol = "SSN";
    name = "Sandstone";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-coa";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 35;
  };

  public let DeadBush = {
    symbol = "DDB";
    name = "Dead Bush";
    cid = "5hs4f-vqaaa-aaaai-qpk4a-cpa";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 2;
  };

  public let Energy = {
    symbol = "NRG";
    name = "Energy";
    cid = "6tzm6-miaaa-aaaai-q3lha-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "";
    fee = 10_000;
    density = 1;
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

  public let BlockType = {
    Air = 0 : Nat16;
    Stone = 1 : Nat16;
    Water = 2 : Nat16;
    Dirt = 3 : Nat16;
    Bedrock = 4 : Nat16;
    Grass = 5 : Nat16;
    Lava = 6 : Nat16;
    Sand = 7 : Nat16;
    Gravel = 8 : Nat16;
    GoldOre = 9 : Nat16;
    IronOre = 10 : Nat16;
    CoalOre = 11 : Nat16;
    Log = 12 : Nat16;
    Leaves = 13 : Nat16;
    Sandstone = 14 : Nat16;
    DeadBush = 15 : Nat16;
  };
};
