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
    entity: 'Trynoa Inc.',
    email: 'experiment@trynoa.io',
  },
} as const;

/**
 * The spine — the four-paragraph manifesto that anchors every surface.
 * One source. Used in hero, About, social copy, application narratives.
 */
export const SPINE = {
  en: [
    `Most US-built AI tools won't survive their first month with a LATAM SMB. I have a hypothesis why — but I want proof.`,
    `So for the next 16 days, I'm having 100 conversations with Spanish-speaking SMB founders about how they actually run their business in WhatsApp. The hypothesis is something I'm calling **Noa**: that WhatsApp isn't a channel for these businesses, it's the OS — and vertical AI agents get built on it, not retrofitted to it. The experiment will tell me if I'm right, wrong, or partway between.`,
    `Live counter below. Daily diary on LinkedIn, long-form in **Modo Build**. The synthesis publishes May 17 — same day my a16z Speedrun and YC applications go in. Those are deadlines. The thesis is the real output.`,
    `If you're a LATAM SMB founder using or refusing AI tools — book a slot. 40 minutes. Anonymized. I publish what I learn.`,
  ],
  es: [
    `La mayoría de las herramientas de IA hechas en San Francisco no van a sobrevivir su primer mes con una PYME latinoamericana. Tengo una hipótesis del porqué — pero quiero pruebas.`,
    `Por los próximos 16 días, voy a tener 100 conversaciones con fundadores de PYMES hispanohablantes sobre cómo realmente operan su negocio en WhatsApp. La hipótesis se llama **Noa**: WhatsApp no es un canal para estos negocios, es el sistema operativo — y los agentes de IA verticales se construyen sobre WhatsApp primero, no adaptados después. El experimento dirá si tengo razón, si estoy equivocada, o algo intermedio.`,
    `Contador en vivo abajo. Diario diario en LinkedIn, formato largo en **Modo Build**. La síntesis se publica el 17 de mayo — el mismo día en que envío mis aplicaciones a a16z Speedrun y YC. Esos son los deadlines. La tesis es el resultado real.`,
    `Si sos fundador o fundadora de una PYME en LATAM usando — o rechazando — herramientas de IA, agendá tu turno. 40 minutos. Anonimizado. Publico lo que aprendo.`,
  ],
} as const;

/**
 * Counter-positioning. The villain we name on the manifesto.
 */
export const VILLAIN = {
  en: 'Demoware AI: tools polished for SF investor demos that fall apart the first time a customer in Bogotá messages "ola, tienes turno?" at 9pm on a Saturday.',
  es: 'IA demoware: herramientas pulidas para demos de inversionistas en SF que se rompen el primer sábado a las 9pm cuando un cliente en Bogotá escribe "ola, tienes turno?".',
} as const;
