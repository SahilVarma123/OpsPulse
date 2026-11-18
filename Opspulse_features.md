Here is a complete, clear, and comprehensive breakdown of ResourcePulse AI, explaining how it solves the core problem statement, every feature on the platform, and the full end-to-end workflow.
Part 1: How ResourcePulse AI Tackles the Problem Statement
The Problem in Emergency & Healthcare Logistics
During mass casualty incidents, natural disasters, or power outages, emergency supplies (ambulances, high-flow ICU ventilators, oxygen canisters, blood reserves, emergency generators) are managed across isolated, siloed facilities (e.g., Ward A, Ward C, Pavilion 2).
This leads to 4 critical failures:
Asymmetric Visibility (Information Silos): Facility managers only know their own stock; they cannot see if a facility 5 miles away has an idle surplus.
Delayed Response (Latent Shortages): Deficits are noticed only after reserves reach zero, when it is already too late.
Donor Exhaustion Risk: When people manually coordinate over phone calls or spreadsheets, they often take too much stock from a donor hospital, accidentally pushing the donor facility into a crisis.
"Black Box" AI Distrust: Pure machine learning models often hallucinate or make recommendations that doctors and logistics directors cannot audit or verify mathematically.
How ResourcePulse AI Solves This
ResourcePulse AI uses a hybrid architecture that combines deterministic mathematical invariants with generative AI:
Unified Telemetry: Ingests live hardware, vehicle, and consumable numbers into a single real-time operational cockpit.
Rule-Based Thresholds & Anomaly Flags: Instantly flags critical deficits (
buffer) and sudden demand spikes ( load).

Safe Bilateral Redistribution (
):Ensures transfers are only sourced from verified surpluses. A donor is never drained below its mandatory safety baseline.

Explainable Arithmetic Proofs: Shows the exact math behind every suggested transfer so directors can audit it before authorizing dispatch.
Structured Gemini 3.8 Flash AI: Produces concise, structured JSON executive directives server-side with zero API key exposure and built-in offline fallback.
Part 2: Comprehensive Feature-by-Feature Breakdown
The platform is structured into two main operational environments: Observation & Monitoring and the Coordination Board.

Global Controls & Navigation Bar
A. Demo Scenario Selector
What it does: Allows you to switch between 3 real-world emergency scenarios:
Metro Emergency Surge (Default): An urban mass casualty incident with severe ambulance and oxygen deficits.
Power Grid Substation Failure: A regional blackout causing emergency generator deficits.
Post-Coordination Balanced State: Demonstrates what the network looks like after all transfers have successfully stabilized the system.
Why it exists: Enables instant demonstration of the app under different stress conditions without manual database seeding.
B. Live Telemetry & Manual Refresh Button
What it does: Displays a pulsing green live connection indicator and a refresh button (⟳).
Why it exists: Clicking the refresh button simulates a live sensor polling cycle, triggers a rotation animation, and updates the timestamp ("Just now").
C. Guided Flow Indicator (1 2 3 4)
What it does: A clickable breadcrumb banner at the top (1. Monitor

Spot Deficit 3. Review Transfers 4. AI Insight).

Why it exists: Serves as guided onboarding for operators or evaluators, walking them step-by-step through the incident response lifecycle.

Core Metrics & Timeline View
A. 4-Pillar KPI Dashboard Cards
Total Resources: Aggregates all tracked hardware, vehicles, and consumables across all facilities.
Used Resources: Total units actively in operational use.
Available Resources: Free buffer units ready for deployment.
Utilization Percentage: Dynamic calculation
accompanied by an interactive color-coded load meter (Green , Amber , Red ).

B. Time-Range Filter System
What it does: Four buttons (Today, Last 7 Days, Last 30 Days, Custom 14D).
How it works: Dynamically adjusts the metrics and trend chart to show either real-time intraday spikes or long-term baseline shifts.
C. Vector SVG Utilization Trend Chart
What it does: Renders a clean line chart mapping network utilization over time.
Key details:
Displays a red dashed critical warning threshold at 85%.
Highlights specific historical surge incident milestones (e.g., "Surge Incident", "Current Peak").
Hovering over any data point reveals a tooltip with exact units used and utilization percentages.

Triage, Risk Summary & System Alerts
A. Operational Alerts Feed (AlertPanel)
What it does: A real-time notification engine that evaluates incoming telemetry against four specific rules:
Critical Shortage: Available stock
of required or absolute buffer .

Overutilization: Facility operational load
.

Stale Data: Telemetry has not updated in
minutes.

Demand Spike: Facility demand exceeds regional peers by
.

Controls: Includes filter tabs (All, Shortages, Overutilization, Stale Data, Spikes), single-card dismissal (X), and a restore button for dismissed alerts.
B. Shortage Detection & Risk Summary Panel
What it does: Provides an executive summary of current deficits:
Net Network Deficit Counter: Total units needed across the network in red (e.g., -17 units deficit).
Quick Triage Cards: Clickable cards for Critical Shortages, Low Stock, and Adequate Stock. Clicking any card instantly filters the inventory table below.
Impacted Facilities Roster: Enumerates all hospital wards currently facing deficits.

Resource Inventory Table & Drill-Down Engine
A. High-Density Inventory Table
Columns: Resource Name, Category, Location, Required Baseline, Available Reserves, Net Balance (Deficit/Surplus badge), Utilization Bar, and Status.
Search & Filters: Real-time search by keyword or location, plus tabs to filter by All, Critical, Low, Normal, or Anomalies.
B. Deterministic Anomaly Detection
What it does: Automatically flags unusual operational behavior with a purple Anomaly badge:
Usage Spike: Individual unit load
.

Availability Collapse: Reserves dropped below
of baseline safety requirements.

C. Resource Row Drill-Down Details (In-Place Expandable Card)
What it does: Clicking any row in the inventory table expands an in-place operational detail card split into 4 quadrants:
Location & Capacity Architecture: Node ID, category, registered total, deployed units, available reserves, and baseline requirement.
Shortage Reason & Threshold Evaluation: The mathematical justification for why the item was flagged, exact deficit count, and buffer ratio.
Operational Telemetry History: A 3-point chronological timeline (
shift baseline, demand wave, and live update timestamp).

Recommended Action & Coordination Path: If the item is in deficit, it shows the exact recommended transfer and provides an "Inspect On Coordination Board" button that navigates directly to the transfer action.

Coordination Board & Redistribution Engine
A. Bilateral Redistribution Matching Engine
What it does: Automatically pairs facilities facing a deficit with peer facilities holding an eligible surplus of the exact same resource.
The Core Invariant Rule:

A donor is never asked to transfer more than its surplus, ensuring its own safety baseline is preserved.

B. Route-Visualized Redistribution Cards
Displays a 3-part card:

Includes plain-language operational justification for dispatch teams.
C. Explainable Arithmetic Audit Drawer ("Inspect Evidence & Math")
What it does: An expandable mathematical proof drawer on every transfer card.
What it proves:
Recipient deficit equation (
).

Donor surplus equation (
).

Minimax transfer quantity.
Invariant Check: Verifies that post-transfer donor stock
required baseline ().

D. Interactive Action Dispatch Lifecycle
What it does: Allows logistics coordinators to track execution:
Pending (slate badge)
In-Transit (cyan badge) Coordinated / Completed (emerald badge).

Gemini Coordination Intelligence (Structured AI Layer)
A. What it does
Analyzes current deficit and surplus nodes across the network and returns a single, prioritized executive coordination directive.
B. Technical Implementation
Strict Server-Side Proxy: Calls are made through POST /api/recommendation in server.ts. The API key is never sent to the client browser.
Structured JSON Output: Uses @google/genai with responseMimeType: 'application/json' and a formal JSON schema (Type.OBJECT).
Exact Output Fields:
severity (e.g., "critical", "high")
recommended_action (one concise redistribution directive)
reason (factual justification)
confidence (probability score, e.g.,
)

affected_location (the facility in need)
Deterministic Offline Fallback: If no API key is provided or the network fails, server.ts automatically runs local rule-based matching. The UI receives the exact same JSON format with a Fallback Recommendation badge, ensuring the app never crashes.
Part 3: The End-to-End User Workflow
Here is how an incident commander uses the platform during a crisis:
codeCode
[ Step 1: Monitor & Detect]
Commander opens ResourcePulse AI.
Sees Metro Emergency Surge scenario.
KPIs show 74% network utilization with 2 Critical Shortages.
SVG Chart shows an active peak above the 85% line.
Alert Feed highlights Ward C ambulances and North Pavilion oxygen canisters.
│
▼
[ Step 2: Triage & Drill Down]
Commander clicks "Critical Shortages (2)" in the Risk Summary panel.
Table instantly filters down to the 2 critical items.
Commander clicks the "Rapid Response Ambulances" row.
Drill-down card expands:
- Location: Metro South - Ward C
- Deficit: -5 vehicles (only 1 available, 6 required)
- History: Shows demand wave logged 45m ago
- Action: Suggested transfer from Central Hub - Ward A
│
▼
[ Step 3: Review Transfers & Audit Math]
Commander clicks "Inspect On Coordination Board".
App switches to Coordination Board tab.
Route card shows:
Central Hub - Ward A (+4 surplus) ──[ Move 4 vehicles]──> Metro South - Ward C (-5 deficit)
Commander clicks "Inspect Evidence & Math":
Verifies that Central Hub has 10 vehicles, requires 6, leaving +4 surplus.
Confirms Safety Invariant is TRUE (Central Hub will not drop into deficit).
│
▼
[ Step 4: Dispatch & AI Synthesis]
Commander clicks "Dispatch / Mark In-Transit".
Status badge updates to cyan "In-Transit".
Commander clicks "Generate Coordination Suggestion".
Gemini 3.8 Flash returns structured JSON:
- Severity: Critical
- Action: Reallocate 4 vehicles from Central Hub to Metro South
- Location: Metro South - Ward C
- Confidence: 94%
Incident commander authorizes the physical fleet movement with full confidence.
Part 4: Key Strengths to Highlight in Presentations or Viva
If presenting this project to evaluators or professors, emphasize these 4 technical differentiators:
Deterministic Safety over Hallucination:
Unlike pure AI wrappers that make up transfer numbers, ResourcePulse AI calculates transfers using strict mathematical invariants (
) before asking the AI to summarize them.

Defensible Explainability:
Every recommendation comes with an arithmetic audit drawer. Hospital directors can see the exact math (
) verifying that the donor remains safe.

Resilient Offline Fallback:
The app functions 100% offline. If the Gemini API key is missing or internet is cut off, the local fallback engine produces the exact same structured JSON.
Production Architecture:
Full-stack Vite + Express server proxy, strictly separated type-safe TypeScript, zero client-side API key leakage, and token-minimized compact payloads.