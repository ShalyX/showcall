"""Direct-mode coverage for the ShowCall claim lifecycle."""

import json
import sys


def _register(contract):
    return contract.register_event(
        "harbor-sessions-2026",
        "Harbor Sessions",
        "2026-11-14",
        "If the event is cancelled, ticket holders may choose a refund or a replacement date. A date change under 30 days qualifies for a replacement ticket.",
        "https://events.example.org/harbor-sessions/guarantee",
        "https://events.example.org/harbor-sessions",
        ["a" * 64],
    )


def _open_claim(contract):
    return contract.open_claim(
        "harbor-sessions-2026",
        "a" * 64,
        "CANCELLED",
        "https://events.example.org/harbor-sessions/notices/cancelled",
    )


def test_register_and_read_event(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/showcall.py")
    direct_vm.sender = direct_alice

    assert _register(contract) == "harbor-sessions-2026"
    event = contract.get_event("harbor-sessions-2026")
    assert event["title"] == "Harbor Sessions"
    assert event["organizer"]
    assert contract.get_events() == [event]


def test_duplicate_event_fails(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/showcall.py")
    direct_vm.sender = direct_alice
    _register(contract)

    with direct_vm.expect_revert("Event ID already registered"):
        _register(contract)


def test_open_claim_keeps_only_ticket_commitment(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/showcall.py")
    direct_vm.sender = direct_alice
    _register(contract)

    claim_id = _open_claim(contract)
    claim = contract.get_claim(claim_id)
    assert claim["status"] == "OPEN"
    assert claim["ticket_commitment"] == "a" * 64
    assert "ticket_number" not in claim
    assert contract.get_claims("harbor-sessions-2026") == [claim]


def test_claim_requires_supported_change(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/showcall.py")
    direct_vm.sender = direct_alice
    _register(contract)

    with direct_vm.expect_revert("Unsupported event change"):
        contract.open_claim(
            "harbor-sessions-2026",
            "b" * 64,
            "SURPRISE",
            "https://events.example.org/notice",
        )


def test_unissued_ticket_commitment_cannot_open_claim(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/showcall.py")
    direct_vm.sender = direct_alice
    _register(contract)

    with direct_vm.expect_revert("Ticket commitment was not issued for this event"):
        contract.open_claim(
            "harbor-sessions-2026",
            "b" * 64,
            "CANCELLED",
            "https://events.example.org/notice",
        )


def test_resolve_claim_records_consensus_result(direct_vm, direct_deploy, direct_alice, monkeypatch):
    contract = direct_deploy("contracts/showcall.py")
    direct_vm.sender = direct_alice
    _register(contract)
    claim_id = _open_claim(contract)

    direct_vm.mock_web(
        r".*events\.example\.org/.*",
        {"status": 200, "body": "Harbor Sessions: the 14 November date has been cancelled by the organizer."},
    )
    # The pinned direct VM does not yet dispatch ExecPromptTemplate, which is
    # the GenLayer SDK call used by prompt_non_comparative. Keep this test
    # focused on the persisted claim lifecycle and fetched evidence.
    contract_module = sys.modules[contract.__class__.__module__]

    def assess(prompt, **_kwargs):
        evidence_prompt = prompt()
        assert "cancelled by the organizer" in evidence_prompt
        return json.dumps({
            "decision": "REFUND",
            "reason": "The official notice confirms cancellation and the guarantee offers a refund.",
            "evidence": "Organizer cancellation notice for the listed event date.",
        })

    monkeypatch.setattr(
        contract_module.gl.eq_principle,
        "prompt_non_comparative",
        assess,
    )

    result = contract.resolve_claim(claim_id)
    stored = contract.get_claim(claim_id)

    assert result["decision"] == "REFUND"
    assert stored["status"] == "RESOLVED"
    assert stored["decision"] == "REFUND"
    assert "ticket_commitment" in stored


def test_resolved_claim_cannot_be_resolved_again(direct_vm, direct_deploy, direct_alice, monkeypatch):
    contract = direct_deploy("contracts/showcall.py")
    direct_vm.sender = direct_alice
    _register(contract)
    claim_id = _open_claim(contract)

    direct_vm.mock_web(
        r".*events\.example\.org/.*",
        {"status": 200, "body": "No change to the event."},
    )
    contract_module = sys.modules[contract.__class__.__module__]
    monkeypatch.setattr(
        contract_module.gl.eq_principle,
        "prompt_non_comparative",
        lambda prompt, **_kwargs: json.dumps({
            "decision": "NO_CHANGE",
            "reason": "No official change is shown.",
            "evidence": "Event page",
        }),
    )
    contract.resolve_claim(claim_id)

    with direct_vm.expect_revert("Claim is already resolved"):
        contract.resolve_claim(claim_id)
