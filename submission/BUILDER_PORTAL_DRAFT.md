# GenLayer Builder Portal draft

## Contribution type

Project / app powered by a GenLayer Intelligent Contract.

## Title

ShowCall: event guarantee claims with public evidence

## Short description

ShowCall applies an event organizer’s published ticket guarantee to public event notices. GenLayer validators assess the evidence and record a bounded claim outcome on-chain.

## Project description

Event guarantees are easy to publish and harder to apply consistently when dates, venues, or lineups change. ShowCall stores an organizer’s voluntary guarantee and the public pages that describe the policy and event. A ticket holder can open a claim using a ticket reference that is hashed in the browser before it reaches the contract. GenLayer validators read the published policy, event page, and notice, then record one of five outcomes: refund, credit, replacement, no change, or needs evidence.

The first version records decisions only. It does not send money, verify statutory rights, or prove that a submitted web page belongs to an organizer. ShowCall has an existing StudioNet deployment and a Vercel preview; the source-provenance hardening below is implemented in the repository but still needs a new deployment and wallet QA. The earlier deployment finalized an i74 cancellation claim as `REFUND`, but its transaction did not verify domain ownership. All test ticket commitments are synthetic and do not represent real ticket purchases or buyer entitlements.

## GenLayer use

The current contract source uses `gl.vm.run_nondet_unsafe` with independent leader and validator fetches and assessments. Each run returns the bounded decision plus exact source URLs, fetch status, and SHA-256 fingerprints for the rendered text and reviewed excerpt. State is written only when validators reproduce the decision and every fingerprint. Missing sources return `NEEDS_EVIDENCE`; a changed source snapshot rejects resolution for retry. Source origins remain explicitly unverified: fingerprints identify fetched content but do not prove domain ownership. Page content is treated as untrusted evidence.

## Demo flow

1. Register an event with a voluntary guarantee, policy URL, event URL, and ticket commitments.
2. Open a claim using a ticket reference; the browser submits only its SHA-256 commitment.
3. Resolve the claim against the policy, event, and incident notice pages.
4. Show the finalized on-chain decision and evidence summary.

## Live evidence

- Public repository: https://github.com/ShalyX/showcall

- App preview: https://showcall-genlayer.vercel.app
- Contract: https://explorer-studio.genlayer.com/address/0x03C0D1E99cc766b9d24b29cC0FE3FD596e29C902
- Deploy transaction: https://explorer-studio.genlayer.com/tx/0xf27475b45b6568e6653cc7bc4dc13b9b5792f4fb9c608c35f9cfe8fb8bf615cf
- Synthetic fail-closed resolution on an earlier deployment (`NEEDS_EVIDENCE`): https://explorer-studio.genlayer.com/tx/0xd28eb0abb2c78d5f11efc50378ec8fd61b388ff49b94d04801f96c3bcb68a712
- Unavailable-source i74 resolution on an earlier deployment (`NEEDS_EVIDENCE`): https://explorer-studio.genlayer.com/tx/0x7809b7ceeb1c395ddca18acbc00ba803058a9bc3b77c53eb7748e8a429ee5c85
- Official-source i74 cancellation resolution (`REFUND`, synthetic ticket commitment): https://explorer-studio.genlayer.com/tx/0x380581ab34949842e60f524998e1a175959f4297956fdcc0338f5b50676ce94e
- Wallet UI QA guarantee registration: https://explorer-studio.genlayer.com/tx/0x849c74cea283bb9817cd000019ee86228ed4915f9c00c0ca6e5b3f76bfad8bf1
- Wallet UI QA cancellation claim: https://explorer-studio.genlayer.com/tx/0xe8cfaa6d4df37a23c60653c7e8f5ac620992ea0e31cdeb9d0311d2a0cccbd612
- Wallet UI QA finalized `REFUND`: https://explorer-studio.genlayer.com/tx/0x3cd4d22ffde6b6d2064e10291cf3d3100247afd82d388a452d69224e5f2610d3
- Policy: https://www.insomniagamingfestival.com/event-terms-conditions
- Event details and cancellation notice: https://www.insomniagamingfestival.com/

## Response to requested improvements

The repository now records a per-claim source manifest and requires the leader and validator to independently fetch the same content snapshot before a decision is stored. The UI exposes the fetch result and hashes while labeling every source origin unverified. Focused direct-mode tests cover duplicate event registration, invalid and unissued claims, one-use ticket commitments, source outage, malformed model output, resolution replay, and source drift between leader and validator. The new contract needs a StudioNet deployment and live wallet QA before these protections can be claimed as live.

One limitation remains explicit: issued commitments are public and are not bound to a ticket holder's wallet, so a holder is not authenticated by this prototype. Use synthetic references for demonstration; real-ticket use requires holder authorization.

## Submission status

Wallet UI QA is complete for the earlier StudioNet version. The source-provenance hardening is not yet deployed or live-verified; add its new contract address and transaction receipts here after deployment. No real ticket or refund entitlement is implied. The Portal's demo-video field is optional.

Do not describe the local preview or mocked tests as a live GenLayer consensus result.
Do not describe any synthetic ticket commitment as a real ticket or consumer claim.
