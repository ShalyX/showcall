# ShowCall frontend

Next.js app for publishing event-ticket guarantees, opening ticket claims, and reading claim decisions from a GenLayer Intelligent Contract.

## Run

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
```

Leave `NEXT_PUBLIC_CONTRACT_ADDRESS` blank to explore the clearly labeled local preview. Configure the deployed contract address to enable StudioNet reads and wallet-backed writes.

Ticket references are SHA-256 hashed in the browser before a contract call. Only the commitment is sent. Preview actions do not make RPC calls or create transactions.
