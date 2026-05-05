/**
 * Site-wide constants.
 * Single source of truth for copy, links, and configuration.
 */

export const SITE = {
  name: 'thexperiment.dev',
  url: 'https://thexperiment.dev',
  description: '16 days. 100 conversations with Spanish-speaking SMB founders. Watch live.',
  domain: 'thexperiment.dev',
  startDate: new Date('2026-05-02T00:00:00-05:00'),
  endDate: new Date('2026-05-17T23:59:59-05:00'),
  totalDays: 16,
  targetCalls: 100,
  author: {
    name: 'Irina Velez',
    site: 'https://irinavelez.com',
    linkedin: 'https://www.linkedin.com/in/irina-velez/en/',
    x: 'https://x.com/Irina_Velez',
  },
  newsletter: {
    name: 'Modo Build',
    description: 'Weekly long-form: what 100 conversations are teaching me.',
    url: 'https://modobuild.beehiiv.com',
  },
  cta: {
    booking: 'https://cal.com/thexperiment/40min',
  },
  legal: {
    entity: 'Deltanova SAS',
    jurisdiction: 'Colombia',
    contact: 'hello@thexperiment.dev',
    privacyUpdated: '4 de mayo de 2026',
  },
} as const;

/**
 * The hero — the question that opens the page.
 * Frames the experiment as discovery, not declaration. Embodies Emily Benn's
 * principle ("insight isn't a starting point") by leading with a question.
 */
export const HERO = {
  en: {
    eyebrow: 'Sixteen days. 100 conversations. One question:',
    question:
      'What should a fifteen-year LATAM enterprise operator actually build for Spanish-speaking SMBs in AI?',
  },
  es: {
    eyebrow: 'Dieciséis días. 100 conversaciones. Una pregunta:',
    question:
      '¿Qué debería construir, después de quince años operando empresas latinoamericanas, para las PYMES hispanohablantes en IA?',
  },
} as const;

/**
 * The spine — the body of the bet. Three paragraphs.
 * Working hypothesis (Ari) + insight-isn't-a-starting-point + building-in-public + CTA close.
 * One source. Used in The Bet section, About, social copy, application narratives.
 */
export const SPINE = {
  en: [
    `I have a working hypothesis, call it **Ari**, that WhatsApp isn't a channel for these businesses, it's the OS. Vertical agents get built on it, not retrofitted to it. But insight isn't a starting point. It's something you build.`,
    `So I'm building it in public: counter, diary, quotes, contradictions, including the numbers that make me look stupid. Synthesis publishes May 17, same day my a16z Speedrun and YC applications go in. Those are deadlines. The POV is the output.`,
    `Pick a time. Or watch live.`,
  ],
  es: [
    `Tengo una hipótesis de trabajo, la llamo **Ari**, que WhatsApp no es un canal para estos negocios, es el sistema operativo. Los agentes verticales se construyen sobre él, no adaptados después. Pero el insight no es un punto de partida. Es algo que se construye.`,
    `Por eso lo estoy construyendo en público: contador, diario, citas, contradicciones, incluyendo los números que me hacen quedar mal. La síntesis se publica el 17 de mayo, el mismo día en que envío mis aplicaciones a a16z Speedrun y YC. Esos son deadlines. La tesis es el resultado real.`,
    `Agenda tu turno. O mira en vivo.`,
  ],
} as const;

/**
 * Counter-positioning. The villain we name on the manifesto.
 */
export const VILLAIN = {
  en: 'Demoware AI: tools polished for SF investor demos that fall apart the first time a customer in Bogotá messages "ola, tienes turno?" at 9pm on a Saturday.',
  es: 'IA demoware: herramientas pulidas para demos de inversionistas en SF que se rompen el primer sábado a las 9pm cuando un cliente en Bogotá escribe "ola, tienes turno?".',
} as const;

// /talk copy (transmission lines + Ari seed) lives directly inside
// src/pages/talk.astro and src/lib/ari-prompt.ts. The redesign collapsed the
// previous TALK constants block into the cinematic page itself.
