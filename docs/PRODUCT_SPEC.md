# Product Specification — Forth Urban AI Property Advisor

Canonical, agent-readable version of the source PDF (`Forth Urban Ai Property Consultation System (2).pdf`). This is the functional spec — read [ARCHITECTURE.md](ARCHITECTURE.md) for how it's implemented technically.

## 1. Product summary

An AI-guided Abuja property consultation experience, not a property catalogue. It helps users understand readiness, affordability, best-fit areas, hidden costs, and ROI potential, and drives every interaction toward one conversion event: **booking a land inspection** (physical or virtual).

**Golden rule:** every screen/result must show one clearly recommended next action. No dead ends.

## 2. Main user journey

| Step | User action | System response | Next recommended action |
|---|---|---|---|
| 1 | Arrives from ad/social/search/referral | Hero explains free AI consultation | Start Free AI Property Consultation |
| 2 | Creates account / logs in | Saves profile, opens quiz dashboard | Begin Abuja Home-Readiness Quiz |
| 3 | Completes quiz | AI generates readiness score + buyer profile | View matched land recommendations |
| 4 | Views recommended lands | System explains fit | Open Budget & Installment Calculator |
| 5 | Calculates affordability | Shows payment plan + affordability status | View Hidden Cost Breakdown |
| 6 | Checks hidden costs | Explains legal/documentation costs | Run ROI Projection or View Inspection Checklist |
| 7 | Runs ROI projection | Shows educational appreciation scenarios | Book physical or virtual inspection |
| 8 | Books inspection | Generates checklist, alerts sales | Attend inspection, receive sales follow-up |

## 3. Account layer (required, framed as a benefit)

Every visitor must create an account or log in before receiving full personalized results, so Forth Urban owns the lead relationship (email/WhatsApp nurture, retargeting, sales follow-up).

**Headline:** "Create your free Abuja Property Profile"
**Value bullets:** save quiz result; get matched Abuja property options; receive payment breakdown by email; track recommended next steps; book inspection when ready.

**Fields:**

| Field | Required? | Purpose |
|---|---|---|
| First name | Yes | Personalization, sales follow-up |
| Last name | Optional at first | CRM completeness |
| Email | Yes | Marketing, saved reports, login recovery |
| WhatsApp number | Yes | Sales follow-up, report delivery (messaging only — no WhatsApp OTP) |
| Password or email OTP | Yes | Account access |
| Current city/country | Optional | Identify diaspora vs local buyers |

**Friction reduction:** frame as a benefit, not a bank form; support Google login and email OTP; short form first, enrich profile via quiz later; show a privacy reassurance line; let users resume where they stopped.

## 4. Home-Readiness Quiz

| Quiz area | Question | Why it matters |
|---|---|---|
| Buyer goal | Why do you want land? | Investment/residential/family/diaspora/first-time |
| Budget range | What can you start with? | Realistic property matches |
| Monthly income/contribution | What payment pressure can you handle? | Affordability scoring |
| Payment style | One-time or installment? | Payment plan matching |
| Timeline | When do you want to buy? | Hot/warm/nurture segmentation |
| Preferred area | Where are you considering? | Area education & matching |
| Lifestyle preference | What environment fits you? | Fit beyond price |
| Biggest fear | What is stopping you? | Objection handling |
| Inspection preference | How would you like to verify the land? | Physical vs virtual routing |

## 5. AI recommendation output (Decision Engine result, explained by LLM)

- Readiness score (0–100)
- Buyer persona (First-Time Ownership Builder, Diaspora Investor, Budget Starter, Premium Home Builder, ...)
- Recommended property type
- Recommended Abuja area (e.g. Kuje, Lugbe, Guzape II, Lokogoma)
- Affordability range
- Main concern (scam fear, documents, hidden costs, location confusion, delayed allocation, affordability)
- Next best action

### Readiness score bands (deterministic)

| Score | Category | Next action |
|---|---|---|
| 80–100 | Ready Buyer | Show matched lands + inspection scheduler |
| 60–79 | Almost Ready | Show budget calculator + hidden cost guide before inspection |
| 40–59 | Researching Buyer | Show area quiz, buying roadmap, document checklist |
| 0–39 | Early Stage Buyer | Show education sequence, invite to build a readiness plan |

## 6. Next Best Action engine (deterministic rules)

| Trigger | Recommendation | Reason |
|---|---|---|
| Completes Home-Readiness Quiz | View matched available lands | Needs options fitting result |
| Views a property card | Calculate payment breakdown | Price clarity qualifies intent |
| Uses Budget Calculator | View hidden costs | Builds trust |
| Views Hidden Cost Guide | Run ROI projection or inspect property | Understands total cost |
| Runs ROI Calculator | Book inspection | Investment interest → verification |
| Completes Area Quiz | View available land in recommended area | Converts clarity to shortlist |
| Downloads inspection checklist | Schedule inspection | Prepares for site visit |
| Starts but abandons quiz | Email reminder to continue | Recover abandoned lead |
| Views same property twice | Invite virtual/physical inspection | Repeat viewing = high intent |

All paths terminate at **inspection** — the sole conversion event.

## 7. Property recommendation engine

**Required property data:** name/estate, location + landmarks, price per plot, plot sizes, title type/documentation status, payment plan options, best-fit buyer type, development status (serviced/developing/planned/completed), inspection availability (physical/virtual), hidden cost rules, ROI assumptions per location/scenario, photos/videos/site map/brochure.

**Output format example:** "Recommended for You: Forth Urban Residency, Kuje. Why it fits: matches your budget, supports installment payment, suits first-time buyers, lower entry point. Next step: View Payment Breakdown."

## 8. Budget & Installment Calculator (deterministic)

**Inputs:** selected property, down payment, installment duration, monthly income/contribution, include-hidden-costs toggle.

**Formula:** `balance = propertyPrice - downPayment`; `monthlyInstallment = balance / installmentDurationMonths`.

| Affordability ratio (installment / monthly income) | Status | Advice |
|---|---|---|
| 0–25% | Comfortable | Proceed to hidden cost breakdown |
| 26–40% | Manageable | Proceed, review monthly pressure |
| 41–60% | Tight | Consider longer plan, bigger down payment, or lower-cost property |
| >60% | Risky | Recommend more affordable property or savings plan |

## 9. Hidden Cost Guide

Line items: survey fee, legal/documentation fee, development levy, deed preparation fee, consent/stamp duty (where applicable), allocation fee (where applicable), infrastructure/service charge (where applicable), inspection logistics (where applicable).

**Disclaimer (always shown):** "This is an educational estimate. Actual costs may vary depending on the property, title, transaction structure, and official requirements. Forth Urban will provide a clear breakdown before payment."

**Next action:** first-time buyers → inspection checklist first; investors → ROI projection first.

## 10. ROI Calculator (deterministic, admin-editable assumptions)

| Scenario | Default annual appreciation |
|---|---|
| Conservative | 5% |
| Moderate | 10% |
| Optimistic | 15% |

**Formula:** `futureValue = currentPrice * (1 + rate) ^ years`; `estimatedGain = futureValue - currentPrice`; `roiPercent = (estimatedGain / currentPrice) * 100`.

**Required wording:** "This projection is for educational purposes only. Real estate value can be affected by infrastructure, demand, documentation, government policy, access roads, and market conditions."

**Next action:** book physical or virtual inspection.

## 11. Site Inspection Scheduler (the conversion event)

| Inspection option | Best for |
|---|---|
| Physical site inspection | Abuja-based / nearby buyers |
| Virtual video inspection | Diaspora / out-of-Abuja buyers |
| Document review call first | Buyers whose main fear is documentation |
| Advisor call before inspection | Buyers with budget/area confusion |

**Captured info:** name, phone, WhatsApp, email, selected property/recommended area, inspection type, preferred date/time, main concern, whether they want docs/cost breakdown/videos first.

**Auto-generated checklist:** confirm estate name/location/access route; ask about title & documentation process; ask about allocation timeline; ask about development levy & future charges; inspect road access & surrounding development; ask what happens after first payment; request written payment breakdown; confirm documents received after payment.

## 12. Best Abuja Area AI Quiz (standalone)

| User preference | Area logic |
|---|---|
| Premium living | Guzape II or similar |
| Affordable ownership | Kuje or lower-entry areas |
| City access + affordability | Lugbe or similar growth corridors |
| Family-oriented | Quieter areas with growth/access potential |
| Investment-focused | Areas with future infrastructure & resale potential |
| Diaspora buyer | Areas with strong documentation clarity + virtual inspection support |

**Next action:** view available lands in recommended area → calculate budget → inspection.

## 13. Standalone tool funnel logic

Every tool must work independently and still route toward inspection:

| Tool | Lead capture moment | Next action |
|---|---|---|
| Home-Readiness Quiz | Before full result | View matched land recommendations |
| Budget Calculator | Before full payment report download | View hidden cost estimate |
| ROI Calculator | Before full projection report | Book inspection (investment) |
| Best Abuja Area Quiz | Before detailed area report | View available land in area |
| Hidden Cost Guide | Before full cost PDF | Review docs checklist or book inspection |
| Site Inspection Tool | Before confirming schedule | Attend inspection + advisor follow-up |

## 14. Lead capture & email marketing

| Moment | Data collected |
|---|---|
| Start of experience | Name, email, WhatsApp |
| Before full result | Budget, location, goal, timeline |
| Before report download | Email confirmation |
| Before inspection booking | Full contact + schedule details |

**Email segments:** Hot lead (matched properties, inspection reminder, payment breakdown), Warm lead (budget planning, hidden costs, area education), Research lead (buying roadmap, doc education, scam prevention), Diaspora lead (virtual inspection, doc proof), Budget starter (installment paths, affordable areas), Investor (area growth, ROI education).

## 15. CRM & sales follow-up

CRM context per lead: account ID, lead source/campaign, quiz answers + readiness score, buyer persona + lead category, budget range + payment preference, preferred vs recommended area, main fear/objection, viewed/saved properties, calculator results, inspection preference + booked date, recommended sales angle.

**Sample templates:**
- Hot lead: "Hi [Name], your result shows you are ready to compare available plots. I have prepared options that match your budget and preferred area. Would you prefer a physical or virtual inspection?"
- Warm lead: "Hi [Name], your result shows you are close to being ready. The main thing to clarify is your budget and payment structure. Here is the breakdown that may fit you."
- Diaspora lead: "Hi [Name], your result shows you want to build something in Abuja from abroad. We can guide you with property details, document explanation, and virtual inspection before you make any decision."

## 16. UI/UX requirements

Calm, premium, advisory design (not loud promo). One question per quiz screen with progress indicator ("Step 3 of 10"). Post-login dashboard to resume tools/see saved results. Recommendation cards for readiness score, buyer profile, area fit, property match, next step. Next-recommended-action always in a highlighted card. Trust blocks: testimonials, site videos, document explainers, allocation proof, process steps. Inspection CTA visible but not aggressive. Mobile-first.

## 17. Final funnel structure

```
Create Free Property Profile
  → Abuja Home-Readiness Quiz
  → Personalized Result
  → Matched Land Recommendations
  → Budget & Installment Calculator
  → Hidden Cost Breakdown
  → ROI Projection
  → Site Inspection Scheduler
  → Sales Follow-Up
```

**Hero message:** "Find out if you are ready to own land in Abuja — and discover the areas, payment plan, and property options that fit your budget and goal."
**Primary CTA:** "Start My Free AI Property Consultation"
**Secondary CTA:** "Create My Free Abuja Property Profile"
