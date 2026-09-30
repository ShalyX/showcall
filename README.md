# ShowCall

ShowCall records voluntary event-ticket guarantees and uses a GenLayer Intelligent Contract to evaluate claims against the published terms and public event notices.

**Current milestone:** ShowCall is deployed on GenLayer StudioNet with a live Vercel preview. The latest deployment now resolves a verified official-source i74 cancellation claim as `REFUND`. Earlier live checks also confirmed that synthetic or unavailable evidence fails closed as `NEEDS_EVIDENCE`. All test ticket commitments are synthetic; no real ticket purchase or refund claim is implied.

## Live deployment

- App preview: https://frontend-dpaeo09y2-shalyxs-projects.vercel.app
- StudioNet contract: [0x03C0D1E99cc766b9d24b29cC0FE3FD596e29C902](https://explorer-studio.genlayer.com/address/0x03C0D1E99cc766b9d24b29cC0FE3FD596e29C902)
- Deployment transaction: https://explorer-studio.genlayer.com/tx/0xf27475b45b6568e6653cc7bc4dc13b9b5792f4fb9c608c35f9cfe8fb8bf615cf

### Live claim evidence

**Synthetic fixture on an earlier deployment:** The published pages identify themselves as synthetic and unofficial. The finalized claim returned `NEEDS_EVIDENCE` with successful execution: https://explorer-studio.genlayer.com/tx/0xd28eb0abb2c78d5f11efc50378ec8fd61b388ff49b94d04801f96c3bcb68a712.

**Unavailable-source test on an earlier deployment:** The ticketing event page was inaccessible to GenLayer. The contract caught the fetch failure, finalized the claim as `NEEDS_EVIDENCE`, and stored which source was unavailable: https://explorer-studio.genlayer.com/tx/0x7809b7ceeb1c395ddca18acbc00ba803058a9bc3b77c53eb7748e8a429ee5c85.

**Official-source positive test:** The latest contract finalized the i74 cancellation claim as `REFUND`; the record cites the organizer cancellation press release from 3 March 2026 and its statement that ticket holders would receive refunds: https://explorer-studio.genlayer.com/tx/0x380581ab34949842e60f524998e1a175959f4297956fdcc0338f5b50676ce94e. The test uses a synthetic ticket commitment, not a real ticket.

Sources: [Insomnia ticket terms](https://www.insomniagamingfestival.com/event-terms-conditions), [official i74 cancellation announcement](https://www.insomniagamingfestival.com/). The organizer terms say canceled non-LAN tickets are refundable at face value, excluding booking fees; the official i74 announcement confirms the cancellation and refunds.

## Why GenLayer

The contract reads the guarantee page, event page, and claimant-supplied notice inside a non-deterministic block. Validators assess the public evidence against the guarantee that was fixed when the event was registered. The result is bounded to `REFUND`, `CREDIT`, `REPLACEMENT`, `NO_CHANGE`, or `NEEDS_EVIDENCE`, then stored with the claim on-chain.

The organizer’s guarantee is voluntary. ShowCall does not decide statutory rights, verify legal compliance, or automatically transfer ticket funds. The first version records claim outcomes and keeps the cited evidence discoverable.

## Claim lifecycle

1. Organizer registers an event, its guarantee terms, policy URL, event URL, and issued ticket references.
2. The browser hashes ticket references with SHA-256 before they are sent to GenLayer. The contract records commitments rather than raw ticket codes.
3. A ticket holder opens one claim per issued commitment and supplies a public event-change notice.
4. Anyone may request resolution. The contract fetches all three public pages and asks validators to apply the stored guarantee.
5. The accepted structured outcome and short explanation are written to contract state.

## Project layout

```text
contracts/showcall.py       Intelligent Contract and public state transitions
tests/direct/               Direct-mode contract behavior tests
frontend/                   Next.js app, wallet connection, preview and contract client
deploy/deployScript.ts      GenLayer deployment entry point
```

## Local setup

Requirements: Node.js 20.9+, Python 3.12+, and the GenLayer CLI/testing tools from the [official setup guide](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup).

```powershell
pip install -r requirements.txt
npm install
Copy-Item frontend/.env.example frontend/.env.local
npm run dev
```

With `NEXT_PUBLIC_CONTRACT_ADDRESS` blank, the interface runs in preview mode. Preview actions are local UI state only. After deploying `contracts/showcall.py`, set the contract address in `frontend/.env.local` and restart the dev server to use live StudioNet reads and writes.

## Contract quality checks

```powershell
genvm-lint check contracts/showcall.py
pytest tests/direct/ -v
```

The direct tests mock web and LLM responses. The live transactions above verify StudioNet page retrieval and consensus for the listed scenarios. The app preview is configured for the live contract; the local preview mode remains illustrative and does not send transactions.

## Important limitations

- The organizer submits the guarantee text and public URLs; ShowCall does not authenticate event domains or verify that a page belongs to the organizer.
- The Insomnia verification uses a synthetic ticket commitment and does not establish that a real ticket was purchased or that any particular buyer qualifies for a refund.
- Ticket commitments are not encrypted. Low-entropy ticket codes can be guessed from their hashes; organizers should use high-entropy references.
- Public pages can change, disappear, or contain prompt-injection text. The contract treats fetched pages as evidence and directs validators to ignore embedded instructions, but source authenticity and availability still need live QA.
- No refund, credit, or replacement is automatically fulfilled. The contract records the adjudicated outcome only.
- Preview mode uses an illustrative fixture and a local rule mapping; only live mode invokes GenLayer.

## Foundation

The app scaffold started from the [official GenLayer project boilerplate](https://github.com/genlayerlabs/genlayer-project-boilerplate) (MIT licensed). ShowCall-specific contract and UI code is maintained here under the same license.
