import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { experienceSchema } from '@/lib/schemas/experience';
import { projectSchema } from '@/lib/schemas/projects';
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

export const collections = {
  experience,
  projects,
  'side-projects': sideProjects,
};
