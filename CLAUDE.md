# ShowCall contributor notes

ShowCall is a GenLayer Builder contribution: an event-ticket guarantee claims app backed by an Intelligent Contract.

## Contract invariants

- The event guarantee is stored at event registration and is the rule validators apply.
- Only issued ticket commitments can open a claim; each commitment can be used once.
- Raw ticket references are hashed in the browser and never sent as transaction arguments.
- Resolution uses public policy, event, and incident pages inside a GenLayer non-deterministic block.
- Return only one of the bounded decision values in `contracts/showcall.py`.
- An unclear, unavailable, conflicting, or unofficial source must produce `NEEDS_EVIDENCE`.
- Never describe the outcome as legal advice or claim that ShowCall automatically moves ticket funds.

## Commands

- `genvm-lint check contracts/showcall.py`
- `pytest tests/direct/ -v`
- `npm run lint`
- `npm run build`

The preview fixture is not live evidence. A Builder-ready demo still needs a StudioNet deployment and a real-source finalized transaction.
