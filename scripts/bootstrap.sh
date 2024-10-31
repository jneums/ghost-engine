#!/bin/bash

# Check if the script received an argument
if [ $# -eq 0 ]; then
  echo "Usage: $0 <ic|local>"
  exit 1
fi

# Set the network option based on the argument
if [ "$1" = "ic" ]; then
  NETWORK_OPTION="--network ic"
else
  NETWORK_OPTION=""
fi

export PRE_MINTED_TOKENS=100_000_000_000_000
dfx identity use default
export DEFAULT=$(dfx identity get-principal)

export TRANSFER_FEE=10_000

dfx identity new archive_controller
dfx identity use archive_controller
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)

export TRIGGER_THRESHOLD=2000

export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

export NUM_OF_BLOCK_TO_ARCHIVE=1000

dfx identity new minter
dfx identity use minter
export MINTER=$(dfx identity get-principal)

export FEATURE_FLAGS=true

dfx identity use default

dfx deploy stone_ledger_canister --specified-id 5hs4f-vqaaa-aaaai-qpk4a-cai $NETWORK_OPTION --argument "(variant {Init =
record {
     token_symbol = \"STONE\";
     token_name = \"Stone\";
     token_logo = \"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB90BDhcbKtQvTGsAAAFuSURBVDjLZZLhioMwEIS/qwmotJFWEPrCfVUhIEKaWhtrcz8ke7E3IKhMZmYn+3O73SJAjFGeoihQSjHPM6/Xi4Tz+Uzf91yvVwD6vkcVRQGAc455ngEoy5JlWeRg13V47/Heczqd8N5TVRVd16ES0RiDMYYkOI6j/F/XlaqqAER4WRbGcUTd73dxUkoJsaoqyrLkG8nAWruNGmPEGCOE9/st7977nWsOrTXLsqDatgVgGAaJnOCco65rIedC6Zyy1tI0ze5gKjIfYRxHtNaSyFq7CRhjiDHyfD53Aun7O77WmnVdOR6Pm8Dj8aBtW3EbhkGc8lnzhKlo59xfB8mprmshTtO0E8qROlM5wTn3L27awARrLW3b/pU4DANd1/0jpq38fjfGSFrn3FbiPM+7EtOM+U7ky5aLqRCCOORFaa13c6eZE+QWPp+PFJenyO88F5+micPhQAhhEwghEELgcrmIal5YvnUATdPsUv0CbIbPrWvq8PwAAAAASUVORK5CYII=\";
     minting_account = record { owner = principal \"${MINTER}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEFAULT}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

# Meme token

dfx deploy meme_token --specified-id 6tzm6-miaaa-aaaai-q3lha-cai $NETWORK_OPTION --argument "(variant {Init =
record {
     token_symbol = \"TEST\";
     token_name = \"Test ICRC1\";
     minting_account = record { owner = principal \"${MINTER}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEFAULT}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

# Set env var for ghost engine backend
export GHOST_ENGINE_BACKEND="yooxn-7qaaa-aaaai-qpkaa-cai"

dfx deploy ghost-engine-backend --specified-id ${GHOST_ENGINE_BACKEND} $NETWORK_OPTION

# Set env var for world generator
export GHOST_ENGINE_GENERATOR="5yp25-kqaaa-aaaai-q3lnq-cai"

dfx deploy ghost-engine-generator --specified-id ${GHOST_ENGINE_GENERATOR} $NETWORK_OPTION

# Call the icrc1_transfer method on the stone_ledger_canister canister
dfx canister call stone_ledger_canister icrc1_transfer "(record {
  to = record {
    owner = principal \"${GHOST_ENGINE_BACKEND}\";
  };  
  amount = 1_000_000_000_000;
})" $NETWORK_OPTION
