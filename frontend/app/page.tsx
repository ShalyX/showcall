"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Fingerprint,
  Globe2,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Radio,
  ShieldCheck,
  Ticket,
  X,
} from "lucide-react";
import { createGenLayerClient, getContractAddress } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/wallet";
import { estimateWriteFeePreset, feePresetToTransactionFees } from "@/lib/genlayer/fees";

type EventRecord = {
  event_id: string;
  title: string;
  show_date: string;
  guarantee: string;
  policy_url: string;
  event_url: string;
  organizer?: string;
  ticket_commitments?: string[];
};

type ClaimRecord = {
  claim_id: string;
  event_id: string;
  ticket_commitment: string;
  claimed_change: string;
  incident_url: string;
  buyer?: string;
  status: "OPEN" | "RESOLVED";
  decision: string;
  reason: string;
  evidence?: string;
  source_manifest?: SourceManifest[];
};

type SourceManifest = {
  role: string;
  url: string;
  origin_status: "UNVERIFIED";
  fetch_status: "FETCHED" | "UNAVAILABLE";
  rendered_text_sha256: string;
  reviewed_excerpt_sha256: string;
  reviewed_excerpt_characters: number;
};

const PREVIEW_EVENT: EventRecord = {
  event_id: "harbor-sessions-demo",
  title: "Harbor Sessions: Night 02",
  show_date: "14 November 2026",
  guarantee:
    "If the event is cancelled, ticket holders may choose a refund or replacement date. A date change within 30 days qualifies for a replacement ticket. A material lineup change qualifies for event credit.",
  policy_url: "https://example.org/harbor-sessions/guarantee",
  event_url: "https://example.org/harbor-sessions",
  organizer: "0x52a1…7C91",
  ticket_commitments: ["372e5ae742eaeb3838eea769b1ba5fb25b6f29a6674c2dbce2deca787503aa4a"],
};

const PREVIEW_CLAIM: ClaimRecord = {
  claim_id: "harbor-sessions-demo:preview-claim-02",
  event_id: PREVIEW_EVENT.event_id,
  ticket_commitment: "372e5ae742eaeb3838eea769b1ba5fb25b6f29a6674c2dbce2deca787503aa4a",
  claimed_change: "RESCHEDULED",
  incident_url: "https://example.org/harbor-sessions/notices/date-change",
  buyer: "0x8D1c…13B4",
  status: "OPEN",
  decision: "",
  reason: "",
  evidence: "",
};

const EMPTY_EVENT_FORM = {
  title: "",
  showDate: "",
  guarantee: "",
  policyUrl: "",
  eventUrl: "",
  ticketRefs: "",
};

const EMPTY_CLAIM_FORM = {
  ticketCode: "",
  change: "RESCHEDULED",
  incidentUrl: "",
};

function shortId(value?: string) {
  if (!value) return "Not connected";
  if (value.length < 15) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function eventSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

async function hashTicketReference(reference: string) {
  const bytes = new TextEncoder().encode(reference.trim());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (part) =>
    part.toString(16).padStart(2, "0"),
  ).join("");
}

function StagePill({ status }: { status: "OPEN" | "RESOLVED" }) {
  return (
    <span className={`stage-pill ${status === "OPEN" ? "stage-open" : "stage-done"}`}>
      <span className="stage-dot" />
      {status === "OPEN" ? "Awaiting decision" : "Decision recorded"}
    </span>
  );
}

export default function HomePage() {
  const { address, isConnected, isOnCorrectNetwork, isLoading, connectWallet } = useWallet();
  const contractAddress = getContractAddress();
  const liveMode = Boolean(contractAddress);

  const [events, setEvents] = useState<EventRecord[]>(liveMode ? [] : [PREVIEW_EVENT]);
  const [claims, setClaims] = useState<ClaimRecord[]>(liveMode ? [] : [PREVIEW_CLAIM]);
  const [activeClaimId, setActiveClaimId] = useState(liveMode ? "" : PREVIEW_CLAIM.claim_id);
  const [selectedEventId, setSelectedEventId] = useState(liveMode ? "" : PREVIEW_EVENT.event_id);
  const [claimEventId, setClaimEventId] = useState(liveMode ? "" : PREVIEW_EVENT.event_id);
  const [activeView, setActiveView] = useState<"claims" | "guarantees">("claims");
  const [modal, setModal] = useState<"event" | "claim" | null>(null);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [claimForm, setClaimForm] = useState(EMPTY_CLAIM_FORM);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const activeClaim = activeClaimId
    ? claims.find((claim) => claim.claim_id === activeClaimId) ?? claims[0]
    : undefined;
  const activeEvent = events.find((event) => event.event_id === (activeClaim?.event_id ?? selectedEventId));
  const claimEvent = events.find((event) => event.event_id === claimEventId) ?? activeEvent;
  const openCount = claims.filter((claim) => claim.status === "OPEN").length;
  const resolvedCount = claims.filter((claim) => claim.status === "RESOLVED").length;

  const loadContractData = useCallback(async () => {
    if (!contractAddress) return;
    const client: any = createGenLayerClient();
    try {
      const [eventResult, claimResult] = await Promise.all([
        client.readContract({ address: contractAddress, functionName: "get_events", args: [] }),
        client.readContract({ address: contractAddress, functionName: "get_claims", args: [""] }),
      ]);
      const nextEvents = Array.isArray(eventResult) ? (eventResult as EventRecord[]) : [];
      const nextClaims = Array.isArray(claimResult) ? (claimResult as ClaimRecord[]) : [];
      setEvents(nextEvents);
      setClaims(nextClaims);
      setSelectedEventId((current) => nextEvents.some((event) => event.event_id === current)
        ? current
        : nextEvents[0]?.event_id ?? "");
      setActiveClaimId((current) => nextClaims.some((claim) => claim.claim_id === current)
        ? current
        : nextClaims[0]?.claim_id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read ShowCall from GenLayer.");
    }
  }, [contractAddress]);

  useEffect(() => {
    if (liveMode) void loadContractData();
  }, [liveMode, loadContractData]);

  const submitTransaction = async (functionName: string, args: unknown[]) => {
    if (!contractAddress) throw new Error("Set NEXT_PUBLIC_CONTRACT_ADDRESS to use the live contract.");
    if (!address || !isConnected) throw new Error("Connect a wallet to continue.");
    if (!isOnCorrectNetwork) throw new Error("Switch your wallet to GenLayer StudioNet first.");
    const client: any = createGenLayerClient(address);
    const write = {
      address: contractAddress,
      functionName,
      args,
      value: 0n,
    };
    const preset = await estimateWriteFeePreset(client, write as any, "standard");
    const fees = feePresetToTransactionFees(preset);
    const hash = await client.writeContract({ ...write, ...(fees ? { fees } : {}) });
    setNotice(`Transaction submitted: ${shortId(String(hash))}. Waiting for GenLayer consensus…`);
    if (typeof client.waitForFinalization === "function") {
      await client.waitForFinalization({ hash, interval: 4000, retries: 90 });
    } else if (typeof client.waitForTransactionReceipt === "function") {
      await client.waitForTransactionReceipt({ hash, status: "FINALIZED", interval: 4000, retries: 90 });
    }
    return hash;
  };

  const publishEvent = async (eventFormEvent: FormEvent<HTMLFormElement>) => {
    eventFormEvent.preventDefault();
    setError("");
    setNotice("");
    if (!eventForm.title.trim() || !eventForm.showDate || !eventForm.guarantee.trim()) {
      setError("Add the event name, date, and guarantee terms.");
      return;
    }
    if (!/^https:\/\//i.test(eventForm.policyUrl) || !/^https:\/\//i.test(eventForm.eventUrl)) {
      setError("Use public HTTPS links for the guarantee and event pages.");
      return;
    }
    const ticketRefs = eventForm.ticketRefs.split(/\r?\n/).map((ref) => ref.trim()).filter(Boolean);
    if (ticketRefs.length === 0 || ticketRefs.length > 200) {
      setError("Add between 1 and 200 ticket references. Their hashes are registered with the guarantee.");
      return;
    }
    setBusy("event");
    try {
      const id = eventSlug(eventForm.title);
      const ticketCommitments = await Promise.all(ticketRefs.map(hashTicketReference));
      if (liveMode) {
        await submitTransaction("register_event", [
          id,
          eventForm.title.trim(),
          eventForm.showDate,
          eventForm.guarantee.trim(),
          eventForm.policyUrl.trim(),
          eventForm.eventUrl.trim(),
          ticketCommitments,
        ]);
        await loadContractData();
        setSelectedEventId(id);
        setActiveClaimId("");
        setNotice("Guarantee registered on GenLayer.");
      } else {
        const demoEvent: EventRecord = {
          event_id: id,
          title: eventForm.title.trim(),
          show_date: new Date(`${eventForm.showDate}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
          guarantee: eventForm.guarantee.trim(),
          policy_url: eventForm.policyUrl.trim(),
          event_url: eventForm.eventUrl.trim(),
          organizer: shortId(address ?? "Preview organizer"),
          ticket_commitments: ticketCommitments,
        };
        setEvents((current) => [...current.filter((item) => item.event_id !== id), demoEvent]);
        setSelectedEventId(id);
        setActiveClaimId("");
        setNotice("Preview guarantee added locally. No wallet transaction was sent.");
      }
      setEventForm(EMPTY_EVENT_FORM);
      setModal(null);
      setActiveView("guarantees");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register this guarantee.");
    } finally {
      setBusy("");
    }
  };

  const submitClaim = async (claimFormEvent: FormEvent<HTMLFormElement>) => {
    claimFormEvent.preventDefault();
    setError("");
    setNotice("");
    if (!claimEvent) {
      setError("Publish or select an event guarantee before opening a claim.");
      return;
    }
    if (claimForm.ticketCode.trim().length < 4 || !/^https:\/\//i.test(claimForm.incidentUrl)) {
      setError("Add your ticket reference and a public HTTPS incident notice.");
      return;
    }
    setBusy("claim");
    try {
      const commitment = await hashTicketReference(claimForm.ticketCode);
      if (liveMode) {
        await submitTransaction("open_claim", [claimEvent.event_id, commitment, claimForm.change, claimForm.incidentUrl.trim()]);
        await loadContractData();
        setNotice("Claim opened on GenLayer. Your ticket reference was hashed in your browser.");
      } else {
        if (!claimEvent.ticket_commitments?.includes(commitment)) {
          throw new Error("That ticket reference is not in this preview guarantee’s issued ticket list.");
        }
        const claim: ClaimRecord = {
          claim_id: `${claimEvent.event_id}:${commitment}`,
          event_id: claimEvent.event_id,
          ticket_commitment: `${commitment.slice(0, 16)}…`,
          claimed_change: claimForm.change,
          incident_url: claimForm.incidentUrl.trim(),
          buyer: shortId(address ?? "Preview buyer"),
          status: "OPEN",
          decision: "",
          reason: "",
          evidence: "",
        };
        setClaims((current) => [claim, ...current]);
        setActiveClaimId(claim.claim_id);
        setSelectedEventId(claimEvent.event_id);
        setNotice("Preview claim opened locally. No wallet transaction was sent.");
      }
      setClaimForm(EMPTY_CLAIM_FORM);
      setModal(null);
      setActiveView("claims");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open this claim.");
    } finally {
      setBusy("");
    }
  };

  const resolveClaim = async () => {
    if (!activeClaim || !activeEvent) return;
    setBusy("resolve");
    setError("");
    setNotice("");
    try {
      if (liveMode) {
        await submitTransaction("resolve_claim", [activeClaim.claim_id]);
        await loadContractData();
        setNotice("GenLayer finalized the claim decision.");
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 1100));
        const decision = activeClaim.claimed_change === "CANCELLED"
          ? "REFUND"
          : activeClaim.claimed_change === "RESCHEDULED"
            ? "REPLACEMENT"
            : activeClaim.claimed_change === "LINEUP_CHANGE"
              ? "CREDIT"
              : "NEEDS_EVIDENCE";
        setClaims((current) => current.map((claim) => claim.claim_id === activeClaim.claim_id
          ? {
              ...claim,
              status: "RESOLVED",
              decision,
              reason: decision === "REPLACEMENT"
                ? "The organizer’s posted guarantee offers a replacement ticket for a rescheduled show."
                : `The preview rule maps this claim to ${decision.toLowerCase().replaceAll("_", " ")}.`,
              evidence: "Illustrative preview result. No pages were fetched and no GenLayer transaction was sent.",
            }
          : claim));
        setNotice("Preview result recorded in this page only. Connect the deployed contract for a validator decision.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resolve this claim.");
    } finally {
      setBusy("");
    }
  };

  const handleConnect = async () => {
    setError("");
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection was not completed.");
    }
  };

  const filteredClaims = useMemo(() => activeView === "claims" ? claims : [], [activeView, claims]);

  return (
    <div className="app-frame">
      <header className="topbar">
        <a className="brand-lockup" href="#top" aria-label="ShowCall home">
          <span className="brand-mark"><span /></span>
          <span>showcall</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={activeView === "claims" ? "nav-link is-active" : "nav-link"} onClick={() => setActiveView("claims")}>Claims <span>{claims.length.toString().padStart(2, "0")}</span></button>
          <button className={activeView === "guarantees" ? "nav-link is-active" : "nav-link"} onClick={() => setActiveView("guarantees")}>Guarantees <span>{events.length.toString().padStart(2, "0")}</span></button>
          <a className="nav-link nav-docs" href="https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer" target="_blank" rel="noreferrer">How it works <ExternalLink size={13} /></a>
        </nav>
        <div className="header-actions">
          <div className={`network-tag ${liveMode ? "network-live" : "network-preview"}`}><span />{liveMode ? "StudioNet" : "Preview"}</div>
          {isConnected ? (
            <button className="wallet-button connected" title={isOnCorrectNetwork ? "Connected to GenLayer" : "Switch to GenLayer"} onClick={() => void handleConnect()}>
              <span className={`wallet-light ${isOnCorrectNetwork ? "" : "wallet-warning"}`} />{shortId(address ?? "")}
            </button>
          ) : (
            <button className="wallet-button" disabled={isLoading} onClick={() => void handleConnect()}>
              {isLoading ? <LoaderCircle size={14} className="spin" /> : <Fingerprint size={15} />}
              {isLoading ? "Checking" : "Connect wallet"}
            </button>
          )}
        </div>
      </header>

      <main id="top" className="main-content">
        <section className="intro-row">
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-square" /> TICKET GUARANTEES · GENLAYER</div>
            <h1>When the show changes,<br /><em>the terms still hold.</em></h1>
            <p>ShowCall applies an organizer’s published guarantee to event changes. Each claim gets a decision backed by public evidence and GenLayer consensus.</p>
          </div>
          <div className="intro-note">
            <div className="note-icon"><Radio size={17} /></div>
            <div><strong>One shared record</strong><span>Terms, evidence and claim outcome stay together.</span></div>
            <ArrowDownRight size={17} className="note-arrow" />
          </div>
        </section>

        <section className="workspace" aria-label="ShowCall workspace">
          <div className="workspace-head">
            <div className="workspace-title">
              <span className="workspace-mark">SC</span>
              <div><strong>Claim desk</strong><span>{liveMode ? "Live contract data" : "Interactive preview · sample data"}</span></div>
            </div>
            <div className="workspace-actions">
              {liveMode && <button className="icon-button" aria-label="Refresh contract data" onClick={() => void loadContractData()}><Radio size={15} /></button>}
              <button className="quiet-button" onClick={() => { setError(""); setModal("event"); }}><Plus size={15} /> Publish guarantee</button>
              <button className="primary-button" onClick={() => { setError(""); setClaimEventId(selectedEventId || activeEvent?.event_id || events[0]?.event_id || ""); setModal("claim"); }}><Ticket size={15} /> Start a claim</button>
            </div>
          </div>

          <div className="summary-strip">
            <div><span className="summary-label">IN REVIEW</span><strong>{String(openCount).padStart(2, "0")}</strong></div>
            <div><span className="summary-label">DECISIONS</span><strong>{String(resolvedCount).padStart(2, "0")}</strong></div>
            <div><span className="summary-label">GUARANTEES</span><strong>{String(events.length).padStart(2, "0")}</strong></div>
            <div className="summary-end"><span className="chain-glyph">G</span><span>{liveMode ? "GenLayer contract connected" : "Preview — no transaction sent"}</span></div>
          </div>

          <div className="desk-grid">
            <section className="claim-list-panel">
              <div className="panel-heading">
                <div><div className="eyebrow tiny">WORK QUEUE</div><h2>{activeView === "claims" ? "Claims" : "Published guarantees"}</h2></div>
                <span className="panel-count">{String(activeView === "claims" ? claims.length : events.length).padStart(2, "0")}</span>
              </div>

              {activeView === "claims" ? (
                filteredClaims.length ? (
                  <div className="claim-list">
                    {filteredClaims.map((claim) => {
                      const event = events.find((item) => item.event_id === claim.event_id);
                      return (
                        <button key={claim.claim_id} className={`claim-row ${activeClaim?.claim_id === claim.claim_id ? "selected" : ""}`} onClick={() => { setActiveClaimId(claim.claim_id); setSelectedEventId(claim.event_id); }}>
                          <span className="claim-row-icon"><Ticket size={16} /></span>
                          <span className="claim-row-copy"><strong>{event?.title ?? claim.event_id}</strong><span>{claim.claimed_change.toLowerCase().replaceAll("_", " ")} · {shortId(claim.claim_id.split(":")[1])}</span></span>
                          <span className={`row-status ${claim.status === "OPEN" ? "row-status-open" : "row-status-done"}`} title={claim.status}>{claim.status === "OPEN" ? <Clock3 size={14} /> : <Check size={14} />}</span>
                          <ChevronRight size={15} className="row-chevron" />
                        </button>
                      );
                    })}
                  </div>
                ) : <div className="empty-state"><Ticket size={22} /><strong>No claims yet</strong><span>Open the first ticket claim to start a review.</span><button onClick={() => setModal("claim")}>Start a claim <ArrowUpRight size={14} /></button></div>
              ) : (
                <div className="guarantee-list">
                  {events.map((event) => <button key={event.event_id} className={`guarantee-row ${selectedEventId === event.event_id ? "selected" : ""}`} onClick={() => { setSelectedEventId(event.event_id); const match = claims.find((claim) => claim.event_id === event.event_id); setActiveClaimId(match?.claim_id ?? ""); }}><span className="guarantee-calendar"><span>{event.show_date.slice(0, 3).toUpperCase()}</span><strong>{event.show_date.match(/\d+/)?.[0] ?? "—"}</strong></span><span className="claim-row-copy"><strong>{event.title}</strong><span>Guarantee published · {shortId(event.organizer)}</span></span><ChevronRight size={15} className="row-chevron" /></button>)}
                </div>
              )}

              <div className="queue-footer"><span className="mini-live" /> {liveMode ? "Synced with the Intelligent Contract" : "Sample case is illustrative"}</div>
            </section>

            <section className="case-panel">
              {activeClaim && activeEvent ? (
                <>
                  <div className="case-topline"><div className="eyebrow tiny">CASE / {activeClaim.claim_id.slice(-8).toUpperCase()}</div><StagePill status={activeClaim.status} /></div>
                  <div className="case-title-row"><div><span className="change-label">{activeClaim.claimed_change.replaceAll("_", " ")}</span><h2>{activeEvent.title}</h2><p>Scheduled for {activeEvent.show_date}</p></div><div className="ticket-stamp"><Ticket size={19} /><span>TICKET<br />COMMITMENT</span></div></div>

                  <div className="ticket-art" aria-label="Illustrative event ticket">
                    <div className="ticket-art-copy"><span>SHOWCALL PRESENTS</span><strong>HARBOR<br />SESSIONS</strong><small>NIGHT 02 · WATERFRONT STAGE</small></div>
                    <div className="ticket-art-date"><span>14</span><small>NOV<br />2026</small></div>
                    <div className="ticket-perforation" />
                    <div className="ticket-code"><span>ENTRY</span><strong>SC—{activeClaim.claim_id.slice(-4).toUpperCase()}</strong><div className="barcode"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div>
                  </div>
                  <div className="ticket-caption"><span><LockKeyhole size={13} /> Ticket ID hidden</span><code>{activeClaim.ticket_commitment}</code></div>

                  <div className="section-divider"><span>PUBLIC EVIDENCE</span><span>3 SOURCES</span></div>
                  <div className="evidence-list">
                    <a className="evidence-row" href={activeEvent.policy_url} target="_blank" rel="noreferrer" aria-disabled={!liveMode} onClick={(event) => { if (!liveMode) event.preventDefault(); }}><span className="evidence-icon"><FileText size={15} /></span><span><strong>Guarantee terms</strong><small>{liveMode ? "Submitted URL · origin unverified" : "Illustrative preview source · not fetched"}</small></span><ExternalLink size={14} /></a>
                    <a className="evidence-row" href={activeClaim.incident_url} target="_blank" rel="noreferrer" aria-disabled={!liveMode} onClick={(event) => { if (!liveMode) event.preventDefault(); }}><span className="evidence-icon evidence-alert"><Globe2 size={15} /></span><span><strong>Change notice</strong><small>{liveMode ? "Claimant submitted · origin unverified" : "Illustrative preview source · not fetched"}</small></span><ExternalLink size={14} /></a>
                  </div>

                  <div className="guarantee-excerpt"><div className="excerpt-label"><ShieldCheck size={14} /> GUARANTEE SNAPSHOT <span>{liveMode ? "ON-CHAIN" : "PREVIEW"}</span></div><p>“{activeEvent.guarantee}”</p><a href={activeEvent.event_url} target="_blank" rel="noreferrer" aria-disabled={!liveMode} onClick={(event) => { if (!liveMode) event.preventDefault(); }}>{liveMode ? "View submitted event URL · origin unverified" : "Preview source not fetched"} <ExternalLink size={12} /></a></div>

                  {activeClaim.status === "RESOLVED" ? (
                    <div className="decision-card"><div className="decision-head"><span className="decision-check"><Check size={15} /></span><div><span>GENLAYER DECISION</span><strong>{activeClaim.decision}</strong></div><span className="decision-chain">{liveMode ? "FINALIZED" : "PREVIEW"}</span></div><p>{activeClaim.reason}</p><small>{activeClaim.evidence}</small>{activeClaim.source_manifest?.length ? <div className="source-manifest"><strong>Resolution source fingerprints</strong>{activeClaim.source_manifest.map((source) => <div className="source-fingerprint" key={source.role}><span>{source.role.replaceAll("_", " ")} · {source.fetch_status.toLowerCase()} · origin unverified</span><code>{source.rendered_text_sha256 ? `SHA-256 ${source.rendered_text_sha256}` : "No content hash: fetch failed"}</code></div>)}</div> : null}</div>
                  ) : (
                    <div className="decision-callout"><div className="callout-copy"><span className="callout-icon"><CircleHelp size={16} /></span><span><strong>Ready for review</strong><small>Validators compare the event notice to the guarantee.</small></span></div><button className="primary-button resolve-button" onClick={() => void resolveClaim()} disabled={Boolean(busy)}>{busy === "resolve" ? <><LoaderCircle size={15} className="spin" /> {liveMode ? "Waiting on consensus" : "Reviewing evidence"}</> : <><FileCheck2 size={15} /> {liveMode ? "Resolve with GenLayer" : "Run preview decision"}</>}</button></div>
                  )}
                </>
              ) : (
                <div className="empty-detail"><Ticket size={26} /><strong>Select a claim</strong><span>Choose a case from the queue or open a new one.</span></div>
              )}
            </section>
          </div>

          {(notice || error) && <div className={error ? "feedback feedback-error" : "feedback feedback-notice"} role="status"><span>{error || notice}</span><button aria-label="Dismiss message" onClick={() => { setNotice(""); setError(""); }}><X size={14} /></button></div>}
        </section>

        <section className="process-row" aria-label="How ShowCall works">
          <div className="process-intro"><span className="eyebrow tiny">A CLEARER SHOW MUST GO ON</span><strong>One promise.<br />One answer.</strong></div>
          <div className="process-step"><span>01</span><div><strong>Terms are set</strong><small>Organizer publishes a voluntary guarantee and its source before tickets move.</small></div></div>
          <div className="process-step"><span>02</span><div><strong>Notice is checked</strong><small>Validators fetch the posted terms and event-change notice independently.</small></div></div>
          <div className="process-step"><span>03</span><div><strong>Outcome is recorded</strong><small>GenLayer consensus stores a structured claim decision for both sides.</small></div></div>
        </section>

        <footer className="page-footer"><a className="brand-lockup footer-brand" href="#top"><span className="brand-mark"><span /></span><span>showcall</span></a><span>Voluntary ticket guarantees · not legal advice</span><a href="https://portal.genlayer.foundation/builders" target="_blank" rel="noreferrer">Built for GenLayer Builders <ExternalLink size={12} /></a></footer>
      </main>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setModal(null); }}>
          <section className="form-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <button className="modal-close" aria-label="Close dialog" onClick={() => setModal(null)} disabled={Boolean(busy)}><X size={18} /></button>
            <div className="eyebrow tiny">{modal === "event" ? "ORGANIZER FLOW" : "TICKET HOLDER FLOW"}</div>
            <h2 id="modal-title">{modal === "event" ? "Publish a guarantee" : "Open a ticket claim"}</h2>
            <p className="modal-intro">{modal === "event" ? "Set the voluntary terms before a show changes. They become the rule validators apply." : "Your ticket reference is hashed in this browser. Only its commitment is stored with the claim."}</p>

            {modal === "event" ? (
              <form onSubmit={publishEvent} className="form-stack">
                <label>Event name<input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Harbor Sessions: Night 02" maxLength={100} required /></label>
                <label>Show date<input type="date" value={eventForm.showDate} onChange={(e) => setEventForm({ ...eventForm, showDate: e.target.value })} required /></label>
                <label>Guarantee terms<textarea value={eventForm.guarantee} onChange={(e) => setEventForm({ ...eventForm, guarantee: e.target.value })} placeholder="If the event is cancelled…" maxLength={2000} rows={4} required /></label>
                <label>Issued ticket references<textarea value={eventForm.ticketRefs} onChange={(e) => setEventForm({ ...eventForm, ticketRefs: e.target.value })} placeholder="Paste one issued ticket code per line" rows={3} required /></label>
                <label>Published guarantee URL<input type="url" value={eventForm.policyUrl} onChange={(e) => setEventForm({ ...eventForm, policyUrl: e.target.value })} placeholder="https://…" required /></label>
                <label>Official event page<input type="url" value={eventForm.eventUrl} onChange={(e) => setEventForm({ ...eventForm, eventUrl: e.target.value })} placeholder="https://…" required /></label>
                <p className="form-footnote"><LockKeyhole size={13} /> Ticket references are hashed in this browser. Their commitments and guarantee terms are public once registered.</p>
                <button className="primary-button form-submit" disabled={Boolean(busy)}>{busy === "event" ? <><LoaderCircle size={15} className="spin" /> Publishing…</> : <><Plus size={15} /> {liveMode ? "Publish to GenLayer" : "Add preview guarantee"}</>}</button>
              </form>
            ) : (
              <form onSubmit={submitClaim} className="form-stack">
                <label>Event guarantee<select value={claimEvent?.event_id ?? ""} onChange={(e) => setClaimEventId(e.target.value)} required>{events.map((event) => <option value={event.event_id} key={event.event_id}>{event.title}</option>)}</select></label>
                <label>Ticket reference<input value={claimForm.ticketCode} onChange={(e) => setClaimForm({ ...claimForm, ticketCode: e.target.value })} placeholder="Printed ticket or booking reference" autoComplete="off" required /></label>
                <label>What changed?<select value={claimForm.change} onChange={(e) => setClaimForm({ ...claimForm, change: e.target.value })}><option value="CANCELLED">Event cancelled</option><option value="RESCHEDULED">Date changed</option><option value="VENUE_CHANGE">Venue changed</option><option value="LINEUP_CHANGE">Material lineup change</option><option value="OTHER">Something else</option></select></label>
                <label>Public change notice URL<input type="url" value={claimForm.incidentUrl} onChange={(e) => setClaimForm({ ...claimForm, incidentUrl: e.target.value })} placeholder="Organizer or venue notice · https://…" required /></label>
                <p className="form-footnote"><LockKeyhole size={13} /> Raw ticket reference stays on your device. Only the SHA-256 commitment is submitted.</p>
                <button className="primary-button form-submit" disabled={Boolean(busy) || events.length === 0}>{busy === "claim" ? <><LoaderCircle size={15} className="spin" /> Opening claim…</> : <><Ticket size={15} /> {liveMode ? "Open claim on GenLayer" : "Add preview claim"}</>}</button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
