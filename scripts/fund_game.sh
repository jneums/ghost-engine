dfx identity use minter

# Extract the CANISTER_ID_GHOST_ENGINE_BACKEND value from the .env.local file and strip single quotes
CANISTER_ID_GHOST_ENGINE_BACKEND=$(grep CANISTER_ID_GHOST_ENGINE_BACKEND .env.local | cut -d '=' -f2 | sed "s/'//g")

# Export the CANISTER_ID_GHOST_ENGINE_BACKEND variable
export CANISTER_ID_GHOST_ENGINE_BACKEND

# Call the icrc1_transfer method on the icrc1_ledger_canister canister
dfx canister call icrc1_ledger_canister icrc1_transfer "(record {
  to = record {
    owner = principal \"${CANISTER_ID_GHOST_ENGINE_BACKEND}\";
  };  
  amount = 1_000_000_000_000;
})"