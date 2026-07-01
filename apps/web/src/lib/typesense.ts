import { Client as TypesenseClient } from 'typesense';
import { db } from './db';
import { normalizeValue } from '../../../../packages/search/normalization';

const typesenseHost = process.env.TYPESENSE_HOST || 'localhost';
const typesensePort = parseInt(process.env.TYPESENSE_PORT || '8108', 10);
const typesenseApiKey = process.env.TYPESENSE_API_KEY || 'xyz123';
const typesenseProtocol = process.env.TYPESENSE_PROTOCOL || 'http';

export const typesense = new TypesenseClient({
  nodes: [
    {
      host: typesenseHost,
      port: typesensePort,
      protocol: typesenseProtocol,
    },
  ],
  apiKey: typesenseApiKey,
  connectionTimeoutSeconds: 10,
});

export const COLLECTION_NAME = 'components';

// Aliases for component specifications
const VOLTAGE_ALIASES = ['voltage', 'voltage_rating', 'voltage_max', 'operating_voltage', 'rated_voltage', 'voltage - rated', 'voltage rating', 'max voltage'];
const CAPACITANCE_ALIASES = ['capacitance', 'capacitance_value', 'capacitance - rated', 'capacitance rating'];
const RESISTANCE_ALIASES = ['resistance', 'resistance_value', 'resistance - rated', 'resistance rating', 'value'];
const CURRENT_ALIASES = ['current', 'current_rating', 'max_current', 'rated_current', 'current - rated', 'current rating', 'max current'];
const INDUCTANCE_ALIASES = ['inductance', 'inductance_value', 'inductance - rated', 'inductance rating'];
const PACKAGE_ALIASES = ['package', 'package_type', 'case_package', 'package_case', 'case/package', 'package / case', 'mounting_type'];

function extractSpec(specs: any, aliases: string[]): any {
  if (!specs || typeof specs !== 'object') return null;
  for (const alias of aliases) {
    if (specs[alias] !== undefined && specs[alias] !== null) {
      return specs[alias];
    }
  }
  const specsKeys = Object.keys(specs);
  for (const alias of aliases) {
    const lowerAlias = alias.toLowerCase();
    const matchingKey = specsKeys.find(k => k.toLowerCase() === lowerAlias);
    if (matchingKey && specs[matchingKey] !== undefined && specs[matchingKey] !== null) {
      return specs[matchingKey];
    }
  }
  return null;
}

export async function indexComponentInTypesense(componentId: string) {
  const component = await db.component.findUnique({
    where: { id: componentId },
    include: {
      manufacturer: true,
      category: true,
      stock: true,
      assets: true,
    },
  });

  if (!component) return;

  const rawVoltage = extractSpec(component.specs, VOLTAGE_ALIASES);
  const rawCapacitance = extractSpec(component.specs, CAPACITANCE_ALIASES);
  const rawResistance = extractSpec(component.specs, RESISTANCE_ALIASES);
  const rawCurrent = extractSpec(component.specs, CURRENT_ALIASES);
  const rawInductance = extractSpec(component.specs, INDUCTANCE_ALIASES);
  const packageType = extractSpec(component.specs, PACKAGE_ALIASES);

  const normalizedVoltage = normalizeValue(rawVoltage, 'voltage');
  const normalizedCapacitance = normalizeValue(rawCapacitance, 'capacitance');
  const normalizedResistance = normalizeValue(rawResistance, 'resistance');
  const normalizedCurrent = normalizeValue(rawCurrent, 'current');
  const normalizedInductance = normalizeValue(rawInductance, 'inductance');

  let stockTotal = 0;
  let minPrice = 0.0;
  const prices: number[] = [];

  if (component.stock && component.stock.length > 0) {
    for (const s of component.stock) {
      stockTotal += s.stockQty;
      const tiers = typeof s.priceTiers === 'string' ? JSON.parse(s.priceTiers) : s.priceTiers;
      if (Array.isArray(tiers) && tiers.length > 0) {
        const qty1Tier = tiers.find((t: any) => t.qty === 1) || tiers[0];
        if (qty1Tier && typeof qty1Tier.price === 'number') {
          prices.push(qty1Tier.price);
        }
      }
    }
    if (prices.length > 0) {
      minPrice = Math.min(...prices);
    }
  }

  const categoryPath = component.category.path
    ? component.category.path.split('.')
    : [component.category.name.toLowerCase()];

  const doc = {
    id: component.id,
    mpn: component.mpn,
    description: component.description || '',
    manufacturer: component.manufacturer.name,
    category: component.category.name,
    category_path: categoryPath,
    lifecycle: component.lifecycle,
    stock_total: stockTotal,
    min_price: minPrice,
    
    // Normalized numeric values for range filtering
    normalized_voltage: normalizedVoltage?.value ?? null,
    normalized_capacitance: normalizedCapacitance?.value ?? null,
    normalized_resistance: normalizedResistance?.value ?? null,
    normalized_current: normalizedCurrent?.value ?? null,
    normalized_inductance: normalizedInductance?.value ?? null,
    
    // Standardized display strings for fast rendering
    voltage_display: normalizedVoltage?.display ?? null,
    capacitance_display: normalizedCapacitance?.display ?? null,
    resistance_display: normalizedResistance?.display ?? null,
    current_display: normalizedCurrent?.display ?? null,
    inductance_display: normalizedInductance?.display ?? null,
    
    package_type: packageType ? String(packageType) : null,
    has_cad_assets: component.assets.length > 0,
    created_at: component.createdAt.getTime(),
  };

  await typesense.collections(COLLECTION_NAME).documents().upsert(doc);
}

