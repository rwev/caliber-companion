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
  bc_g1: z.number().optional(),
  bc_g7: z.number().optional(),
  sectional_density: z.number().optional(),
  gel_penetration_in: z.number().optional(),
  expansion_diameter_in: z.number().optional(),
  barrier_blind: z.boolean().optional(),
  ballistics: z.array(ballisticsPointSchema),
});

const gameRecommendationSchema = z.object({
  game: z.string(),
  range: z.string(),
  notes: z.string(),
});

const militaryAdoptionSchema = z.object({
  organization: z.string(),
  designation: z.string().optional(),
  year_adopted: z.number().optional(),
  role: z.string(),
  status: z.enum(['active', 'retired']),
});

const leAdoptionSchema = z.object({
  organization: z.string(),
  year_adopted: z.number().optional(),
  role: z.string(),
  status: z.enum(['active', 'retired']),
});

const adoptionEventSchema = z.object({
  year: z.number(),
  event: z.string(),
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

    adoption_timeline: z.array(adoptionEventSchema).optional(),

    parent_cartridge: z.string().optional(),
    derived_cartridges: z.array(z.string()).optional(),

    recommended_game: z.array(gameRecommendationSchema).optional(),

    max_pressure_psi: z.number().optional(),
    primer_type: z.string().optional(),
    powder_charge_range_gr: z.tuple([z.number(), z.number()]).optional(),

    availability_rating: z.number().min(1).max(5).optional(),
    annual_production_estimate: z.enum(['massive', 'high', 'moderate', 'limited', 'minimal']).optional(),
    price_trend: z.enum(['stable', 'rising', 'falling', 'volatile']).optional(),

    suppressor_friendly: z.boolean().optional(),
    subsonic_loads_available: z.boolean().optional(),

    military_adoption_detail: z.array(militaryAdoptionSchema).optional(),
    le_adoption_detail: z.array(leAdoptionSchema).optional(),

    compatible_chambers: z.array(z.object({
      caliber: z.string(),
      notes: z.string(),
    })).optional(),
    dangerous_substitutions: z.array(z.object({
      caliber: z.string(),
      danger: z.string(),
    })).optional(),
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

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    summary: z.string(),
    calibers: z.array(z.string()),
    last_updated: z.coerce.date(),
  }),
});

const firearmsData = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/data/firearms' }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    manufacturer: z.string(),
    country_of_origin: z.string(),
    caliber: z.string(),
    type: z.enum(['pistol', 'revolver', 'rifle', 'shotgun', 'submachine_gun', 'carbine']),
    action: z.string(),
    capacity: z.number().optional(),
    barrel_length_in: z.number(),
    overall_length_in: z.number().optional(),
    weight_oz: z.number(),
    year_introduced: z.number(),
    msrp_usd: z.number().optional(),
    notable_features: z.array(z.string()).default([]),
    summary: z.string(),
  }),
});

export const collections = { caliberData, caliberProse, guides, firearmsData };
