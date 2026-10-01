# GenLayer Builder Portal draft

## Contribution type

Project / app powered by a GenLayer Intelligent Contract.

## Title

ShowCall: event guarantee claims with public evidence

## Short description

ShowCall applies an event organizer’s published ticket guarantee to public event notices. GenLayer validators assess the evidence and record a bounded claim outcome on-chain.

## Project description

Event guarantees are easy to publish and harder to apply consistently when dates, venues, or lineups change. ShowCall stores an organizer’s voluntary guarantee and the public pages that describe the policy and event. A ticket holder can open a claim using a ticket reference that is hashed in the browser before it reaches the contract. GenLayer validators read the published policy, event page, and notice, then record one of five outcomes: refund, credit, replacement, no change, or needs evidence.

The first version records decisions only. It does not send money, verify statutory rights, or prove that a submitted web page belongs to an organizer. The latest contract is deployed to StudioNet and the app is available as a Vercel preview. The latest deployment finalized a verified official-source i74 cancellation claim as `REFUND`. Earlier live checks also confirmed fail-closed `NEEDS_EVIDENCE` outcomes for synthetic and unavailable sources. All test ticket commitments are synthetic and do not represent real ticket purchases or buyer entitlements.

## GenLayer use

The contract uses `gl.eq_principle.prompt_non_comparative` to interpret public web evidence against guarantee text fixed in contract state. Validators must converge on the same bounded result before the contract stores it. The page content is treated as untrusted evidence, and unclear or conflicting evidence should produce `NEEDS_EVIDENCE`.

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

## Submission status

Wallet UI QA is complete on StudioNet. The published synthetic guarantee and its cancellation claim resolve to `REFUND`; no real ticket or refund entitlement is implied. The Portal's demo-video field is optional, so the live app and transaction links provide the review path.

Do not describe the local preview or mocked tests as a live GenLayer consensus result.
Do not describe any synthetic ticket commitment as a real ticket or consumer claim.
