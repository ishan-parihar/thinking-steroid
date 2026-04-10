import type {
  DevelopmentalLevel,
  SpiralDynamicsStage,
  LineOfDevelopment,
  StateOfConsciousness,
  CoreDrive,
  Quadrant,
  ShadowFramework,
  UnitySubsystem,
  SystemsArchetype,
  LeveragePointCategory,
  CognitiveBias,
  VisionLogicSubstage,
  CynefinDomain,
  JungianArchetype,
  ShadowPattern,
  FirstPrinciplesCategory,
  LadderOfInferenceStep,
} from "./types.js";

// ─── Developmental Levels ────────────────────────────────────────────────────

export const DEVELOPMENTAL_LEVELS: Record<
  DevelopmentalLevel,
  { label: string; description: string; key_characteristics: string[] }
> = {
  archaic: {
    label: "Archaic",
    description:
      "The most fundamental layer of human awareness, rooted in survival, instinct, and raw sensory experience. At this stage, cognition operates through bodily impulses, reflex patterns, and undifferentiated perception of self and environment. The boundary between organism and world is porous and fluid.",
    key_characteristics: [
      "Survival-oriented perception driven by threat and safety detection",
      "Undifferentiated sense of self — minimal ego boundary",
      "Bodily and instinctual intelligence as primary knowledge source",
      "Reactive, stimulus-response patterns of behavior",
      "Pre-symbolic, pre-verbal modes of awareness",
      "Deep attunement to physical environment and bodily states",
    ],
  },
  magic: {
    label: "Magic",
    description:
      "The emergence of symbolic thinking, animistic perception, and the recognition that internal states can influence external reality. This stage is characterized by the birth of imagination, metaphor, and the conviction that thoughts, wishes, and rituals carry causal power in the world.",
    key_characteristics: [
      "Symbolic and metaphorical thinking as primary cognitive mode",
      "Animistic worldview — seeing agency and spirit in natural phenomena",
      "Blurring of subjective desire and objective causality",
      "Emergence of ritual, taboo, and magical thinking patterns",
      "Rich inner fantasy life experienced as partially real",
      "Strong sensitivity to energetic and emotional atmospheres",
    ],
  },
  "magic-mythic": {
    label: "Magic-Mythic",
    description:
      "The egocentric, power-oriented stage where the self asserts dominance over its environment and relationships. Characterized by the emergence of will, impulse-driven action, and the belief that strength and cunning determine outcomes. This is the stage of the 'terrible twos' writ large — the assertion of I against the world.",
    key_characteristics: [
      "Egocentric worldview with the self as the center of gravity",
      "Power-oriented — strength, dominance, and assertion as values",
      "Impulse-driven behavior with minimal self-regulation",
      "Exploitative opportunism and fear-based respect",
      "Emergence of personal agency separated from the group",
      "Black-and-white thinking framed as strong vs. weak",
    ],
  },
  mythic: {
    label: "Mythic",
    description:
      "The ethnocentric, rule-governed stage where meaning is derived from belonging to a group, tradition, or belief system. Authority is externalized into sacred texts, leaders, and cultural norms. Truth is received, not questioned. Order, loyalty, and conformity are paramount, and deviation is experienced as moral failure.",
    key_characteristics: [
      "Ethnocentric identification with group, tribe, or belief system",
      "Externalized authority — truth comes from tradition and leaders",
      "Rule-based morality with clear right/wrong distinctions",
      "Strong need for order, structure, and predictability",
      "Loyalty and conformity valued over individual expression",
      "Guilt and shame as primary mechanisms of social control",
    ],
  },
  "modern-rational": {
    label: "Modern-Rational",
    description:
      "The world-centric, objective stage characterized by the rise of scientific reasoning, individualism, and universal principles. Truth is discovered through evidence, logic, and critical inquiry rather than received authority. Achievement, progress, and meritocracy are core values. The self is differentiated from the group and capable of self-authorship.",
    key_characteristics: [
      "World-centric perspective transcending tribal or ethnocentric boundaries",
      "Scientific rationalism and evidence-based epistemology",
      "Individualism and self-authorship as developmental achievements",
      "Achievement orientation with focus on success and competence",
      "Universal principles and human rights as moral foundations",
      "Critical thinking and skepticism toward received authority",
    ],
  },
  postmodern: {
    label: "Postmodern",
    description:
      "The pluralistic stage that recognizes the validity of multiple perspectives, truths, and ways of knowing. Characterized by sensitivity to context, power dynamics, and the social construction of reality. The postmodern stance deconstructs grand narratives, privileges marginalized voices, and embraces relativism. The shadow is a paralysis of endless critique without reconstruction.",
    key_characteristics: [
      "Pluralistic worldview embracing multiple truths and perspectives",
      "Relativism — recognition that all knowledge is context-dependent",
      "Deconstruction of grand narratives and meta-narratives",
      "Heightened sensitivity to power, privilege, and systemic oppression",
      "Emphasis on equity, inclusion, and social justice",
      "Paradox tolerance and comfort with ambiguity and contradiction",
    ],
  },
  integral: {
    label: "Integral",
    description:
      "The holistic, systemic stage that integrates and transcends all previous developmental levels. Recognizes that each stage contains partial truth and that wisdom lies in understanding how they fit together. Characterized by meta-systemic thinking, the ability to hold multiple perspectives simultaneously, and the recognition of patterns across domains. Reality is understood as a nested holarchy of increasing complexity.",
    key_characteristics: [
      "Holistic thinking that sees patterns across systems and domains",
      "Integration of multiple perspectives without collapsing their differences",
      "Meta-systemic cognition — thinking about thinking about systems",
      "Recognition of developmental trajectories in individuals and cultures",
      "Quadrantal awareness — interior/exterior, individual/collective dimensions",
      "Constructive action informed by systemic understanding",
    ],
  },
  "super-integral": {
    label: "Super-Integral",
    description:
      "The unity consciousness stage in which the separation between self and other, subject and object, dissolves into direct experiential knowing of fundamental interconnectedness. Not a rejection of rationality or complexity, but a grounding of all cognition in the direct realization of non-dual awareness. Characterized by spontaneous compassion, effortless wisdom, and the capacity to act from the ground of being itself.",
    key_characteristics: [
      "Non-dual awareness transcending subject-object separation",
      "Direct experiential knowing of unity and interconnectedness",
      "Spontaneous compassion arising from recognition of shared being",
      "Effortless wisdom that integrates all developmental levels naturally",
      "Trans-rational cognition — rationality grounded in direct experience",
      "Cosmic humor and playfulness as expressions of ultimate freedom",
    ],
  },
};

// ─── Spiral Dynamics Stages ──────────────────────────────────────────────────

export const SPIRAL_DYNAMICS_STAGES: Record<
  SpiralDynamicsStage,
  { label: string; color: string; description: string; key_shadow: string }
> = {
  beige: {
    label: "Beige",
    color: "#F5F5DC",
    description:
      "The first emergence of human consciousness, focused on physiological survival. Beige operates through instinctual patterns, automatic bodily rhythms, and the most basic needs of food, water, warmth, and reproduction. The sense of self is barely differentiated from the environment. This stage persists in newborns, severely regressed individuals, and as an undercurrent in all human experience when survival is threatened.",
    key_shadow:
      "When fixated or regressed: complete dissociation from higher cognition, feral behavior, inability to plan beyond immediate gratification, loss of symbolic thought, and reduction to purely biological imperatives.",
  },
  purple: {
    label: "Purple",
    color: "#7B68EE",
    description:
      "The tribal, animistic stage where safety is found in group membership, ancestral bonds, and ritual practices. Purple consciousness perceives the world as alive with hidden forces, spirits, and magical influences. The tribe is the primary unit of identity, and loyalty to bloodlines, traditions, and sacred customs provides existential security. Decision-making is guided by ancestral wisdom, omens, and the collective memory of the group.",
    key_shadow:
      "When fixated: magical thinking that overrides rational assessment, superstition, ethnic or tribal chauvinism, fear of outsiders, scapegoating of those who violate taboos, and the inability to think independently of group consensus.",
  },
  red: {
    label: "Red",
    color: "#DC143C",
    description:
      "The egocentric, power-driven stage where the individual breaks free from tribal fusion and asserts the self as a sovereign force. Red consciousness is characterized by impulse, action, dominance, and the raw assertion of will. It is the stage of the warrior, the rebel, and the entrepreneur who refuses to be constrained by rules. Shame is the primary wound, and power is the primary defense. Red sees the world as a jungle where the strong survive and the weak are exploited.",
    key_shadow:
      "When fixated: narcissistic grandiosity, psychopathic exploitation, chronic impulsivity, inability to delay gratification, rage responses to perceived threats, and the creation of environments where fear is the primary motivator.",
  },
  blue: {
    label: "Blue",
    color: "#4169E1",
    description:
      "The absolutistic, purpose-driven stage where meaning is found in order, discipline, and adherence to a higher principle or authority. Blue consciousness introduces the concept of guilt — the recognition that one can transgress against a moral code. It is the stage of religion, military hierarchy, bureaucratic institutions, and any system that provides stability through rules. Blue sacrifices present gratification for future reward and finds meaning in duty, sacrifice, and righteous purpose.",
    key_shadow:
      "When fixated: fundamentalism, rigid dogmatism, moral absolutism, guilt-based control, authoritarianism, suppression of individuality in service of the system, and the tendency to punish rather than understand deviation.",
  },
  orange: {
    label: "Orange",
    color: "#FF8C00",
    description:
      "The strategic, achievement-oriented stage where the individual discovers that rules can be bent, systems can be gamed, and success is the ultimate metric. Orange consciousness is characterized by rationality, empiricism, innovation, and the belief that progress is both possible and desirable. It is the stage of science, capitalism, meritocracy, and the entrepreneurial spirit. Orange values competence, efficiency, and measurable outcomes. The self is autonomous and self-directing.",
    key_shadow:
      "When fixated: ruthless materialism, exploitation masked as meritocracy, reduction of all value to metrics, burnout culture, cynicism about anything that cannot be measured or monetized, and the creation of systems that optimize for efficiency at the cost of humanity.",
  },
  green: {
    label: "Green",
    color: "#32CD32",
    description:
      "The relativistic, community-oriented stage where the individual recognizes that all perspectives have validity and that truth is plural, contextual, and socially constructed. Green consciousness is characterized by empathy, egalitarianism, inclusivity, and sensitivity to power dynamics. It is the stage of multiculturalism, social justice, consensus decision-making, and the recognition of systemic oppression. Green deconstructs the hierarchies of Orange and Blue in favor of networks, circles, and horizontal relationships.",
    key_shadow:
      "When fixated: endless deconstruction without reconstruction, paralysis by relativism, the tyranny of the marginalized voice over all others, performative virtue signaling, inability to make decisive action, and the creation of echo chambers that punish dissent.",
  },
  teal: {
    label: "Teal",
    color: "#008080",
    description:
      "The integrative, systemic stage where the individual recognizes that each previous stage represents a necessary and valuable layer of human development. Teal consciousness is characterized by the ability to hold multiple perspectives, see patterns across domains, and understand that reality is a nested holarchy of increasing complexity. It is the stage of integral theory, systems thinking, and the recognition that evolution itself has direction and purpose. Teal transcends and includes all previous stages.",
    key_shadow:
      "When fixated: intellectual arrogance masquerading as integration, the tendency to map everything into frameworks rather than experience it directly, meta-level analysis that substitutes for grounded action, and the creation of elaborate models that are beautiful but inert.",
  },
  turquoise: {
    label: "Turquoise",
    color: "#40E0D0",
    description:
      "The holistic, global-consciousness stage where the individual experiences the interconnectedness of all systems — biological, social, psychological, and spiritual — as a single living process. Turquoise consciousness is characterized by a shift from individual achievement to collective evolution, from analysis to synthesis, and from managing systems to participating in the self-organizing intelligence of the cosmos. It is the stage of Gaia consciousness, deep ecology, and the recognition that the universe is not a machine but an organism.",
    key_shadow:
      "When fixated: dissolution of healthy ego boundaries, cosmic escapism that avoids practical engagement, spiritual bypassing of developmental work, and the tendency to speak in holistic platitudes rather than address concrete problems.",
  },
};

// ─── Lines of Development ────────────────────────────────────────────────────

export const LINES_OF_DEVELOPMENT: Record<
  LineOfDevelopment,
  { label: string; description: string; shadow_manifestation: string }
> = {
  cognitive: {
    label: "Cognitive",
    description:
      "The line of intellectual development encompassing logical reasoning, abstract thinking, problem-solving capacity, and the ability to understand increasingly complex systems. This is the line measured by IQ tests and formal education. It progresses from concrete operational thinking through formal operations to post-formal, dialectical, and systems-level reasoning. Cognitive development enables the individual to hold more variables in mind, see deeper patterns, and construct more adequate models of reality.",
    shadow_manifestation:
      "Intellectualization as defense — using rational analysis to avoid feeling, dismissing emotional or somatic intelligence, reducing all experience to conceptual frameworks, the arrogance of the 'smart' person who cannot access empathy, and the shadow of hyper-rationality that fragments lived experience into data points.",
  },
  emotional: {
    label: "Emotional",
    description:
      "The line of affective development encompassing emotional awareness, regulation, empathy, and the capacity for increasingly complex and nuanced feeling states. This line progresses from undifferentiated affective reactions through basic emotion recognition to the capacity for holding contradictory emotions, meta-emotional awareness, and the ability to use emotion as a source of intelligence and connection. Emotional development enables deeper intimacy, more authentic expression, and greater resilience in the face of psychological stress.",
    shadow_manifestation:
      "Emotional reactivity that masquerades as authenticity, the inability to regulate affect in service of higher goals, emotional manipulation, the shadow of empathy without boundaries that leads to codependency or compassion fatigue, and the tendency to collapse all truth claims into how they make one feel.",
  },
  intrapersonal: {
    label: "Intrapersonal",
    description:
      "The line of self-knowledge and identity development encompassing self-awareness, self-regulation, introspection, and the capacity to observe one own patterns of thought, emotion, and behavior. This line progresses from minimal self-reflection through basic self-concept to meta-awareness, the observation of the observer, and the recognition of the constructed nature of identity itself. Intrapersonal development enables the individual to see their own blind spots, regulate their own states, and increasingly disidentify from transient contents of consciousness.",
    shadow_manifestation:
      "Obsessive self-analysis that substitutes for action, navel-gazing as a lifestyle, the shadow of self-awareness without the capacity for genuine connection, hyper-vigilance about one own flaws, and the tendency to use psychological language as a defense against vulnerability.",
  },
  moral: {
    label: "Moral",
    description:
      "The line of ethical development encompassing the evolution of moral reasoning from pre-conventional (obedience and punishment) through conventional (conformity and social order) to post-conventional (universal principles and justice). This line, pioneered by Kohlberg and expanded by Gilligan, traces how the individual's sense of right and wrong becomes increasingly abstract, inclusive, and principled. Moral development enables the individual to act ethically even when it conflicts with personal interest or social pressure.",
    shadow_manifestation:
      "Moral superiority and self-righteousness, the use of ethical principles as weapons against others, the shadow of 'enlightened' judgment that creates new hierarchies of worthiness, performative morality, and the inability to tolerate ambiguity in ethical situations where all choices involve genuine loss.",
  },
  spiritual: {
    label: "Spiritual",
    description:
      "The line of contemplative and transcendent development encompassing the capacity for states of consciousness beyond ordinary waking awareness, the recognition of dimensions of reality that transcend the individual self, and the progressive deepening of one relationship with the ground of being. This line progresses from magical and mythic forms of spiritual expression through rational skepticism to direct experiential realization of non-dual awareness. Spiritual development enables the individual to access increasingly subtle, spacious, and luminous states of consciousness.",
    shadow_manifestation:
      "Spiritual bypassing — using transcendent states and language to avoid psychological work, the inflation of identifying with ultimate reality before earning it developmentally, cultish dependency on spiritual authority, the denial of relative truth in favor of absolute truth, and the tendency to spiritualize abuse, dysfunction, or developmental arrest.",
  },
  kinesthetic: {
    label: "Kinesthetic",
    description:
      "The line of bodily and somatic development encompassing physical coordination, bodily awareness, the integration of movement and cognition, and the capacity to use the body as an instrument of perception and expression. This line progresses from reflexive movement through basic motor skills to refined somatic intelligence, embodied presence, and the ability to access wisdom through the body. Kinesthetic development enables the individual to ground awareness in physical experience and to use the body as a source of knowledge equal to the mind.",
    shadow_manifestation:
      "The denial or dissociation from the body in favor of purely mental functioning, the shadow of physical perfectionism, the use of the body as a performance object rather than a source of wisdom, and the tendency to intellectualize somatic experience rather than inhabit it directly.",
  },
  willpower: {
    label: "Willpower",
    description:
      "The line of volitional development encompassing the capacity for intentional action, self-discipline, sustained focus, and the ability to direct one energy toward chosen ends despite internal and external resistance. This line progresses from impulsive, stimulus-driven action through basic self-control to the refined capacity for sustained intention, the alignment of will with deeper purpose, and ultimately the recognition that true will is the expression of being itself rather than egoic striving. Willpower development enables the individual to become an effective agent in the world.",
    shadow_manifestation:
      "The shadow of willfulness — the egoic drive to control all outcomes, rigidity masquerading as discipline, the inability to surrender or flow, workaholism, and the tendency to equate effort with worth. At its extreme, the shadow of willpower is the refusal to accept reality as it is, substituting force for wisdom.",
  },
};

// ─── States of Consciousness ─────────────────────────────────────────────────

export const STATES_OF_CONSCIOUSNESS: Record<
  StateOfConsciousness,
  { label: string; description: string }
> = {
  gross: {
    label: "Gross",
    description:
      "The ordinary waking state of consciousness in which perception is mediated through the physical senses and cognition operates within the framework of space, time, and causality. This is the state of everyday awareness — of bodies, objects, actions, and the material world. The gross state is the foundation of empirical science and rational inquiry. In meditation traditions, this state is associated with awareness of the physical body and the external environment. Dreams are excluded from this state; they belong to the subtle.",
  },
  subtle: {
    label: "Subtle",
    description:
      "The dream state and the state of deep contemplation, meditation, and visualization in which awareness operates beyond the constraints of physical perception. The subtle state is characterized by luminous imagery, archetypal forms, inner voices, and the direct experience of psychological contents as realities. This is the domain of dreams, visions, creative inspiration, and the encounter with inner guides, deities, and archetypal figures. In advanced practice, the subtle state becomes the space of luminous clarity and the direct perception of the architecture of consciousness itself.",
  },
  causal: {
    label: "Causal",
    description:
      "The formless, unmanifest state of pure potentiality in which all distinctions dissolve into the ground of being itself. The causal state is experienced in deep dreamless sleep, in advanced meditative absorption (nirodha samapatti), and in moments of total self-transcendence. It is the state of pure consciousness without content, the witness that witnesses nothing, the silence before the first thought. In the causal state, there is no subject, no object, no experience — only the formless ground from which all experience arises.",
  },
  witness: {
    label: "Witness",
    description:
      "The meta-aware state in which consciousness turns upon itself and observes the flow of thoughts, emotions, sensations, and perceptions from a position of detached clarity. The witness state is not a content of consciousness but the recognition of consciousness itself as the space in which all contents appear. It is the 'I am' prior to any identification, the observing self that is never identical with any particular thought, feeling, or sensation. The witness state is the foundation of mindfulness practice and the gateway to non-dual realization.",
  },
  "non-dual": {
    label: "Non-Dual",
    description:
      "The ultimate state in which the distinction between subject and object, observer and observed, self and world, completely collapses. Non-dual consciousness is not a state among states but the recognition that all states are expressions of a single, undivided reality. It is the direct, immediate, and unmediated knowing that there is only This — no separation, no boundary, no inside and outside. In non-dual consciousness, the gross, subtle, and causal are not separate realms but dimensions of a single, seamless whole. This is the state of enlightenment, awakening, and the full recognition of one true nature.",
  },
};

// ─── Core Drives ─────────────────────────────────────────────────────────────

export const CORE_DRIVES: Record<
  CoreDrive,
  {
    label: string;
    description: string;
    complementary_opposite: string;
    pathological_expression: string;
  }
> = {
  agency: {
    label: "Agency",
    description:
      "The fundamental drive toward self-assertion, autonomy, individuation, and the expression of one unique identity and will. Agency is the force of differentiation — the impulse to say 'I am' and to act from that center. It encompasses independence, competence, self-efficacy, and the courage to stand apart from the group when necessary. Agency without communion is isolation; agency with communion is authentic self-expression in relationship.",
    complementary_opposite: "communion",
    pathological_expression:
      "Hyper-individuation, narcissistic self-inflation, domination, the inability to be vulnerable or dependent, isolation disguised as independence, and the refusal of intimacy in all its forms. At its extreme, pathological agency is the solipsistic conviction that only the self is real and all others are instruments or obstacles.",
  },
  communion: {
    label: "Communion",
    description:
      "The fundamental drive toward connection, belonging, union, and the dissolution of boundaries between self and other. Communion is the force of integration — the impulse to say 'we are' and to participate in something larger than the individual self. It encompasses empathy, intimacy, cooperation, and the capacity to surrender individual interest for the sake of the whole. Communion without agency is enmeshment; communion with agency is authentic relationship.",
    complementary_opposite: "agency",
    pathological_expression:
      "Enmeshment, codependency, loss of self in the other, the inability to set boundaries, conformity masquerading as love, and the suppression of individuality in service of group harmony. At its extreme, pathological communion is the complete dissolution of the ego boundary and the inability to function as an autonomous agent.",
  },
  eros: {
    label: "Eros",
    description:
      "The fundamental drive toward growth, creativity, attraction, and the movement toward greater complexity, beauty, and aliveness. Eros is the life force — the impulse that draws organisms toward their next stage of development. It encompasses desire, passion, creative inspiration, sexual energy, and the magnetic pull toward what is not yet but could be. Eros is the evolutionary impulse in the universe, the force that drives the entire arc of development from matter to life to mind to spirit.",
    complementary_opposite: "agape",
    pathological_expression:
      "Unbridled desire that consumes its object, addiction disguised as passion, the inability to be satisfied, creative mania, and the shadow of eros as the endless pursuit of novelty at the expense of depth. At its extreme, pathological eros is the destruction of all stable structures in the name of endless becoming.",
  },
  agape: {
    label: "Agape",
    description:
      "The fundamental drive toward preservation, care, acceptance, and the unconditional holding of what is. Agape is the receptive force — the impulse to embrace, nurture, and sustain. It encompasses compassion, forgiveness, patience, and the capacity to love without condition or expectation. Agape is the gravitational force that holds the universe together, the mother principle that receives all beings without judgment. Where eros pushes toward the future, agape receives the present.",
    complementary_opposite: "eros",
    pathological_expression:
      "Smothering care that prevents growth, the refusal to challenge or confront, enabling dysfunction in the name of acceptance, the shadow of unconditional love that has no boundaries or standards. At its extreme, pathological agape is the inability to discern between what should be nurtured and what should be allowed to die, resulting in the perpetuation of suffering in the name of compassion.",
  },
};

// ─── Quadrants ───────────────────────────────────────────────────────────────

export const QUADRANTS: Record<
  Quadrant,
  { label: string; full_label: string; epistemology: string; description: string }
> = {
  intentional: {
    label: "Intentional",
    full_label: "Intentional / Subjective (Upper-Left)",
    epistemology: "First-person phenomenological inquiry — introspection, meditation, self-observation, and the direct examination of subjective experience.",
    description:
      "The quadrant of interior individual experience — thoughts, feelings, intentions, values, self-identity, states of consciousness, and the entire domain of 'what it feels like from the inside.' This is the territory of psychology, phenomenology, contemplative practice, and any discipline that takes first-person experience as its primary data. The intentional quadrant asks: What is happening in my inner world right now?",
  },
  behavioral: {
    label: "Behavioral",
    full_label: "Behavioral / Objective (Upper-Right)",
    epistemology: "Third-person empirical observation — measurement, experimentation, neuroscience, and the objective study of observable behavior and physical processes.",
    description:
      "The quadrant of exterior individual reality — brain states, neurochemistry, observable behavior, physical health, performance metrics, and all phenomena that can be measured, quantified, and studied from the outside. This is the territory of biology, neuroscience, behaviorism, and any discipline that takes third-person data as its primary evidence. The behavioral quadrant asks: What can be objectively measured about this organism?",
  },
  cultural: {
    label: "Cultural",
    full_label: "Cultural / Inter-subjective (Lower-Left)",
    epistemology: "Second-person hermeneutic inquiry — dialogue, shared meaning-making, cultural interpretation, and the exploration of collective worldviews.",
    description:
      "The quadrant of interior collective reality — shared values, cultural narratives, collective meaning-making, worldviews, intersubjective agreements, and the entire domain of 'how we see things together.' This is the territory of cultural anthropology, hermeneutics, dialogue practice, and any discipline that studies how groups construct shared reality. The cultural quadrant asks: What meanings do we co-create as a group?",
  },
  social: {
    label: "Social",
    full_label: "Social / Inter-objective (Lower-Right)",
    epistemology: "Third-person systems analysis — structural analysis, institutional design, network theory, and the study of objective social systems.",
    description:
      "The quadrant of exterior collective reality — social systems, institutions, economic structures, legal frameworks, technological infrastructure, and all phenomena that exist as objective, measurable collective arrangements. This is the territory of sociology, economics, political science, systems theory, and any discipline that studies the structural architecture of collective life. The social quadrant asks: What systems and structures shape our collective behavior?",
  },
};

// ─── Shadow Frameworks ───────────────────────────────────────────────────────

export const SHADOW_FRAMEWORKS: Record<
  ShadowFramework,
  { label: string; key_concepts: string[] }
> = {
  freudian: {
    label: "Freudian",
    key_concepts: [
      "The unconscious as repository of repressed drives and forbidden desires",
      "Id, ego, and superego as the tripartite structure of personality",
      "Repression as the primary defense mechanism that creates the shadow",
      "The return of the repressed — how unconscious material resurfaces through symptoms, slips, and dreams",
      "Transference as the projection of unresolved unconscious conflicts onto present relationships",
      "Psychoanalysis as the method of making the unconscious conscious through free association and interpretation",
    ],
  },
  jungian: {
    label: "Jungian",
    key_concepts: [
      "The shadow as the repressed, disowned, and unrecognized aspects of the personality",
      "The personal unconscious versus the collective unconscious as distinct layers of psychic depth",
      "Archetypes as universal patterns of psychic organization that structure human experience",
      "Projection as the primary mechanism by which the shadow operates — seeing in others what we cannot see in ourselves",
      "Individuation as the lifelong process of integrating the shadow and becoming whole",
      "Active imagination as the method of engaging directly with unconscious contents",
      "The persona as the social mask that conceals the shadow from public view",
    ],
  },
  gestalt: {
    label: "Gestalt",
    key_concepts: [
      "Awareness as the primary curative factor — what is fully experienced in the present moment integrates naturally",
      "Unfinished business as unexpressed emotions and unresolved situations that persist in the background of awareness",
      "The top dog / underdog split as the internal dialogue between the critical and the resistant aspects of self",
      "Contact boundaries as the interface between self and environment where growth occurs",
      "The empty chair technique as the method of externalizing and integrating disowned parts",
      "Here-and-now experiencing as the ground of all therapeutic work",
      "Resistance as creative adjustment that has become rigid and fixed",
    ],
  },
  integral: {
    label: "Integral",
    key_concepts: [
      "The shadow as any aspect of reality that the current structure of consciousness cannot recognize or integrate",
      "Vertical shadow — the disowned potentials of higher developmental stages that are not yet available",
      "Horizontal shadow — the disowned aspects of the current developmental stage that have been repressed or denied",
      "Quadrantal shadow — the blind spots that exist in each of the four quadrants and their interactions",
      "Shadow work as the practice of making the unconscious conscious across all lines, levels, states, and types",
      "3-2-1 Process as the integral method of shadow integration — facing it (3rd person), talking to it (2nd person), and being it (1st person)",
      "The recognition that shadow is not just personal but collective, cultural, and systemic",
    ],
  },
};

// ─── Unity Subsystems ────────────────────────────────────────────────────────

export const UNITY_SUBSYSTEMS: Record<
  UnitySubsystem,
  { label: string; full_name: string; description: string; output_focus: string }
> = {
  lodS: {
    label: "lodS",
    full_name: "Levels of Development Subsystem",
    description:
      "The subsystem that maps and evaluates the developmental altitude of any phenomenon — individual, team, organization, or culture — across the eight-stage spectrum from archaic to super-integral. It assesses the complexity of thinking, the range of perspective-taking, and the depth of meaning-making available within the system being analyzed.",
    output_focus:
      "Developmental stage identification with nuanced descriptions that honor the partial truth of each level while illuminating the next available stage of growth.",
  },
  lidS: {
    label: "lidS",
    full_name: "Lines of Development Subsystem",
    description:
      "The subsystem that recognizes the multiple, relatively independent lines of human development — cognitive, emotional, moral, spiritual, kinesthetic, intrapersonal, and willpower — and evaluates the unique profile of strengths and vulnerabilities across these lines. It prevents the reduction of a person to a single developmental score and honors the asymmetric nature of human growth.",
    output_focus:
      "Multi-dimensional developmental profiles that reveal patterns of uneven development, enabling targeted interventions that address specific line deficiencies while leveraging line strengths.",
  },
  soCS: {
    label: "soCS",
    full_name: "States of Consciousness Subsystem",
    description:
      "The subsystem that maps the range of conscious states available to an individual or group — from ordinary gross waking awareness through subtle dreamlike and meditative states to the formless causal ground, the meta-aware witness, and the non-dual recognition. It recognizes that states are temporary experiences that can be accessed at any developmental level, and that state cultivation is complementary to stage development.",
    output_focus:
      "State access mapping that identifies which states of consciousness are available, how frequently they are accessed, and how state experiences can be integrated into developmental practice.",
  },
  driS: {
    label: "driS",
    full_name: "Drives Subsystem",
    description:
      "The subsystem that analyzes the four core drives — agency, communion, eros, and agape — and evaluates their balance, expression, and pathological distortions within a system. It recognizes that health is not the maximization of any single drive but the dynamic interplay of all four, and that pathology emerges when any drive is chronically overemphasized or suppressed.",
    output_focus:
      "Drive balance analysis that identifies overemphasized and underemphasized drives, maps their pathological expressions, and recommends practices for restoring dynamic equilibrium.",
  },
  quaS: {
    label: "quaS",
    full_name: "Quadrants Subsystem",
    description:
      "The subsystem that ensures comprehensive analysis across all four quadrants of reality — intentional (interior individual), behavioral (exterior individual), cultural (interior collective), and social (exterior collective). It prevents the reductionism of any single-quadrant approach and ensures that interventions address the full spectrum of causes and conditions.",
    output_focus:
      "Quadrantal analysis that maps phenomena across all four dimensions of reality, revealing blind spots where important factors are being ignored and ensuring that recommendations are multi-dimensional.",
  },
  shWS: {
    label: "shWS",
    full_name: "Shadow Work Subsystem",
    description:
      "The subsystem that applies the insights of Freudian, Jungian, Gestalt, and Integral shadow psychology to identify, analyze, and recommend interventions for shadow material — the disowned, repressed, and unrecognized aspects of individual and collective experience. It recognizes that shadow work is essential for authentic development and that unexamined shadow material will sabotage any growth-oriented effort.",
    output_focus:
      "Shadow identification and integration recommendations that name the specific shadow dynamics at play, trace their developmental origins, and provide concrete practices for shadow retrieval and integration.",
  },
};

// ─── Polarity Map Rows ───────────────────────────────────────────────────────

export const POLARITY_MAP_ROWS: {
  section: string;
  label_a: string;
  label_b: string;
}[] = [
  {
    section: "Rewards of Focus",
    label_a: "Upside of Emphasizing A",
    label_b: "Upside of Emphasizing B",
  },
  {
    section: "Overemphasis Feedback",
    label_a: "Early Warning: Overdoing A",
    label_b: "Early Warning: Overdoing B",
  },
  {
    section: "Neglect Risks",
    label_a: "Risks of Underfocusing A",
    label_b: "Risks of Underfocusing B",
  },
  {
    section: "Circular Causal Loops",
    label_a: "How A Fuels B",
    label_b: "How B Fuels A",
  },
  {
    section: "Balkanization Risks",
    label_a: "A-Only Fragmentation",
    label_b: "B-Only Fragmentation",
  },
  {
    section: "Extremity Feedback",
    label_a: "Signs A Has Become Extreme",
    label_b: "Signs B Has Become Extreme",
  },
  {
    section: "Transcendence Rewards",
    label_a: "Benefits When A Is Well-Integrated",
    label_b: "Benefits When B Is Well-Integrated",
  },
  {
    section: "Reflection Loops",
    label_a: "A Reflecting on Itself",
    label_b: "B Reflecting on Itself",
  },
  {
    section: "Meta-Reflection Process",
    label_a: "Meta-Perspective on the Polarity",
    label_b: "System-Level Integration Insight",
  },
];

// ─── Integration Spectrum Rows ───────────────────────────────────────────────

export const INTEGRATION_SPECTRUM_ROWS: string[] = [
  "Harmonious Integration",
  "Pathological Disintegration",
  "Balance",
  "Dynamic Interplay",
  "Fluid Transition",
  "Interdependence",
  "Hidden Synergy",
  "Emergent Properties",
  "Generative Outcome",
  "Emergence from Combinations",
  "Transcendence",
  "Unconscious Attachment",
  "Impact on Neutrality",
  "Developmental Tools",
  "Step-by-step Transcendence",
  "Signs of Transcendence",
];

// ─── Integration Spectrum Levels ─────────────────────────────────────────────

export const INTEGRATION_SPECTRUM_LEVELS: string[] = [
  "1 — Nascent",
  "2 — Developing",
  "3 — Mature",
  "4 — Transcendent",
];

// ─── Character Limit ─────────────────────────────────────────────────────────

export const CHARACTER_LIMIT = 25000;

// ─── Systems Archetypes (Senge) ──────────────────────────────────────────────

export const SYSTEMS_ARCHETYPES: Record<
  SystemsArchetype,
  {
    name: string;
    structure: string;
    description: string;
    early_warning: string;
    intervention_strategy: string;
  }
> = {
  "fixes-that-fail": {
    name: "Fixes That Fail",
    structure: "B-R-B",
    description:
      "A quick fix is applied to a problem. The fix has immediate positive results but produces unintended consequences that worsen the original problem over time, creating pressure for more of the same fix.",
    early_warning:
      "The same problem keeps recurring despite repeated applications of the 'solution.' The fix feels good initially but the underlying issue grows worse.",
    intervention_strategy:
      "Focus on fundamental solutions rather than symptomatic fixes. Acknowledge the delay in fundamental solutions and plan for the gap.",
  },
  "shifting-the-burden": {
    name: "Shifting the Burden",
    structure: "B-B-R",
    description:
      "A problem is addressed by shifting the burden of resolution to an external intervenor or symptomatic solution. This erodes the system's own capacity to solve the problem, creating increasing dependency.",
    early_warning:
      "Capability atrophy in the core system. The more help is given, the less the system can help itself. Side effects from the symptomatic solution compound the original problem.",
    intervention_strategy:
      "Use symptomatic solutions only as temporary bridges while building fundamental capacity. Focus on strengthening the system's own problem-solving abilities.",
  },
  "tragedy-of-the-commons": {
    name: "Tragedy of the Commons",
    structure: "R-R-B",
    description:
      "Individuals acting independently and rationally according to their own self-interest deplete a shared resource, even when it is clear that this is contrary to the group's long-term best interests.",
    early_warning:
      "The shared resource shows signs of degradation. Individual users increase their consumption rate as the resource becomes scarcer, accelerating depletion.",
    intervention_strategy:
      "Establish governance structures that align individual incentives with collective sustainability. Use regulation, social norms, or privatization appropriately.",
  },
  "drift-to-low-performance": {
    name: "Drift to Low Performance",
    structure: "B-B",
    description:
      "A gap between desired and actual performance leads to corrective action, but the desired standard gradually lowers based on perceived reality, creating a slow drift toward mediocrity.",
    early_warning:
      "Performance standards are being revised downward. 'This is just how things are around here' becomes a common explanation. Past achievements are dismissed as exceptional circumstances.",
    intervention_strategy:
      "Anchor performance standards to external benchmarks or absolute criteria, not to past performance. Maintain an independent assessment of what 'good' looks like.",
  },
  escalation: {
    name: "Escalation",
    structure: "R-R",
    description:
      "Two parties compete by taking actions that each perceives as defensive but the other perceives as threatening, creating a reinforcing cycle of increasingly aggressive actions.",
    early_warning:
      "Each party describes their actions as 'defensive' or 'reactive.' The pace of escalation increases. Neither party can remember who started it.",
    intervention_strategy:
      "One party must unilaterally de-escalate or negotiate mutual de-escalation agreements. Establish communication channels that separate perception from intent.",
  },
  "success-to-the-successful": {
    name: "Success to the Successful",
    structure: "R-R",
    description:
      "Two activities compete for limited resources. The more successful one receives more resources, making it even more successful, while the less successful one starves — regardless of its potential.",
    early_warning:
      "Resource allocation decisions are based primarily on past performance rather than future potential. Promising alternatives never get a fair trial.",
    intervention_strategy:
      "Maintain a portfolio approach with protected resources for emerging options. Use separate evaluation criteria for mature vs. emerging activities.",
  },
  "limits-to-growth": {
    name: "Limits to Growth",
    structure: "R-B",
    description:
      "A process generates accelerating growth, but eventually encounters a limiting condition that slows growth. The harder you push growth, the stronger the resistance becomes.",
    early_warning:
      "Growth rate is declining despite continued effort. The limiting factor shifts from one constraint to another as each is addressed.",
    intervention_strategy:
      "Identify and address the limiting factor rather than pushing harder on the growth engine. Growth will resume naturally once the constraint is removed.",
  },
  "growth-and-underinvestment": {
    name: "Growth and Underinvestment",
    structure: "R-B-B",
    description:
      "Growth approaches a limit due to inadequate investment in capacity. The slowdown is interpreted as lack of demand, further reducing investment and creating a self-fulfilling prophecy.",
    early_warning:
      "Capacity constraints are dismissed as temporary. Investment in infrastructure lags behind growth projections. Market share is attributed to 'market conditions' rather than capacity limits.",
    intervention_strategy:
      "Invest in capacity ahead of demand, not in response to it. Distinguish between demand limits and capacity limits through deliberate testing.",
  },
  "accidental-adversaries": {
    name: "Accidental Adversaries",
    structure: "R-R-B",
    description:
      "Two parties who benefit from cooperation accidentally become adversaries when one party's actions to improve its own position inadvertently threaten the other, triggering a defensive response.",
    early_warning:
      "Partners begin to characterize each other's independent actions as 'threats.' Communication decreases while monitoring increases. Past successes are discounted.",
    intervention_strategy:
      "Re-establish the shared goal that originally brought the parties together. Create structures for transparent communication about independent actions.",
  },
  attractiveness: {
    name: "Attractiveness Principle",
    structure: "R-R-B",
    description:
      "Multiple reinforcing growth processes compete for limited resources. Growth in each process is limited not by its own dynamics but by the attractiveness of alternatives that draw resources away.",
    early_warning:
      "Multiple growth initiatives stall simultaneously. Resources are spread thin across many options. No single initiative reaches critical mass.",
    intervention_strategy:
      "Consciously limit the number of simultaneous growth initiatives. Ensure each has dedicated resources sufficient to reach critical mass before adding new ones.",
  },
};

// ─── Meadows' 12 Leverage Points ─────────────────────────────────────────────

export const LEVERAGE_POINTS: Record<
  LeveragePointCategory,
  {
    rank: number;
    name: string;
    description: string;
    example: string;
    actionability: "high" | "medium" | "low";
  }
> = {
  parameters: {
    rank: 12,
    name: "Constants, Parameters, Numbers",
    description:
      "Subsidies, taxes, standards — the lowest leverage intervention. Changing numbers rarely changes system behavior unless they alter feedback loops or information flows.",
    example: "Adjusting interest rates by 0.25%, changing a subsidy amount.",
    actionability: "high",
  },
  buffers: {
    rank: 11,
    name: "Sizes of Buffers and Stabilizing Stocks",
    description:
      "Increasing buffer sizes can stabilize a system but only to the extent that buffers are larger than typical fluctuations. Beyond a certain point, bigger buffers add rigidity.",
    example: "Increasing inventory levels, building larger reservoirs.",
    actionability: "high",
  },
  "stock-and-flow": {
    rank: 10,
    name: "Structure of Material Stocks and Flows",
    description:
      "The physical architecture of a system — its nodes and connections. Changing structure can be powerful but is often slow and expensive.",
    example: "Building new roads, restructuring an organization chart.",
    actionability: "medium",
  },
  delays: {
    rank: 9,
    name: "Length of Delays Relative to Rate of System Change",
    description:
      "Systems with long delays relative to their rate of change oscillate. Shortening delays can dramatically improve system behavior, but only if the feedback is accurate.",
    example: "Real-time dashboards vs. quarterly reports, rapid prototyping vs. annual planning.",
    actionability: "medium",
  },
  "negative-feedback": {
    rank: 8,
    name: "Strength of Negative Feedback Loops",
    description:
      "Balancing loops that keep system states within bounds. Strengthening these loops enhances self-correction and resilience.",
    example: "Thermostat systems, quality control processes, anti-trust laws.",
    actionability: "medium",
  },
  "positive-feedback": {
    rank: 7,
    name: "Gain Around Positive Feedback Loops",
    description:
      "Reinforcing loops that drive growth, explosion, or collapse. Reducing the gain around reinforcing loops is more powerful than strengthening balancing loops.",
    example: "Compound interest caps, epidemic containment, viral content moderation.",
    actionability: "medium",
  },
  "information-flows": {
    rank: 6,
    name: "Structure of Information Flows",
    description:
      "Who does and does not have access to information. Adding missing feedback loops is one of the most powerful and cheapest interventions possible.",
    example: "Publishing pollution data, transparent salary information, open-source code.",
    actionability: "high",
  },
  rules: {
    rank: 5,
    name: "Rules of the System",
    description:
      "Incentives, punishments, constraints — the formal rules that govern system behavior. Changing rules changes what behaviors are rewarded and punished.",
    example: "Tax code changes, constitutional amendments, platform algorithm changes.",
    actionability: "medium",
  },
  "self-organization": {
    rank: 4,
    name: "Power to Add, Change, or Self-Organize System Structure",
    description:
      "The capacity of a system to evolve itself — to create new structures, learn, and diversify. This is the essence of biological and cultural evolution.",
    example: "Open innovation platforms, democratic constitutions with amendment processes, biological mutation.",
    actionability: "low",
  },
  goals: {
    rank: 3,
    name: "Goals of the System",
    description:
      "The purpose or function that defines what the system is trying to achieve. Changing goals changes everything — every parameter, loop, and rule serves the goal.",
    example: "Shifting from GDP growth to well-being metrics, from profit maximization to stakeholder value.",
    actionability: "low",
  },
  paradigm: {
    rank: 2,
    name: "Mindset or Paradigm Out of Which the System Arises",
    description:
      "The shared ideas and assumptions that underlie the system's goals, rules, and structure. Paradigms are the source code of systems.",
    example: "Shift from Newtonian to quantum physics, from mechanistic to ecological worldview.",
    actionability: "low",
  },
  "transcend-paradigm": {
    rank: 1,
    name: "Power to Transcend Paradigms",
    description:
      "The ability to recognize that no paradigm is 'true,' to hold multiple worldviews lightly, and to choose among them consciously. This is the highest leverage point — flexibility itself.",
    example: "Recognizing both market-based and commons-based approaches have validity depending on context.",
    actionability: "low",
  },
};

// ─── Cognitive Biases (Decision Lab) ─────────────────────────────────────────

export const COGNITIVE_BIASES: Record<
  CognitiveBias,
  {
    name: string;
    description: string;
    detection_question: string;
    mitigation_strategy: string;
  }
> = {
  "confirmation-bias": {
    name: "Confirmation Bias",
    description: "Seeking, interpreting, and remembering information that confirms pre-existing beliefs while ignoring contradictory evidence.",
    detection_question: "Am I giving equal weight to evidence that contradicts my position?",
    mitigation_strategy: "Actively seek disconfirming evidence. Use the 'consider the opposite' technique before finalizing conclusions.",
  },
  anchoring: {
    name: "Anchoring Bias",
    description: "Over-relying on the first piece of information encountered when making decisions, using it as a reference point for all subsequent judgments.",
    detection_question: "If I had seen different information first, would my judgment change?",
    mitigation_strategy: "Generate your own estimate before seeing any anchor. Consider multiple reference points before deciding.",
  },
  "availability-heuristic": {
    name: "Availability Heuristic",
    description: "Judging the likelihood of events based on how easily examples come to mind, rather than on actual statistical frequency.",
    detection_question: "Am I overestimating this risk because I recently saw a vivid example of it?",
    mitigation_strategy: "Look up base rates and statistical data. Consider how memorable (not how likely) the examples you recall are.",
  },
  "survivorship-bias": {
    name: "Survivorship Bias",
    description: "Focusing on entities that passed a selection process while overlooking those that did not, leading to overly optimistic conclusions.",
    detection_question: "Am I only looking at the winners and ignoring the failures?",
    mitigation_strategy: "Explicitly identify the population of non-survivors. Ask what failures might tell you that successes cannot.",
  },
  "sunk-cost-fallacy": {
    name: "Sunk Cost Fallacy",
    description: "Continuing a behavior or endeavor because of previously invested resources, even when abandoning it would be more rational.",
    detection_question: "If I were starting fresh today with no prior investment, would I make this same choice?",
    mitigation_strategy: "Evaluate decisions based on future costs and benefits only. Treat past investments as irretrievable.",
  },
  "dunning-kruger": {
    name: "Dunning-Kruger Effect",
    description: "People with limited knowledge or ability in a domain overestimate their competence, while experts tend to underestimate theirs.",
    detection_question: "Do I have enough expertise in this domain to accurately assess my own understanding of it?",
    mitigation_strategy: "Seek external calibration from recognized experts. Test your knowledge against objective benchmarks.",
  },
  "planning-fallacy": {
    name: "Planning Fallacy",
    description: "Underestimating the time, costs, and risks of future actions while overestimating the benefits, even when past experience suggests otherwise.",
    detection_question: "How long did similar projects actually take, not how long do I think this one will take?",
    mitigation_strategy: "Use reference class forecasting — base estimates on actual outcomes of similar projects, not on optimistic scenarios.",
  },
  "status-quo-bias": {
    name: "Status Quo Bias",
    description: "Preference for the current state of affairs, treating any change from the baseline as a loss, even when change would be beneficial.",
    detection_question: "Am I preferring the current situation because it's genuinely better, or simply because it's familiar?",
    mitigation_strategy: "Frame the decision as choosing between options, not as maintaining vs. changing the status quo.",
  },
  "framing-effect": {
    name: "Framing Effect",
    description: "Drawing different conclusions from the same information depending on how it is presented (e.g., as gains vs. losses).",
    detection_question: "Would I make the same decision if this information were framed differently?",
    mitigation_strategy: "Reframe the problem in multiple ways. Present the same data with opposite frames and check for consistency.",
  },
  "hindsight-bias": {
    name: "Hindsight Bias",
    description: "Seeing past events as having been predictable and inevitable after they have already occurred, distorting learning from experience.",
    detection_question: "Am I judging this decision based on what was knowable at the time, or on what I know now?",
    mitigation_strategy: "Reconstruct the decision context as it existed at the time. Document predictions before outcomes are known.",
  },
  "optimism-bias": {
    name: "Optimism Bias",
    description: "Systematically overestimating the likelihood of positive outcomes and underestimating the likelihood of negative ones.",
    detection_question: "Am I assuming things will go better than they typically do for others in similar situations?",
    mitigation_strategy: "Run a pre-mortem: imagine the project failed and work backward to identify why. Use base rates from similar endeavors.",
  },
  "loss-aversion": {
    name: "Loss Aversion",
    description: "The tendency to prefer avoiding losses over acquiring equivalent gains — losses feel roughly twice as painful as gains feel good.",
    detection_question: "Am I overweighting potential losses relative to equivalent potential gains?",
    mitigation_strategy: "Reframe losses as opportunity costs. Consider the cost of inaction as actively choosing to lose the potential gain.",
  },
  "fundamental-attribution-error": {
    name: "Fundamental Attribution Error",
    description: "Over-emphasizing personality-based explanations for others' behaviors while under-emphasizing situational explanations.",
    detection_question: "Am I attributing this person's behavior to their character when situational factors might explain it?",
    mitigation_strategy: "Actively generate situational explanations. Ask: 'What circumstances would lead me to behave the same way?'",
  },
  groupthink: {
    name: "Groupthink",
    description: "The practice of thinking or making decisions as a group in a way that discourages creativity or individual responsibility to maintain harmony.",
    detection_question: "Are dissenting opinions being suppressed or self-censored in this group?",
    mitigation_strategy: "Assign a devil's advocate role. Use anonymous input methods. Bring in outside perspectives.",
  },
  "bandwagon-effect": {
    name: "Bandwagon Effect",
    description: "Adopting beliefs or behaviors because many others have already done so, regardless of evidence or personal judgment.",
    detection_question: "If nobody else believed this, would I still hold this position based on the evidence?",
    mitigation_strategy: "Evaluate the evidence independently of its popularity. Seek out why early adopters believed, not just that many believe.",
  },
  "false-consensus": {
    name: "False Consensus Effect",
    description: "Overestimating the extent to which others share our beliefs, attitudes, and behaviors.",
    detection_question: "Am I assuming most people agree with me without actually checking?",
    mitigation_strategy: "Seek actual data on others' views. Actively look for disagreement rather than assuming agreement.",
  },
  "recency-effect": {
    name: "Recency Effect",
    description: "Giving disproportionate weight to the most recent information when making decisions, overshadowing earlier but equally relevant data.",
    detection_question: "Am I overweighting this information simply because it's the most recent thing I learned?",
    mitigation_strategy: "Create a systematic review of all relevant information in chronological order. Weight by quality, not recency.",
  },
  "authority-bias": {
    name: "Authority Bias",
    description: "Attributing greater accuracy and weight to the opinions of authority figures, regardless of the actual content of the message.",
    detection_question: "Would I find this argument equally convincing if it came from someone without authority?",
    mitigation_strategy: "Evaluate arguments on their merits, not their source. Anonymize inputs during evaluation when possible.",
  },
  "illusion-of-validity": {
    name: "Illusion of Validity",
    description: "Overestimating one's ability to interpret data and make accurate predictions when the data actually has limited predictive power.",
    detection_question: "Does this data actually predict outcomes, or does it just feel predictive?",
    mitigation_strategy: "Test your predictions against actual outcomes. Track your accuracy rate. Use algorithms over intuition when data is weak.",
  },
  "narrative-fallacy": {
    name: "Narrative Fallacy",
    description: "Creating compelling stories to explain events after they occur, making random or complex outcomes appear predictable and logical.",
    detection_question: "Is this explanation a genuine causal account or just a satisfying story?",
    mitigation_strategy: "Look for disconfirming evidence that doesn't fit the narrative. Consider multiple competing explanations.",
  },
};

// ─── Vision-Logic Substages (Richards & Commons) ─────────────────────────────

export const VISION_LOGIC_SUBSTAGES: Record<
  VisionLogicSubstage,
  {
    label: string;
    description: string;
    cognitive_capacity: string;
    typical_output: string;
  }
> = {
  systematic: {
    label: "Systematic",
    description:
      "The ability to construct and operate within a single closed system of relationships. The thinker can coordinate multiple variables within one coherent framework, but cannot yet compare multiple systems.",
    cognitive_capacity:
      "Can hold a complete system in mind — all variables, relationships, and feedback loops within one domain. Cannot yet step outside the system to compare it with alternatives.",
    typical_output:
      "A complete causal loop diagram of one system. A comprehensive SWOT analysis. A fully specified model within a single paradigm.",
  },
  metasystematic: {
    label: "Metasystematic",
    description:
      "The ability to compare, contrast, and coordinate multiple systematic frameworks. The thinker can identify structural similarities and differences between systems and construct meta-level frameworks that encompass both.",
    cognitive_capacity:
      "Can hold multiple complete systems in mind simultaneously, compare their structures, identify which is more adequate for a given purpose, and construct frameworks that integrate them.",
    typical_output:
      "A comparison of three analytical frameworks showing where each excels and fails. A synthesis of AQAL + Cynefin + Systems Thinking into a unified meta-framework.",
  },
  paradigmatic: {
    label: "Paradigmatic",
    description:
      "The ability to identify, construct, and operate within overarching paradigms that organize multiple metasystems. The thinker recognizes that paradigms themselves are constructed and can be evaluated.",
    cognitive_capacity:
      "Can identify the underlying assumptions that generate entire families of metasystems. Can construct new paradigms and recognize when existing paradigms have reached their limits.",
    typical_output:
      "Identification of the paradigm-level assumptions underlying Western rationality vs. Indigenous knowledge systems. A new paradigm that reorganizes how we understand the relationship between individual and collective development.",
  },
  "cross-paradigmatic": {
    label: "Cross-Paradigmatic",
    description:
      "The ability to fluidly move between paradigms, recognizing that each paradigm reveals aspects of reality that others obscure. The thinker can synthesize across paradigms without collapsing their differences.",
    cognitive_capacity:
      "Can inhabit multiple paradigms simultaneously, translate between them, and recognize that reality exceeds any single paradigm's capacity to describe it. Operates at the boundary of what can be conceptualized.",
    typical_output:
      "A framework that honors the irreducible validity of scientific, contemplative, artistic, and Indigenous ways of knowing while showing how they complement each other in addressing specific domains of inquiry.",
  },
};

// ─── Cynefin Domain Response Patterns ────────────────────────────────────────

export const CYNEFIN_RESPONSES: Record<
  CynefinDomain,
  {
    domain: string;
    description: string;
    approach: string;
    action_pattern: string;
    leadership_stance: string;
    best_tool_match: string[];
    warning_if_misclassified: string;
  }
> = {
  clear: {
    domain: "Clear (Simple)",
    description:
      "Stable conditions with clear cause-and-effect relationships that are easily discernible by everyone. The right answer is obvious and best practices exist.",
    approach: "Sense — Categorize — Respond",
    action_pattern: "Triaging: assess the situation, categorize it into known patterns, apply the appropriate best practice.",
    leadership_stance: "Direct and directive. Communicate clear procedures. Ensure best practices are documented and followed.",
    best_tool_match: ["think_sequential", "think_first_principles"],
    warning_if_misclassified:
      "Treating a clear situation as complex leads to analysis paralysis. Don't over-think simple problems — apply the known solution.",
  },
  complicated: {
    domain: "Complicated",
    description:
      "Multiple right answers exist. Cause and effect require analysis or expertise to discern. Experts are needed to evaluate options and recommend solutions.",
    approach: "Sense — Analyze — Respond",
    action_pattern: "Bring in expertise, analyze the options, evaluate trade-offs, choose the best fit for context.",
    leadership_stance: "Listen to experts. Facilitate analysis. Ensure diverse expert opinions are heard and weighed.",
    best_tool_match: ["think_sequential", "think_aqal_situational", "think_causal"],
    warning_if_misclassified:
      "Treating a complicated situation as clear leads to applying oversimplified best practices where expert analysis is needed. Don't skip the analysis phase.",
  },
  complex: {
    domain: "Complex",
    description:
      "Cause and effect can only be understood in retrospect. Right answers emerge through experimentation and pattern emergence. Novel practices are required.",
    approach: "Probe — Sense — Respond",
    action_pattern: "Run safe-to-fail experiments, observe patterns that emerge, amplify desirable patterns and dampen undesirable ones.",
    leadership_stance: "Create conditions for emergence. Set boundaries, not prescriptions. Encourage experimentation and learning.",
    best_tool_match: ["think_cynefin", "think_scenario", "think_causal", "think_shadow"],
    warning_if_misclassified:
      "Treating a complex situation as complicated leads to analysis without action. Expert opinion is insufficient — you must probe the system directly.",
  },
  chaotic: {
    domain: "Chaotic",
    description:
      "No discernible cause-and-effect relationships. The situation is turbulent and demands immediate action. Novel practices may emerge from crisis response.",
    approach: "Act — Sense — Respond",
    action_pattern: "Take immediate action to establish order, sense where stability emerges, respond to transform chaos into complexity.",
    leadership_stance: "Command and control. Act decisively. Communicate directly. The goal is to stop the bleeding, not to understand the wound.",
    best_tool_match: ["think_sequential"],
    warning_if_misclassified:
      "Treating a chaotic situation as anything else is dangerous. Analysis, experimentation, and best practices are all too slow. Act first, understand later.",
  },
  disorder: {
    domain: "Disorder (Not Yet Classified)",
    description:
      "It is not yet clear which of the other four domains applies. Multiple perspectives compete. The situation is ambiguous and may contain elements of several domains.",
    approach: "Decompose — Classify — Route",
    action_pattern: "Break the situation into component parts, classify each into a Cynefin domain, apply the appropriate response pattern for each part.",
    leadership_stance: "Gather information rapidly. Bring in diverse perspectives to break the ambiguity. Avoid premature classification.",
    best_tool_match: ["think_cynefin", "think_aqal_situational", "think_metacognitive"],
    warning_if_misclassified:
      "Remaining in disorder is the most dangerous position — decisions will be made by your default preferences, not by the situation's actual nature. Classify urgently.",
  },
};

// ─── Ladder of Inference Steps ───────────────────────────────────────────────

export const LADDER_OF_INFERENCE_STEPS: Record<
  LadderOfInferenceStep,
  {
    label: string;
    description: string;
    common_errors: string[];
    descent_question: string;
  }
> = {
  "observable-data": {
    label: "Observable Data & Experiences",
    description: "The pool of all available information — everything that could potentially be observed.",
    common_errors: ["Assuming you have all the relevant data", "Confusing data with interpretation of data"],
    descent_question: "What observable, verifiable data do I actually have?",
  },
  "selected-data": {
    label: "Selected Data",
    description: "The subset of data we choose to pay attention to, filtered through our beliefs and prior experiences.",
    common_errors: ["Confirmation bias in data selection", "Missing critical data due to cultural or personal blind spots"],
    descent_question: "What data am I NOT selecting? What would someone from a different background notice that I'm missing?",
  },
  "interpreted-meaning": {
    label: "Added Meanings",
    description: "The meanings, interpretations, and cultural assumptions we attach to the selected data.",
    common_errors: ["Projecting cultural assumptions onto neutral data", "Treating interpretations as facts"],
    descent_question: "What other meanings could this data have? How might someone from a different culture interpret this?",
  },
  assumptions: {
    label: "Assumptions",
    description: "The assumptions we make based on our interpretations — the stories we tell ourselves about what the data means.",
    common_errors: ["Treating assumptions as certainties", "Building chains of assumptions without testing"],
    descent_question: "What am I assuming here? Is this assumption tested or merely convenient?",
  },
  conclusions: {
    label: "Conclusions",
    description: "The conclusions we draw from our assumptions — the judgments we form about the situation.",
    common_errors: ["Drawing conclusions from insufficient evidence", "Conflating correlation with causation"],
    descent_question: "Do my conclusions follow logically from my tested assumptions? What would change my conclusion?",
  },
  beliefs: {
    label: "Beliefs Adopted",
    description: "The beliefs we adopt based on our conclusions — these become part of our worldview and influence future data selection.",
    common_errors: ["Treating beliefs as immutable truths", "Not recognizing how beliefs filter future perception"],
    descent_question: "How are my existing beliefs shaping what I see? What beliefs might I be protecting rather than testing?",
  },
  actions: {
    label: "Actions Taken",
    description: "The actions we take based on our beliefs — these actions change the situation and generate new data.",
    common_errors: ["Acting without examining the reasoning chain", "Creating self-fulfilling prophecies"],
    descent_question: "What action am I about to take? What would happen if I descended the ladder first?",
  },
};

// ─── Shadow Patterns ─────────────────────────────────────────────────────────

export const SHADOW_PATTERNS: Record<
  ShadowPattern,
  {
    label: string;
    description: string;
    detection_signals: string[];
    integration_approach: string;
  }
> = {
  projection: {
    label: "Projection",
    description: "Attributing one's own disowned qualities, impulses, or desires to another person or group.",
    detection_signals: [
      "Intense emotional reactions to others' behavior that seem disproportionate to the situation",
      "Consistent criticism of a specific trait in others that you refuse to acknowledge in yourself",
      "Idealization of others as possessing exclusively positive qualities you disown in yourself",
    ],
    integration_approach: "Use the 3-2-1 Process: face the projected quality in 3rd person, dialogue with it in 2nd person, then embody it in 1st person.",
  },
  compensation: {
    label: "Compensation",
    description: "Consciously or unconsciously emphasizing the opposite of a disowned tendency to mask its presence.",
    detection_signals: [
      "Exaggerated commitment to a virtue or value that seems disproportionate to the situation",
      "Rigid adherence to a position that excludes any nuance or qualification",
      "Defensive reactions when the opposite tendency is mentioned even in abstract terms",
    ],
    integration_approach: "Identify the compensated tendency and create safe conditions for its healthy expression. The shadow always seeks expression — channel it consciously.",
  },
  inflation: {
    label: "Inflation",
    description: "Identifying with a transpersonal quality or archetype before having the developmental capacity to ground it, leading to grandiosity.",
    detection_signals: [
      "Claims of special insight, mission, or destiny that cannot be verified",
      "Disconnection from feedback and criticism, dismissing them as 'not understanding'",
      "Grandiose language and self-presentation that exceeds the evidence of actual achievement",
    ],
    integration_approach: "Ground the inflated identity in developmental reality. Return to the actual tasks at the current level. Inflation is a defense against the humility required for genuine growth.",
  },
  possession: {
    label: "Possession",
    description: "Being overtaken by a complex or archetype — the shadow speaks and acts through the individual without their awareness.",
    detection_signals: [
      "Episodes of behavior that the individual later cannot fully explain or remember",
      "Sudden shifts in personality, tone, or values triggered by specific contexts",
      "Others report that you 'seemed like a different person' during specific interactions",
    ],
    integration_approach: "Develop meta-awareness through contemplative practice. Create pause points between trigger and response. Work with a therapist to identify and integrate the possessing complex.",
  },
  splitting: {
    label: "Splitting",
    description: "Dividing the world into all-good and all-bad categories, unable to hold the ambivalence that most things contain both positive and negative aspects.",
    detection_signals: [
      "Rapid shifts between idealization and devaluation of the same person or institution",
      "Inability to acknowledge any positive qualities in something you oppose",
      "Black-and-white language: 'always,' 'never,' 'completely,' 'totally'",
    ],
    integration_approach: "Practice dialectical thinking. For every all-good or all-bad judgment, deliberately identify one contradictory quality. Hold the tension of opposites without premature resolution.",
  },
  denial: {
    label: "Denial",
    description: "Refusing to acknowledge the existence of painful or threatening aspects of reality, either internal or external.",
    detection_signals: [
      "Gaps in awareness that others find obvious",
      "Defensive humor or rationalization when specific topics arise",
      "Continuing behavior despite clear evidence of harm",
    ],
    integration_approach: "Create psychological safety for the denied content to emerge. Denial protects against overwhelming anxiety — the anxiety must be managed before the denied content can be faced.",
  },
};

// ─── Jungian Archetypes ──────────────────────────────────────────────────────

export const JUNGIAN_ARCHETYPES: Record<
  JungianArchetype,
  {
    label: string;
    description: string;
    shadow_expression: string;
    integration_signal: string;
  }
> = {
  persona: {
    label: "Persona",
    description: "The social mask — the aspect of personality presented to the world to facilitate social adaptation and protect the inner self.",
    shadow_expression: "Complete identification with the persona — becoming the mask. No sense of authentic self beneath the social role.",
    integration_signal: "Ability to deploy the persona consciously as a tool while maintaining awareness of the deeper self behind it.",
  },
  shadow: {
    label: "Shadow",
    description: "The repository of disowned, repressed, and unrecognized aspects of the personality — everything the conscious ego refuses to acknowledge about itself.",
    shadow_expression: "Unconscious projection onto others, compulsive behavior patterns, and emotional triggers that reveal disowned material.",
    integration_signal: "Recognition and ownership of shadow material. Ability to access shadow energy consciously for creative rather than destructive purposes.",
  },
  anima: {
    label: "Anima",
    description: "The unconscious feminine aspect in the male psyche — encompassing receptivity, intuition, eros, relatedness, and the capacity for inner experience.",
    shadow_expression: "Emotional volatility, moodiness, irrational jealousy, or conversely, complete emotional suppression and hyper-rationality.",
    integration_signal: "Access to feeling, intuition, and relatedness without losing masculine center. Ability to receive and process inner experience.",
  },
  animus: {
    label: "Animus",
    description: "The unconscious masculine aspect in the female psyche — encompassing assertion, logic, initiative, spiritual conviction, and the capacity for directed action.",
    shadow_expression: "Rigid opinions, argumentativeness, cold rationality, or conversely, complete passivity and inability to assert boundaries.",
    integration_signal: "Access to clarity, conviction, and directed action without losing feminine receptivity. Ability to act decisively from inner authority.",
  },
  self: {
    label: "Self",
    description: "The central archetype of order and totality — the regulating center that encompasses both consciousness and the unconscious. The archetype of wholeness.",
    shadow_expression: "Inflation — identification with the Self archetype before the personality is developed enough to carry it. Messianic complexes.",
    integration_signal: "Experience of inner unity without inflation. The ability to hold contradictions within a coherent whole. Spontaneous alignment with deeper purpose.",
  },
  hero: {
    label: "Hero",
    description: "The archetype of the ego's struggle for autonomy and mastery — the part that fights dragons, overcomes obstacles, and achieves independence.",
    shadow_expression: "Reckless bravado, inability to ask for help, compulsive achievement, and the inability to surrender or be vulnerable.",
    integration_signal: "Courage grounded in service. The ability to fight when needed and surrender when appropriate. Strength that includes vulnerability.",
  },
  trickster: {
    label: "Trickster",
    description: "The archetype of boundary-crossing, rule-breaking, and creative disruption — the part that exposes hypocrisy and creates change through chaos.",
    shadow_expression: "Destructive chaos, malicious deception, self-sabotage, and the inability to commit to any structure or relationship.",
    integration_signal: "Creative disruption in service of growth. The ability to question assumptions and break stale patterns while maintaining constructive intent.",
  },
  "wise-old-man": {
    label: "Wise Old Man/Woman",
    description: "The archetype of meaning, wisdom, and understanding — the inner guide who offers perspective beyond the ego's limited view.",
    shadow_expression: "Dogmatism, pontification, using wisdom as a weapon, and the inability to acknowledge not-knowing.",
    integration_signal: "Wisdom expressed as gentle guidance rather than authoritative pronouncement. The ability to offer insight while honoring the other's autonomy.",
  },
  "great-mother": {
    label: "Great Mother",
    description: "The archetype of nurturing, fertility, and the natural world — the generative and protective force that sustains life.",
    shadow_expression: "Smothering, devouring, the inability to let go, and the equation of love with control.",
    integration_signal: "Nurturance that empowers rather than creates dependency. The ability to hold space for growth without directing it.",
  },
  child: {
    label: "Divine Child",
    description: "The archetype of new beginnings, potential, and the future — the emerging consciousness that carries the seeds of what is to come.",
    shadow_expression: "Puer/puella aeternus — the eternal child who refuses to grow up, commits to nothing, and lives in perpetual possibility.",
    integration_signal: "Access to wonder, creativity, and new beginnings combined with the maturity to ground them in sustained effort.",
  },
  mandala: {
    label: "Mandala",
    description: "The archetype of wholeness, order, and the center — the symbolic representation of psychic totality and the integration of opposites.",
    shadow_expression: "Obsession with order and symmetry as a defense against chaos. Rigid structuring as avoidance of lived experience.",
    integration_signal: "Experience of centeredness without rigidity. The ability to find the center in chaos as well as in order.",
  },
};

// ─── First Principles Categories ─────────────────────────────────────────────

export const FIRST_PRINCIPLES_CATEGORIES: Record<
  FirstPrinciplesCategory,
  {
    label: string;
    description: string;
    test: string;
  }
> = {
  "irreducible-fact": {
    label: "Irreducible Fact",
    description: "An observation that cannot be decomposed further — the atomic unit of empirical reality in this context.",
    test: "Can this be broken down into more fundamental claims? If not, it is irreducible.",
  },
  "inherited-assumption": {
    label: "Inherited Assumption",
    description: "A belief accepted without examination because it was inherited from culture, tradition, or authority.",
    test: "Would someone from a different culture or era accept this as self-evident? If not, it is inherited.",
  },
  "contextual-constraint": {
    label: "Contextual Constraint",
    description: "A limitation that is real within the current context but may not be universal or permanent.",
    test: "Is this constraint a property of the system or of our current configuration? Could it change with different conditions?",
  },
  "physical-law": {
    label: "Physical Law",
    description: "A constraint imposed by the fundamental laws of physics, mathematics, or logic.",
    test: "Does this hold across all possible contexts and configurations? If so, it may be a physical or logical necessity.",
  },
  "social-convention": {
    label: "Social Convention",
    description: "A pattern of behavior or belief maintained by collective agreement rather than necessity.",
    test: "If everyone agreed to change this tomorrow, could they? If yes, it is conventional, not necessary.",
  },
  "logical-necessity": {
    label: "Logical Necessity",
    description: "A conclusion that follows necessarily from the premises — denying it would entail a contradiction.",
    test: "Is the negation of this claim self-contradictory? If so, it is logically necessary.",
  },
};
