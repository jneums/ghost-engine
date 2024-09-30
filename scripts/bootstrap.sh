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

export TOKEN_NAME="Test Ghost Engine Tokens"

export TOKEN_SYMBOL="tENGINE"

dfx identity new minter
dfx identity use minter
export MINTER=$(dfx identity get-principal)

export FEATURE_FLAGS=true

dfx identity use default

dfx deploy icrc1_ledger_canister --specified-id 5hs4f-vqaaa-aaaai-qpk4a-cai $NETWORK_OPTION --argument "(variant {Init =
record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
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

# Call the icrc1_transfer method on the icrc1_ledger_canister canister
dfx canister call icrc1_ledger_canister icrc1_transfer "(record {
  to = record {
    owner = principal \"${GHOST_ENGINE_BACKEND}\";
  };  
  amount = 1_000_000_000_000;
})" $NETWORK_OPTION