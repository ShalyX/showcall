# ShowCall

ShowCall records voluntary event-ticket guarantees and uses a GenLayer Intelligent Contract to evaluate claims against the published terms and public event notices.

**Current milestone:** ShowCall has a live StudioNet deployment and Vercel preview. The deployed version completed wallet QA with a synthetic ticket commitment. The current source adds independent source-snapshot verification and on-chain fingerprints; that hardening still needs a new StudioNet deployment and wallet QA before it is live. No real ticket or refund claim is implied.

## Live deployment

- App preview: https://showcall-genlayer.vercel.app
- StudioNet contract: [0x03C0D1E99cc766b9d24b29cC0FE3FD596e29C902](https://explorer-studio.genlayer.com/address/0x03C0D1E99cc766b9d24b29cC0FE3FD596e29C902)
- Deployment transaction: https://explorer-studio.genlayer.com/tx/0xf27475b45b6568e6653cc7bc4dc13b9b5792f4fb9c608c35f9cfe8fb8bf615cf

### Live claim evidence

**Synthetic fixture on an earlier deployment:** The published pages identify themselves as synthetic and unofficial. The finalized claim returned `NEEDS_EVIDENCE` with successful execution: https://explorer-studio.genlayer.com/tx/0xd28eb0abb2c78d5f11efc50378ec8fd61b388ff49b94d04801f96c3bcb68a712.

**Unavailable-source test on an earlier deployment:** The ticketing event page was inaccessible to GenLayer. The contract caught the fetch failure, finalized the claim as `NEEDS_EVIDENCE`, and stored which source was unavailable: https://explorer-studio.genlayer.com/tx/0x7809b7ceeb1c395ddca18acbc00ba803058a9bc3b77c53eb7748e8a429ee5c85.

**Positive-source test on the deployed version:** The contract finalized the i74 cancellation claim as `REFUND`; the record cites the submitted cancellation and terms pages: https://explorer-studio.genlayer.com/tx/0x380581ab34949842e60f524998e1a175959f4297956fdcc0338f5b50676ce94e. Those pages identify themselves as organizer sources, but the transaction does not prove domain ownership. The test uses a synthetic ticket commitment, not a real ticket.

**Wallet UI QA:** From the connected Chrome wallet on StudioNet, the deployed app registered a synthetic guarantee, opened a cancellation claim using a browser-hashed ticket reference, and finalized the claim as `REFUND` through GenLayer consensus. The claim record is `59e25db7beb7ccd5a7adbd70b847a64afacb4eb263f14bfb535a189bea7a9202`.

- Register guarantee: https://explorer-studio.genlayer.com/tx/0x849c74cea283bb9817cd000019ee86228ed4915f9c00c0ca6e5b3f76bfad8bf1
- Open cancellation claim: https://explorer-studio.genlayer.com/tx/0xe8cfaa6d4df37a23c60653c7e8f5ac620992ea0e31cdeb9d0311d2a0cccbd612
- Resolve with GenLayer: https://explorer-studio.genlayer.com/tx/0x3cd4d22ffde6b6d2064e10291cf3d3100247afd82d388a452d69224e5f2610d3

Sources: [Insomnia ticket terms](https://www.insomniagamingfestival.com/event-terms-conditions), [official i74 cancellation announcement](https://www.insomniagamingfestival.com/). The organizer terms say canceled non-LAN tickets are refundable at face value, excluding booking fees; the official i74 announcement confirms the cancellation and refunds.

## Why GenLayer

The contract reads the guarantee page, event page, and claimant-supplied notice inside a non-deterministic block. Each validator independently fetches the same three submitted URLs, calculates SHA-256 fingerprints for the rendered text and reviewed excerpt, and assesses the bounded result against the guarantee fixed at registration. The contract stores the decision and source manifest only if validators agree on both the decision and all source fingerprints. A source outage returns `NEEDS_EVIDENCE`; differing snapshots reject the resolution so it can be retried.

The source manifest records exact submitted URLs, fetch status, origin-verification status, and rendered-text and reviewed-excerpt hashes. `origin_status` is always `UNVERIFIED`: a hash proves which bytes were fingerprinted, not who controls a domain or whether the URL belongs to the organizer. The UI labels these links accordingly.

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

The 16 direct tests mock web and LLM responses. They cover duplicate registration, invalid and unissued claims, cross-wallet replay attempts, single-use ticket commitments, unavailable and empty sources, malformed and unsupported model output, prompt-injection handling, resolution replay, and rejection when leader and validator observe different source snapshots. They do not replace live consensus tests. The deployed transactions above predate the new source manifest and must not be presented as verifying that hardening. The local preview mode remains illustrative and does not send transactions.

## Important limitations

- The organizer submits the guarantee text and public URLs; ShowCall does not authenticate event domains or verify that a page belongs to the organizer.
- The Insomnia verification uses a synthetic ticket commitment and does not establish that a real ticket was purchased or that any particular buyer qualifies for a refund.
- Ticket commitments are not encrypted. Low-entropy ticket codes can be guessed from their hashes; organizers should use high-entropy references.
- Public pages can change, disappear, or contain prompt-injection text. The current source fails closed on unavailable sources and requires an identical fingerprint across leader and validator fetches. It directs validators to ignore embedded instructions, but source authenticity remains unverified.
- Issued ticket commitments are public and are not bound to a ticket holder's wallet. Anyone who knows an issued commitment could open its first claim. Use synthetic references for demos; real-ticket use requires holder authorization.
- No refund, credit, or replacement is automatically fulfilled. The contract records the adjudicated outcome only.
- Preview mode uses an illustrative fixture and a local rule mapping; only live mode invokes GenLayer.

## Foundation

The app scaffold started from the [official GenLayer project boilerplate](https://github.com/genlayerlabs/genlayer-project-boilerplate) (MIT licensed). ShowCall-specific contract and UI code is maintained here under the same license.
