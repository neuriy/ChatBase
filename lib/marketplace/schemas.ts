import { z } from "zod";

/** Marketplace app object — fields observed in Neuriy-Marketplace repository.serialize_app */
export const MarketplaceAppSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional().default(""),
    category: z.string().optional().default(""),
    developer: z.string().optional().default(""),
    price: z.string().optional().default("Free"),
    version: z.string().optional().default("1.0.0"),
    rating: z.number().optional().default(0),
    downloads: z.number().optional().default(0),
    featured: z.boolean().optional().default(false),
    icon_url: z.string().nullable().optional(),
    package_filename: z.string().nullable().optional(),
    owner_id: z.string().nullable().optional(),
    status: z.string().optional().default("approved"),
    moderation_score: z.number().nullable().optional(),
    moderation_notes: z.string().nullable().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .passthrough();

export const MarketplaceAppListSchema = z.array(MarketplaceAppSchema);

export const CategoriesResponseSchema = z.object({
  categories: z.array(z.string()),
});

export const HealthResponseSchema = z
  .object({
    status: z.string(),
    service: z.string().optional(),
    database: z.string().optional(),
  })
  .passthrough();

export type MarketplaceApp = z.infer<typeof MarketplaceAppSchema>;

export function validateApps(data: unknown): MarketplaceApp[] {
  // API returns a bare array
  const parsed = MarketplaceAppListSchema.safeParse(data);
  if (parsed.success) return parsed.data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const nested = obj.apps ?? obj.items;
    const nestedParsed = MarketplaceAppListSchema.safeParse(nested);
    if (nestedParsed.success) return nestedParsed.data;
  }
  throw new MarketplaceValidationError("Invalid Marketplace apps response");
}

export function validateApp(data: unknown): MarketplaceApp {
  const parsed = MarketplaceAppSchema.safeParse(data);
  if (!parsed.success) {
    throw new MarketplaceValidationError("Invalid Marketplace app response");
  }
  return parsed.data;
}

export function validateCategories(data: unknown): string[] {
  const parsed = CategoriesResponseSchema.safeParse(data);
  if (parsed.success) return parsed.data.categories;
  if (Array.isArray(data) && data.every((x) => typeof x === "string")) {
    return data as string[];
  }
  throw new MarketplaceValidationError("Invalid Marketplace categories response");
}

export function validateHealth(data: unknown) {
  const parsed = HealthResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new MarketplaceValidationError("Invalid Marketplace health response");
  }
  return parsed.data;
}

export class MarketplaceValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MarketplaceValidationError";
  }
}
