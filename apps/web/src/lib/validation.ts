import { z } from "zod";

export const ComponentSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  manufacturer: z.string().optional(),
  lifecycle: z.enum(["ACTIVE", "NRND", "EOL", "OBSOLETE"]).optional(),
  page: z.preprocess((val) => (val ? parseInt(val as string, 10) : 1), z.number().min(1).default(1)),
  limit: z.preprocess((val) => (val ? parseInt(val as string, 10) : 20), z.number().min(1).max(100).default(20)),
  // Parametric filters
  voltage_min: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().optional()),
  voltage_max: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().optional()),
  capacitance_min: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().optional()),
  capacitance_max: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().optional()),
  resistance_min: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().optional()),
  resistance_max: z.preprocess((val) => (val ? parseFloat(val as string) : undefined), z.number().optional()),
  package_type: z.string().optional(),
});

export const PinSchema = z.object({
  number: z.string(),
  name: z.string(),
  type: z.enum(["POWER", "GROUND", "INPUT", "OUTPUT", "BIDIRECT", "ANALOG", "PASSIVE"]).default("PASSIVE"),
  functionalGroup: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
});

export const CadAssetSchema = z.object({
  type: z.enum(["SYMBOL", "FOOTPRINT", "MODEL_3D"]),
  fileUrl: z.string().url(),
  checksum: z.string().optional(),
});

export const ComponentCreateSchema = z.object({
  mpn: z.string().min(1, "MPN is required"),
  description: z.string().min(1, "Description is required"),
  manufacturerId: z.string().uuid("Invalid Manufacturer ID"),
  categoryId: z.string().uuid("Invalid Category ID"),
  lifecycle: z.enum(["ACTIVE", "NRND", "EOL", "OBSOLETE"]).default("ACTIVE"),
  specs: z.record(z.string(), z.any()).default({}),
  pins: z.array(PinSchema).optional(),
  assets: z.array(CadAssetSchema).optional(),
});

export const ComponentUpdateSchema = ComponentCreateSchema.partial().extend({
  // mpn remains a string if provided
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial();

export const ProjectComponentSchema = z.object({
  componentId: z.string().uuid("Invalid Component ID"),
  quantity: z.number().int().min(1).default(1),
  notes: z.string().max(200).optional(),
});

export const FavoriteToggleSchema = z.object({
  componentId: z.string().uuid("Invalid Component ID"),
});

export const AIChatSchema = z.object({
  componentId: z.string().uuid("Invalid Component ID"),
  message: z.string().min(1, "Message cannot be empty").max(2000),
  history: z.array(z.object({
    role: z.enum(["user", "model", "assistant"]),
    content: z.string(),
  })).optional().default([]),
});
