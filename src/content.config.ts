import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const ballisticsPointSchema = z.object({
  distance_yd: z.number(),
  velocity_fps: z.number(),
  energy_ft_lbs: z.number(),
  drop_in: z.number(),
});

const loadSchema = z.object({
  name: z.string(),
  bullet_weight_gr: z.number(),
  bullet_type: z.string(),
  muzzle_velocity_fps: z.number(),
  muzzle_energy_ft_lbs: z.number(),
  barrel_length_in: z.number(),
  ballistics: z.array(ballisticsPointSchema),
});

const caliberData = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/calibers' }),
  schema: z.object({
    name: z.string(),
    designation: z.string(),
    aliases: z.array(z.string()).default([]),
    category: z.enum(['handgun', 'rifle', 'shotgun', 'pdw', 'magnum_handgun', 'magnum_rifle']),
    slug: z.string(),

    dimensions: z.object({
      bullet_diameter_in: z.number(),
      neck_diameter_in: z.number(),
      case_length_in: z.number(),
      overall_length_in: z.number(),
      rim_diameter_in: z.number().optional(),
      case_type: z.string(),
    }),

    typical_velocity_fps: z.tuple([z.number(), z.number()]),
    typical_energy_ft_lbs: z.tuple([z.number(), z.number()]),
    typical_bullet_weight_gr: z.tuple([z.number(), z.number()]),
    effective_range_yd: z.number(),
    max_range_yd: z.number().optional(),

    recoil: z.object({
      free_recoil_ft_lbs: z.number(),
      reference_firearm: z.string(),
      subjective: z.enum(['very_low', 'low', 'moderate', 'heavy', 'very_heavy']),
    }),

    year_introduced: z.number(),
    country_of_origin: z.string(),
    military_usage: z.array(z.string()).default([]),
    le_usage: z.array(z.string()).default([]),
    primary_use_cases: z.array(z.string()),

    popularity_tier: z.enum(['ubiquitous', 'very_common', 'common', 'niche', 'rare']),
    cost_per_round_usd: z.tuple([z.number(), z.number()]),
    common_firearms: z.array(z.string()),

    loads: z.array(loadSchema),
  }),
});

const caliberProse = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/calibers' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    last_updated: z.coerce.date(),
  }),
});

export const collections = { caliberData, caliberProse };
