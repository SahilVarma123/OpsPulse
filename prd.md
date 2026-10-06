# PRD.md

# Project Name
**ResourcePulse AI**
*Real-Time Resource Usage Observation and Coordination Platform*

---

## 1. Product Summary

ResourcePulse AI is a web-based platform that observes resource usage, detects shortages and imbalances, and helps teams coordinate better with simple AI-assisted recommendations.

The system is designed for situations where multiple teams, locations, or departments need to share limited resources efficiently. It combines live or demo resource data, utilization tracking, shortage detection, and an AI assistant that suggests practical coordination actions.

---

## 2. Problem Statement

Teams often do not have a clear, shared view of how resources are being used across locations or units. This leads to:
- Overuse in some areas and underuse in others.
- Delayed decisions because data is fragmented.
- Poor coordination when shortages occur.
- Manual reporting that is slow and difficult to interpret.
- No easy way to turn data into action.

The problem is not only tracking resources, but also helping people coordinate around them quickly and clearly.

---

## 3. Product Vision

Build a simple but powerful website that turns raw resource data into:
- A live usage overview.
- Clear shortage and surplus detection.
- A coordination board with recommended actions.
- AI-generated insights that explain what to do next.

The product should feel practical, trustworthy, and easy to demo.

---

## 4. Goals

### Primary goals
- Show current resource usage in a simple dashboard.
- Detect high usage, low availability, and critical shortages.
- Suggest redistribution or coordination actions.
- Use AI only to summarize and recommend actions, not to replace calculations.

### Secondary goals
- Support multiple resource categories.
- Allow demo data and future real API integration.
- Make the UI suitable for presentations and prototypes.
- Keep the system lightweight and credit-efficient.

---

## 5. Non-goals

This version will not:
- Replace an enterprise ERP or operations system.
- Automate real-world allocation without human approval.
- Require paid APIs to function.
- Depend on continuous AI calls.
- Include complex forecasting, voice input, or multi-agent workflows.

---

## 6. Target Users

### 1. Coordinator
A person who monitors resource availability and reallocates resources when needed.

### 2. Supervisor
A person who checks utilization, identifies risk areas, and approves actions.

### 3. Admin
A person who manages categories, locations, and demo or real data sources.

### 4. Demo reviewer
A judge, teacher, or stakeholder who needs a quick, visual understanding of the problem and solution.

---

## 7. Core User Problems

The platform should solve these main problems:
- “Where are resources being overused?”
- “Which location is short on supply?”
- “What should be moved or reallocated?”
- “How do I explain the decision quickly?”
- “How can I coordinate without manually comparing spreadsheets?”

---

## 8. Key Features

### 8.1 Resource Dashboard
- Total resources.
- Used resources.
- Available resources.
- Utilization percentage.
- Status indicators such as Normal, Low, and Critical.

### 8.2 Resource Table
- Resource name.
- Category.
- Location.
- Required amount.
- Available amount.
- Utilization.
- Priority level.

### 8.3 Shortage Detection
- Detect locations or units below threshold.
- Highlight critical shortages.
- Flag unusual imbalance between locations.

### 8.4 Coordination Board
- Show suggested transfers or reassignments.
- Display priority order.
- Show which resource should be moved, from where, and to where.

### 8.5 AI Insight Panel
- One-click generation of a short recommendation.
- AI produces concise, human-readable actions.
- AI must not invent data or change numbers.

### 8.6 Data Input
- Demo JSON or CSV upload.
- Option for manual sample data.
- Future-ready structure for API integration.

### 8.7 Evidence View
- Show the calculation behind the recommendation.
- Display the key values used in the decision.
- Make the system explainable.

---

## 9. User Flow

1. User opens dashboard.
2. System shows usage summary and resource table.
3. System highlights shortages and surplus.
4. User opens coordination board.
5. User clicks “Generate AI Insight”.
6. AI returns a short suggestion based on the visible data.
7. User reviews and applies the recommendation manually.

---

## 10. Functional Requirements

### Dashboard
- Display resource totals and utilization.
- Show charts or cards for quick understanding.
- Update visually when data changes.

### Monitoring
- Detect critical thresholds.
- Use color-coded alerts.
- Support multiple resource categories and locations.

### Coordination
- Sort resources by urgency.
- Recommend redistribution when one unit has surplus and another has shortage.
- Show a readable explanation for each suggestion.

### AI Integration
- Use Google AI Studio / Gemini API from backend only.
- Send only small summary data to the model.
- Return short recommendations.
- Support fallback to local rule-based output if AI fails.

### Data Handling
- Allow CSV or JSON-based demo data.
- Validate data before processing.
- Keep local fallback so the app still works without API access.

---

## 11. Non-Functional Requirements

- Fast page load.
- Mobile-friendly responsive layout.
- Secure API key handling.
- Reliable fallback when AI is unavailable.
- Simple and understandable UI.
- Easy to deploy on free hosting.

---

## 12. Real-Time Data and Freshness

The platform supports real-time or near-real-time data where the source system allows it.

### Requirements
- Display a visible “Last updated” timestamp.
- Support manual refresh in the MVP.
- Support automatic refresh at a configurable interval in future versions.
- Mark data as stale if it crosses the defined freshness threshold.
- Use demo or fallback data when live source access is unavailable.

### Prototype rule
The dashboard must remain usable even without live streaming data.

---

## 13. AI Design Principles

The AI should:
- Summarize, not compute.
- Recommend, not decide.
- Use only the provided data.
- Avoid hallucinating missing values.
- Return short and actionable text.

Example output:
“Ward C is critically short on ambulances. Reassign one ambulance from Ward A, which has surplus capacity, and review demand again after 2 hours.”

---

## 14. Success Metrics

The product is successful if:
- A user can understand resource status in under 30 seconds.
- Shortages are clearly visible without manual calculation.
- The system produces a useful coordination recommendation in one click.
- The demo works even without live APIs.
- Reviewers can clearly explain how the system improves coordination.

---

## 15. Scope for MVP

### Included
- Dashboard.
- Resource table.
- Shortage alerts.
- Coordination suggestions.
- Gemini AI insight panel.
- Demo data support.
- Freshness timestamp.
- Manual refresh.

### Excluded
- User authentication.
- Multi-tenant enterprise controls.
- Advanced forecasting.
- Real-time IoT integration.
- Complex workflow approvals.

---

## 16. Technical Direction

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: Next.js Route Handlers.
- AI: Google AI Studio / Gemini API.
- Data: JSON or CSV demo data.
- Deployment: Vercel free tier.

---

## 17. Risks and Mitigations

### Risk: AI quota or API failure
Mitigation: Use local rule-based fallback recommendations.

### Risk: Too much complexity
Mitigation: Keep the MVP focused on monitoring, shortage detection, and one AI suggestion.

### Risk: Weak demo clarity
Mitigation: Use strong color coding, sample scenarios, and a single clear coordination path.

### Risk: Stale or missing live data
Mitigation: Show freshness timestamps and support fallback demo data.

---

## 18. Future Enhancements

- Multi-location live tracking.
- Role-based access.
- Historical trend analysis.
- Forecasting and anomaly detection.
- Integration with official or real operational APIs.

---

## 19. Definition of Done

The project is complete when:
- The dashboard displays resource usage clearly.
- Shortages are detected automatically.
- Coordination suggestions are visible.
- Gemini API works through a server route.
- The app can still run using demo data if the API is unavailable.
- Freshness and last-updated information are visible.