# Obscura Storage

Obscura Storage is a private file-metadata vault that keeps IPFS references and the symmetric keys that protect them out of sight. Files are uploaded to IPFS (mocked locally for development), the resulting hash is encrypted in the browser with a 12-digit key, and that key is wrapped with Zama FHE before being saved on-chain. Users later decrypt the key via Zama’s relayer to recover the IPFS hash without ever exposing plaintext on the blockchain.

## Why it matters
- Protects IPFS hashes and their encryption keys so storage locations cannot be inferred from on-chain data.
- Keeps all symmetric-key operations in the browser; only FHE-encrypted handles touch the chain.
- Aligns with Zama’s FHEVM stack, demonstrating how to mix confidential on-chain storage with familiar web3 UX.
- Prevents reliance on local RPC or localStorage in the frontend; built for Sepolia from day one.

## Key features
- **On-chain encrypted records**: Store file name, encrypted IPFS hash payload, FHE-protected 12-digit key, and timestamp per user.
- **Local-first encryption**: Random key generation and hash encryption happen in the browser before any network call.
- **Zama relayer integration**: Uses `@zama-fhe/relayer-sdk` to encrypt the key for storage and to perform user decryption when a record is retrieved.
- **Viem reads, Ethers writes**: Reads use viem’s `useReadContract`; writes go through `ethers.Contract` with the connected wallet.
- **Hardhat tasks & tests**: Tasks cover storing, listing, and mock-network decryption; tests validate the FHE flow against the mock network.

## Tech stack
- **Smart contract**: Solidity 0.8.27, `@fhevm/solidity`, Hardhat, hardhat-deploy, ethers v6.
- **FHE tooling**: `@fhevm/hardhat-plugin`, Zama Sepolia config, relayer SDK for encrypted inputs and user decrypt.
- **Frontend**: React + Vite + TypeScript, RainbowKit for wallet connect, wagmi/viem for reads, ethers for writes. No Tailwind and no frontend env vars.
- **Testing & quality**: Hardhat network with FHE mock, chai, solhint, eslint, prettier, solidity-coverage, gas reporter.

## Project layout
- `contracts/ObscuraStorage.sol` – Stores encrypted file metadata and FHE-wrapped key per user.
- `deploy/deploy.ts` – hardhat-deploy script for ObscuraStorage.
- `tasks/obscuraStorage.ts` – CLI tasks to store/list/decrypt records.
- `test/ObscuraStorage.ts` – Contract tests on the FHE mock network.
- `deployments/sepolia/ObscuraStorage.json` – Source of truth for deployed address and ABI (copy this ABI into the frontend).
- `home/` – React app (viem reads, ethers writes, Zama relayer for encryption/decryption, mock IPFS uploader).

## End-to-end flow
1. User selects a file in the web app.
2. App mocks an IPFS upload, returning a random CID-like hash.
3. A 12-digit numeric key is generated locally; the IPFS hash is symmetrically encrypted with that key (digit-shift cipher for the demo).
4. The key is encrypted with Zama’s relayer (`createEncryptedInput`) and sent on-chain with the file name and encrypted hash via `storeFile`.
5. Records are fetched with `getRecords`. To decrypt, the user signs an EIP-712 payload so the relayer can return the key, which is then used client-side to recover the IPFS hash.

## Getting started
### Prerequisites
- Node.js 20+
- npm

### Install dependencies (contracts)
```bash
npm install
```

### Environment variables (root `.env`)
Set real values before deploying or running against live networks. Use a private key, not a mnemonic.
```
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
INFURA_API_KEY=your_infura_key
ETHERSCAN_API_KEY=optional_for_verification
```

### Useful commands
- Compile: `npm run compile`
- Tests (FHE mock only): `npm run test`
- Lint: `npm run lint`
- Coverage: `npm run coverage`
- Local chain (for contract iteration): `npm run chain`

### Hardhat tasks
- Show address: `npx hardhat task:storage:address --network <network>`
- Store a record: `npx hardhat task:storage:store --file sample.pdf --payload <encryptedHash> --key 123456789012 --network <network>`
- List records: `npx hardhat task:storage:list --user 0x... --network <network>`
- Decrypt (mock net only): `npx hardhat task:storage:decrypt --index 0 --network hardhat`

## Deploying ObscuraStorage
1. Ensure `PRIVATE_KEY` and `INFURA_API_KEY` are set.
2. Deploy to Sepolia:
   ```bash
   npx hardhat deploy --network sepolia
   ```
3. After deployment, copy the fresh address and ABI from `deployments/sepolia/ObscuraStorage.json` into the frontend config (`home/src/config/contracts.ts`). The frontend must always use the generated ABI; do not hand-write it.
4. (Optional) Verify:
   ```bash
   npx hardhat verify --network sepolia <DEPLOYED_ADDRESS>
   ```

## Frontend (home/)
1. Install deps:
   ```bash
   cd home
   npm install
   ```
2. Update `home/src/config/contracts.ts` with the deployed address and ABI from `deployments/sepolia/ObscuraStorage.json`.
3. Start the app (Sepolia only; no localhost or env vars):
   ```bash
   npm run dev
   ```
4. Workflow in the UI:
   - Connect wallet (RainbowKit).
   - Upload a file, mock IPFS hash is generated, 12-digit key is created, and the hash is encrypted locally.
   - “Save to ObscuraStorage” encrypts the key with Zama and writes the record to the contract.
   - In “My Files”, fetch stored records and decrypt to reveal the IPFS hash and symmetric key via the relayer.

## Problem solved & advantages
- Prevents plaintext IPFS references or keys from leaking on-chain.
- Ensures only the data owner can decrypt their key thanks to Zama’s ACL and user-decrypt flow.
- Keeps encryption client-side, reducing trust in the backend and simplifying compliance.
- Demonstrates a concrete pattern for marrying decentralized storage with FHE-protected metadata.

## Notes and constraints
- Frontend avoids env vars and localhost networks by design; configure addresses directly in `contracts.ts`.
- Use the ABI generated by Hardhat (`deployments/sepolia`); keep it in sync after every deployment.
- The 12-digit cipher is intentionally lightweight for demo purposes; FHE protects the key, but production deployments should harden the symmetric scheme.

## Future roadmap
- Swap the mock IPFS uploader for a real pinning flow with progress feedback.
- Add batch uploads and pagination for large record sets.
- Harden client-side encryption (e.g., AES-GCM) while keeping FHE key wrapping.
- Introduce role-based access and sharing controls using Zama ACL patterns.
- Extend deployment targets beyond Sepolia and add automated CI for tests/lint/coverage.

## License
BSD-3-Clause-Clear. See `LICENSE`.
