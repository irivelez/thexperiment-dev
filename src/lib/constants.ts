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
 * Working hypothesis (Noa) + insight-isn't-a-starting-point + building-in-public + CTA close.
 * One source. Used in The Bet section, About, social copy, application narratives.
 */
export const SPINE = {
  en: [
    `I have a working hypothesis — call it **Noa** — that WhatsApp isn't a channel for these businesses, it's the OS. Vertical agents get built on it, not retrofitted to it. But insight isn't a starting point. It's something you build.`,
    `So I'm building it in public — counter, diary, quotes, contradictions, including the numbers that make me look stupid. Synthesis publishes May 17, same day my a16z Speedrun and YC applications go in. Those are deadlines. The POV is the output.`,
    `Pick a time. Or watch live.`,
  ],
  es: [
    `Tengo una hipótesis de trabajo — la llamo **Noa** — que WhatsApp no es un canal para estos negocios, es el sistema operativo. Los agentes verticales se construyen sobre él, no adaptados después. Pero el insight no es un punto de partida. Es algo que se construye.`,
    `Por eso lo estoy construyendo en público — contador, diario, citas, contradicciones, incluyendo los números que me hacen quedar mal. La síntesis se publica el 17 de mayo, el mismo día en que envío mis aplicaciones a a16z Speedrun y YC. Esos son deadlines. La tesis es el resultado real.`,
    `Agendá tu turno. O mirá en vivo.`,
  ],
} as const;

/**
 * Counter-positioning. The villain we name on the manifesto.
 */
export const VILLAIN = {
  en: 'Demoware AI: tools polished for SF investor demos that fall apart the first time a customer in Bogotá messages "ola, tienes turno?" at 9pm on a Saturday.',
  es: 'IA demoware: herramientas pulidas para demos de inversionistas en SF que se rompen el primer sábado a las 9pm cuando un cliente en Bogotá escribe "ola, tienes turno?".',
} as const;

/**
 * Funnel-entry hero: the page LinkedIn/TikTok traffic lands on.
 * Leadership-led, never fear-led. The market is the moat;
 * how the work gets delivered is what's about to change radically.
 */
export const TALK = {
  es: {
    eyebrow: 'Para los dueños que ya tienen el negocio.',
    question: 'Hoy se están armando empresas desde cero con IA. ¿Y la tuya?',
    subhead: [
      `Hay startups en San Francisco montando la próxima cadena de plomería, limpieza, logística — sin operación previa, sin equipo en campo, sin un solo cliente. Solo agentes y una idea.`,
      `Vos ya tenés lo que ellos no: mercado, clientes que confían, operación que aguanta. **Eso no se reemplaza fácil.** Lo que sí va a cambiar — radicalmente — es cómo entregás el servicio a esos mismos clientes.`,
      `La pregunta no es si tu negocio sobrevive. Es **quién va a liderar el rearme** — vos, o alguien nuevo que va a servir a tus clientes mejor con menos personas.`,
    ],
    chatIntro:
      'Soy Noa, el agente que armó Irina. Robame 4 minutos: contame cómo opera tu negocio. Cuando termine, vas a tener un brief tuyo, y el botón para agendar 40 minutos con ella si querés ir más a fondo.',
    why: {
      eyebrow: 'Qué es esto',
      title: '16 días. 100 conversaciones. Ningún pitch.',
      body: `Irina lleva 15 años operando empresas en LATAM. Está entrevistando 100 dueños de negocios de campo en Latinoamérica — plomería, limpieza, mantenimiento, logística, eléctricos, construcción ligera — para construir su tesis sobre qué se debería realmente construir con IA para PYMES hispanohablantes.`,
      promise: `Sin pitch. Sin venta. Sin depósito. Lo que aprendemos sale público en /diary. Tu nombre y empresa nunca aparecen sin tu permiso.`,
    },
    watch: 'Mirá el experimento en vivo →',
    english: 'Read in English →',
  },
  en: {
    eyebrow: 'For owners who already have the business.',
    question: 'New businesses are being built from scratch with AI. What about yours?',
    subhead: [
      `In San Francisco right now, AI agents are spinning up the next plumbing brand, the next cleaning company, the next logistics startup — with no prior operation, no field crew, no customers. Just agents and an idea.`,
      `You already have what they don't: a market, customers who trust you, an operation that holds. **That isn't replaced easily.** What WILL change — radically — is how you deliver the service to those same customers.`,
      `The question isn't whether your business survives. It's **who leads the rebuild** — you, or someone new who serves your customers better with fewer people.`,
    ],
    chatIntro:
      `I'm Noa, the agent Irina built. Give me 4 minutes — tell me how your business runs. When we're done, you'll have a brief of your own, and the button to book 40 minutes with her if you want to go deeper.`,
    why: {
      eyebrow: 'What this is',
      title: '16 days. 100 conversations. No pitch.',
      body: `Irina has 15 years operating companies across LATAM. She's interviewing 100 field-operations SMB owners — plumbing, cleaning, maintenance, logistics, electrical, light construction — to build her point of view on what AI should actually be built for Spanish-speaking SMBs.`,
      promise: `No pitch. No sales. No deposit. What we learn goes public at /diary. Your name and company never appear without explicit permission.`,
    },
    watch: 'Watch the experiment live →',
    english: 'Leer en español →',
  },
} as const;
