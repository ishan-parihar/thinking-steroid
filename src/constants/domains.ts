export interface Domain {
  id: string;
  name: string;
  vocabulary: string[];
  subdomains: string[];
  relatedDomains: string[];
}

export const DOMAINS: Record<string, Domain> = {
  "software-architecture": {
    id: "software-architecture",
    name: "Software Architecture",
    vocabulary: [
      "monolith", "microservice", "api", "deployment", "coupling", "cohesion",
      "service boundary", "distributed", "technical debt", "scalability",
      "latency", "throughput", "container", "orchestration", "event-driven",
      "rest", "graphql", "database", "cache", "load balancer", "circuit breaker",
      "saga", "cqrs", "event sourcing",
    ],
    subdomains: ["backend", "frontend", "devops", "infrastructure"],
    relatedDomains: ["organizational-topology", "systems-thinking"],
  },
  "organizational-topology": {
    id: "organizational-topology",
    name: "Organizational Topology",
    vocabulary: [
      "team", "department", "silo", "cross-functional", "matrix", "reporting",
      "stakeholder", "alignment", "culture", "resistance", "collaboration",
      "communication", "governance", "hierarchy", "flat organization", "agile",
      "scrum", "kanban", "transformation", "change management", "reorg",
      "ownership", "autonomy", "conway's law",
    ],
    subdomains: ["team design", "org design", "culture"],
    relatedDomains: ["systems-thinking", "leadership-development", "software-architecture"],
  },
  "strategic-planning": {
    id: "strategic-planning",
    name: "Strategic Planning",
    vocabulary: [
      "strategy", "objective", "roadmap", "competitive", "market", "positioning",
      "risk", "opportunity", "scenario", "forecast", "vision", "mission", "goal",
      "initiative", "portfolio", "investment", "pivot", "differentiation", "moat",
      "swot", "okr", "kpi", "milestone", "timeline", "resource allocation",
    ],
    subdomains: ["business strategy", "product strategy", "corporate strategy"],
    relatedDomains: ["financial-planning", "product-management"],
  },
  "interpersonal-dynamics": {
    id: "interpersonal-dynamics",
    name: "Interpersonal Dynamics",
    vocabulary: [
      "relationship", "trust", "communication", "conflict", "empathy", "boundary",
      "attachment", "projection", "transference", "vulnerability", "intimacy",
      "power dynamic", "negotiation", "influence", "persuasion", "active listening",
      "feedback", "psychological safety", "rapport", "alliance",
    ],
    subdomains: ["romantic", "professional", "therapeutic", "familial"],
    relatedDomains: ["personal-development", "leadership-development"],
  },
  "financial-planning": {
    id: "financial-planning",
    name: "Financial Planning",
    vocabulary: [
      "revenue", "cost", "margin", "investment", "roi", "budget", "cashflow",
      "forecast", "valuation", "capital", "profit", "loss", "expense", "income",
      "asset", "liability", "equity", "debt", "dividend", "burn rate", "runway",
      "unit economics", "ltv", "cac", "ebitda",
    ],
    subdomains: ["corporate finance", "personal finance", "investment"],
    relatedDomains: ["strategic-planning", "product-management"],
  },
  "product-management": {
    id: "product-management",
    name: "Product Management",
    vocabulary: [
      "user", "feature", "roadmap", "backlog", "prioritization", "mvp", "metric",
      "retention", "conversion", "churn", "engagement", "activation", "acquisition",
      "monetization", "product-market fit", "user story", "acceptance criteria",
      "a/b test", "cohort", "funnel", "north star",
    ],
    subdomains: ["growth", "platform", "data product"],
    relatedDomains: ["strategic-planning", "financial-planning", "software-architecture"],
  },
  "leadership-development": {
    id: "leadership-development",
    name: "Leadership Development",
    vocabulary: [
      "vision", "delegation", "accountability", "feedback", "coaching",
      "empowerment", "culture", "values", "decision-making", "mentorship",
      "succession planning", "executive presence", "emotional intelligence",
      "strategic thinking", "influence", "conflict resolution", "team building",
    ],
    subdomains: ["executive coaching", "management training", "talent development"],
    relatedDomains: ["organizational-topology", "interpersonal-dynamics", "personal-development"],
  },
  "systems-thinking": {
    id: "systems-thinking",
    name: "Systems Thinking",
    vocabulary: [
      "feedback loop", "leverage point", "emergence", "boundary", "constraint",
      "delay", "stock", "flow", "balancing", "reinforcing", "causal loop",
      "system dynamics", "holarchy", "interconnected", "nonlinear", "oscillation",
      "homeostasis", "tipping point", "resilience", "adaptation", "complexity",
    ],
    subdomains: ["systems dynamics", "complexity theory", "cybernetics"],
    relatedDomains: ["software-architecture", "organizational-topology", "strategic-planning"],
  },
  "ethics-governance": {
    id: "ethics-governance",
    name: "Ethics & Governance",
    vocabulary: [
      "compliance", "risk", "accountability", "transparency", "fairness", "bias",
      "privacy", "audit", "regulation", "oversight", "policy", "standard",
      "framework", "control", "governance", "ethics", "responsible", "stewardship",
      "fiduciary", "duty of care", "due diligence",
    ],
    subdomains: ["data ethics", "ai ethics", "corporate governance", "regulatory compliance"],
    relatedDomains: ["organizational-topology", "strategic-planning"],
  },
  "personal-development": {
    id: "personal-development",
    name: "Personal Development",
    vocabulary: [
      "habit", "identity", "belief", "pattern", "growth", "mindset", "resilience",
      "self-awareness", "motivation", "goal", "discipline", "reflection",
      "journaling", "meditation", "mindfulness", "values", "purpose", "meaning",
      "fulfillment", "well-being", "emotional regulation",
    ],
    subdomains: ["cognitive behavioral", "positive psychology", "contemplative practice"],
    relatedDomains: ["interpersonal-dynamics", "leadership-development"],
  },
};
