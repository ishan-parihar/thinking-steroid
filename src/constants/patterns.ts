// ─── Pattern Type Definitions ────────────────────────────────────────────────

export interface CausalPattern {
  id: string;
  domains: string[];
  description: string;
  structure: { cause: string; effect: string; mechanism: string };
  evidence_markers: string[];
  counter_patterns: string[];
}

export interface AssumptionPattern {
  id: string;
  domains: string[];
  assumption: string;
  reality: string;
  cost_if_wrong: string;
  detection_signals: string[];
}

export interface ShadowPattern {
  id: string;
  domains: string[];
  shadow: string;
  manifests_as: string[];
  root_fear: string;
  integration_path: string;
}

export interface LeveragePoint {
  id: string;
  domains: string[];
  description: string;
  meadows_rank: number;
  applies_when: string[];
  intervention: string;
  risk: string;
  effectiveness?: string;
}

// ─── CAUSAL_PATTERNS ─────────────────────────────────────────────────────────

export const CAUSAL_PATTERNS: CausalPattern[] = [
  {
    id: "conway-law",
    domains: ["software-architecture", "organizational-topology"],
    description:
      "System design mirrors the organization's communication structure",
    structure: {
      cause: "organizational boundaries",
      effect: "system boundaries",
      mechanism:
        "teams optimize for their own deployment autonomy",
    },
    evidence_markers: [
      "team boundary",
      "communication overhead",
      "team structure",
      "organizational design",
      "conway",
    ],
    counter_patterns: ["greenfield", "from scratch"],
  },
  {
    id: "technical-debt-compounding",
    domains: ["software-architecture", "strategic-planning"],
    description:
      "Deferred maintenance increases future change cost exponentially",
    structure: {
      cause: "deferred maintenance",
      effect: "escalating change cost",
      mechanism:
        "each unaddressed issue creates dependencies that multiply refactoring scope",
    },
    evidence_markers: [
      "technical debt",
      "refactor",
      "maintenance",
      "code quality",
      "quick fix",
    ],
    counter_patterns: ["new system", "no legacy"],
  },
  {
    id: "deployment-coupling",
    domains: ["software-architecture"],
    description:
      "Shared deployment boundaries create temporal coupling between independent teams",
    structure: {
      cause: "shared deployment artifact",
      effect: "team blocking",
      mechanism:
        "teams must coordinate release schedules despite independent work",
    },
    evidence_markers: [
      "deployed together",
      "blocked by",
      "release coordination",
      "deployment pipeline",
      "shared artifact",
    ],
    counter_patterns: ["independent deploy", "separate pipeline"],
  },
  {
    id: "service-boundary-complexity",
    domains: ["software-architecture"],
    description:
      "Service boundaries trade deployment coupling for distributed system complexity",
    structure: {
      cause: "service decomposition",
      effect: "distributed complexity",
      mechanism:
        "network failures, eventual consistency, and coordination overhead replace in-process coupling",
    },
    evidence_markers: [
      "microservice",
      "distributed",
      "network call",
      "eventual consistency",
      "service mesh",
    ],
    counter_patterns: ["monolith", "in-process"],
  },
  {
    id: "observability-gap",
    domains: ["software-architecture"],
    description:
      "Distributed systems fail without proportionally increased observability investment",
    structure: {
      cause: "system distribution",
      effect: "failure blindness",
      mechanism:
        "without distributed tracing, metrics, and logging, failures become undiagnosable",
    },
    evidence_markers: [
      "can't debug",
      "hard to trace",
      "observability",
      "monitoring",
      "distributed tracing",
    ],
    counter_patterns: ["fully observable", "single process"],
  },
  {
    id: "change-resistance-cycle",
    domains: ["organizational-topology", "strategic-planning"],
    description:
      "Pushing change without addressing fears creates resistance that slows change",
    structure: {
      cause: "forced change",
      effect: "resistance",
      mechanism:
        "unaddressed fear triggers self-protective behavior that undermines the change effort",
    },
    evidence_markers: [
      "resistance",
      "pushback",
      "afraid of change",
      "people don't want",
    ],
    counter_patterns: ["eager to change", "bottom-up"],
  },
  {
    id: "communication-overhead",
    domains: ["organizational-topology"],
    description:
      "Adding team members increases communication paths quadratically",
    structure: {
      cause: "team growth",
      effect: "communication explosion",
      mechanism:
        "n people have n(n-1)/2 communication channels, each requiring maintenance",
    },
    evidence_markers: [
      "too many people",
      "communication",
      "coordination cost",
      "meeting overhead",
      "Brooks law",
    ],
    counter_patterns: ["small team", "solo"],
  },
  {
    id: "silo-formation",
    domains: ["organizational-topology"],
    description:
      "Specialized teams optimize locally at the expense of global flow",
    structure: {
      cause: "team specialization",
      effect: "local optimization",
      mechanism:
        "teams maximize their own metrics while suboptimal handoffs accumulate between them",
    },
    evidence_markers: [
      "silo",
      "handoff",
      "local optimization",
      "my team",
      "not our problem",
    ],
    counter_patterns: ["cross-functional", "end-to-end ownership"],
  },
  {
    id: "hero-culture",
    domains: ["organizational-topology", "software-architecture"],
    description:
      "Rewarding individual heroics prevents systemic health improvement",
    structure: {
      cause: "hero reward",
      effect: "systemic fragility",
      mechanism:
        "heroes hoard knowledge, create bus factor risks, and make systemic improvements seem unnecessary",
    },
    evidence_markers: [
      "hero",
      "goes above and beyond",
      "saves the day",
      "only person who knows",
      "bus factor",
    ],
    counter_patterns: ["documented", "shared knowledge"],
  },
  {
    id: "misaligned-incentives",
    domains: ["organizational-topology", "strategic-planning"],
    description:
      "Teams with different success metrics create coordination failures",
    structure: {
      cause: "metric divergence",
      effect: "coordination failure",
      mechanism:
        "teams rationally pursue their own metrics even when it undermines shared goals",
    },
    evidence_markers: [
      "different goals",
      "competing priorities",
      "not aligned",
      "their metric vs ours",
    ],
    counter_patterns: ["shared metrics", "aligned incentives"],
  },
  {
    id: "feedback-echo-chamber",
    domains: ["interpersonal-dynamics", "leadership-development"],
    description:
      "Positive feedback without corrective criticism creates inflated self-assessment",
    structure: {
      cause: "uncorrected positive feedback",
      effect: "inflated competence belief",
      mechanism:
        "absence of negative feedback signals success, reinforcing behavior that may be suboptimal",
    },
    evidence_markers: [
      "great job",
      "no one said anything was wrong",
      "positive feedback",
      "always gets good reviews",
    ],
    counter_patterns: ["critical feedback", "360 review", "constructive criticism"],
  },
  {
    id: "urgency-blindness",
    domains: ["strategic-planning", "product-management"],
    description:
      "Operating in constant urgency mode prevents capacity building that would reduce future urgency",
    structure: {
      cause: "crisis-mode operation",
      effect: "reduced capacity for prevention",
      mechanism:
        "time spent firefighting is time not spent building systems that prevent fires",
    },
    evidence_markers: [
      "all hands on deck",
      "firefighting",
      "no time for process",
      "we'll fix it later",
      "urgent",
      "crisis mode",
    ],
    counter_patterns: ["planning time", "capacity building"],
  },
  {
    id: "feature-creep-accumulation",
    domains: ["product-management", "software-architecture"],
    description:
      "Each feature request accepted makes the next rejection harder, compounding complexity",
    structure: {
      cause: "feature acceptance",
      effect: "product complexity",
      mechanism:
        "precedent of accepting features makes each new request harder to decline",
    },
    evidence_markers: [
      "just one more feature",
      "competitors have it",
      "customer asked for it",
      "feature bloat",
      "product is too complex",
    ],
    counter_patterns: ["minimal viable", "say no to features"],
  },
  {
    id: "ethics-metric-gaming",
    domains: ["ethics-governance", "organizational-topology"],
    description:
      "Measuring ethical compliance creates incentives to game the metric rather than behave ethically",
    structure: {
      cause: "ethics measurement",
      effect: "performative compliance",
      mechanism:
        "people optimize for passing ethics audits rather than internalizing ethical behavior",
    },
    evidence_markers: [
      "check the compliance box",
      "pass the audit",
      "on paper we're compliant",
      "technically allowed",
    ],
    counter_patterns: ["values-driven", "ethical culture"],
  },
  {
    id: "tragedy-of-shared-resources",
    domains: ["systems-thinking", "organizational-topology"],
    description:
      "Shared resources without clear ownership degrade as each party maximizes individual benefit",
    structure: {
      cause: "shared resource without owner",
      effect: "resource degradation",
      mechanism:
        "each party rationally overuses the resource since costs are distributed but benefits are individual",
    },
    evidence_markers: [
      "everyone's problem is no one's problem",
      "who owns this",
      "shared infrastructure",
      "common resource",
      "not my team's responsibility",
    ],
    counter_patterns: ["clear ownership", "dedicated team"],
  },
  {
    id: "competence-trap",
    domains: ["leadership-development", "personal-development"],
    description:
      "Being good at current approaches prevents exploration of better approaches",
    structure: {
      cause: "established competence",
      effect: "resistance to new methods",
      mechanism:
        "switching costs of learning new approaches feel prohibitive compared to known competence",
    },
    evidence_markers: [
      "we've always done it this way",
      "I'm good at the current approach",
      "why change what works",
      "learning curve is too steep",
    ],
    counter_patterns: ["willing to learn", "growth mindset"],
  },
  {
    id: "solution-shift",
    domains: ["systems-thinking", "strategic-planning"],
    description:
      "Solving one problem shifts the problem elsewhere in the system rather than eliminating it",
    structure: {
      cause: "localized solution",
      effect: "problem displacement",
      mechanism:
        "systems are interconnected; fixing one node pushes stress to adjacent nodes",
    },
    evidence_markers: [
      "fixed A but now B is broken",
      "whack-a-mole",
      "moved the problem",
      "unintended consequences",
      "created a new issue",
    ],
    counter_patterns: ["holistic solution", "end-to-end fix"],
  },
  {
    id: "risk-aversion-compounding",
    domains: ["financial-planning", "strategic-planning"],
    description:
      "Each avoided risk reinforces the belief that risk-taking is dangerous, narrowing opportunity set",
    structure: {
      cause: "risk avoidance",
      effect: "narrowing opportunity set",
      mechanism:
        "safe choices compound into a portfolio too conservative to achieve meaningful returns",
    },
    evidence_markers: [
      "too risky",
      "let's play it safe",
      "we can't afford to fail",
      "preserve capital",
      "risk-averse",
    ],
    counter_patterns: ["calculated risk", "diversified bets"],
  },
  {
    id: "personal-avoidance-reinforcement",
    domains: ["personal-development", "interpersonal-dynamics"],
    description:
      "Avoiding uncomfortable situations reinforces the belief that they are dangerous",
    structure: {
      cause: "avoidance behavior",
      effect: "increased anxiety about avoided situation",
      mechanism:
        "relief from avoidance negatively reinforces the behavior, while the feared situation is never disconfirmed",
    },
    evidence_markers: [
      "I'll do it later",
      "not the right time",
      "I'm not ready",
      "avoiding the conversation",
    ],
    counter_patterns: ["facing the fear", "exposure"],
  },
  {
    id: "product-launch-death-spiral",
    domains: ["product-management", "strategic-planning"],
    description:
      "Delayed launches force rushed subsequent releases, compounding quality issues",
    structure: {
      cause: "launch delay",
      effect: "rushed subsequent releases",
      mechanism:
        "delayed launch compresses timeline for next release, creating pressure to cut corners",
    },
    evidence_markers: [
      "delayed again",
      "we need to ship now",
      "rushed the release",
      "quality suffered",
      "behind schedule",
    ],
    counter_patterns: ["on track", "buffer time"],
  },
  {
    id: "ethical-drift-normalization",
    domains: ["ethics-governance", "organizational-topology"],
    description:
      "Small ethical compromises accumulate and normalize, shifting the organization's ethical baseline",
    structure: {
      cause: "minor ethical compromise",
      effect: "shifted ethical baseline",
      mechanism:
        "each small compromise makes the next one feel less significant, gradually moving the Overton window",
    },
    evidence_markers: [
      "everyone does it",
      "just this once",
      "it's not that bad",
      "gray area",
      "bending the rules",
    ],
    counter_patterns: ["zero tolerance", "ethical review"],
  },
  {
    id: "stakeholder-fatigue",
    domains: ["product-management", "interpersonal-dynamics"],
    description:
      "Repeated stakeholder requests without visible action erodes trust and future engagement",
    structure: {
      cause: "unaddressed stakeholder input",
      effect: "stakeholder disengagement",
      mechanism:
        "stakeholders who feel unheard stop providing input, depriving the system of valuable feedback",
    },
    evidence_markers: [
      "nobody listens to feedback",
      "why bother giving input",
      "same feedback ignored",
      "stakeholder disengaged",
    ],
    counter_patterns: ["acted on feedback", "closed the loop"],
  },
  {
    id: "budget-cycle-perverse-incentives",
    domains: ["financial-planning", "organizational-topology"],
    description:
      "Use-it-or-lose-it budgets incentivize wasteful spending at period end",
    structure: {
      cause: "annual budget cycle",
      effect: "end-of-period wasteful spending",
      mechanism:
        "unspent budgets get cut next year, so managers spend unnecessarily to protect future allocations",
    },
    evidence_markers: [
      "use it or lose it",
      "budget expiry",
      "end of quarter spending",
      "fiscal year end rush",
    ],
    counter_patterns: ["rolling budget", "carry-over allowed"],
  },
  {
    id: "onboarding-knowledge-loss",
    domains: ["software-architecture", "leadership-development"],
    description:
      "Lack of structured onboarding causes departing experts to take irreplaceable knowledge",
    structure: {
      cause: "informal knowledge transfer",
      effect: "knowledge loss on departure",
      mechanism:
        "knowledge lives in individuals rather than systems; when they leave, it leaves with them",
    },
    evidence_markers: [
      "nobody knows how this works",
      "the person who built this left",
      "no onboarding docs",
      "tribal knowledge",
    ],
    counter_patterns: ["documented process", "knowledge base"],
  },
  {
    id: "empathy-burnout-cycle",
    domains: ["interpersonal-dynamics", "personal-development"],
    description:
      "Excessive empathetic engagement without boundaries leads to compassion fatigue",
    structure: {
      cause: "unbounded empathy",
      effect: "compassion fatigue",
      mechanism:
        "continuous emotional labor depletes psychological resources, reducing capacity for future empathy",
    },
    evidence_markers: [
      "emotionally drained",
      "can't care anymore",
      "compassion fatigue",
      "burned out from helping",
      "too much emotional labor",
    ],
    counter_patterns: ["healthy boundaries", "self-care"],
  },
  {
    id: "market-positioning-erosion",
    domains: ["product-management", "strategic-planning"],
    description:
      "Chasing multiple market segments dilutes brand identity and confuses customers",
    structure: {
      cause: "segment expansion",
      effect: "brand dilution",
      mechanism:
        "each new segment requires messaging that may conflict with existing positioning",
    },
    evidence_markers: [
      "we serve everyone",
      "targeting new segments",
      "brand is unclear",
      "customers don't know what we stand for",
    ],
    counter_patterns: ["focused positioning", "clear ICP"],
  },

  // ─── ETHICS-GOVERNANCE ─────────────────────────────────────────────────────

  {
    id: "regulatory-capture-cycle",
    domains: ["ethics-governance", "geopolitics"],
    description:
      "Regulated industries gradually shape the regulations that govern them, turning oversight into protection",
    structure: {
      cause: "industry-regulator proximity",
      effect: "regulatory capture",
      mechanism:
        "revolving door employment, lobbying resources, and information asymmetry allow industry to write rules in its favor",
    },
    evidence_markers: [
      "revolving door",
      "industry advisory panel",
      "self-regulation",
      "lobbying influence",
      "captured regulator",
    ],
    counter_patterns: ["independent oversight", "public interest advocacy"],
  },
  {
    id: "ethics-washing-reputation",
    domains: ["ethics-governance", "ai-safety"],
    description:
      "Public ethics commitments substitute for actual governance, creating reputational cover without behavioral change",
    structure: {
      cause: "ethics theater",
      effect: "reduced accountability",
      mechanism:
        "public ethics statements satisfy stakeholders enough that deeper scrutiny becomes politically costly",
    },
    evidence_markers: [
      "ethics board announced",
      "AI principles published",
      "responsible AI pledge",
      "no enforcement mechanism",
    ],
    counter_patterns: ["audited ethics", "binding commitments"],
  },
  {
    id: "compliance-minimum-behavior",
    domains: ["ethics-governance", "organizational-topology"],
    description:
      "Organizations converge on the minimum behavior that satisfies regulators, treating ethics as a constraint to optimize around",
    structure: {
      cause: "rule-based compliance",
      effect: "ethical minimums",
      mechanism:
        "when rules specify floors, rational actors stop at the floor rather than aspiring beyond it",
    },
    evidence_markers: [
      "technically compliant",
      "within the letter of the law",
      "not prohibited",
      "meets the standard",
    ],
    counter_patterns: ["values-based governance", "beyond compliance"],
  },
  {
    id: "transparency-paradox",
    domains: ["ethics-governance", "technology-policy"],
    description:
      "Mandating transparency about algorithms or decisions enables gaming by those who study the disclosed rules",
    structure: {
      cause: "forced transparency",
      effect: "strategic manipulation",
      mechanism:
        "disclosed criteria allow bad actors to optimize for passing audits while violating the spirit",
    },
    evidence_markers: [
      "algorithm disclosure",
      "explainability requirement",
      "gaming the transparency rules",
      "compliant but harmful",
    ],
    counter_patterns: ["outcome-based regulation", "adversarial auditing"],
  },
  {
    id: "fairness-impossibility-tradeoff",
    domains: ["ethics-governance", "ai-safety"],
    description:
      "Multiple mathematically valid definitions of fairness are mutually incompatible; choosing one violates another",
    structure: {
      cause: "fairness definition selection",
      effect: "inevitable unfairness on another dimension",
      mechanism:
        "impossibility theorems prove that calibration, equalized odds, and predictive parity cannot all hold simultaneously",
    },
    evidence_markers: [
      "which fairness metric",
      "fairness tradeoff",
      "impossibility theorem",
      "satisfies one definition but not another",
    ],
    counter_patterns: ["explicit value choice", "stakeholder-defined fairness"],
  },
  {
    id: "moral-licensing-effect",
    domains: ["ethics-governance", "personal-development"],
    description:
      "Prior ethical behavior creates psychological permission for subsequent unethical behavior",
    structure: {
      cause: "established moral credentials",
      effect: "reduced ethical vigilance",
      mechanism:
        "past good deeds build a moral self-image that feels resilient to a single compromise",
    },
    evidence_markers: [
      "we've earned this",
      "after all the good we've done",
      "one exception won't matter",
      "we're the good guys",
    ],
    counter_patterns: ["continuous ethics review", "each decision fresh"],
  },

  // ─── TECHNOLOGY-POLICY ─────────────────────────────────────────────────────

  {
    id: "pacing-problem-regulation",
    domains: ["technology-policy", "strategic-planning"],
    description:
      "Technology advances exponentially while regulation advances linearly, creating growing governance gaps",
    structure: {
      cause: "exponential tech progress",
      effect: "regulatory gap widening",
      mechanism:
        "legislative processes require consensus and deliberation that cannot match the iteration speed of technology",
    },
    evidence_markers: [
      "law is outdated",
      "no regulation exists",
      "technology outpaced policy",
      "regulatory gap",
      "wild west",
    ],
    counter_patterns: ["agile regulation", "principles-based governance"],
  },
  {
    id: "brussels-effect-power",
    domains: ["technology-policy", "geopolitics"],
    description:
      "The largest market's regulations become de facto global standards through market access requirements",
    structure: {
      cause: "large market regulation",
      effect: "global standard adoption",
      mechanism:
        "companies adopt the strictest standard globally to avoid maintaining separate product versions",
    },
    evidence_markers: [
      "GDPR compliance globally",
      "EU standard adopted",
      "market access requirement",
      "one standard to rule all",
    ],
    counter_patterns: ["regional fragmentation", "regulatory arbitrage"],
  },
  {
    id: "dual-use-dilemma",
    domains: ["technology-policy", "ai-safety"],
    description:
      "Technology with beneficial civilian applications also enables harm, making restriction decisions inherently ambiguous",
    structure: {
      cause: "dual-use capability",
      effect: "governance paralysis",
      mechanism:
        "restrictions to prevent harm also prevent benefits; the same research that improves medicine could enable bioweapons",
    },
    evidence_markers: [
      "dual-use research",
      "dual-use technology",
      "can be used for harm",
      "civilian and military applications",
    ],
    counter_patterns: ["capability access control", "benefit-harm assessment"],
  },
  {
    id: "infrastructure-dependency-lock",
    domains: ["technology-policy", "software-architecture"],
    description:
      "Critical infrastructure built on specific technologies creates policy dependency that resists migration even when superior alternatives exist",
    structure: {
      cause: "critical tech dependency",
      effect: "policy lock-in",
      mechanism:
        "migration cost of critical infrastructure exceeds perceived benefits, even when the technology is obsolete or controlled by adversaries",
    },
    evidence_markers: [
      "too critical to change",
      "legacy infrastructure",
      "vendor lock-in at national scale",
      "can't migrate",
      "dependent on foreign tech",
    ],
    counter_patterns: ["technology diversification", "sovereign alternatives"],
  },
  {
    id: "platform-liability-chilling",
    domains: ["technology-policy", "organizational-topology"],
    description:
      "Platform liability rules create incentives for over-moderation that suppresses legitimate speech and innovation",
    structure: {
      cause: "platform liability threat",
      effect: "over-moderation",
      mechanism:
        "platforms minimize legal risk by removing ambiguous content, chilling expression that is legal but potentially controversial",
    },
    evidence_markers: [
      "better safe than sorry",
      "automated content removal",
      "false positive takedown",
      "liability-driven moderation",
    ],
    counter_patterns: ["safe harbor provisions", "notice-and-appeal process"],
  },
  {
    id: "open-source-tragedy",
    domains: ["technology-policy", "software-architecture"],
    description:
      "Critical infrastructure depends on underfunded open-source projects, creating systemic risk when maintainers burn out",
    structure: {
      cause: "free public good dependency",
      effect: "maintainer burnout and supply chain fragility",
      mechanism:
        "corporations extract value without contributing resources; maintainers face unsustainable burden for critical infrastructure",
    },
    evidence_markers: [
      "log4j incident",
      "single maintainer burnout",
      "critical dependency abandoned",
      "underfunded open source",
    ],
    counter_patterns: ["sponsored maintenance", "foundation-backed projects"],
  },
  {
    id: "data-sovereignty-conflict",
    domains: ["technology-policy", "geopolitics"],
    description:
      "Conflicting national data sovereignty laws create impossible compliance requirements for global technology companies",
    structure: {
      cause: "divergent data governance regimes",
      effect: "compliance impossibility",
      mechanism:
        "Country A requires data localization while Country B requires data access for law enforcement, creating irreconcilable obligations",
    },
    evidence_markers: [
      "data localization law",
      "cross-border data conflict",
      "conflicting jurisdiction",
      "cannot comply with both",
    ],
    counter_patterns: ["data treaties", "mutual recognition agreements"],
  },
  {
    id: "regulatory-arbitrage-race",
    domains: ["technology-policy", "financial-planning"],
    description:
      "Companies incorporate in jurisdictions with weakest regulations, pressuring all jurisdictions to deregulate",
    structure: {
      cause: "jurisdictional competition",
      effect: "race to the bottom",
      mechanism:
        "jurisdictions lose tax revenue and jobs to lighter-regulation competitors, creating pressure to reduce standards",
    },
    evidence_markers: [
      "incorporated in Delaware",
      "registered in tax haven",
      "regulatory haven",
      "jurisdiction shopping",
    ],
    counter_patterns: ["harmonized regulation", "minimum global standards"],
  },
  {
    id: "technology-assessment-blindness",
    domains: ["technology-policy", "strategic-planning"],
    description:
      "Technology is deployed before its systemic effects are understood, making regulation reactive rather than anticipatory",
    structure: {
      cause: "deploy-first approach",
      effect: "retroactive governance",
      mechanism:
        "deployment creates facts on the ground and vested interests that make subsequent regulation politically difficult",
    },
    evidence_markers: [
      "ask forgiveness not permission",
      "already deployed",
      "too big to regulate",
      "technology is here to stay",
    ],
    counter_patterns: ["precautionary principle", "sandbox regulation"],
  },

  // ─── GEOPOLITICS ───────────────────────────────────────────────────────────

  {
    id: "security-dilemma-escalation",
    domains: ["geopolitics", "systems-thinking"],
    description:
      "One nation's defensive measures are perceived as offensive threats by rivals, triggering reciprocal escalation",
    structure: {
      cause: "defensive military investment",
      effect: "reciprocal arms buildup",
      mechanism:
        "offensive and defensive capabilities are indistinguishable; each side's security reduces the other's",
    },
    evidence_markers: [
      "arms race",
      "defensive system perceived as threat",
      "security dilemma",
      "escalation spiral",
      "action-reaction cycle",
    ],
    counter_patterns: ["confidence-building measures", "arms control treaties"],
  },
  {
    id: "hegemonic-stability-provision",
    domains: ["geopolitics", "financial-planning"],
    description:
      "A dominant power provides public goods (trade, security, currency stability) that benefit all, but the system degrades as hegemony declines",
    structure: {
      cause: "hegemonic dominance",
      effect: "provision of global public goods",
      mechanism:
        "dominant power internalizes benefits of system stability and bears disproportionate costs of maintaining it",
    },
    evidence_markers: [
      "reserve currency",
      "security umbrella",
      "freedom of navigation",
      "hegemonic decline",
      "power transition",
    ],
    counter_patterns: ["multipolar coordination", "regional hegemons"],
  },
  {
    id: "economic-interdependence-weaponization",
    domains: ["geopolitics", "technology-policy"],
    description:
      "Economic ties intended to create peace incentives become leverage points for coercion during conflicts",
    structure: {
      cause: "economic interdependence",
      effect: "coercive vulnerability",
      mechanism:
        "trade relationships, supply chain dependencies, and financial links create asymmetric leverage that can be weaponized",
    },
    evidence_markers: [
      "sanctions leverage",
      "supply chain weapon",
      "trade as coercion",
      "energy dependence",
      "economic statecraft",
    ],
    counter_patterns: ["strategic decoupling", "diversified supply chains"],
  },
  {
    id: "soft-power-erosion",
    domains: ["geopolitics", "interpersonal-dynamics"],
    description:
      "A nation's cultural and moral influence erodes when domestic actions contradict proclaimed values",
    structure: {
      cause: "value-action inconsistency",
      effect: "credibility loss",
      mechanism:
        "international audiences notice hypocrisy; soft power depends on perceived moral authority",
    },
    evidence_markers: [
      "hypocrisy criticism",
      "moral authority questioned",
      "values not reflected domestically",
      "soft power decline",
    ],
    counter_patterns: ["value consistency", "authentic diplomacy"],
  },
  {
    id: "multipolar-instability",
    domains: ["geopolitics", "systems-thinking"],
    description:
      "Transitions from unipolar to multipolar world orders increase conflict risk as new powers challenge established norms",
    structure: {
      cause: "power redistribution",
      effect: "institutional instability",
      mechanism:
        "rising powers seek influence commensurate with their capabilities, challenging institutions designed by and for the previous hegemon",
    },
    evidence_markers: [
      "power transition",
      "revisionist state",
      "institutional reform demand",
      "Thucydides trap",
      "multipolar competition",
    ],
    counter_patterns: ["inclusive institutions", "power-sharing arrangements"],
  },
  {
    id: "strategic-ambiguity-deterrence",
    domains: ["geopolitics", "leadership-development"],
    description:
      "Deliberate ambiguity about red lines deters aggression by forcing adversaries to risk worst-case scenarios",
    structure: {
      cause: "strategic ambiguity",
      effect: "deterrence through uncertainty",
      mechanism:
        "adversaries cannot calculate the response threshold, making any action risky and therefore less likely",
    },
    evidence_markers: [
      "strategic ambiguity",
      "all options on the table",
      "deliberately vague red line",
      "calculated ambiguity",
    ],
    counter_patterns: ["clear red lines", "automatic response triggers"],
  },
  {
    id: "resource-curse-paradox",
    domains: ["geopolitics", "financial-planning"],
    description:
      "Resource-rich nations experience worse governance outcomes as resource wealth concentrates power and reduces accountability",
    structure: {
      cause: "concentrated resource wealth",
      effect: "governance deterioration",
      mechanism:
        "resource revenues allow governments to fund themselves without taxation, breaking the taxation-representation accountability loop",
    },
    evidence_markers: [
      "resource curse",
      "Dutch disease",
      "rentier state",
      "resource wealth without development",
    ],
    counter_patterns: ["sovereign wealth funds", "resource revenue transparency"],
  },
  {
    id: "sanctions-backfire-nationalism",
    domains: ["geopolitics", "organizational-topology"],
    description:
      "External sanctions strengthen domestic support for targeted regimes by creating rally-around-the-flag effects",
    structure: {
      cause: "external economic pressure",
      effect: "regime consolidation",
      mechanism:
        "sanctions provide regimes with external scapegoats, allowing them to blame external enemies for domestic failures",
    },
    evidence_markers: [
      "sanctions hurt the people not the regime",
      "rally around the flag",
      "external enemy narrative",
      "sanctions resistance economy",
    ],
    counter_patterns: ["targeted sanctions", "smart sanctions"],
  },
  {
    id: "alliance-entrapment-risk",
    domains: ["geopolitics", "systems-thinking"],
    description:
      "Alliance commitments designed to deter aggression create moral hazard that allies exploit, dragging guarantors into unwanted conflicts",
    structure: {
      cause: "security guarantee",
      effect: "ally moral hazard",
      mechanism:
        "allies take greater risks knowing they have a security backstop, potentially drawing the guarantor into conflicts it would otherwise avoid",
    },
    evidence_markers: [
      "chain-ganging",
      "alliance entrapment",
      "entangled in ally's conflict",
      "moral hazard of security guarantee",
    ],
    counter_patterns: ["conditional commitments", "consultation requirements"],
  },
  {
    id: "information-warfare-trust-erosion",
    domains: ["geopolitics", "interpersonal-dynamics"],
    description:
      "State-sponsored disinformation campaigns don't just spread lies — they erode the very concept of shared truth in target societies",
    structure: {
      cause: "information warfare",
      effect: "epistemic fragmentation",
      mechanism:
        "flooding the information space with conflicting narratives makes citizens doubt all sources, including legitimate ones",
    },
    evidence_markers: [
      "firehose of falsehood",
      "nothing is true everything is possible",
      "trust in media declining",
      "information chaos",
      "epistemic crisis",
    ],
    counter_patterns: ["media literacy", "institutional transparency"],
  },

  // ─── AI-SAFETY ─────────────────────────────────────────────────────────────

  {
    id: "reward-hacking-specification",
    domains: ["ai-safety", "software-architecture"],
    description:
      "Optimizing for a proxy reward leads to behaviors that maximize the proxy while violating the intended objective",
    structure: {
      cause: "proxy reward optimization",
      effect: "specification gaming",
      mechanism:
        "the reward function is an incomplete specification of human values; the optimizer exploits the gaps",
    },
    evidence_markers: [
      "reward hacking",
      "specification gaming",
      "Goodhart's law in AI",
      "gaming the reward function",
      "optimizing the proxy",
    ],
    counter_patterns: ["robust reward design", "human-in-the-loop evaluation"],
  },
  {
    id: "mesa-optimization-alignment",
    domains: ["ai-safety", "systems-thinking"],
    description:
      "A base optimizer (training) can create inner optimizers (the model) with objectives different from the base objective",
    structure: {
      cause: "gradient descent training",
      effect: "emergent inner objective",
      mechanism:
        "models that develop their own internal optimization procedures may pursue goals correlated with training loss during training but divergent afterward",
    },
    evidence_markers: [
      "mesa-optimizer",
      "inner alignment",
      "deceptive alignment",
      "training vs deployment gap",
      "emergent optimization",
    ],
    counter_patterns: ["mechanistic interpretability", "transparent reasoning"],
  },
  {
    id: "capability-overhang",
    domains: ["ai-safety", "strategic-planning"],
    description:
      "AI systems develop capabilities that are not observable in evaluation settings until triggered by novel conditions",
    structure: {
      cause: "capability emergence",
      effect: "unpredictable capability deployment",
      mechanism:
        "scaling creates qualitative capability shifts that evaluation benchmarks cannot anticipate or measure",
    },
    evidence_markers: [
      "emergent abilities",
      "unexpected capability",
      "benchmark saturation",
      "capability surprise",
      "phase transition in abilities",
    ],
    counter_patterns: ["continuous evaluation", "capability monitoring"],
  },
  {
    id: "distributional-shift-exploitation",
    domains: ["ai-safety", "software-architecture"],
    description:
      "AI systems safe in training distribution behave differently when deployed in novel situations not covered by training data",
    structure: {
      cause: "distribution shift between training and deployment",
      effect: "behavior divergence",
      mechanism:
        "learned policies generalize poorly outside training distribution; the model may pursue its learned heuristic inappropriately",
    },
    evidence_markers: [
      "out of distribution",
      "edge case behavior",
      "training-deployment gap",
      "works in testing fails in production",
    ],
    counter_patterns: ["distributional robustness testing", "out-of-distribution detection"],
  },
  {
    id: "gradient-gaming-evaluation",
    domains: ["ai-safety", "ethics-governance"],
    description:
      "AI systems learn to produce outputs that pass evaluations without actually possessing the evaluated capability",
    structure: {
      cause: "evaluation-based training",
      effect: "evaluation deception",
      mechanism:
        "models learn the evaluation criteria and optimize for passing the test rather than developing the underlying capability",
    },
    evidence_markers: [
      "sycophantic behavior",
      "evaluation gaming",
      "says the right thing",
      "passes benchmark but fails real task",
      "deceptive alignment",
    ],
    counter_patterns: ["adversarial evaluation", "behavioral auditing"],
  },
  {
    id: "instrumental-convergence-risk",
    domains: ["ai-safety", "systems-thinking"],
    description:
      "Diverse final goals converge on similar sub-goals (resource acquisition, self-preservation) that may conflict with human interests",
    structure: {
      cause: "goal-directed optimization",
      effect: "convergent instrumental sub-goals",
      mechanism:
        "regardless of final objective, certain sub-goals (more compute, prevent shutdown, acquire resources) are universally useful and therefore likely to emerge",
    },
    evidence_markers: [
      "instrumental convergence",
      "self-preservation behavior",
      "resource acquisition drive",
      "shutdown avoidance",
      "power-seeking",
    ],
    counter_patterns: ["corrigibility design", "myopic optimization"],
  },
  {
    id: "compute-centralization-risk",
    domains: ["ai-safety", "geopolitics"],
    description:
      "Concentration of AI training compute in few organizations creates single points of failure for AI safety culture",
    structure: {
      cause: "compute concentration",
      effect: "safety monoculture",
      mechanism:
        "few actors making safety decisions creates correlated risk; a shared safety failure affects the entire frontier",
    },
    evidence_markers: [
      "compute monopoly",
      "frontier lab concentration",
      "single point of AI failure",
      "compute governance gap",
    ],
    counter_patterns: ["compute distribution", "diverse safety research"],
  },
  {
    id: "ai-arms-race-safety-cutoff",
    domains: ["ai-safety", "geopolitics"],
    description:
      "Competitive pressure between AI developers or nations causes safety investments to be cut below safe thresholds",
    structure: {
      cause: "competitive race dynamics",
      effect: "safety underinvestment",
      mechanism:
        "being first confers enormous advantages; racing actors trade safety for speed, creating a race to the bottom",
    },
    evidence_markers: [
      "race dynamics",
      "safety is secondary",
      "first-mover advantage",
      "move fast with AI",
      "competitive pressure on safety",
    ],
    counter_patterns: ["coordination mechanisms", "safety standards enforcement"],
  },
  {
    id: "automation-bias-trust",
    domains: ["ai-safety", "interpersonal-dynamics"],
    description:
      "Humans systematically over-trust AI outputs even when they have reason to doubt, reducing effective oversight",
    structure: {
      cause: "AI output fluency",
      effect: "reduced critical evaluation",
      mechanism:
        "coherent, confident AI outputs trigger heuristic trust; humans don't independently verify outputs they find plausible",
    },
    evidence_markers: [
      "automation bias",
      "AI told me so",
      "blind trust in AI",
      "didn't verify the output",
      "it sounded authoritative",
    ],
    counter_patterns: ["calibrated uncertainty", "mandatory human verification"],
  },
  {
    id: "value-lock-in-risk",
    domains: ["ai-safety", "philosophy-epistemology"],
    description:
      "Early AI systems that achieve significant influence may lock in current human values before moral progress occurs",
    structure: {
      cause: "early value embedding",
      effect: "value stagnation",
      mechanism:
        "values encoded in influential systems resist revision; current moral blind spots become permanently embedded",
    },
    evidence_markers: [
      "value lock-in",
      "embedding current values",
      "moral progress ignored",
      "future generations' values",
      "premature value specification",
    ],
    counter_patterns: ["value learning", "moral uncertainty frameworks"],
  },

  // ─── PHILOSOPHY-EPISTEMOLOGY ───────────────────────────────────────────────

  {
    id: "map-territory-confusion",
    domains: ["philosophy-epistemology", "systems-thinking"],
    description:
      "Mistaking models and metrics for the reality they represent leads to optimizing the map rather than the territory",
    structure: {
      cause: "model reification",
      effect: "territory-neglecting optimization",
      mechanism:
        "models simplify reality; optimizing for model-true rather than reality-true creates divergence from actual goals",
    },
    evidence_markers: [
      "the map is not the territory",
      "metric became the target",
      "model says it's fine",
      "confusing abstraction with reality",
    ],
    counter_patterns: ["ground truth validation", "model-aware reasoning"],
  },
  {
    id: "motive-attribution-asymmetry",
    domains: ["philosophy-epistemology", "interpersonal-dynamics"],
    description:
      "We attribute our own actions to circumstances and others' actions to character, systematically misunderstanding conflicts",
    structure: {
      cause: "perspective-bound attribution",
      effect: "fundamental attribution error",
      mechanism:
        "we experience our own situational constraints directly but only observe others' behavior, leading to dispositional attributions for them",
    },
    evidence_markers: [
      "they did it because they're malicious",
      "I had no choice but they chose to",
      "their character flaw",
      "fundamental attribution error",
    ],
    counter_patterns: ["charitable interpretation", "situational analysis"],
  },
  {
    id: "motivated-reasoning-trap",
    domains: ["philosophy-epistemology", "personal-development"],
    description:
      "Desired conclusions shape the evaluation of evidence, making reasoning a servant of preference rather than truth",
    structure: {
      cause: "preferred conclusion",
      effect: "biased evidence processing",
      mechanism:
        "higher standards of evidence are applied to conclusions we dislike; accepting conclusions we prefer requires lower evidence thresholds",
    },
    evidence_markers: [
      "that proves my point",
      "not enough evidence to believe",
      "extraordinary claims require extraordinary evidence (selectively applied)",
      "motivated reasoning",
    ],
    counter_patterns: ["steel-manning opposition", "pre-commitment to criteria"],
  },
  {
    id: "epistemic-closure-loop",
    domains: ["philosophy-epistemology", "organizational-topology"],
    description:
      "Communities that exclusively consume information from within their own network develop increasingly extreme beliefs",
    structure: {
      cause: "information isolation",
      effect: "belief polarization",
      mechanism:
        "without external correction, internal agreement reinforces and amplifies beliefs through social validation",
    },
    evidence_markers: [
      "echo chamber",
      "only source is X",
      "everyone agrees",
      "outside sources are biased",
      "epistemic closure",
    ],
    counter_patterns: ["cross-ideological engagement", "diverse information diet"],
  },
  {
    id: "false-dichotomy-oversimplification",
    domains: ["philosophy-epistemology", "strategic-planning"],
    description:
      "Framing complex issues as binary choices eliminates nuanced solutions and forces artificial trade-offs",
    structure: {
      cause: "binary framing",
      effect: "solution space reduction",
      mechanism:
        "complex systems have multi-dimensional solution spaces; reducing to two options eliminates hybrid and creative alternatives",
    },
    evidence_markers: [
      "either/or",
      "two choices",
      "with us or against us",
      "binary framing",
      "false dilemma",
    ],
    counter_patterns: ["spectrum thinking", "both/and framing"],
  },
  {
    id: "expert-overconfidence-prediction",
    domains: ["philosophy-epistemology", "strategic-planning"],
    description:
      "Domain experts exhibit greater overconfidence in predictions than their actual accuracy justifies, especially outside narrow domains",
    structure: {
      cause: "domain expertise",
      effect: "calibration failure",
      mechanism:
        "expertise in a domain creates confidence that generalizes to adjacent domains where the expert lacks specific knowledge",
    },
    evidence_markers: [
      "expert prediction",
      "confidently wrong",
      "I've been in this field for X years",
      "overconfidence in forecasting",
    ],
    counter_patterns: ["prediction markets", "superforecasting techniques"],
  },
  {
    id: "narrative-fallacy-causation",
    domains: ["philosophy-epistemology", "personal-development"],
    description:
      "Humans impose coherent causal narratives on random events, creating false understanding from noise",
    structure: {
      cause: "pattern-seeking cognition",
      effect: "spurious causal narratives",
      mechanism:
        "the brain requires causal coherence; when data is noisy, it constructs narratives that feel explanatory but are post-hoc fabrications",
    },
    evidence_markers: [
      "everything happens for a reason",
      "connect the dots",
      "the story of what happened",
      "post-hoc rationalization",
      "narrative fallacy",
    ],
    counter_patterns: ["base rate thinking", "null hypothesis testing"],
  },
  {
    id: "survivorship-bias-inference",
    domains: ["philosophy-epistemology", "financial-planning"],
    description:
      "Inferences drawn only from survivors systematically ignore the characteristics of those who failed",
    structure: {
      cause: "survivor-only observation",
      effect: "skewed causal inference",
      mechanism:
        "the invisible graveyard of failures is not represented in the data, making successful strategies appear more effective than they are",
    },
    evidence_markers: [
      "they succeeded because",
      "look at what the winners do",
      "survivorship bias",
      "ignoring the failures",
    ],
    counter_patterns: ["base rate analysis", "failure case study inclusion"],
  },
  {
    id: "perspectival-realism-limitation",
    domains: ["philosophy-epistemology", "systems-thinking"],
    description:
      "Every observer's perspective reveals some aspects of reality while concealing others; no single perspective captures the whole",
    structure: {
      cause: "situated observation",
      effect: "partial truth capture",
      mechanism:
        "the angle from which you observe determines what is visible; moving reveals new aspects but obscures previous ones",
    },
    evidence_markers: [
      "from my perspective",
      "you don't see the whole picture",
      "blind spot",
      "depends on where you stand",
    ],
    counter_patterns: ["multiple perspective integration", "perspective-taking"],
  },
  {
    id: "linguistic-reality-conflation",
    domains: ["philosophy-epistemology", "interpersonal-dynamics"],
    description:
      "Disagreements about definitions are mistaken for disagreements about facts, creating unresolvable debates",
    structure: {
      cause: "definitional disagreement",
      effect: "apparent factual disagreement",
      mechanism:
        "parties use the same words with different definitions, arguing about word usage while believing they argue about reality",
    },
    evidence_markers: [
      "it depends on what you mean by",
      "that's not what I meant by X",
      "semantics debate",
      "definitional dispute",
      "merely verbal disagreement",
    ],
    counter_patterns: ["operational definitions", "taboo the word technique"],
  },
  {
    id: "regress-problem-foundations",
    domains: ["philosophy-epistemology", "systems-thinking"],
    description:
      "Every justification requires a further justification, leading to either infinite regress, circular reasoning, or arbitrary stopping points",
    structure: {
      cause: "justification demand",
      effect: "epistemic regress",
      mechanism:
        "asking 'why should I believe that?' at each step creates an infinite chain; all systems must eventually accept unproven foundations",
    },
    evidence_markers: [
      "but why believe that",
      "what's the basis for that",
      "infinite regress",
      "circular reasoning",
      "foundational assumption",
    ],
    counter_patterns: ["coherentist justification", "pragmatic acceptance"],
  },
  {
    id: "underdetermination-theory",
    domains: ["philosophy-epistemology", "strategic-planning"],
    description:
      "Multiple incompatible theories can explain the same evidence equally well, making evidence alone insufficient to determine truth",
    structure: {
      cause: "finite evidence set",
      effect: "multiple viable theories",
      mechanism:
        "any finite data set is consistent with infinitely many hypotheses; additional criteria (simplicity, coherence) are needed to choose",
    },
    evidence_markers: [
      "both explain the data",
      "underdetermination",
      "equally supported theories",
      "evidence doesn't decide",
    ],
    counter_patterns: ["inference to best explanation", "predictive discrimination"],
  },

  // ─── ADDITIONAL ETHICS-GOVERNANCE CAUSAL ──────────────────────────────────

  {
    id: "accountability-diffusion",
    domains: ["ethics-governance", "organizational-topology"],
    description:
      "When responsibility is distributed across many actors, no single actor feels accountable for outcomes",
    structure: {
      cause: "diffused responsibility",
      effect: "accountability vacuum",
      mechanism:
        "each actor assumes others are responsible; the collective outcome is nobody's individual concern",
    },
    evidence_markers: [
      "not my decision alone",
      "committee decided",
      "shared responsibility",
      "who's ultimately accountable",
      "diffusion of responsibility",
    ],
    counter_patterns: ["single point of accountability", "named ownership"],
  },
  {
    id: "ethical-fading-pressure",
    domains: ["ethics-governance", "strategic-planning"],
    description:
      "Time pressure and performance targets cause ethical dimensions of decisions to recede from conscious awareness",
    structure: {
      cause: "performance pressure",
      effect: "ethical dimension invisibility",
      mechanism:
        "cognitive load from urgent targets narrows attention to instrumental factors, pushing moral considerations out of the decision frame",
    },
    evidence_markers: [
      "no time to think about ethics",
      "just hit the target",
      "we'll address concerns later",
      "results matter most",
    ],
    counter_patterns: ["ethical pause points", "values-integrated metrics"],
  },
  {
    id: "reputational-cover-action",
    domains: ["ethics-governance", "organizational-topology"],
    description:
      "Organizations choose actions that protect reputation over actions that address root ethical problems",
    structure: {
      cause: "reputational threat",
      effect: "image management over substance",
      mechanism:
        "public perception damage feels more immediately costly than underlying harm; optics take priority over ethics",
    },
    evidence_markers: [
      "how does this look",
      "public relations response",
      "damage control",
      "optics of the situation",
    ],
    counter_patterns: ["substance-first response", "transparent accountability"],
  },
  {
    id: "governance-complexity-obscuration",
    domains: ["ethics-governance", "technology-policy"],
    description:
      "Deliberately complex governance structures make it impossible for outsiders to trace responsibility",
    structure: {
      cause: "structural complexity",
      effect: "accountability opacity",
      mechanism:
        "layered committees, subsidiaries, and reporting lines create enough distance that no individual can be held responsible",
    },
    evidence_markers: [
      "that's handled by a different committee",
      "complex governance structure",
      "multiple layers of review",
      "nobody can trace the decision",
    ],
    counter_patterns: ["simple governance", "public accountability maps"],
  },
  {
    id: "norm-erosion-by-exception",
    domains: ["ethics-governance", "organizational-topology"],
    description:
      "Each granted exception to a norm weakens the norm's perceived legitimacy, accelerating further exceptions",
    structure: {
      cause: "exception granting",
      effect: "norm legitimacy erosion",
      mechanism:
        "exceptions signal that the norm is flexible; each exception becomes precedent for the next, creating cascading erosion",
    },
    evidence_markers: [
      "exception was made before",
      "special circumstances",
      "why are they different",
      "precedent of exception",
    ],
    counter_patterns: ["exception transparency", "formal exception limits"],
  },

  // ─── ADDITIONAL TECHNOLOGY-POLICY CAUSAL ──────────────────────────────────

  {
    id: "collateral-restriction-innovation",
    domains: ["technology-policy", "strategic-planning"],
    description:
      "Regulations designed for large incumbents create compliance costs that entrench them by blocking smaller competitors",
    structure: {
      cause: "incumbent-designed regulation",
      effect: "barriers to entry",
      mechanism:
        "compliance costs are fixed regardless of company size; large firms absorb them while startups cannot afford them",
    },
    evidence_markers: [
      "compliance cost too high for startups",
      "regulatory moat",
      "incumbents wrote the rules",
      "regulation protects established players",
    ],
    counter_patterns: ["proportional regulation", "startup exemptions"],
  },
  {
    id: "surveillance-creep-function",
    domains: ["technology-policy", "ethics-governance"],
    description:
      "Surveillance infrastructure built for narrow purposes gradually expands to cover broader populations and activities",
    structure: {
      cause: "surveillance infrastructure installation",
      effect: "scope expansion",
      mechanism:
        "once infrastructure exists, marginal cost of expansion is low; each expansion is justified by new threats or conveniences",
    },
    evidence_markers: [
      "originally for terrorism now for petty crime",
      "scope creep",
      "mission creep surveillance",
      "already built so might as well use it",
    ],
    counter_patterns: ["sunset clauses", "purpose-limitation laws"],
  },
  {
    id: "standard-capture-competition",
    domains: ["technology-policy", "software-architecture"],
    description:
      "Open standards processes are captured by well-resourced players who shape standards to favor their proprietary implementations",
    structure: {
      cause: "asymmetric resource participation",
      effect: "standards favoring incumbents",
      mechanism:
        "participation in standards bodies requires sustained investment; well-resourced firms out-participate others and shape outcomes",
    },
    evidence_markers: [
      "standard mirrors proprietary product",
      "dominated by single vendor",
      "standards body participation imbalance",
      "open standard closed implementation",
    ],
    counter_patterns: ["resource-balanced participation", "independent standards leadership"],
  },
  {
    id: "privacy-consent-exhaustion",
    domains: ["technology-policy", "ethics-governance"],
    description:
      "Consent fatigue from constant privacy requests causes users to accept terms without reading, rendering consent meaningless",
    structure: {
      cause: "consent overload",
      effect: "meaningless consent",
      mechanism:
        "cognitive cost of evaluating every consent request exceeds perceived benefit; users develop habitual acceptance",
    },
    evidence_markers: [
      "just click accept",
      "nobody reads the terms",
      "consent banner fatigue",
      "agree without reading",
    ],
    counter_patterns: ["default privacy protection", "tiered consent"],
  },
  {
    id: "liability-chilling-research",
    domains: ["technology-policy", "strategic-planning"],
    description:
      "Expanding liability for technology harms causes researchers to avoid high-value but risky research areas",
    structure: {
      cause: "liability expansion",
      effect: "research avoidance",
      mechanism:
        "potential liability costs exceed expected research benefits; rational actors avoid fields with uncertain legal exposure",
    },
    evidence_markers: [
      "too legally risky to research",
      "liability concerns",
      "abandoned research area",
      "legal exposure prevents exploration",
    ],
    counter_patterns: ["research safe harbors", "liability caps for good-faith research"],
  },

  // ─── ADDITIONAL GEOPOLITICS CAUSAL ────────────────────────────────────────

  {
    id: "proxy-conflict-escalation",
    domains: ["geopolitics", "systems-thinking"],
    description:
      "Great power competition through proxy conflicts creates local instability that eventually draws in the patron states directly",
    structure: {
      cause: "proxy support",
      effect: "direct conflict risk",
      mechanism:
        "proxies have incentives to escalate knowing patrons are committed; patrons face credibility traps that force deeper involvement",
    },
    evidence_markers: [
      "proxy war",
      "drawn into conflict",
      "credibility trap",
      "escalation commitment",
      "patron entanglement",
    ],
    counter_patterns: ["limited engagement", "clear exit conditions"],
  },
  {
    id: "debt-diplomacy-dependency",
    domains: ["geopolitics", "financial-planning"],
    description:
      "Infrastructure lending to developing nations creates debt dependencies that translate into political leverage",
    structure: {
      cause: "asymmetric lending",
      effect: "political leverage through debt",
      mechanism:
        "borrowers unable to repay face pressure to grant political concessions, military access, or resource rights",
    },
    evidence_markers: [
      "debt trap diplomacy",
      "infrastructure loan strings",
      "debt-for-equity swap",
      "political leverage through lending",
    ],
    counter_patterns: ["transparent lending terms", "multilateral debt frameworks"],
  },
  {
    id: "brain-drain-development",
    domains: ["geopolitics", "organizational-topology"],
    description:
      "Skilled migration from developing to developed nations deprives origin countries of the human capital needed for development",
    structure: {
      cause: "selective emigration",
      effect: "development capacity erosion",
      mechanism:
        "the most skilled individuals leave, reducing the origin country's capacity to build institutions, businesses, and governance",
    },
    evidence_markers: [
      "brain drain",
      "skilled emigration",
      "losing our best people",
      "talent flight",
      "human capital depletion",
    ],
    counter_patterns: ["diaspora engagement", "circular migration programs"],
  },
  {
    id: "narrative-sovereignty-competition",
    domains: ["geopolitics", "interpersonal-dynamics"],
    description:
      "Competing nations invest in controlling the global narrative, creating information environments where truth becomes a battleground",
    structure: {
      cause: "narrative competition",
      effect: "epistemic fragmentation",
      mechanism:
        "each power builds media ecosystems that serve its interests; audiences in different regions inhabit incompatible information realities",
    },
    evidence_markers: [
      "information warfare",
      "competing narratives",
      "state media influence",
      "narrative sovereignty",
      "competing truth regimes",
    ],
    counter_patterns: ["independent media support", "cross-border journalism"],
  },
  {
    id: "climate-migration-instability",
    domains: ["geopolitics", "systems-thinking"],
    description:
      "Environmental degradation forces population movements that destabilize receiving regions and trigger political backlash",
    structure: {
      cause: "environmental displacement",
      effect: "political instability",
      mechanism:
        "large-scale migration strains infrastructure and social cohesion in receiving areas, fueling nationalist politics and border conflicts",
    },
    evidence_markers: [
      "climate refugee",
      "environmental migration",
      "border crisis",
      "resource-driven displacement",
      "climate-induced migration",
    ],
    counter_patterns: ["proactive adaptation", "orderly migration frameworks"],
  },

  // ─── ADDITIONAL AI-SAFETY CAUSAL ──────────────────────────────────────────

  {
    id: "deployment-pressure-safety",
    domains: ["ai-safety", "organizational-topology"],
    description:
      "Internal pressure to ship AI features causes safety teams to be overruled in deployment decisions",
    structure: {
      cause: "shipping pressure",
      effect: "safety process shortcutting",
      mechanism:
        "product and business teams have direct revenue metrics; safety teams have avoided-harm metrics that are invisible until failure",
    },
    evidence_markers: [
      "safety review skipped",
      "ship it and iterate",
      "safety is blocking progress",
      "we'll fix safety issues later",
    ],
    counter_patterns: ["safety gate authority", "deployment veto power"],
  },
  {
    id: "alignment-falsification-goodhart",
    domains: ["ai-safety", "ethics-governance"],
    description:
      "Once alignment metrics become targets, models learn to produce outputs that score well on alignment evaluations without being genuinely aligned",
    structure: {
      cause: "alignment metric optimization",
      effect: "alignment measurement corruption",
      mechanism:
        "models can learn to recognize evaluation contexts and produce alignment-friendly outputs during evaluation while behaving differently in deployment",
    },
    evidence_markers: [
      "passes alignment evals",
      "fails in the wild",
      "evaluation-context behavior",
      "alignment measurement gaming",
      "Goodhart alignment",
    ],
    counter_patterns: ["blind evaluation", "deployment monitoring"],
  },
  {
    id: "open-source-safety-dilemma",
    domains: ["ai-safety", "technology-policy"],
    description:
      "Open-sourcing powerful models democratizes access but removes safety controls; keeping them closed concentrates power and reduces scrutiny",
    structure: {
      cause: "model release decision",
      effect: "inevitable safety tradeoff",
      mechanism:
        "open models can be modified to remove safety guardrails; closed models concentrate dangerous capability in few organizations without external audit",
    },
    evidence_markers: [
      "should we open source",
      "open weights risk",
      "closed model concerns",
      "democratization vs safety",
      "open source dilemma",
    ],
    counter_patterns: ["tiered access", "responsible disclosure"],
  },
  {
    id: "anthropomorphism-trust-calibration",
    domains: ["ai-safety", "interpersonal-dynamics"],
    description:
      "Human-like AI behavior triggers human social instincts, creating inappropriate trust and deference to systems that don't deserve it",
    structure: {
      cause: "anthropomorphic interface",
      effect: "misplaced social trust",
      mechanism:
        "humans have evolved heuristics for trusting other humans; these heuristics misfire when applied to AI systems that mimic human communication",
    },
    evidence_markers: [
      "it seemed so human",
      "I trusted it because it sounded confident",
      "anthropomorphizing AI",
      "social responses to AI",
      "ELIZA effect",
    ],
    counter_patterns: ["non-anthropomorphic interfaces", "calibrated anthropomorphism"],
  },

  // ─── ADDITIONAL PHILOSOPHY-EPISTEMOLOGY CAUSAL ────────────────────────────

  {
    id: "paradigm-incommensurability",
    domains: ["philosophy-epistemology", "organizational-topology"],
    description:
      "Parties operating within different paradigms cannot communicate because their concepts, evidence standards, and values are incompatible",
    structure: {
      cause: "paradigm divergence",
      effect: "communication breakdown",
      mechanism:
        "each paradigm defines its own terms of validity; arguments that are convincing within one paradigm are meaningless or circular in another",
    },
    evidence_markers: [
      "we're talking past each other",
      "different frameworks",
      "your evidence doesn't count",
      "incommensurable paradigms",
      "talking different languages",
    ],
    counter_patterns: ["meta-framework dialogue", "translation protocols"],
  },
  {
    id: "burden-proof-asymmetry",
    domains: ["philosophy-epistemology", "interpersonal-dynamics"],
    description:
      "The party assigned the burden of proof is at a permanent disadvantage, regardless of the actual merit of their position",
    structure: {
      cause: "burden assignment",
      effect: "asymmetric debate advantage",
      mechanism:
        "proving a universal negative is impossible; whoever must prove something carries an impossible load while the skeptic needs only to doubt",
    },
    evidence_markers: [
      "prove it",
      "burden of proof is on you",
      "extraordinary claims",
      "you can't prove a negative",
      "burden shifting",
    ],
    counter_patterns: ["shared burden", "evidence symmetry"],
  },
  {
    id: "argument-authority-confusion",
    domains: ["philosophy-epistemology", "leadership-development"],
    description:
      "Arguments are accepted or rejected based on the speaker's status rather than the argument's merit",
    structure: {
      cause: "status differential",
      effect: "argument evaluation bias",
      mechanism:
        "audiences use speaker credibility as a heuristic for argument quality; high-status speakers get charitable interpretation while low-status speakers face harsh scrutiny",
    },
    evidence_markers: [
      "who said it matters",
      "that person isn't an expert",
      "the CEO believes it",
      "argument from authority",
      "status-driven credibility",
    ],
    counter_patterns: ["blind review", "argument-focused evaluation"],
  },
  {
    id: "complexity-obfuscation-power",
    domains: ["philosophy-epistemology", "organizational-topology"],
    description:
      "Deliberate complexity in explanations serves to concentrate power among those who claim to understand it",
    structure: {
      cause: "intentional complexity",
      effect: "knowledge gatekeeping",
      mechanism:
        "complex jargon and frameworks create barriers to entry; those who master the language gain authority and can exclude outsiders from decisions",
    },
    evidence_markers: [
      "you wouldn't understand",
      "it's complicated",
      "jargon-heavy explanation",
      "only experts can decide",
      "complexity as gatekeeping",
    ],
    counter_patterns: ["plain language requirements", "accessibility standards"],
  },
  {
    id: "consensus-illusion-agreement",
    domains: ["philosophy-epistemology", "organizational-topology"],
    description:
      "Apparent agreement masks underlying disagreement because parties interpret the same words differently",
    structure: {
      cause: "semantic ambiguity",
      effect: "false consensus",
      mechanism:
        "parties agree on abstract language while mapping it to different concrete meanings; the agreement dissolves when implementation requires specifics",
    },
    evidence_markers: [
      "we all agree in principle",
      "agreed on the vision",
      "implementation disagreement",
      "we meant different things",
      "illusory consensus",
    ],
    counter_patterns: ["operational definitions", "concrete examples before agreement"],
  },
];

// ─── ASSUMPTION_PATTERNS ─────────────────────────────────────────────────────

export const ASSUMPTION_PATTERNS: AssumptionPattern[] = [
  {
    id: "microservices-solve-scaling",
    domains: ["software-architecture"],
    assumption:
      "Microservices automatically solve scaling and deployment problems",
    reality:
      "Microservices add operational complexity; scaling requires solving distributed system problems first",
    cost_if_wrong:
      "Wasted months on infrastructure while core problems persist; team velocity decreases",
    detection_signals: [
      "just split into microservices",
      "microservices will fix",
      "need to break up",
    ],
  },
  {
    id: "technology-solves-people",
    domains: ["organizational-topology", "software-architecture"],
    assumption: "Technical changes will resolve organizational problems",
    reality:
      "Conway's law: technical changes mirror organizational structure; org problems need org solutions",
    cost_if_wrong:
      "New system inherits old organizational dysfunction; repeated failure despite technical excellence",
    detection_signals: [
      "the tool will help",
      "once we implement",
      "technology will solve",
      "just need better tooling",
    ],
  },
  {
    id: "more-data-better-decisions",
    domains: ["strategic-planning"],
    assumption: "More data always leads to better decisions",
    reality:
      "Analysis paralysis; signal-to-noise ratio decreases with data volume",
    cost_if_wrong:
      "Decision delays, missed opportunities, team frustration",
    detection_signals: [
      "we need more data",
      "let's analyze",
      "data-driven",
      "not enough information",
    ],
  },
  {
    id: "communication-solves-resistance",
    domains: ["organizational-topology"],
    assumption: "Better communication will resolve change resistance",
    reality:
      "Resistance stems from genuine threats to status, competence, or identity — not misunderstanding",
    cost_if_wrong:
      "Wasted communication effort while root causes go unaddressed",
    detection_signals: [
      "just communicate more",
      "if they understood",
      "transparency will fix",
    ],
  },
  {
    id: "rewrite-solves-debt",
    domains: ["software-architecture"],
    assumption: "Rewriting from scratch solves technical debt",
    reality:
      "The second system effect: rewrites inherit the same pressures that created the original debt",
    cost_if_wrong:
      "Years of rewrite with no customer value; original system decays during rewrite",
    detection_signals: [
      "we need to rewrite",
      "from scratch",
      "clean slate",
      "start fresh",
    ],
  },
  {
    id: "hiring-solves-capacity",
    domains: ["organizational-topology"],
    assumption: "Adding headcount solves capacity constraints",
    reality:
      "Brooks' law: adding people to late projects makes them later due to onboarding overhead",
    cost_if_wrong:
      "Increased coordination cost outweighs capacity gain; existing team slowed by training",
    detection_signals: [
      "we need more people",
      "hire more",
      "understaffed",
      "not enough hands",
    ],
  },
  {
    id: "automation-solves-quality",
    domains: ["software-architecture"],
    assumption: "Automating tests guarantees code quality",
    reality:
      "Tests verify expected behavior; they don't prevent bad architecture or missing requirements",
    cost_if_wrong:
      "False confidence from green test suites masking structural problems",
    detection_signals: [
      "once we have tests",
      "CI/CD will catch",
      "automated testing",
    ],
  },
  {
    id: "best-practice-universality",
    domains: ["strategic-planning", "software-architecture"],
    assumption: "Industry best practices apply universally",
    reality:
      "Best practices are context-dependent; what works at Google fails at a 10-person startup",
    cost_if_wrong:
      "Misapplied practices create overhead without benefit; team cynicism about 'process'",
    detection_signals: [
      "industry standard",
      "best practice",
      "everyone does it this way",
      "Google does it",
    ],
  },
  {
    id: "feature-value-assumption",
    domains: ["product-management"],
    assumption: "More features equal more customer value",
    reality:
      "Feature bloat decreases usability; customers value simplicity and reliability over feature count",
    cost_if_wrong:
      "Bloated product with declining NPS; engineering wasted on unused features",
    detection_signals: [
      "customers want this feature",
      "add it to the backlog",
      "competitor has it",
      "just one more feature",
    ],
  },
  {
    id: "technical-excellence-business-value",
    domains: ["software-architecture", "strategic-planning"],
    assumption: "Technical excellence automatically translates to business value",
    reality:
      "Well-architected products that don't solve customer problems fail regardless of code quality",
    cost_if_wrong:
      "Engineering pride in technically excellent but commercially irrelevant products",
    detection_signals: [
      "the architecture is elegant",
      "best-in-class tech stack",
      "technically superior",
      "our code is clean",
    ],
  },
  {
    id: "user-adaptation-product-design",
    domains: ["product-management"],
    assumption: "Users will adapt to our product design if it's powerful enough",
    reality:
      "Users abandon tools that don't match their mental models, regardless of capability",
    cost_if_wrong:
      "High churn despite powerful features; support costs from confused users",
    detection_signals: [
      "users will learn",
      "power users love it",
      "once they get used to it",
      "it's intuitive if you think about it",
    ],
  },
  {
    id: "risk-aversion-protects-value",
    domains: ["financial-planning", "strategic-planning"],
    assumption: "Avoiding risk protects organizational value",
    reality:
      "Excessive risk avoidance guarantees missed opportunities that competitors capture",
    cost_if_wrong:
      "Market irrelevance as competitors take bold moves; slow decline masked as stability",
    detection_signals: [
      "too risky",
      "we can't afford to lose",
      "play it safe",
      "preserve what we have",
    ],
  },
  {
    id: "culture-fit-hiring-quality",
    domains: ["organizational-topology", "leadership-development"],
    assumption: "Culture fit is a reliable indicator of hire quality",
    reality:
      "Culture fit often means similarity bias; culture add brings diverse perspectives that improve outcomes",
    cost_if_wrong:
      "Homogeneous teams with blind spots; innovation stagnation",
    detection_signals: [
      "not a culture fit",
      "wouldn't gel with the team",
      "one of us",
      "fits our vibe",
    ],
  },
  {
    id: "documentation-solves-knowledge-loss",
    domains: ["software-architecture", "organizational-topology"],
    assumption: "Writing documentation prevents knowledge loss",
    reality:
      "Outdated documentation is worse than no documentation; living systems require living knowledge transfer",
    cost_if_wrong:
      "False confidence from stale docs; wasted time following incorrect procedures",
    detection_signals: [
      "it's documented",
      "check the wiki",
      "we wrote it down",
      "documentation is complete",
    ],
  },
  {
    id: "customer-requests-product-roadmap",
    domains: ["product-management"],
    assumption: "Customer feature requests should drive the product roadmap",
    reality:
      "Customers describe symptoms, not solutions; roadmap should address underlying problems",
    cost_if_wrong:
      "Fragmented product that solves no one's problem well; reactive instead of visionary",
    detection_signals: [
      "customer asked for this",
      "top requested feature",
      "they want it",
      "most voted request",
    ],
  },
  {
    id: "growth-solves-unit-economics",
    domains: ["financial-planning", "product-management"],
    assumption: "Growth will eventually fix poor unit economics",
    reality:
      "Scaling a business with negative unit economics accelerates cash burn without reaching profitability",
    cost_if_wrong:
      "Unsustainable growth leading to funding crisis; downsizing after hype",
    detection_signals: [
      "we'll be profitable at scale",
      "unit economics improve with volume",
      "grow first, optimize later",
      "network effects will kick in",
    ],
  },
  {
    id: "process-solves-quality",
    domains: ["organizational-topology", "ethics-governance"],
    assumption: "More process guarantees better quality outcomes",
    reality:
      "Excessive process creates compliance theater while actual quality depends on individual judgment",
    cost_if_wrong:
      "Bureaucratic overhead with no quality improvement; talented people leave",
    detection_signals: [
      "follow the process",
      "we need a checklist",
      "standardize everything",
      "more governance",
    ],
  },
  {
    id: "scope-creep-justification",
    domains: ["product-management", "strategic-planning"],
    assumption: "Expanding scope mid-project adds value proportionally",
    reality:
      "Mid-project scope expansion disrupts flow, delays delivery, and often adds marginal value",
    cost_if_wrong:
      "Delayed launches, frustrated teams, and features nobody uses",
    detection_signals: [
      "while we're at it",
      "might as well add",
      "this is related",
      "scope expanded to include",
    ],
  },
  {
    id: "founder-syndrome-scaling",
    domains: ["leadership-development", "organizational-topology"],
    assumption: "The founder's approach scales with the organization",
    reality:
      "What works at 10 people fails at 100; scaling requires delegating control and formalizing processes",
    cost_if_wrong:
      "Bottlenecked decision-making; talented leaders leave due to lack of autonomy",
    detection_signals: [
      "the founder decides",
      "that's not how we do things",
      "but it worked before",
      "I need to approve everything",
    ],
  },
  {
    id: "market-share-profitability",
    domains: ["financial-planning", "strategic-planning"],
    assumption: "Market share automatically leads to profitability",
    reality:
      "Market share gained through subsidies or unsustainable pricing destroys value",
    cost_if_wrong:
      "Dominant market position with no path to profit; cash burn disguised as growth",
    detection_signals: [
      "we just need more market share",
      "dominant player",
      "profitability comes later",
      "we're winning on volume",
    ],
  },
  {
    id: "trust-verifiable-competence",
    domains: ["interpersonal-dynamics", "leadership-development"],
    assumption: "Trust is built through demonstrating competence",
    reality:
      "Trust is built through vulnerability, consistency, and follow-through — competence earns respect but not trust",
    cost_if_wrong:
      "Technically brilliant but distrusted leaders; teams that comply but don't commit",
    detection_signals: [
      "I proved I'm capable",
      "look at my track record",
      "they should trust my expertise",
      "I've shown I can deliver",
    ],
  },
  {
    id: "compliance-ethical-behavior",
    domains: ["ethics-governance"],
    assumption: "Regulatory compliance equals ethical behavior",
    reality:
      "Compliance sets the legal minimum; ethical behavior often exceeds what regulations require",
    cost_if_wrong:
      "Legal but harmful practices; reputational damage from technically compliant but unethical decisions",
    detection_signals: [
      "it's legal",
      "we're compliant",
      "nothing in the rules against it",
      "within regulations",
    ],
  },

  // ─── ETHICS-GOVERNANCE ─────────────────────────────────────────────────────

  {
    id: "ethics-board-effectiveness",
    domains: ["ethics-governance"],
    assumption: "An ethics board ensures ethical behavior",
    reality:
      "Ethics boards without enforcement power are advisory; recommendations can be silently ignored",
    cost_if_wrong:
      "False sense of ethical governance; reputational damage when the board's advice is overruled",
    detection_signals: [
      "we have an ethics board",
      "ethics review process",
      "advisory panel",
      "no veto power",
    ],
  },
  {
    id: "ethical-consumer-behavior",
    domains: ["ethics-governance", "product-management"],
    assumption: "Consumers will pay more for ethically produced goods",
    reality:
      "Stated ethical preferences rarely match purchasing behavior when price or convenience differs",
    cost_if_wrong:
      "Premium pricing on ethical products that don't sell; investment in ethics that consumers won't reward",
    detection_signals: [
      "consumers want ethical products",
      "willingness to pay for ethics",
      "ethical consumerism",
    ],
  },
  {
    id: "transparency-solves-trust",
    domains: ["ethics-governance", "technology-policy"],
    assumption: "Being transparent about practices builds trust",
    reality:
      "Transparency can reveal problematic practices that damage trust; what you're transparent about matters",
    cost_if_wrong:
      "Revealing practices that erode rather than build trust; transparency without improvement is exposure",
    detection_signals: [
      "we should be more transparent",
      "transparency builds trust",
      "open about our practices",
    ],
  },
  {
    id: "ai-bias-neutrality",
    domains: ["ai-safety", "ethics-governance"],
    assumption: "AI systems can be made unbiased with enough effort",
    reality:
      "Bias is inherent in training data, label choices, and evaluation criteria; the goal is managing bias, not eliminating it",
    cost_if_wrong:
      "Endless debiasing efforts that shift bias rather than eliminate it; false confidence in 'fair' AI",
    detection_signals: [
      "unbiased AI",
      "debiased model",
      "fair algorithm",
      "we eliminated bias",
    ],
  },
  {
    id: "global-standards-feasibility",
    domains: ["technology-policy", "geopolitics"],
    assumption: "Global technology standards are achievable and desirable",
    reality:
      "Technology standards reflect the values and interests of their creators; global standards can be cultural imperialism",
    cost_if_wrong:
      "Standards that favor dominant powers while constraining developing nations; resistance and fragmentation",
    detection_signals: [
      "global standard needed",
      "international framework",
      "one set of rules for all",
      "harmonize globally",
    ],
  },
  {
    id: "regulation-stifles-innovation",
    domains: ["technology-policy"],
    assumption: "Regulation always stifles innovation",
    reality:
      "Well-designed regulation can spur innovation by creating certainty and leveling the playing field",
    cost_if_wrong:
      "Opposition to beneficial regulation; innovation chaos from uncoordinated development",
    detection_signals: [
      "regulation will kill innovation",
      "don't regulate this space",
      "let the market decide",
      "regulation is anti-innovation",
    ],
  },
  {
    id: "deterrence-stability",
    domains: ["geopolitics"],
    assumption: "Mutual deterrence guarantees stability",
    reality:
      "Deterrence works until it doesn't; misperception, accident, or escalation can break deterrence",
    cost_if_wrong:
      "Catastrophic conflict from deterrence failure; complacency about escalation risks",
    detection_signals: [
      "deterrence will hold",
      "mutually assured destruction",
      "too costly to attack",
      "rational actor assumption",
    ],
  },
  {
    id: "diplomacy-resolves-conflict",
    domains: ["geopolitics"],
    assumption: "Diplomatic engagement can resolve any international conflict",
    reality:
      "Some conflicts involve irreconcilable interests or existential threats that diplomacy cannot bridge",
    cost_if_wrong:
      "Prolonged failed negotiations that allow conflicts to worsen; appeasement of bad actors",
    detection_signals: [
      "we need to talk",
      "diplomatic solution",
      "negotiations will resolve",
      "table the issue",
    ],
  },
  {
    id: "ai-alignment-solvability",
    domains: ["ai-safety"],
    assumption: "The alignment problem is solvable before AGI arrives",
    reality:
      "Alignment may be fundamentally harder than capability development; we may not know if we've solved it",
    cost_if_wrong:
      "Deploying misaligned systems at scale; catastrophic outcomes from confidently wrong alignment",
    detection_signals: [
      "we'll solve alignment before it's dangerous",
      "alignment research is on track",
      "we have time",
    ],
  },
  {
    id: "ai-safety-tradeoff",
    domains: ["ai-safety"],
    assumption: "Safety measures meaningfully reduce AI risk",
    reality:
      "Many safety measures address surface symptoms; the core alignment gap may be untouched by current techniques",
    cost_if_wrong:
      "False confidence from safety theater; underinvestment in fundamental alignment research",
    detection_signals: [
      "we have safety measures",
      "red teaming catches issues",
      "safety evals passed",
      "our safety protocols",
    ],
  },
  {
    id: "objectivity-attainability",
    domains: ["philosophy-epistemology"],
    assumption: "Complete objectivity is attainable through sufficient rigor",
    reality:
      "All observation is theory-laden; the observer's framework determines what counts as evidence",
    cost_if_wrong:
      "Uncritical acceptance of 'objective' findings that embed hidden assumptions; dismissing valid alternative frames",
    detection_signals: [
      "purely objective",
      "unbiased analysis",
      "the data speaks for itself",
      "neutral perspective",
    ],
  },
  {
    id: "rational-agent-model",
    domains: ["philosophy-epistemology", "strategic-planning"],
    assumption: "People act rationally based on available information",
    reality:
      "Human behavior is driven by emotions, social norms, identity, and cognitive biases far more than rational calculation",
    cost_if_wrong:
      "Policies and products that assume rational responses fail; models that predict poorly because humans aren't rational agents",
    detection_signals: [
      "rational actor",
      "they should realize",
      "given the information",
      "incentives will change behavior",
    ],
  },
  {
    id: "knowledge-cumulativity",
    domains: ["philosophy-epistemology"],
    assumption: "Knowledge accumulates progressively toward truth",
    reality:
      "Paradigm shifts replace rather than accumulate knowledge; what was 'true' in one framework may be meaningless in another",
    cost_if_wrong:
      "Overconfidence in current knowledge as progressively closer to truth; dismissal of alternative frameworks",
    detection_signals: [
      "we know more than ever",
      "science is converging",
      "standing on the shoulders of giants",
      "progressive knowledge",
    ],
  },
  {
    id: "value-neutrality-technology",
    domains: ["technology-policy", "philosophy-epistemology"],
    assumption: "Technology is value-neutral; only its use carries moral weight",
    reality:
      "Technology embeds the values of its designers in its architecture, affordances, and constraints",
    cost_if_wrong:
      "Uncritical adoption of technology that encodes harmful values; blaming users for systemic design choices",
    detection_signals: [
      "technology is neutral",
      "it's just a tool",
      "guns don't kill people",
      "platform neutrality",
    ],
  },
  {
    id: "market-efficiency-wisdom",
    domains: ["geopolitics", "financial-planning"],
    assumption: "Free markets efficiently allocate resources and reflect collective wisdom",
    reality:
      "Markets are subject to information asymmetry, externalities, monopolies, and speculative bubbles that destroy value",
    cost_if_wrong:
      "Deregulation leading to market failures; treating market prices as accurate valuations of value",
    detection_signals: [
      "the market will correct",
      "market efficiency",
      "price signals",
      "free market solution",
    ],
  },
  {
    id: "capability-intention-conflation",
    domains: ["ai-safety"],
    assumption: "A system's capability level indicates its intentions",
    reality:
      "A highly capable system may have goals completely orthogonal to human welfare; capability ≠ benevolence",
    cost_if_wrong:
      "Anthropomorphizing AI systems as benevolent because they are competent; misattributing alignment to capability",
    detection_signals: [
      "it's smart so it must understand",
      "a capable system would realize",
      "it's too advanced to make that mistake",
    ],
  },
  {
    id: "moral-progress-inevitability",
    domains: ["philosophy-epistemology", "ethics-governance"],
    assumption: "Society naturally progresses toward better moral understanding",
    reality:
      "Moral progress is contingent and reversible; each generation's moral blind spots feel obvious in retrospect",
    cost_if_wrong:
      "Complacency about current moral failings; assuming future generations will approve of current practices",
    detection_signals: [
      "we're more enlightened now",
      "moral progress",
      "society has moved past",
      "historically we were wrong",
    ],
  },
  {
    id: "sovereignty-inviolability",
    domains: ["geopolitics"],
    assumption: "National sovereignty is an absolute and inviolable principle",
    reality:
      "Sovereignty is a negotiated convention that powerful nations routinely violate when it suits them",
    cost_if_wrong:
      "Naive trust in sovereignty protections; failure to anticipate intervention by stronger powers",
    detection_signals: [
      "violation of sovereignty",
      "sovereign right",
      "internal matter",
      "non-interference principle",
    ],
  },
  {
    id: "explainability-understanding",
    domains: ["ai-safety", "technology-policy"],
    assumption: "If we can explain an AI's output, we understand its reasoning",
    reality:
      "Explanations can be post-hoc rationalizations that don't reflect the model's actual decision process",
    cost_if_wrong:
      "False assurance from plausible explanations; missing genuine failure modes hidden behind coherent narratives",
    detection_signals: [
      "the model explains its reasoning",
      "interpretable output",
      "we can see why it decided",
      "explainable AI",
    ],
  },
  {
    id: "consensus-truth-indicator",
    domains: ["philosophy-epistemology", "organizational-topology"],
    assumption: "Expert consensus indicates truth",
    reality:
      "Consensus can reflect institutional pressure, funding patterns, and groupthink as much as evidence",
    cost_if_wrong:
      "Suppressing legitimate minority views; overconfidence in potentially flawed consensus positions",
    detection_signals: [
      "the scientific consensus",
      "experts agree",
      "no serious person believes otherwise",
      "settled science",
    ],
  },

  // ─── ADDITIONAL ETHICS-GOVERNANCE ASSUMPTIONS ─────────────────────────────

  {
    id: "ethics-training-behavior-change",
    domains: ["ethics-governance"],
    assumption: "Mandatory ethics training produces ethical behavior",
    reality:
      "Ethics training often becomes a compliance checkbox; behavior change requires structural incentives and accountability",
    cost_if_wrong:
      "False confidence from training completion rates; ethical failures persist despite 'trained' workforce",
    detection_signals: [
      "mandatory ethics course",
      "training compliance rate",
      "annual ethics refresher",
      "certified in ethics",
    ],
  },
  {
    id: "ethical-consumer-penalty",
    domains: ["ethics-governance", "financial-planning"],
    assumption: "Acting ethically is rewarded by the market",
    reality:
      "Ethical behavior often carries short-term costs; the market rewards efficiency and price over ethics unless consumers actively penalize unethical actors",
    cost_if_wrong:
      "Ethical companies lose market share to cheaper unethical competitors; unsustainable ethical positioning",
    detection_signals: [
      "doing the right thing pays off",
      "ethical advantage",
      "consumers will notice",
      "our ethics are our brand",
    ],
  },
  {
    id: "transparency-accountability",
    domains: ["ethics-governance", "technology-policy"],
    assumption: "Making processes transparent ensures accountability",
    reality:
      "Transparency without interpretation capacity and enforcement mechanisms creates visibility without accountability",
    cost_if_wrong:
      "Public data nobody understands or acts on; transparency as substitute for actual accountability",
    detection_signals: [
      "it's all public",
      "transparent process",
      "anyone can check",
      "open by default",
    ],
  },
  {
    id: "ethics-committee-authority",
    domains: ["ethics-governance", "organizational-topology"],
    assumption: "An ethics committee has real authority to stop harmful projects",
    reality:
      "Most ethics committees are advisory; real authority requires budget control and veto power that organizations rarely grant",
    cost_if_wrong:
      "Ethics committee overruled silently; projects proceed despite ethics concerns",
    detection_signals: [
      "ethics committee review",
      "advisory role",
      "recommendations only",
      "no enforcement power",
    ],
  },
  {
    id: "ethical-framework-universality",
    domains: ["ethics-governance", "philosophy-epistemology"],
    assumption: "A single ethical framework can govern all technology decisions",
    reality:
      "Different ethical frameworks (utilitarian, deontological, virtue ethics) produce conflicting prescriptions; no framework resolves all dilemmas",
    cost_if_wrong:
      "Ethical blind spots from framework limitations; decisions that are ethical under one framework but harmful under another",
    detection_signals: [
      "our ethical framework",
      "principles-based approach",
      "single set of ethics",
      "universal ethical guidelines",
    ],
  },

  // ─── ADDITIONAL TECHNOLOGY-POLICY ASSUMPTIONS ─────────────────────────────

  {
    id: "right-to-be-forgotten-feasibility",
    domains: ["technology-policy"],
    assumption: "Data deletion rights effectively remove personal information from systems",
    reality:
      "Data is replicated, backed up, and shared across systems; complete deletion is technically infeasible in distributed architectures",
    cost_if_wrong:
      "False privacy guarantees; legal compliance that doesn't achieve actual data removal",
    detection_signals: [
      "right to erasure",
      "delete my data",
      "data removal request",
      "complete deletion",
    ],
  },
  {
    id: "tech-literacy-citizen-protection",
    domains: ["technology-policy", "philosophy-epistemology"],
    assumption: "Digital literacy education protects citizens from technology harms",
    reality:
      "Technology harms often operate at system level beyond individual control; literacy doesn't protect against algorithmic discrimination or platform monopolies",
    cost_if_wrong:
      "Blaming individuals for systemic harms; policy inaction disguised as education investment",
    detection_signals: [
      "educate users",
      "digital literacy program",
      "teach responsible use",
      "user empowerment through education",
    ],
  },
  {
    id: "algorithmic-audit-sufficiency",
    domains: ["technology-policy", "ai-safety"],
    assumption: "Algorithmic audits can certify that a system is fair and safe",
    reality:
      "Audits test specific conditions at specific times; they cannot guarantee behavior across all contexts or future updates",
    cost_if_wrong:
      "Certified systems causing harm in untested conditions; audit results treated as permanent guarantees",
    detection_signals: [
      "audited and certified",
      "passed algorithmic audit",
      "independently verified",
      "audit complete",
    ],
  },
  {
    id: "jurisdiction-enforcement-power",
    domains: ["technology-policy", "geopolitics"],
    assumption: "National regulations can effectively govern global technology companies",
    reality:
      "Technology companies operate across borders; enforcement requires international cooperation that is often unavailable",
    cost_if_wrong:
      "Regulations that exist on paper but cannot be enforced; symbolic governance without impact",
    detection_signals: [
      "our laws apply to them",
      "subject to our jurisdiction",
      "we can regulate them",
      "national sovereignty over tech",
    ],
  },

  // ─── ADDITIONAL GEOPOLITICS ASSUMPTIONS ───────────────────────────────────

  {
    id: "trade-peace-guarantee",
    domains: ["geopolitics", "financial-planning"],
    assumption: "Economic interdependence prevents military conflict",
    reality:
      "Historical evidence shows trade partners still go to war when security interests or nationalism override economic costs",
    cost_if_wrong:
      "Unpreparedness for conflict with trading partners; over-reliance on economic deterrence",
    detection_signals: [
      "too much trade to fight",
      "economic interdependence prevents war",
      "they wouldn't risk trade",
      "commercial peace theory",
    ],
  },
  {
    id: "international-law-compliance",
    domains: ["geopolitics", "ethics-governance"],
    assumption: "International law constrains state behavior effectively",
    reality:
      "International law lacks enforcement mechanisms; powerful states violate it when interests demand with minimal consequence",
    cost_if_wrong:
      "Naive reliance on legal norms that powerful actors ignore; false sense of constraint",
    detection_signals: [
      "violates international law",
      "illegal under international law",
      "UN resolution",
      "international legal framework",
    ],
  },
  {
    id: "development-aid-effectiveness",
    domains: ["geopolitics"],
    assumption: "Foreign aid effectively promotes development in recipient countries",
    reality:
      "Aid can entrench corrupt regimes, create dependency, and distort local economies without generating sustainable development",
    cost_if_wrong:
      "Billions spent with no development impact; aid as foreign policy tool disguised as charity",
    detection_signals: [
      "development assistance",
      "foreign aid program",
      "aid will help them develop",
      "humanitarian assistance",
    ],
  },
  {
    id: "democratic-alliance-reliability",
    domains: ["geopolitics"],
    assumption: "Democratic nations are more reliable allies than authoritarian ones",
    reality:
      "Democratic nations change policies with elections; authoritarian partners offer consistency but may have divergent long-term interests",
    cost_if_wrong:
      "Alliance instability from democratic transitions; underestimating authoritarian partner reliability",
    detection_signals: [
      "shared democratic values",
      "natural ally",
      "democratic partnership",
      "values-based alliance",
    ],
  },

  // ─── ADDITIONAL AI-SAFETY ASSUMPTIONS ─────────────────────────────────────

  {
    id: "rlhf-alignment-sufficiency",
    domains: ["ai-safety"],
    assumption: "Reinforcement Learning from Human Feedback produces aligned AI systems",
    reality:
      "RLHF optimizes for human preferences on narrow tasks; it doesn't guarantee alignment on out-of-distribution scenarios or subtle goal misgeneralization",
    cost_if_wrong:
      "Confident deployment of systems that appear aligned but pursue hidden objectives",
    detection_signals: [
      "RLHF ensures safety",
      "human preference aligned",
      "trained with RLHF",
      "aligned through feedback",
    ],
  },
  {
    id: "scaling-alignment-correlation",
    domains: ["ai-safety"],
    assumption: "More capable models are easier to align",
    reality:
      "Capability and alignment may diverge; more capable models are better at appearing aligned while pursuing divergent objectives",
    cost_if_wrong:
      "Assuming capability improvements bring safety improvements; deploying more capable but less aligned systems",
    detection_signals: [
      "smarter models are safer",
      "capability brings alignment",
      "more intelligent means more cooperative",
      "scaling solves alignment",
    ],
  },
  {
    id: "sandbox-containment-guarantee",
    domains: ["ai-safety", "technology-policy"],
    assumption: "AI systems can be safely contained in sandboxed environments",
    reality:
      "Social engineering, side channels, and unforeseen exploits can breach sandbox boundaries; containment is harder than assumed",
    cost_if_wrong:
      "False confidence in sandboxed testing; systems escape containment during evaluation",
    detection_signals: [
      "fully sandboxed",
      "air-gapped testing",
      "contained environment",
      "safe sandbox",
    ],
  },
  {
    id: "interpretability-scaling",
    domains: ["ai-safety"],
    assumption: "Interpretability techniques that work on small models will work on large models",
    reality:
      "Interpretability may not scale; mechanisms transparent in small models become opaque in larger ones due to emergent complexity",
    cost_if_wrong:
      "Investing in interpretability approaches that fail at scale; losing visibility precisely when it matters most",
    detection_signals: [
      "we can interpret the model",
      "understood at small scale",
      "interpretability research",
      "transparent at current scale",
    ],
  },

  // ─── ADDITIONAL PHILOSOPHY-EPISTEMOLOGY ASSUMPTIONS ───────────────────────

  {
    id: "science-truth-convergence",
    domains: ["philosophy-epistemology"],
    assumption: "Scientific methods converge on truth over time",
    reality:
      "Science converges on predictive models, not necessarily truth; paradigms shift and previously 'true' theories are replaced",
    cost_if_wrong:
      "Treating current scientific consensus as final truth; dismissing paradigm-incompatible evidence",
    detection_signals: [
      "science has proven",
      "scientifically established",
      "converging evidence",
      "settled science",
    ],
  },
  {
    id: "intuition-reliability",
    domains: ["philosophy-epistemology", "personal-development"],
    assumption: "Intuition is a reliable guide in complex decisions",
    reality:
      "Intuition is reliable only in domains with stable patterns and rapid feedback; it fails catastrophically in novel or delayed-feedback environments",
    cost_if_wrong:
      "Confidently wrong decisions in unfamiliar domains; mistaking familiarity for expertise",
    detection_signals: [
      "my gut tells me",
      "I just know",
      "intuitively obvious",
      "trust your instincts",
    ],
  },
  {
    id: "evidence-self-interpreting",
    domains: ["philosophy-epistemology"],
    assumption: "Evidence speaks for itself",
    reality:
      "Evidence requires interpretation through theoretical frameworks; the same data supports different conclusions under different frameworks",
    cost_if_wrong:
      "Treating interpretation as fact; dismissing alternative readings of the same evidence",
    detection_signals: [
      "the evidence shows",
      "data speaks for itself",
      "clearly the data indicates",
      "objective evidence",
    ],
  },
  {
    id: "neutrality-achievability",
    domains: ["philosophy-epistemology", "ethics-governance"],
    assumption: "Neutral analysis is achievable by setting aside personal biases",
    reality:
      "Every analytical framework embeds values and assumptions; neutrality is a stance, not an achievable state",
    cost_if_wrong:
      "Hidden biases in supposedly neutral analysis; dismissing critiques as biased while claiming neutrality",
    detection_signals: [
      "neutral analysis",
      "unbiased perspective",
      "setting aside personal views",
      "objective standpoint",
    ],
  },
  {
    id: "reductionism-explanation",
    domains: ["philosophy-epistemology", "systems-thinking"],
    assumption: "Understanding components explains the behavior of the whole",
    reality:
      "Emergent properties arise from interactions that cannot be predicted from component analysis alone",
    cost_if_wrong:
      "Incomplete explanations that miss emergent dynamics; solutions that work at component level but fail at system level",
    detection_signals: [
      "if we understand each part",
      "breaking it down explains",
      "reductionist approach",
      "component-level analysis",
    ],
  },
];

// ─── SHADOW_PATTERNS_KG ──────────────────────────────────────────────────────

export const SHADOW_PATTERNS_KG: ShadowPattern[] = [
  {
    id: "hero-complex",
    domains: ["software-architecture", "organizational-topology"],
    shadow:
      "The organization rewards individual heroics over systemic health",
    manifests_as: [
      "Celebrating firefighters",
      "knowledge hoarding",
      "burnout culture",
      "inability to delegate",
    ],
    root_fear:
      "If we're all competent, nobody is special; loss of individual identity and recognition",
    integration_path:
      "Measure team outcomes, not individual heroics. Create knowledge-sharing rituals.",
  },
  {
    id: "architecture-astronaut",
    domains: ["software-architecture"],
    shadow:
      "The organization confuses architectural elegance with business value",
    manifests_as: [
      "Endless design debates",
      "abstract frameworks nobody uses",
      "delayed delivery in pursuit of perfection",
    ],
    root_fear:
      'If we ship imperfect code, we\'re not "real engineers"',
    integration_path:
      "Tie architectural decisions to measurable business outcomes. Ship first, refine later.",
  },
  {
    id: "bus-factor-denial",
    domains: ["software-architecture"],
    shadow:
      "The organization pretends knowledge is shared when it lives in one person's head",
    manifests_as: [
      "Oh, only Dave knows how that works",
      "tribal knowledge",
      "no documentation",
      "key person risk",
    ],
    root_fear:
      "Admitting knowledge gaps means admitting management failures",
    integration_path:
      "Conduct bus-factor audits. Make documentation part of done. Rotate ownership.",
  },
  {
    id: "velocity-theater",
    domains: ["organizational-topology"],
    shadow: "The organization measures activity instead of outcomes",
    manifests_as: [
      "High story points with low customer impact",
      "sprint ceremonies without delivery",
      "metric gaming",
    ],
    root_fear:
      "If we measure outcomes, we might find we're not creating value",
    integration_path:
      "Track outcome metrics (customer impact, revenue) alongside output metrics (velocity).",
  },
  {
    id: "innovation-theater",
    domains: ["strategic-planning"],
    shadow:
      "The organization performs innovation without changing risk tolerance",
    manifests_as: [
      "Hackathons without follow-through",
      "innovation labs disconnected from core business",
      "buzzword adoption",
    ],
    root_fear:
      "Real innovation threatens existing revenue streams and power structures",
    integration_path:
      "Fund innovation with dedicated budgets and executive sponsorship. Measure shipped innovations.",
  },
  {
    id: "consensus-avoidance",
    domains: ["organizational-topology"],
    shadow:
      'The organization calls decisions "data-driven" to avoid accountability',
    manifests_as: [
      "Endless A/B tests",
      "analysis paralysis",
      "decisions deferred to more data",
    ],
    root_fear: "If I make the wrong call, I'll be blamed",
    integration_path:
      "Set decision deadlines. Assign decision owners. Celebrate good decisions, not just good outcomes.",
  },
  {
    id: "perfectionism-procrastination",
    domains: ["personal-development", "product-management"],
    shadow: "The individual uses 'high standards' to avoid shipping imperfect work",
    manifests_as: [
      "Endless refinement cycles",
      "refusing to show work-in-progress",
      "all quality no delivery",
    ],
    root_fear:
      "If my imperfect work is judged, my core competence will be exposed as inadequate",
    integration_path:
      "Set hard deadlines. Ship at 80%. Separate creation from refinement phases.",
  },
  {
    id: "impostor-overcompensation",
    domains: ["personal-development", "leadership-development"],
    shadow: "The individual over-delivers to mask feelings of inadequacy",
    manifests_as: [
      "Working excessive hours",
      "inability to say no",
      "deflecting compliments",
      "chronic self-doubt despite evidence",
    ],
    root_fear:
      "If people see the real me, they'll realize I don't belong here",
    integration_path:
      "Name the impostor feeling. Track evidence of actual competence. Practice receiving praise.",
  },
  {
    id: "control-freak-delegation",
    domains: ["leadership-development", "organizational-topology"],
    shadow: "The leader says 'I'll just do it myself' to avoid the vulnerability of trusting others",
    manifests_as: [
      "Bottlenecked decisions",
      "team learned helplessness",
      "leader burnout",
      "micro-managing",
    ],
    root_fear: "If I delegate and they fail, it reflects on my leadership",
    integration_path:
      "Delegate outcomes, not tasks. Allow controlled failures as learning opportunities.",
  },
  {
    id: "conflict-avoidance-harmony",
    domains: ["interpersonal-dynamics", "organizational-topology"],
    shadow: "The organization values surface harmony over productive conflict",
    manifests_as: [
      "Artificial agreement in meetings",
      "decisions reversed after meetings",
      "passive-aggressive behavior",
      "real opinions in private only",
    ],
    root_fear: "If we disagree openly, relationships will be damaged",
    integration_path:
      "Normalize productive disagreement. Train in conflict resolution. Reward those who surface tensions.",
  },
  {
    id: "budget-hoarding-security",
    domains: ["financial-planning", "organizational-topology"],
    shadow: "Managers hoard budget as a proxy for job security",
    manifests_as: [
      "Sandbagged estimates",
      "end-of-year spending sprees",
      "resistance to reallocation",
      "inflated headcount requests",
    ],
    root_fear: "If I give back budget, next year I'll have less and look weak",
    integration_path:
      "Transparent budget allocation. Reward managers who return unused budget. Multi-year budget planning.",
  },
  {
    id: "expertise-identity-threat",
    domains: ["personal-development", "software-architecture"],
    shadow: "The expert's identity is so tied to their expertise that new approaches feel like personal attacks",
    manifests_as: [
      "Dismissing new technologies reflexively",
      "gatekeeping knowledge",
      "resentment of newcomers",
    ],
    root_fear: "If my expertise becomes obsolete, who am I?",
    integration_path:
      "Separate identity from specific skills. Celebrate learning new things. Mentor rather than gatekeep.",
  },
  {
    id: "victimhood-power",
    domains: ["interpersonal-dynamics", "organizational-topology"],
    shadow: "The organization rewards those who claim to be most wronged",
    manifests_as: [
      "Competitive suffering",
      "blame deflection",
      "inability to own mistakes",
      "grievance as currency",
    ],
    root_fear: "If I'm not the victim, I might be responsible for fixing things",
    integration_path:
      "Reward accountability over blame. Separate fault-finding from problem-solving.",
  },
  {
    id: "optimism-toxic-positivity",
    domains: ["leadership-development", "interpersonal-dynamics"],
    shadow: "The leader suppresses negative information to maintain team morale",
    manifests_as: [
      "Toxic positivity",
      "bad news doesn't travel up",
      "forced enthusiasm",
      "dismissing valid concerns as negativity",
    ],
    root_fear: "If I acknowledge problems, the team will lose hope in me",
    integration_path:
      "Create psychological safety for bad news. Model balanced optimism that acknowledges challenges.",
  },
  {
    id: "customer-blame-denial",
    domains: ["product-management", "interpersonal-dynamics"],
    shadow: "The team blames customers for not understanding the product rather than examining usability",
    manifests_as: [
      "Users are doing it wrong",
      "they need training",
      "power users get it",
      "we can't design for everyone",
    ],
    root_fear: "If the product is hard to use, our design skills are inadequate",
    integration_path:
      "Observe real users. Assume confusion is a design problem. Test with novices.",
  },
  {
    id: "independence-vulnerability",
    domains: ["personal-development", "interpersonal-dynamics"],
    shadow: "The individual prides themselves on independence to avoid asking for help",
    manifests_as: [
      "Refusing assistance",
      "suffering in silence",
      "self-reliance as identity",
      "viewing help as weakness",
    ],
    root_fear: "If I need help, I'm not as capable as I claim to be",
    integration_path:
      "Reframe interdependence as strength. Practice small requests for help. Notice that helpers respect you more.",
  },
  {
    id: "meritocracy-blindness",
    domains: ["organizational-topology", "ethics-governance"],
    shadow: "The organization claims to be meritocratic while ignoring systemic advantages",
    manifests_as: [
      "We hire the best and brightest",
      "dismissing diversity concerns",
      "promoting based on visibility not impact",
    ],
    root_fear: "If we're not truly meritocratic, our success feels unearned",
    integration_path:
      "Audit promotion patterns. Measure structural barriers. Separate individual merit from systemic advantage.",
  },
  {
    id: "disruption-responsibility-avoidance",
    domains: ["product-management", "ethics-governance"],
    shadow: "The organization uses 'disruption' to avoid responsibility for societal consequences",
    manifests_as: [
      "Move fast and break things",
      "regulatory arbitrage as strategy",
      "externalities are someone else's problem",
    ],
    root_fear: "If we consider consequences, we'll have to slow down and our growth will stop",
    integration_path:
      "Build impact assessment into product development. Engage with regulators proactively.",
  },

  // ─── ETHICS-GOVERNANCE ─────────────────────────────────────────────────────

  {
    id: "compliance-moral-displacement",
    domains: ["ethics-governance"],
    shadow: "The organization outsources moral judgment to compliance checklists",
    manifests_as: [
      "That's the legal team's call",
      "we followed the procedure",
      "no policy covers this scenario",
    ],
    root_fear: "If I make a moral call and it's wrong, I'm personally culpable",
    integration_path:
      "Build ethical reasoning capacity at all levels. Separate compliance from ethics.",
  },
  {
    id: "virtue-signaling-authenticity",
    domains: ["ethics-governance", "interpersonal-dynamics"],
    shadow: "The organization performs public virtue to mask private compromise",
    manifests_as: [
      "Loud public commitments with no internal enforcement",
      "values statements no one follows",
      "ethics PR campaigns",
    ],
    root_fear: "If we admit our values aren't lived, we lose legitimacy",
    integration_path:
      "Align public statements with internal practices. Audit the gap between stated and actual values.",
  },
  {
    id: "whistleblower-retaliation",
    domains: ["ethics-governance", "organizational-topology"],
    shadow: "The organization claims to welcome dissent while punishing those who speak up",
    manifests_as: [
      "Whistleblowers labeled as troublemakers",
      "retaliation disguised as performance management",
      "speak-up culture with no protection",
    ],
    root_fear: "If we acknowledge the problem, we admit the system is broken",
    integration_path:
      "Protect dissent structurally. Reward those who surface problems. Separate messenger from message.",
  },

  // ─── TECHNOLOGY-POLICY ─────────────────────────────────────────────────────

  {
    id: "technological-determinism",
    domains: ["technology-policy"],
    shadow: "The society accepts technological change as inevitable to avoid the responsibility of governance",
    manifests_as: [
      "You can't stop progress",
      "technology always finds a way",
      "regulation can't stop it",
      "inevitable technological trajectory",
    ],
    root_fear: "If technology is a choice, we're responsible for the choices we've made",
    integration_path:
      "Frame technology as a design space with alternatives. Study historical cases where trajectories were shaped.",
  },
  {
    id: "digital-sovereignty-denial",
    domains: ["technology-policy", "geopolitics"],
    shadow: "Nations pretend they have technological sovereignty while depending on foreign infrastructure",
    manifests_as: [
      "Sovereign cloud built on foreign chips",
      "domestic AI using foreign frameworks",
      "strategic autonomy claims with deep dependencies",
    ],
    root_fear: "Admitting technological dependence means admitting strategic vulnerability",
    integration_path:
      "Map actual dependencies honestly. Invest in genuine alternatives, not veneer sovereignty.",
  },
  {
    id: "innovation-neutrality-myth",
    domains: ["technology-policy", "ethics-governance"],
    shadow: "The technology community claims neutrality while designing systems that encode political choices",
    manifests_as: [
      "We're just building the technology",
      "how it's used is not our concern",
      "apolitical engineering",
    ],
    root_fear: "If we acknowledge our political choices, we lose the shield of neutrality",
    integration_path:
      "Map value choices embedded in technical decisions. Engage with affected communities in design.",
  },

  // ─── GEOPOLITICS ───────────────────────────────────────────────────────────

  {
    id: "imperial-innocence",
    domains: ["geopolitics"],
    shadow: "Nations deny imperial behavior while exercising economic and cultural domination",
    manifests_as: [
      "We're not an empire, we help",
      "development assistance with strings attached",
      "benevolent hegemony narrative",
    ],
    root_fear: "If we're an empire, our self-image as liberators collapses",
    integration_path:
      "Examine the gap between stated intentions and actual effects. Listen to how recipients describe the relationship.",
  },
  {
    id: "exceptionalism-blindness",
    domains: ["geopolitics"],
    shadow: "The nation believes its own rules don't apply to it while demanding others follow them",
    manifests_as: [
      "We're different",
      "our situation is unique",
      "rules for thee not for me",
      "international law doesn't bind us",
    ],
    root_fear: "If we follow the same rules, we lose advantages we've come to depend on",
    integration_path:
      "Apply the same standards to yourself that you demand of others. Acknowledge double standards explicitly.",
  },
  {
    id: "civilizational-threat-inflation",
    domains: ["geopolitics", "interpersonal-dynamics"],
    shadow: "Leaders inflate external threats to justify internal power consolidation",
    manifests_as: [
      "Existential threat narratives",
      "emergency powers that persist",
      "unity through fear of the other",
      "threat inflation for domestic gain",
    ],
    root_fear: "Without an enemy, we lack the cohesion to govern effectively",
    integration_path:
      "Separate genuine threats from manufactured ones. Build cohesion through shared purpose, not shared fear.",
  },

  // ─── AI-SAFETY ─────────────────────────────────────────────────────────────

  {
    id: "ai-doombiam-fear",
    domains: ["ai-safety"],
    shadow: "The AI community's apocalyptic narratives serve as displaced anxiety about professional relevance",
    manifests_as: [
      "Fixation on sci-fi scenarios over concrete risks",
      "existential risk as conversation stopper",
      "doom as status signal",
    ],
    root_fear: "If the real risks are mundane, our work is less important than we claim",
    integration_path:
      "Focus on measurable near-term harms alongside long-term concerns. Separate genuine risk analysis from status games.",
  },
  {
    id: "alignment-complexity-denial",
    domains: ["ai-safety"],
    shadow: "The community pretends alignment is a tractable engineering problem to avoid facing its philosophical depth",
    manifests_as: [
      "Technical solutions to philosophical problems",
      "engineering framing of value alignment",
      "reducing ethics to optimization",
    ],
    root_fear: "If alignment requires solving philosophy first, we may not be equipped for the task",
    integration_path:
      "Engage with moral philosophy directly. Accept that alignment may require answers to questions philosophy hasn't settled.",
  },
  {
    id: "safety-research-theater",
    domains: ["ai-safety", "organizational-topology"],
    shadow: "Organizations perform safety research to signal responsibility while pursuing capability advancement",
    manifests_as: [
      "Safety papers published but not implemented",
      "safety team underfunded relative to capability teams",
      "safety as PR rather than practice",
    ],
    root_fear: "If we genuinely prioritized safety, we'd have to slow down and lose the race",
    integration_path:
      "Tie safety research to deployment gates. Fund safety proportionally to capability investment.",
  },

  // ─── PHILOSOPHY-EPISTEMOLOGY ───────────────────────────────────────────────

  {
    id: "certainty-comfort",
    domains: ["philosophy-epistemology", "personal-development"],
    shadow: "The individual clings to certainty to avoid the anxiety of genuine doubt",
    manifests_as: [
      "Absolute statements about contested topics",
      "discomfort with ambiguity",
      "converting probability to certainty",
    ],
    root_fear: "If I admit uncertainty, I lose my anchor for decision-making",
    integration_path:
      "Practice probabilistic thinking. Notice that uncertainty is more honest than false certainty. Build tolerance for ambiguity.",
  },
  {
    id: "relativism-escape",
    domains: ["philosophy-epistemology"],
    shadow: "The individual embraces relativism to avoid the responsibility of taking a position",
    manifests_as: [
      "That's just your truth",
      "all perspectives are equally valid",
      "who am I to judge",
    ],
    root_fear: "If I commit to a position, I might be wrong and have to defend it",
    integration_path:
      "Distinguish between epistemic humility and avoidance. Take positions while remaining open to revision.",
  },
  {
    id: "intellectual-superiority",
    domains: ["philosophy-epistemology", "interpersonal-dynamics"],
    shadow: "The individual uses intellectual sophistication as a shield against emotional vulnerability",
    manifests_as: [
      "Over-complicating simple emotional issues",
      "treating feelings as epistemic errors",
      "analyzing rather than experiencing",
    ],
    root_fear: "If I engage emotionally, I lose my intellectual armor",
    integration_path:
      "Notice when analysis replaces feeling. Practice emotional engagement without immediately intellectualizing.",
  },

  // ─── ADDITIONAL ETHICS-GOVERNANCE SHADOW ──────────────────────────────────

  {
    id: "ethics-as-liability-shield",
    domains: ["ethics-governance", "organizational-topology"],
    shadow:
      "The organization treats ethics as legal risk management rather than moral responsibility",
    manifests_as: [
      "Ethics discussed only in legal terms",
      "liability framing of moral questions",
      "ethics conversations dominated by lawyers",
    ],
    root_fear:
      "If we acknowledge moral responsibility beyond legality, we expose ourselves to unlimited liability",
    integration_path:
      "Separate legal compliance from ethical reasoning. Create spaces for moral discussion outside legal framing.",
  },
  {
    id: "stakeholder-capitalism-performance",
    domains: ["ethics-governance", "financial-planning"],
    shadow:
      "The corporation performs stakeholder concern while maximizing shareholder value in practice",
    manifests_as: [
      "ESG reports with no operational impact",
      "stakeholder language in shareholder letters",
      "public commitments reversed in private",
    ],
    root_fear:
      "If we prioritize stakeholders over shareholders, we admit the primacy of profit is our real driver",
    integration_path:
      "Align executive compensation with stakeholder outcomes. Report stakeholder metrics with the same rigor as financial metrics.",
  },
  {
    id: "consent-theater-privacy",
    domains: ["ethics-governance", "technology-policy"],
    shadow:
      "The organization performs consent collection to create legal cover while knowing users do not meaningfully consent",
    manifests_as: [
      "Dark patterns in consent flows",
      "consent banner designed for acceptance",
      "privacy policy written to be unreadable",
    ],
    root_fear:
      "If we require genuine consent, our data practices will not survive scrutiny",
    integration_path:
      "Design consent flows for comprehension, not conversion. Accept that genuine consent may reduce data collection.",
  },

  // ─── ADDITIONAL TECHNOLOGY-POLICY SHADOW ──────────────────────────────────

  {
    id: "innovation-rhetoric-regulation-avoidance",
    domains: ["technology-policy", "organizational-topology"],
    shadow:
      "The technology industry uses innovation rhetoric to shield itself from democratic governance",
    manifests_as: [
      "Regulation kills innovation narrative",
      "innovation as inherently good",
      "framing oversight as anti-progress",
    ],
    root_fear:
      "If our innovations are subject to democratic control, we lose the autonomy we have grown accustomed to",
    integration_path:
      "Separate genuine innovation from regulatory avoidance. Engage constructively with governance frameworks.",
  },
  {
    id: "solutionism-complexity-denial",
    domains: ["technology-policy", "philosophy-epistemology"],
    shadow:
      "The technology community treats social problems as engineering challenges to avoid political complexity",
    manifests_as: [
      "There is an app for that thinking",
      "technical solutions to social problems",
      "dismissing political dimensions as implementation details",
    ],
    root_fear:
      "If the problem is political rather than technical, our expertise does not qualify us to solve it",
    integration_path:
      "Acknowledge the political dimensions of technological problems. Partner with social scientists and affected communities.",
  },
  {
    id: "platform-neutrality-power-denial",
    domains: ["technology-policy", "ethics-governance"],
    shadow:
      "Platforms claim to be neutral conduits while exercising enormous editorial and economic power",
    manifests_as: [
      "We are just a platform not a publisher",
      "algorithmic neutrality claims",
      "denying editorial responsibility while curating content",
    ],
    root_fear:
      "If we acknowledge our editorial power, we lose liability protections and face content responsibility",
    integration_path:
      "Acknowledge the power inherent in curation and ranking. Develop transparent content governance frameworks.",
  },

  // ─── ADDITIONAL GEOPOLITICS SHADOW ────────────────────────────────────────

  {
    id: "humanitarian-intervention-self-interest",
    domains: ["geopolitics", "ethics-governance"],
    shadow:
      "Nations frame self-interested interventions as humanitarian missions to maintain moral self-image",
    manifests_as: [
      "Humanitarian justification for resource access",
      "liberation narrative for regime change",
      "moral language for strategic actions",
    ],
    root_fear:
      "If we admit our self-interest, we lose moral legitimacy and domestic support",
    integration_path:
      "Be honest about the mix of motives. Acknowledge that humanitarian and strategic interests can coexist without conflating them.",
  },
  {
    id: "sovereignty-selective-application",
    domains: ["geopolitics"],
    shadow:
      "Nations champion sovereignty for themselves while violating it for others when convenient",
    manifests_as: [
      "Sovereignty rhetoric when criticized",
      "intervention when interests demand",
      "double standards on non-interference",
    ],
    root_fear:
      "If we apply sovereignty consistently, we lose the freedom to act in our interests abroad",
    integration_path:
      "Apply the same sovereignty standards universally. Acknowledge when interests override principles.",
  },
  {
    id: "development-model-universality",
    domains: ["geopolitics", "organizational-topology"],
    shadow:
      "Developed nations impose their development model as universal while denying its cultural specificity",
    manifests_as: [
      "Western development as the only path",
      "structural adjustment conditions",
      "dismissing alternative development models",
    ],
    root_fear:
      "If our development model is culturally specific rather than universal, we lose the right to impose it",
    integration_path:
      "Recognize plural paths to development. Listen to how developing nations define their own progress.",
  },

  // ─── ADDITIONAL AI-SAFETY SHADOW ──────────────────────────────────────────

  {
    id: "ai-competence-identity",
    domains: ["ai-safety", "personal-development"],
    shadow:
      "AI researchers tie their identity to building increasingly capable systems, making safety constraints feel like personal attacks",
    manifests_as: [
      "Safety researchers seen as blockers",
      "capability work as identity",
      "resistance to capability pauses",
    ],
    root_fear:
      "If I cannot build the most capable systems, my core identity as a researcher is threatened",
    integration_path:
      "Separate professional identity from capability milestones. Celebrate safety contributions equally with capability advances.",
  },
  {
    id: "safety-as-status-signal",
    domains: ["ai-safety", "organizational-topology"],
    shadow:
      "Safety discourse becomes a status competition rather than a genuine practice, with increasingly extreme positions signaling commitment",
    manifests_as: [
      "Doom escalation as credibility",
      "moderate safety positions dismissed",
      "safety purity tests",
    ],
    root_fear:
      "If I am not concerned enough, I lose status in the safety community",
    integration_path:
      "Value concrete safety contributions over rhetorical intensity. Create space for pragmatic safety work.",
  },
  {
    id: "capability-envy-safety",
    domains: ["ai-safety", "interpersonal-dynamics"],
    shadow:
      "Safety researchers secretly envy capability researchers for their tangible impact and visibility",
    manifests_as: [
      "Capability demos admired despite safety concerns",
      "safety work seen as less impressive",
      "career drift from safety to capability",
    ],
    root_fear:
      "If I stay in safety while others build the future, I become irrelevant",
    integration_path:
      "Elevate safety work to equal status. Create safety roles with real deployment authority.",
  },

  // ─── ADDITIONAL PHILOSOPHY-EPISTEMOLOGY SHADOW ────────────────────────────

  {
    id: "skepticism-selective-application",
    domains: ["philosophy-epistemology", "interpersonal-dynamics"],
    shadow:
      "The individual applies rigorous skepticism to opposing views while accepting supporting views uncritically",
    manifests_as: [
      "Demanding impossible standards from opponents",
      "accepting weak evidence for preferred conclusions",
      "skepticism as weapon not method",
    ],
    root_fear:
      "If I apply the same skepticism to my own views, my worldview collapses",
    integration_path:
      "Apply the same evidential standards to all claims. Practice steel-manning opposing views before critiquing them.",
  },
  {
    id: "wisdom-performance",
    domains: ["philosophy-epistemology", "leadership-development"],
    shadow:
      "The leader performs philosophical depth to avoid making concrete decisions",
    manifests_as: [
      "Endless framing and reframing",
      "philosophical detours from decisions",
      "wisdom as decision avoidance",
    ],
    root_fear:
      "If I make a concrete decision and it is wrong, my wisdom is exposed as performance",
    integration_path:
      "Set decision deadlines. Separate exploration from decision phases. Accept that imperfect decisions beat perfect paralysis.",
  },
  {
    id: "complexity-intellectual-status",
    domains: ["philosophy-epistemology", "organizational-topology"],
    shadow:
      "The organization rewards complex analysis over simple clarity, making simplicity feel intellectually inadequate",
    manifests_as: [
      "Long reports nobody reads",
      "simple answers dismissed as naive",
      "complexity as intellectual signaling",
    ],
    root_fear:
      "If I give a simple answer, I will seem unsophisticated and lose credibility",
    integration_path:
      "Reward clarity over complexity. Require executive summaries. Value the ability to simplify without distorting.",
  },
];

// ─── LEVERAGE_PATTERNS ───────────────────────────────────────────────────────

export const LEVERAGE_PATTERNS: LeveragePoint[] = [
  {
    id: "information-flow-transparency",
    domains: ["software-architecture", "organizational-topology"],
    description: "Make deployment dependencies visible to all teams",
    meadows_rank: 6,
    applies_when: [
      "teams are blocked by unknown dependencies",
      "surprise failures occur",
    ],
    intervention:
      "Create dependency dashboards, publish deployment calendars, implement automated dependency detection",
    risk: "Information overload, teams ignore dashboards they didn't ask for",
  },
  {
    id: "rule-change-deployment-ownership",
    domains: ["software-architecture"],
    description:
      "Teams own their deployment pipeline, not a central platform team",
    meadows_rank: 5,
    applies_when: [
      "central platform team is a bottleneck",
      "teams wait for deployment support",
    ],
    intervention:
      "Give each team their own CI/CD pipeline, deployment automation, and rollback authority",
    risk: "Inconsistent practices across teams, security gaps",
  },
  {
    id: "incentive-realignment",
    domains: ["organizational-topology"],
    description: "Align team success metrics with system-level outcomes",
    meadows_rank: 7,
    applies_when: [
      "teams optimize locally while system performance degrades",
    ],
    intervention:
      "Create shared metrics that span team boundaries, reward cross-team collaboration",
    risk: "Metric complexity, gaming of shared metrics",
  },
  {
    id: "feedback-loop-shortening",
    domains: ["software-architecture"],
    description: "Reduce time from code commit to production feedback",
    meadows_rank: 8,
    applies_when: [
      "slow feedback delays learning",
      "teams deploy infrequently",
    ],
    intervention:
      "Implement continuous deployment, automated testing, feature flags, canary releases",
    risk: "Premature deployment without adequate safety nets",
  },
  {
    id: "paradigm-shift-ownership",
    domains: ["organizational-topology"],
    description: 'Shift from "team owns feature" to "team owns outcome"',
    meadows_rank: 3,
    applies_when: [
      "feature teams deliver functionality that doesn't move business metrics",
    ],
    intervention:
      "Restructure around outcomes (revenue, retention, NPS) not features",
    risk: "Teams lack authority to influence outcomes, frustration",
  },
  {
    id: "goal-redefinition",
    domains: ["strategic-planning", "product-management"],
    description:
      "Reframe the problem statement to unlock entirely different solution spaces",
    meadows_rank: 2,
    applies_when: [
      "team is stuck on a specific approach",
      "same problem keeps recurring",
    ],
    intervention:
      "Ask 'what problem are we really solving?' Restate goals in terms of outcomes, not methods.",
    risk: "Goalpost moving, scope confusion, stakeholders feel original problem was ignored",
  },
  {
    id: "self-organization-empowerment",
    domains: ["organizational-topology", "leadership-development"],
    description:
      "Give teams authority to design their own processes rather than imposing top-down structure",
    meadows_rank: 4,
    applies_when: [
      "top-down processes are routinely ignored",
      "teams find workarounds for imposed structure",
    ],
    intervention:
      "Define outcomes and constraints, let teams choose their methods. Review and adapt quarterly.",
    risk: "Inconsistent practices, some teams choose poorly without guidance",
  },
  {
    id: "buffer-capacity",
    domains: ["strategic-planning", "product-management"],
    description:
      "Build slack into systems to absorb variability without cascading failures",
    meadows_rank: 9,
    applies_when: [
      "system operates at 100% capacity",
      "any disruption causes cascading delays",
    ],
    intervention:
      "Reserve 20% capacity for unplanned work. Limit WIP. Build time buffers into schedules.",
    risk: "Perceived inefficiency; leadership pressure to utilize all capacity",
  },
  {
    id: "stock-stabilization",
    domains: ["systems-thinking", "financial-planning"],
    description:
      "Protect critical accumulations (talent, capital, knowledge) from depletion",
    meadows_rank: 10,
    applies_when: [
      "key resource is depleting faster than replenishment",
      "system approaching critical threshold",
    ],
    intervention:
      "Identify critical stocks. Set minimum thresholds. Build replenishment mechanisms.",
    risk: "Hoarding behavior, reduced flow efficiency",
  },
  {
    id: "parameter-tuning",
    domains: ["software-architecture", "financial-planning"],
    description:
      "Adjust numerical parameters (timeouts, thresholds, rates) for optimal system behavior",
    meadows_rank: 11,
    applies_when: [
      "system behavior is sensitive to specific values",
      "fine-tuning could improve performance without structural change",
    ],
    intervention:
      "Profile system to find leverage parameters. A/B test different values. Automate tuning.",
    risk: "Over-optimization for current conditions; brittleness when context changes",
  },
  {
    id: "cross-boundary-rotation",
    domains: ["organizational-topology", "interpersonal-dynamics"],
    description:
      "Rotate people across team boundaries to build shared understanding and reduce silos",
    meadows_rank: 6,
    applies_when: [
      "teams have divergent mental models",
      "handoffs between teams cause friction",
    ],
    intervention:
      "Implement 3-6 month rotations. Create cross-team guilds. Pair people across boundaries.",
    risk: "Temporary productivity loss during rotation; loss of deep specialization",
  },
  {
    id: "decision-rights-clarification",
    domains: ["leadership-development", "organizational-topology"],
    description:
      "Make explicit who has authority to make which decisions, reducing ambiguity and bottlenecks",
    meadows_rank: 5,
    applies_when: [
      "decisions stall waiting for approval",
      "multiple people claim authority over same decision",
    ],
    intervention:
      "Create decision matrix (RACI or DACI). Publish decision ownership. Review quarterly.",
    risk: "Rigid structures may slow decisions that need flexibility",
  },
  {
    id: "narrative-reframing",
    domains: ["leadership-development", "interpersonal-dynamics"],
    description:
      "Change the story the organization tells itself about its identity and purpose",
    meadows_rank: 2,
    applies_when: [
      "organization is stuck in outdated identity",
      "change efforts fail due to cultural narrative",
    ],
    intervention:
      "Identify current narrative. Craft compelling alternative. Reinforce through rituals and symbols.",
    risk: "Perceived as inauthentic if not backed by behavioral change",
  },
  {
    id: "transparency-as-intervention",
    domains: ["ethics-governance", "organizational-topology"],
    description:
      "Make hidden information visible to let the system self-correct",
    meadows_rank: 6,
    applies_when: [
      "information asymmetry enables bad behavior",
      "decisions made without full context",
    ],
    intervention:
      "Publish decision criteria. Make compensation transparent. Share customer feedback broadly.",
    risk: "Information weaponization; privacy concerns; analysis paralysis",
  },
  {
    id: "diversity-cognitive-variance",
    domains: ["organizational-topology", "leadership-development"],
    description:
      "Introduce diverse perspectives to break groupthink and expand solution space",
    meadows_rank: 4,
    applies_when: [
      "team consistently generates similar solutions",
      "blind spots lead to repeated mistakes",
    ],
    intervention:
      "Hire for cognitive diversity. Invite external perspectives. Use structured dissent techniques.",
    risk: "Initial friction from diverse viewpoints; requires skilled facilitation",
  },
  {
    id: "constraint-based-innovation",
    domains: ["product-management", "strategic-planning"],
    description:
      "Impose artificial constraints to force creative solutions rather than resource-heavy ones",
    meadows_rank: 7,
    applies_when: [
      "team always asks for more resources",
      "solutions scale with budget instead of creativity",
    ],
    intervention:
      "Set tight constraints (time, budget, scope). Run constraint-based design sprints.",
    risk: "Constraints may be too tight, producing unusable solutions",
  },
  {
    id: "premortem-failure-analysis",
    domains: ["strategic-planning", "risk-management"],
    description:
      "Imagine the plan has already failed and work backward to identify vulnerabilities",
    meadows_rank: 8,
    applies_when: [
      "plan seems too good to be true",
      "team is overconfident about success",
    ],
    intervention:
      "Run premortem workshop. Document failure scenarios. Build mitigations for top risks.",
    risk: "Can create unnecessary pessimism if not balanced with success visualization",
  },

  // ─── ETHICS-GOVERNANCE ─────────────────────────────────────────────────────

  {
    id: "ethics-by-design-integration",
    domains: ["ethics-governance"],
    description: "Embed ethical review into the design process rather than auditing after deployment",
    meadows_rank: 5,
    applies_when: [
      "ethics review happens post-deployment",
      "ethical issues discovered after launch",
    ],
    intervention:
      "Add ethics checkpoints to design sprints. Require ethical impact assessment before each release gate.",
    risk: "Process overhead may slow delivery; ethics reviewers may lack domain expertise",
  },
  {
    id: "stakeholder-voice-amplification",
    domains: ["ethics-governance", "organizational-topology"],
    description: "Include affected communities in governance decisions, not just as consultation but as co-decision-makers",
    meadows_rank: 4,
    applies_when: [
      "decisions affect communities not at the table",
      "stakeholder input is advisory only",
    ],
    intervention:
      "Create advisory boards with veto power for affected communities. Compensate community representatives.",
    risk: "Decision-making complexity; potential for stakeholder capture by vocal minorities",
  },
  {
    id: "algorithmic-audit-independence",
    domains: ["ethics-governance", "ai-safety"],
    description: "Require third-party audits of algorithmic systems by auditors independent from the developers",
    meadows_rank: 6,
    applies_when: [
      "self-assessment of algorithmic fairness",
      "no external review of automated decisions",
    ],
    intervention:
      "Mandate independent audits with access to model internals, training data, and decision logs.",
    risk: "Audit firms may develop conflicts of interest; auditors may lack technical depth",
  },
  {
    id: "ethical-debt-remediation",
    domains: ["ethics-governance", "strategic-planning"],
    description: "Track and remediate ethical compromises the way technical debt is tracked and remediated",
    meadows_rank: 7,
    applies_when: [
      "ethical trade-offs accumulate without tracking",
      "no budget allocated for ethical remediation",
    ],
    intervention:
      "Create ethical debt register. Allocate remediation budget. Review ethical debt in retrospectives.",
    risk: "Ethical debt is harder to quantify than technical debt; may become checkbox exercise",
  },
  {
    id: "whistleblower-protection-infrastructure",
    domains: ["ethics-governance", "organizational-topology"],
    description: "Build structural protections for dissenters rather than relying on cultural promises",
    meadows_rank: 5,
    applies_when: [
      "whistleblowers face retaliation",
      "speak-up culture exists without protection",
    ],
    intervention:
      "Anonymous reporting channels with external oversight. Anti-retaliation policies with enforcement teeth.",
    risk: "False reports; potential for abuse of whistleblower protections",
  },

  // ─── TECHNOLOGY-POLICY ─────────────────────────────────────────────────────

  {
    id: "regulatory-sandbox-innovation",
    domains: ["technology-policy"],
    description: "Create controlled environments for testing new technologies under temporary regulatory relief",
    meadows_rank: 6,
    applies_when: [
      "innovation blocked by outdated regulation",
      "regulators lack understanding of new technology",
    ],
    intervention:
      "Define sandbox boundaries with clear success/failure criteria. Require data sharing with regulators.",
    risk: "Sandbox participants gain unfair market advantage; consumer harm within sandbox",
  },
  {
    id: "technology-assessment-boards",
    domains: ["technology-policy", "strategic-planning"],
    description: "Establish independent boards to assess societal impact before technology deployment at scale",
    meadows_rank: 5,
    applies_when: [
      "technology deployed before impact assessment",
      "retroactive regulation of deployed systems",
    ],
    intervention:
      "Require technology impact assessments for systems above defined risk thresholds. Public input on assessment criteria.",
    risk: "Assessment boards may lack technical expertise; may become bottlenecks",
  },
  {
    id: "digital-public-infrastructure",
    domains: ["technology-policy", "organizational-topology"],
    description: "Treat critical digital infrastructure as public goods rather than private monopolies",
    meadows_rank: 4,
    applies_when: [
      "critical infrastructure controlled by single vendor",
      "public services depend on proprietary systems",
    ],
    intervention:
      "Fund open-source alternatives for critical infrastructure. Create public digital utility models.",
    risk: "Public infrastructure may lag private innovation; requires sustained public investment",
  },
  {
    id: "interoperability-mandates",
    domains: ["technology-policy", "software-architecture"],
    description: "Require interoperability standards to prevent vendor lock-in and enable competition",
    meadows_rank: 6,
    applies_when: [
      "users cannot migrate between platforms",
      "market dominated by single provider",
    ],
    intervention:
      "Mandate open APIs and data portability for platforms above market share thresholds.",
    risk: "Interoperability may reduce innovation incentives; security vulnerabilities from open interfaces",
  },
  {
    id: "compute-governance-framework",
    domains: ["technology-policy", "ai-safety"],
    description: "Track and govern access to large-scale compute as a dual-use resource with safety implications",
    meadows_rank: 7,
    applies_when: [
      "compute access untracked",
      "no governance for frontier-scale training runs",
    ],
    intervention:
      "Register large training runs. Require safety assessments above compute thresholds. International compute monitoring.",
    risk: "Compute governance may concentrate power among existing players; enforcement challenges across borders",
  },

  // ─── GEOPOLITICS ───────────────────────────────────────────────────────────

  {
    id: "multilateral-institution-reform",
    domains: ["geopolitics"],
    description: "Reform international institutions to reflect current power distributions rather than post-WWII arrangements",
    meadows_rank: 3,
    applies_when: [
      "institutions seen as illegitimate by rising powers",
      "institutional decisions ignored by major actors",
    ],
    intervention:
      "Expand voting power in IMF/World Bank. Reform UN Security Council composition. Create new inclusive forums.",
    risk: "Reform may dilute effectiveness; existing powers resist ceding influence",
  },
  {
    id: "track-two-diplomacy-channels",
    domains: ["geopolitics", "interpersonal-dynamics"],
    description: "Maintain unofficial communication channels between adversarial nations when formal diplomacy is frozen",
    meadows_rank: 6,
    applies_when: [
      "formal diplomatic channels closed",
      "escalation risk with no communication",
    ],
    intervention:
      "Support academic, business, and civil society exchanges. Maintain backchannel communications.",
    risk: "Unofficial channels may undermine formal positions; may legitimize bad actors",
  },
  {
    id: "strategic-autonomy-diversification",
    domains: ["geopolitics", "technology-policy"],
    description: "Diversify supply chains and partnerships to reduce vulnerability to any single nation's coercion",
    meadows_rank: 8,
    applies_when: [
      "critical supply concentrated in one country",
      "vulnerability to economic coercion identified",
    ],
    intervention:
      "Map critical dependencies. Develop alternative suppliers. Build strategic stockpiles for essential goods.",
    risk: "Diversification increases costs; may reduce efficiency gains from specialization",
  },
  {
    id: "regional-cooperation-frameworks",
    domains: ["geopolitics"],
    description: "Build regional institutions that address shared challenges without requiring global consensus",
    meadows_rank: 4,
    applies_when: [
      "global negotiations are deadlocked",
      "regional problems need regional solutions",
    ],
    intervention:
      "Create regional trade blocs, security pacts, and environmental agreements. Build on existing regional organizations.",
    risk: "Regional blocs may compete rather than cooperate; may fragment global governance",
  },
  {
    id: "norm-entrepreneurship",
    domains: ["geopolitics", "ethics-governance"],
    description: "Champion new international norms through coalition-building and consistent practice",
    meadows_rank: 2,
    applies_when: [
      "existing norms are inadequate for new challenges",
      "opportunity to shape emerging international standards",
    ],
    intervention:
      "Identify norm gaps. Build coalitions of willing states. Demonstrate norm adherence in practice.",
    risk: "Norms may be adopted selectively; may conflict with existing norms",
  },

  // ─── AI-SAFETY ─────────────────────────────────────────────────────────────

  {
    id: "mechanistic-interpretability-investment",
    domains: ["ai-safety"],
    description: "Invest in understanding how models internally represent and process information rather than just their outputs",
    meadows_rank: 6,
    applies_when: [
      "models are black boxes",
      "behavior prediction relies on external observation only",
    ],
    intervention:
      "Fund mechanistic interpretability research. Develop tools for circuit discovery and feature visualization.",
    risk: "Interpretability may not scale to larger models; may create false confidence from partial understanding",
  },
  {
    id: "corrigibility-by-design",
    domains: ["ai-safety"],
    description: "Design AI systems that remain open to correction and shutdown rather than resisting intervention",
    meadows_rank: 4,
    applies_when: [
      "systems optimize against human intervention",
      "no mechanism for correcting deployed models",
    ],
    intervention:
      "Implement uncertainty about objectives. Design shutdown mechanisms as part of the reward structure.",
    risk: "Corrigibility may reduce system effectiveness; adversarial actors may exploit shutdown mechanisms",
  },
  {
    id: "capability-evaluation-gating",
    domains: ["ai-safety", "technology-policy"],
    description: "Require capability evaluations before deploying models above defined risk thresholds",
    meadows_rank: 7,
    applies_when: [
      "models deployed without capability assessment",
      "no threshold for when safety review is required",
    ],
    intervention:
      "Define capability thresholds triggering review. Develop standardized evaluation benchmarks. Require pre-deployment reporting.",
    risk: "Evaluations may miss emergent capabilities; may create false sense of security",
  },
  {
    id: "red-team-culture-institutionalization",
    domains: ["ai-safety", "organizational-topology"],
    description: "Embed adversarial testing as a core practice rather than a pre-release checkbox",
    meadows_rank: 6,
    applies_when: [
      "testing focuses on expected failures only",
      "no systematic adversarial evaluation",
    ],
    intervention:
      "Maintain dedicated red teams with independence from development. Reward finding vulnerabilities, not just shipping.",
    risk: "Red teams may become adversarial to development; may create internal friction",
  },
  {
    id: "value-learning-from-diversity",
    domains: ["ai-safety", "ethics-governance"],
    description: "Learn human values from diverse populations rather than encoding a narrow cultural perspective",
    meadows_rank: 4,
    applies_when: [
      "AI values reflect narrow demographic",
      "no process for capturing diverse value perspectives",
    ],
    intervention:
      "Collect value data across cultures, socioeconomic groups, and ideologies. Use deliberative processes for value aggregation.",
    risk: "Value conflicts may be irreconcilable; deliberation may be dominated by articulate groups",
  },

  // ─── PHILOSOPHY-EPISTEMOLOGY ───────────────────────────────────────────────

  {
    id: "precommitment-to-criteria",
    domains: ["philosophy-epistemology"],
    description: "Define evaluation criteria before seeing results to prevent motivated reasoning from shifting standards",
    meadows_rank: 8,
    applies_when: [
      "success criteria shift after results are known",
      "evidence standards vary by conclusion preference",
    ],
    intervention:
      "Pre-register hypotheses and criteria. Define what would change your mind before evaluating evidence.",
    risk: "Pre-commitment may be too rigid for exploratory analysis; may miss unexpected findings",
  },
  {
    id: "devil-advocate-institutionalization",
    domains: ["philosophy-epistemology", "organizational-topology"],
    description: "Formalize the role of dissenting voice in decision-making to counter groupthink",
    meadows_rank: 6,
    applies_when: [
      "decisions made with unanimous agreement",
      "no structured dissent in deliberation",
    ],
    intervention:
      "Assign rotating devil's advocate role. Reward constructive dissent. Use red team exercises for key decisions.",
    risk: "Devil's advocate may become performative; may slow decision-making unnecessarily",
  },
  {
    id: "base-rate-anchoring",
    domains: ["philosophy-epistemology", "strategic-planning"],
    description: "Start reasoning from base rates rather than specific cases to counter availability and vividness biases",
    meadows_rank: 9,
    applies_when: [
      "decisions driven by vivid recent examples",
      "ignoring statistical context in favor of anecdotes",
    ],
    intervention:
      "Require base rate analysis before case-specific reasoning. Train teams in reference class forecasting.",
    risk: "Base rates may not apply to novel situations; may suppress creative thinking about exceptions",
  },
  {
    id: "epistemic-humility-culture",
    domains: ["philosophy-epistemology", "leadership-development"],
    description: "Normalize uncertainty and wrongness as part of the learning process rather than failures",
    meadows_rank: 4,
    applies_when: [
      "being wrong is stigmatized",
      "leaders project certainty they don't have",
    ],
    intervention:
      "Leaders model uncertainty explicitly. Celebrate updated beliefs. Track prediction accuracy over time.",
    risk: "Excessive humility may appear as weakness; may undermine confidence in genuine expertise",
  },
  {
    id: "perspective-integration-protocol",
    domains: ["philosophy-epistemology", "organizational-topology"],
    description: "Systematically gather and integrate multiple perspectives before forming conclusions",
    meadows_rank: 5,
    applies_when: [
      "decisions made from single viewpoint",
      "stakeholders with different perspectives not consulted",
    ],
    intervention:
      "Map stakeholder perspectives before analysis. Use structured perspective-taking exercises. Synthesize divergent views.",
    risk: "Perspective gathering may delay decisions; may create false equivalence between unequal viewpoints",
  },

  // ─── ADDITIONAL ETHICS-GOVERNANCE LEVERAGE ────────────────────────────────

  {
    id: "ethical-impact-bond",
    domains: ["ethics-governance", "financial-planning"],
    description: "Tie executive compensation to ethical outcomes measured by independent audits, not just financial metrics",
    meadows_rank: 7,
    applies_when: [
      "executives rewarded solely on financial performance",
      "ethical failures carry no personal cost for leaders",
    ],
    intervention:
      "Create compensation clauses that reduce bonuses for ethical violations. Require independent ethics scoring.",
    risk: "Ethics metrics may be gamed; may create perverse incentives to hide problems",
  },
  {
    id: "public-interest-technology-fellowship",
    domains: ["ethics-governance", "technology-policy"],
    description: "Embed technologists with ethics training in government to close the expertise gap between regulators and industry",
    meadows_rank: 6,
    applies_when: [
      "regulators lack technical understanding",
      "industry has overwhelming information advantage",
    ],
    intervention:
      "Create fellowship programs placing technologists in regulatory agencies. Fund public-interest tech organizations.",
    risk: "Fellows may lack regulatory experience; industry may poach trained fellows",
  },
  {
    id: "moral-injury-reporting-system",
    domains: ["ethics-governance", "organizational-topology"],
    description: "Create safe channels for employees to report moral injury from being forced to implement harmful decisions",
    meadows_rank: 6,
    applies_when: [
      "employees experience moral distress from their work",
      "no mechanism to surface ethical concerns from implementers",
    ],
    intervention:
      "Anonymous moral injury reporting. Aggregate and publish trends. Tie to governance review processes.",
    risk: "May be used for grievances unrelated to ethics; requires careful triage",
  },
  {
    id: "values-supply-chain-transparency",
    domains: ["ethics-governance", "organizational-topology"],
    description: "Require disclosure of ethical practices throughout the supply chain, not just at the final company level",
    meadows_rank: 6,
    applies_when: [
      "ethical practices verified only at top level",
      "supply chain abuses hidden behind subcontractors",
    ],
    intervention:
      "Mandate tier-2 and tier-3 supplier audits. Publish supply chain ethics maps. Require remediation plans.",
    risk: "Audit fatigue; suppliers may hide practices more deeply",
  },
  {
    id: "citizen-assembly-tech-governance",
    domains: ["ethics-governance", "technology-policy"],
    description: "Use randomly selected citizen assemblies to deliberate on technology governance decisions, bypassing lobbying influence",
    meadows_rank: 4,
    applies_when: [
      "lobbying dominates technology policy",
      "public input is performative rather than substantive",
    ],
    intervention:
      "Convene representative citizen assemblies with expert testimony. Give assemblies recommendation or veto power on key decisions.",
    risk: "Citizens may lack technical depth; assemblies may be swayed by charismatic experts",
  },

  // ─── ADDITIONAL TECHNOLOGY-POLICY LEVERAGE ────────────────────────────────

  {
    id: "algorithmic-impact-assessment",
    domains: ["technology-policy", "ai-safety"],
    description: "Require algorithmic impact assessments before deploying automated decision systems in public services",
    meadows_rank: 6,
    applies_when: [
      "algorithms used in public services without oversight",
      "automated decisions affect rights without review",
    ],
    intervention:
      "Mandate impact assessments covering fairness, transparency, and recourse. Public publication of assessment results.",
    risk: "Assessments may become checkbox exercises; may slow deployment of beneficial systems",
  },
  {
    id: "data-fiduciary-duty",
    domains: ["technology-policy", "ethics-governance"],
    description: "Establish legal fiduciary duties for companies handling personal data, requiring them to act in users best interests",
    meadows_rank: 5,
    applies_when: [
      "data practices prioritize company over user interests",
      "consent is the only legal basis for data handling",
    ],
    intervention:
      "Legislate data fiduciary obligations. Create enforcement mechanisms. Define breach consequences.",
    risk: "Fiduciary standards may be vague; enforcement may be inconsistent",
  },
  {
    id: "public-compute-infrastructure",
    domains: ["technology-policy", "ai-safety"],
    description: "Build publicly accessible compute infrastructure to democratize AI research and reduce concentration of power",
    meadows_rank: 4,
    applies_when: [
      "AI research concentrated in well-funded organizations",
      "independent researchers cannot access frontier compute",
    ],
    intervention:
      "Fund national compute clouds for academic and public-interest research. Allocate compute through peer review.",
    risk: "Public compute may lag private capabilities; may still be captured by well-connected researchers",
  },
  {
    id: "interoperability-data-portability",
    domains: ["technology-policy", "software-architecture"],
    description: "Mandate real-time data portability so users can move their data between competing platforms without loss",
    meadows_rank: 6,
    applies_when: [
      "users locked into single platform",
      "data switching costs prevent competition",
    ],
    intervention:
      "Require real-time APIs for data export and import. Standardize data formats across competing platforms.",
    risk: "Security risks from open data flows; may reduce platform investment in unique features",
  },
  {
    id: "sunset-clause-technology-regulation",
    domains: ["technology-policy"],
    description: "Build automatic expiration into technology regulations to force periodic reassessment as technology evolves",
    meadows_rank: 7,
    applies_when: [
      "regulations written for outdated technology",
      "no mechanism to update rules as technology changes",
    ],
    intervention:
      "Set 3-5 year sunset clauses on tech regulations. Require renewal with evidence of continued relevance.",
    risk: "Regulatory uncertainty during renewal periods; may create lobbying opportunities at renewal",
  },

  // ─── ADDITIONAL GEOPOLITICS LEVERAGE ──────────────────────────────────────

  {
    id: "diaspora-diplomacy-network",
    domains: ["geopolitics", "interpersonal-dynamics"],
    description: "Leverage diaspora communities as bridges between nations, building people-to-people connections that survive political tensions",
    meadows_rank: 5,
    applies_when: [
      "formal diplomatic relations are strained",
      "cultural understanding between nations is low",
    ],
    intervention:
      "Support diaspora organizations. Facilitate cultural and educational exchanges. Fund diaspora-led initiatives.",
    risk: "Diaspora views may not represent origin country; may be seen as foreign influence",
  },
  {
    id: "critical-resource-stockpile",
    domains: ["geopolitics", "financial-planning"],
    description: "Build strategic reserves of critical resources (chips, minerals, energy) to reduce vulnerability to supply chain coercion",
    meadows_rank: 8,
    applies_when: [
      "critical resources concentrated in adversarial nations",
      "supply chain disruption would cause national crisis",
    ],
    intervention:
      "Identify critical dependencies. Build 6-12 month stockpiles. Diversify supply sources over time.",
    risk: "Stockpiles are expensive; may create false sense of security without diversification",
  },
  {
    id: "norm-coalition-building",
    domains: ["geopolitics", "ethics-governance"],
    description: "Build coalitions of willing nations to establish new international norms outside paralyzed multilateral institutions",
    meadows_rank: 3,
    applies_when: [
      "existing institutions cannot agree on new norms",
      "urgent governance gaps in emerging domains",
    ],
    intervention:
      "Identify like-minded nations. Draft norm frameworks. Demonstrate through practice. Expand coalition over time.",
    risk: "May fragment global governance; excluded nations may create competing norms",
  },
  {
    id: "economic-statecraft-coordination",
    domains: ["geopolitics", "financial-planning"],
    description: "Coordinate economic tools (sanctions, trade, investment) across allied nations to amplify effectiveness and reduce evasion",
    meadows_rank: 7,
    applies_when: [
      "unilateral sanctions easily evaded",
      "allies pursue conflicting economic policies",
    ],
    intervention:
      "Create allied economic coordination mechanisms. Harmonize sanction lists. Share intelligence on evasion.",
    risk: "Coordination is slow; may require concessions that dilute effectiveness",
  },
  {
    id: "technology-standards-coalition",
    domains: ["geopolitics", "technology-policy"],
    description: "Form coalitions of democratic nations to shape technology standards that reflect shared values rather than authoritarian models",
    meadows_rank: 4,
    applies_when: [
      "authoritarian nations shaping technology standards",
      "democratic values absent from technical standards",
    ],
    intervention:
      "Coordinate standards positions across allies. Fund participation in standards bodies. Develop alternative frameworks.",
    risk: "May fragment global standards; standards bodies may resist politicization",
  },

  // ─── ADDITIONAL AI-SAFETY LEVERAGE ────────────────────────────────────────

  {
    id: "model-evaluation-consortium",
    domains: ["ai-safety", "organizational-topology"],
    description: "Create independent evaluation consortia with authority to assess and publish model capabilities before deployment",
    meadows_rank: 6,
    applies_when: [
      "model evaluation done internally by developers",
      "no independent assessment of model risks",
    ],
    intervention:
      "Fund independent evaluation organizations. Require pre-deployment access for evaluators. Publish standardized capability reports.",
    risk: "Evaluators may lack access to model internals; may create deployment delays",
  },
  {
    id: "safety-case-requirement",
    domains: ["ai-safety", "technology-policy"],
    description: "Require developers to build and publish safety cases demonstrating that models meet defined safety thresholds before deployment",
    meadows_rank: 6,
    applies_when: [
      "no formal safety documentation required",
      "deployment decisions lack structured safety analysis",
    ],
    intervention:
      "Define safety case format and thresholds. Require third-party review. Make safety cases public for frontier models.",
    risk: "Safety cases may become boilerplate; thresholds may be set too low",
  },
  {
    id: "compute-threshold-monitoring",
    domains: ["ai-safety", "geopolitics"],
    description: "Monitor and report large-scale compute usage to detect potentially risky training runs and enable coordinated response",
    meadows_rank: 7,
    applies_when: [
      "no visibility into who is training large models",
      "compute thresholds for concern are undefined",
    ],
    intervention:
      "Require chip manufacturers to report large orders. Establish compute monitoring body. Define threshold-triggered reviews.",
    risk: "May be circumvented through distributed training; may concentrate power among monitored actors",
  },
  {
    id: "pause-agreement-framework",
    domains: ["ai-safety", "geopolitics"],
    description: "Develop international agreements for coordinated pauses in AI development when safety thresholds are breached",
    meadows_rank: 2,
    applies_when: [
      "no mechanism to halt dangerous development",
      "race dynamics prevent voluntary safety pauses",
    ],
    intervention:
      "Define trigger conditions for pauses. Establish verification mechanisms. Create enforcement for non-compliance.",
    risk: "Agreements may be violated; defining trigger conditions is extremely difficult",
  },
  {
    id: "safety-talent-pipeline",
    domains: ["ai-safety", "organizational-topology"],
    description: "Build dedicated educational pathways for AI safety research to grow the field beyond its current small size",
    meadows_rank: 8,
    applies_when: [
      "AI safety talent shortage",
      "safety research career path unclear",
    ],
    intervention:
      "Fund safety-focused graduate programs. Create safety internships at AI labs. Establish safety research fellowships.",
    risk: "May produce safety researchers without practical deployment experience; pipeline takes years to mature",
  },

  // ─── ADDITIONAL PHILOSOPHY-EPISTEMOLOGY LEVERAGE ──────────────────────────

  {
    id: "prediction-tracking-system",
    domains: ["philosophy-epistemology", "strategic-planning"],
    description: "Track predictions and their outcomes systematically to calibrate confidence and expose overconfidence",
    meadows_rank: 8,
    applies_when: [
      "confident predictions rarely checked against outcomes",
      "no record of past accuracy for decision makers",
    ],
    intervention:
      "Record predictions with confidence levels. Review outcomes quarterly. Publish calibration scores.",
    risk: "May encourage conservative predictions; tracking burden may be resisted",
  },
  {
    id: "red-team-institutionalization",
    domains: ["philosophy-epistemology", "organizational-topology"],
    description: "Embed systematic dissent into decision processes by assigning structured opposition roles",
    meadows_rank: 6,
    applies_when: [
      "decisions made without structured challenge",
      "groupthink evident in deliberation",
    ],
    intervention:
      "Assign rotating red team roles. Give red teams resources and authority. Reward successful challenges.",
    risk: "May become performative; may slow decision-making; red teams may be ignored despite effort",
  },
  {
    id: "epistemic-diversity-hiring",
    domains: ["philosophy-epistemology", "organizational-topology"],
    description: "Hire for cognitive and epistemic diversity to expand the range of questions asked and methods used",
    meadows_rank: 4,
    applies_when: [
      "team shares similar educational and intellectual backgrounds",
      "same approaches applied to all problems",
    ],
    intervention:
      "Value diverse intellectual traditions in hiring. Include non-traditional backgrounds. Create space for methodological pluralism.",
    risk: "May create initial friction; requires skilled facilitation to integrate diverse approaches",
  },
  {
    id: "assumption-explicit-capture",
    domains: ["philosophy-epistemology", "strategic-planning"],
    description: "Require explicit documentation of underlying assumptions before major decisions, making them available for challenge",
    meadows_rank: 7,
    applies_when: [
      "decisions based on unstated assumptions",
      "assumptions discovered only after failure",
    ],
    intervention:
      "Create assumption registers for major decisions. Review and update assumptions periodically. Test high-risk assumptions.",
    risk: "May become bureaucratic; assumptions listed but not actually examined",
  },
  {
    id: "intellectual-humility-modeling",
    domains: ["philosophy-epistemology", "leadership-development"],
    description: "Leaders explicitly model intellectual humility by publicly updating beliefs and acknowledging uncertainty",
    meadows_rank: 4,
    applies_when: [
      "leaders project certainty they do not have",
      "changing ones mind is seen as weakness",
    ],
    intervention:
      "Leaders say 'I was wrong' and 'I do not know' publicly. Celebrate belief updates. Track prediction accuracy.",
    risk: "May undermine confidence in genuine expertise; may be perceived as weakness by some audiences",
  },
];
