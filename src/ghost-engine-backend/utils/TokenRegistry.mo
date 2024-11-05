import Tokens "Tokens";

module {

  public type DropInfo = {
    token : Tokens.Token;
    minQuantity : Nat;
    maxQuantity : Nat;
  };

  public type Block = {
    name : Text;
    dropInfo : DropInfo;
  };

  public let Air = {
    symbol = "AIR";
    name = "Air";
    cid = "aaaaa-aa"; // Assuming this is a placeholder, update if needed
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

  public let Dirt = {
    symbol = "DIRT";
    name = "Dirt";
    cid = "6tzm6-miaaa-aaaai-q3lha-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAC2klEQVR42p1T6VLaUBjNG3VqnWkrOwkQA8aRDvsmimwirlRlJyCroIBaq9NqlwfoG56epG/QH3fm3pt833e2K8zzMvTV35FQC5vRiVsx3fPw7MFkz416xILBthPVsAnNsBXtqA3LnBst3ue9KxAmPExY0InacRFYQz/lwCgjQ0vLaMS5Tzsx3/egFf9X3IlzxWy45sAm98J9WcUg40KVHQvuN3g99vMso5XxQtt24OlwA4NdCVdJB4vt6LJRL2HF474X/bQEYVFQMc56MNv34Sphx3VGRJdoOgkLHsteLEoyG4hoJZzG6qZE3OUVTHddHOSGcF1QMMxIuCkqeCr60CO8ftyJDvVoR0yc4kA1ZEItQh2SMpGI1ERExf8er5VPEBr8MCCfCWkscuu4Snsw3BFRDZhxpK7i3G9Bi4gaUScqYQuROdGM6DTsuM15IPw6D+Fr2YcJ+cz21jE5TZG7RJXNmGadWGZ9FNbJb27ckbeWtFN0CWMOfTrYgNBLqeSt4PnIi59nW5iTxjQro0P4bTYZpSRoMX2aG3MujULWSKmruxGliMOSStgu9NI23OQlNHSLKM4lLT1Q3qIaNFMH0ciEXtwlgnrIyr0NM+omNKMi2rToImgx7GlErSgyIPu+d7gMrqEeNEEjX92h8bYdz8de/P68ReFdqDNYQpXCaEmbAfMHKbycqobn309UY2o1ZMbryRb+tCJoJ4iOdwtaPips4izwkTkoyqgEPlBpC5Z5DwXlhNNNPBTWMcspaGb8LFAM/nUOO+e/4103RkzvkrXCZcCEvLpCe6wYJBy4Zai+lLz4dqgaitfYuBGz0DozrV1Dg1SHdOWOxXqkhSovLshVY+61hEi7ZHRjtI0cp1kRPea/zQYvxU0c+laJ1MxiBQ9lomP8hfuSwmS5qDSjuePCDS3UI6oxUJ2EhCnDcl/eYGOPEbgR38WMKOc52Xgbwv8+5RHT+nCg4C8+xinb6eB0dwAAAABJRU5ErkJggg==";
    fee = 10_000;
    density = 15;
  };

  public let Sand = {
    symbol = "SAND";
    name = "Sand";
    cid = "3ba3t-4qaaa-aaaai-q3lzq-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABhUlEQVQ4jX2TzZKbMBCEv2CDlh8ZDl78nnmzvEvuOSSXdbxlGWFhQdnJAWbCbjbRTTVqdU9Pz6evXz7/8qFDTmkMAGmWY0xGjCPTOHCNUetSA0gEXBpDYxsAKlszjQO9vwB8CO79hRhHEgBb7ABw3lHZWj9Jsxzn3V+qijzTWgLwuM8Mh32rrCHccN5pa41tlPnseq1t17+HcFvkXkizXMFr5hhzpnHQlrYit/cX2vYZAB86ypWpf3rO1RPxI6lszcvpSGVrTq8dYqo8ktO2z0zjoNLVgxBuHPYtMY4z8wISBjH19Pp21NM40NiGpCiedNZr5muM2ncIN3zodJzyzpiM7UdBucbIYd8qsyi7xogtdmw2CYdFWfIenGyMgoV5rexxj2+DJGAJU1E8LeP6vydplnO/P+YglcbgQ6ezP7ueaRywxe6fnjjv8KGbg5RmOSWoNAGJgjTLteez61nvz3a9WS+nI+/POoXH48+ZbGmrsjWJrOx6aZR132pwvn3/AaB38eI3xd4KWhqNSgwAAAAASUVORK5CYII=";
    fee = 10_000;
    density = 20;
  };

  public let Gravel = {
    symbol = "GRAVEL";
    name = "Gravel";
    cid = "3uhk6-5yaaa-aaaai-q3l2a-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAACAklEQVR42j2SSa/iQAyE+98gkNhBrAECyRASAoQtrALmwoH/f/a8r0a8g2k6bZerynbNZtNer5f1ej1L09TiOLbVamVJklir1TLP86zf71uWBLbdbi2KIsvz3EajkWVZZm4+n9tyuVTx7XZT4eFw0GO32xX45XIRyGazsUqloia+76vGBUFg6R9PDB6Ph/09r2y3nOo/4ICUSiUbDof2+XzscVqreDEbqkYMAKHT8/kUfZDDMFQCjGC43+9tPB7/xul0suPxaA5qu91O1Oi0Xq+t3W6rCwDQRi9+oB0gJCBxsViYo9v7/VYBj7ABEAaB17JisWiDwUB3ZCEj8rsyt1armTtlkeiQANhhFf4CnM9nOQ9luhUKBQV53GHvoEmgnwCMBLyo1+tKAhSvMI5CDKUBwA4qjUZD+oNRRwkkozGNfAF1Oh0B8f07UswVgy+VZ56oCA+4X69XBTpns5kKaZbOJyqOQ+/Ho87/KfBIhF5b9HEcWVDM4plO8hgnLDCcfO0BP3TCMJYGxxnTZDKRNCZTrVb1zklOEgzEVGOkGKfpTAFrfNgsJAejACCyxNfi5Ju5zAUANo7VZVnyLFYiAFrvH0AmAhvuAKKdJeP7/X5XQ0cxmr7LAsVsGcq4L3X0UsxEviYjcTqdmiuXy3rkRApJ+IKRmAYIwTRYc1jyDiNy/wFZcNPxsVt58gAAAABJRU5ErkJggg==";
    fee = 10_000;
    density = 22;
  };

  public let GoldOre = {
    symbol = "GORE";
    name = "Gold Ore";
    cid = "3tgmk-qaaaa-aaaai-q3l2q-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAzklEQVR42oVSwQ0CMQzLPozCIh2g/47QUXjdWrx5IBW5J4OTpscjhxqS2LFjrbVRa3WBXO99Rill/u7qDB9tiIFCfWMge/DfHIAkp76fd4fCIWwa45g1fBvRmeBAFr8et5S+W0Hp7iJbD0Cm0340x0RnHoWaQ5ClcZo2YkcE6SP4Xhgo8o6+ihwZmypLz73qJ6udzXaFTBcYUdTlkHgH6grpK6qubXpZZKNvL/LhhPyKeOU/mjJ3lkPSnaMrqkFk9tfGbBV3ypnnmVgRgLkPLAuXXe9hsnYAAAAASUVORK5CYII=";
    fee = 10_000;
    density = 50;
  };

  public let IronOre = {
    symbol = "IORE";
    name = "Iron Ore";
    cid = "32fhw-giaaa-aaaai-q3l3a-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABxUlEQVR42lWTu2sCQRDG92+ztBNLsRUrxQeeIugpPhD0lKSysZETUhyWSh6mEwJJF0iaQJqENOnST/hNmOVSfLe3u/P4vplZNxwOpdvtCmuz2VT0+309Wy6XCvZ23+v1dA/YOz5BEKhhoVDwSDvZynkmk5FcLueTORwxYC2Xy3K7Dv1lsViUer3u9+v1Wl73l2qTJIn6uPl8rrSgjMFkMpHNZqMMPh+vZR8FXhbrbrdTTKdT9VEJtVrtX9ZsNqurGR8OBy9tsVgoCNjpdMTx02g0pFQqKXD++XjT7PwjC3y/PMj7/ZUmsSBhGIqzahPo6+lGjZ7vEtUJfWRxZ/vz+SxxHOvZeDwWRwfIbJSPx6PHdrtVFlS+Uql4SSZXGZDdKgtVYwNoF9SRg/7BYKBZsYmi6K8GbCwysAKSATlGHaxWK60XwemCMuBDEA5wwsEm0FpKF9BtnUAy9zpI0GAOWq2W77MVzqYPIAdG9/GF7vP5vLbfMYXogXoaOJMF/dTB6mSSuNdBarfbMpvN9MAmzx6TVdtqQGdOp5NKAtg5M6JA6WKORiM/3uaQfjdI5p249JMFzAV1odrValVgaC+TgMi1QCT+BZ5XkUYdNOzTAAAAAElFTkSuQmCC";
    fee = 10_000;
    density = 45;
  };

  public let CoalOre = {
    symbol = "CORE";
    name = "Coal Ore";
    cid = "35ebc-lqaaa-aaaai-q3l3q-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABzklEQVR42lWTK8tCQRCG9zcYLBpEi1gEEQwGQbDYxChWMSle8ILgDS8I3qrFItrMmoz+rfl4RmY5X3jPnt2dy/vOzLrlcimTyURY+/2+Yjab6dnpdFKwt/vpdKp7wN7xGQ6Halir1TyCTrZyXiwWJZvN+mQORwxYm82m5HI5f1mv16Xb7fr95XKRWCwm0WhUns+n+rj9fq+0oIzBZrOR6/WqDAqFgqRSKS+L9fF4KLbbrfqohE6n8y9ruVzW1Yxfr5eXdjgcFAQcj8fi+On1etJoNBQ4IyOTyUg6nVZZoFQqSTKZ1CQWZD6fi7NqEwhH0xgOhxXI4o6zSCQi3+9X7ve7nq3Xa3F0gMxG+f1+e9xuN2VE5VutlpdkcpUB2aFGBqgaG1CpVLwc9C8WC82KzfF4/NWAjUUG+Xxe2ZABR2ibnPP5rPUiOF1QBnwIwgFOiUTCT6C1lC6g2zqBZO51kKDBHAwGA99nK5xNH0COzQX7arWq7XdMIXoolgEZOJMFGdSBOiEjFAopuNdBGo1Gstvt9AAjNNtjsmpzFo/HtTOfz0clAeycGVGgYDFXq5Ufb3MIvhsk805c8MkC5oK6UO12uy0wtJdJQORaIBL/AdQwVHdKYJg0AAAAAElFTkSuQmCC";
    fee = 10_000;
    density = 30;
  };

  public let Log = {
    symbol = "LOG";
    name = "Log";
    cid = "2qkfm-eyaaa-aaaai-q3l4a-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOuwAADrsBx/jUNgAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC42/Ixj3wAAALtJREFUOE+Fj0EKwkAQBPON3INnQXyAIHmAVw++QvARebS1VOidLILQmfTMdG0202WZ1+vpeT8jzOd1Q/haDVAJd8C6vR+EJG0rgCZf9oSSkBRTDNsXfA1ANYhVB+qVXCPaAKkjkEWizKvH7ADOPgBtgPgO0NgLWJVRJ5gRMMGpIROlmjwAVENIL+b2ANBXefXBj4DVU/OvmRhoAE+9FWulZ6g3QPIHwPExDlM7kCmqgJM/gHegqqxacpm/fJrPwM9ATXsAAAAASUVORK5CYII=";
    fee = 10_000;
    density = 15;
  };

  public let Leaves = {
    symbol = "LEAVES";
    name = "Leaves";
    cid = "2xldy-jaaaa-aaaai-q3l4q-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOrAAADqwB3KhigwAAABh0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC42/Ixj3wAAAOpJREFUOE91kssNwkAQQ4MQQlREARyogQOFcKIRLlRCaUveSG/kjSCStR57ftlkOV/34/48jvVZxOtzGI/3qTS8y23XOZwAn7MKaMIJMLIAnkPg+vCeKjBIAMT/iolBF7oS3O5wzy3UqxDi5Owu0MjjbohzkzJNAhpOSA2g4dmkLgkRwDW3msXAGPSa/7AtFm5VAcRJxrlFAj296R2dls38qdAtMg/enw8kpwkJaHCHoCWvCU50msWCZHy3Ijavk4AJcqf8Al43MMgpnGjZJAe45VScyeqsSmxDfbXpEltcHziev6/bzE3G8gWbjUJ+kP6AgwAAAABJRU5ErkJggg==";
    fee = 10_000;
    density = 5;
  };

  public let Sandstone = {
    symbol = "SANDSTONE";
    name = "Sandstone";
    cid = "26iie-7iaaa-aaaai-q3l5a-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABp0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjUuMTAw9HKhAAABZ0lEQVQ4T5VS20rDQBCd1WL9ZV9ELRRqQVARL6/6G74I2oraoCmi1tQYraBfoKAd50yYdF2yDwaW7M7lzJwz47LeGpN8841F+vn+pMZCU16OnHPEPCWeOrWb3801xfZVvSm/WOfHXosfTld4dLbKWb/N4/MOAxi+4nqH88GmnA1+SQ/0PF91Srv4KRZoQeNki4ubfX6/O+SP0RFPhnsVkHaPQKA+JducS/BruvsnKLQDpBh0tTpyBaBsM6xkQfBZ66iOAigEYOSSH+hzRaJpo1pIVVQHFVBCwazfKingcn+yrP/8ss1F0uVJKsLJHXYAWScQE4UsR6cAp2mBdi3IlAYQAAGMuyXfHi+VU/A5hm0CJDbKago+x1AogMdGWU3B51hHITbK2RQ8jrqFso3YSmxnnYCmDSZTTSEUyISKCQi/UgB/W2f8YdTlEnTczQ/Ffb/l0NtwNtPYHtTtCWzI1Q4M5L80kPcLQsceg7XDeW8AAAAASUVORK5CYII=";
    fee = 10_000;
    density = 35;
  };

  public let Energy = {
    symbol = "ENERGY";
    name = "Energy";
    cid = "2zjoq-sqaaa-aaaai-q3l5q-cai";
    amount = 100_000_000;
    decimals = 8;
    logo = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAClElEQVQ4jV2TT0hUURTGf0+HaXL1yuEp0iIch6BuKEbEbBpqMQMRGExM1OIRCMHsDMJFoyj1WjRIQdtq0SbBRUSLIHHh2MKIRhJnxBomMdT87ySJzyk4LV5zU8/m3nvO/c53zrnfNexZkYlMmvnpAnvtXO9rik/v8+3PrvbFUw4AG7kc6xNvvZhK3RURERJpMaMdQiIt8RGRsw8/iYhIoC2pfc3X7snjzyIiXjzQlhRDpe4KwPx0gXJQoSwhv2IQKBVpOqFY/JLHDYUBCJSKnL7eDcDUYAY3FKYmv2JosD3glagswQ2FNdiOOahfnm9qMKPBAD5zLa/BS+NZunr6ABjKjjOWKWLHHJZmsgCYk3nKrQpAk9VUGScyaZLRCJ1Nfjqb/CSjEVoiLSzNZHn3KMp86f+Q7QGHF8fhvL+CrxxUMJ3XrEQjAIxV/N7LBOBI+LFmVpawNJ7luT/CnRtJDBJpqWY21/IcO3mK9u4HvLl5hXJQ6bLjKUc/q7JEz63W7hrrb/hdy+GFEt/NBipzBba/TrG1uopbZ+E2WsRTDhu5HDs/iuwUZ1g8VI9bZ2HHHGpe3ILk5Qhd3X0eW1Dp7PGUQ7PvEBu5HB+7z1DffomDZqj4Px2UCrrPvVbVQ337JdYn3u7ThTmZp7ZiHO3f2lyl3OqJqDJX0OW1hi6S25xkpziD7/dPDVaWsLJt4DZa1LoXrva7jRb2gINR42Mh9wG3zmLu1RO2l6dYfvOA3hEviRsK63uH10tU5gpAIi32rMizhV0R8dbqnzBbOiR2e1TMFu9sz4rEXo6KiLea0Q4xSKRFWUJXTx+dTX7ig1kW3w/rQZqTnkaqLe61+ekCvupmKDvOELD4fnjfpb2DPfjly0HFX3GCdNnPeRBjAAAAAElFTkSuQmCC";
    fee = 10_000;
    density = 1;
  };

  public let GeneratedBlocks : [(Nat16, Block)] = [
    (0, { name = "Air"; dropInfo = { token = Air; minQuantity = 0; maxQuantity = 0 } }),
    (1, { name = "Stone"; dropInfo = { token = Stone; minQuantity = 1; maxQuantity = 1 } }),
    (2, { name = "Water"; dropInfo = { token = Air; minQuantity = 0; maxQuantity = 0 } }), // Water doesn't drop anything
    (3, { name = "Dirt"; dropInfo = { token = Dirt; minQuantity = 1; maxQuantity = 1 } }),
    (4, { name = "Bedrock"; dropInfo = { token = Air; minQuantity = 0; maxQuantity = 0 } }), // Bedrock doesn't drop anything
    (5, { name = "Grass"; dropInfo = { token = Dirt; minQuantity = 1; maxQuantity = 1 } }), // Grass drops Dirt
    (6, { name = "Lava"; dropInfo = { token = Air; minQuantity = 0; maxQuantity = 0 } }), // Lava doesn't drop anything
    (7, { name = "Sand"; dropInfo = { token = Sand; minQuantity = 1; maxQuantity = 1 } }),
    (8, { name = "Gravel"; dropInfo = { token = Gravel; minQuantity = 1; maxQuantity = 1 } }),
    (9, { name = "Gold Ore"; dropInfo = { token = GoldOre; minQuantity = 2; maxQuantity = 3 } }), // Gold Ore drops 2-3 Gold Ore
    (10, { name = "Iron Ore"; dropInfo = { token = IronOre; minQuantity = 2; maxQuantity = 3 } }), // Iron Ore drops 2-3 Iron Ore
    (11, { name = "Coal Ore"; dropInfo = { token = CoalOre; minQuantity = 2; maxQuantity = 3 } }), // Coal Ore drops 2-3 Coal Ore
    (12, { name = "Log"; dropInfo = { token = Log; minQuantity = 1; maxQuantity = 1 } }),
    (13, { name = "Leaves"; dropInfo = { token = Leaves; minQuantity = 0; maxQuantity = 0 } }), // Leaves don't drop anything
    (14, { name = "Sandstone"; dropInfo = { token = Sandstone; minQuantity = 1; maxQuantity = 1 } }),
    (15, { name = "Energy"; dropInfo = { token = Energy; minQuantity = 1; maxQuantity = 1 } }) // Dead Bush doesn't drop anything
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
    Energy = 15 : Nat16;
  };
};
