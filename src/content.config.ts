import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const diary = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './content/diary' }),
  schema: z.object({
    day: z.number().int().min(0).max(20),
    title: z.string(),
    date: z.coerce.date(),
    conversations: z.number().int().min(0).default(0),
    excerpt: z.string(),
    lang: z.enum(['en', 'es']).default('en'),
  }),
});

export const collections = { diary };
