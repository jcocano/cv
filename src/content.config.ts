import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { experienceSchema } from '@/lib/schemas/experience';
import { ossProjectSchema } from '@/lib/schemas/oss-projects';
import { projectSchema } from '@/lib/schemas/projects';
import { publicationSchema } from '@/lib/schemas/publications';
import { sideProjectSchema } from '@/lib/schemas/side-projects';

const experience = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/experience' }),
  schema: experienceSchema,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: projectSchema,
});

const sideProjects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/side-projects' }),
  schema: sideProjectSchema,
});

const ossProjects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/oss-projects' }),
  schema: ossProjectSchema,
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/publications' }),
  schema: publicationSchema,
});

export const collections = {
  experience,
  projects,
  'side-projects': sideProjects,
  'oss-projects': ossProjects,
  publications,
};
