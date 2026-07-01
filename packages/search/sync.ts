import { PrismaClient } from '@prisma/client';
import { Client as TypesenseClient } from 'typesense';
import * as fs from 'fs';
import * as path from 'path';
import { normalizeValue } from './normalization';

// Initialize clients
const prisma = new PrismaClient();

const typesenseHost = process.env.TYPESENSE_HOST || 'localhost';
const typesensePort = parseInt(process.env.TYPESENSE_PORT || '8108', 10);
const typesenseApiKey = process.env.TYPESENSE_API_KEY || 'xyz123';
const typesenseProtocol = process.env.TYPESENSE_PROTOCOL || 'http';

const typesense = new TypesenseClient({
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

const COLLECTION_NAME = 'components';

// Helper to extract a spec value from the JSONB specs object using aliases
function extractSpec(specs: any, aliases: string[]): any {
  if (!specs || typeof specs !== 'object') return null;
  
  // Try to find an exact match
  for (const alias of aliases) {
    if (specs[alias] !== undefined && specs[alias] !== null) {
      return specs[alias];
    }
  }

  // Try to find a case-insensitive match
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

// Aliases for component specifications (covers common PDF extraction naming variations)
const VOLTAGE_ALIASES = ['voltage', 'voltage_rating', 'voltage_max', 'operating_voltage', 'rated_voltage', 'voltage - rated', 'voltage rating', 'max voltage'];
const CAPACITANCE_ALIASES = ['capacitance', 'capacitance_value', 'capacitance - rated', 'capacitance rating'];
const RESISTANCE_ALIASES = ['resistance', 'resistance_value', 'resistance - rated', 'resistance rating', 'value'];
const CURRENT_ALIASES = ['current', 'current_rating', 'max_current', 'rated_current', 'current - rated', 'current rating', 'max current'];
const INDUCTANCE_ALIASES = ['inductance', 'inductance_value', 'inductance - rated', 'inductance rating'];
const POWER_ALIASES = ['power', 'power_dissipation', 'power_rating', 'max_power', 'power dissipation', 'rated power', 'max power', 'power_max', 'dissipation', 'power_dissipation_max'];
const FREQUENCY_ALIASES = ['frequency', 'clock_frequency', 'operating_frequency', 'transition_frequency', 'frequency_max', 'frequency rating', 'frequency_rating', 'clock speed', 'max frequency', 'core_frequency', 'transition_frequency'];
const PACKAGE_ALIASES = ['package', 'package_type', 'case_package', 'package_case', 'case/package', 'package / case', 'mounting_type'];

async function main() {
  const args = process.argv.slice(2);
  const recreateIndex = args.includes('--recreate') || args.includes('-r');

  console.log('Starting Typesense synchronization...');
  console.log(`Typesense Host: ${typesenseProtocol}://${typesenseHost}:${typesensePort}`);

  // 1. Manage Collection (Create or Recreate)
  let collectionExists = false;
  try {
    await typesense.collections(COLLECTION_NAME).retrieve();
    collectionExists = true;
  } catch (error) {
    // Collection does not exist (throws 404)
  }

  if (recreateIndex && collectionExists) {
    console.log(`Deleting existing collection "${COLLECTION_NAME}"...`);
    await typesense.collections(COLLECTION_NAME).delete();
    collectionExists = false;
  }

  if (!collectionExists) {
    console.log(`Creating collection "${COLLECTION_NAME}"...`);
    const schemaPath = path.join(__dirname, 'schema.json');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }
    const schemaRaw = fs.readFileSync(schemaPath, 'utf-8');
    const schema = JSON.parse(schemaRaw);
    await typesense.collections().create(schema);
    console.log(`Collection "${COLLECTION_NAME}" created successfully.`);
  }

  // 2. Fetch and Sync Components in Batches
  const BATCH_SIZE = 500;
  let skip = 0;
  let totalSynced = 0;

  console.log('Fetching components from database...');

  while (true) {
    const components = await prisma.component.findMany({
      skip,
      take: BATCH_SIZE,
      include: {
        manufacturer: true,
        category: true,
        stock: true,
        assets: true,
      },
    });

    if (components.length === 0) {
      break;
    }

    console.log(`Processing batch of ${components.length} components (skip: ${skip})...`);
    const documents = [];

    for (const component of components) {
      // Extract parameters from specs JSONB
      const rawVoltage = extractSpec(component.specs, VOLTAGE_ALIASES);
      const rawCapacitance = extractSpec(component.specs, CAPACITANCE_ALIASES);
      const rawResistance = extractSpec(component.specs, RESISTANCE_ALIASES);
      const rawCurrent = extractSpec(component.specs, CURRENT_ALIASES);
      const rawInductance = extractSpec(component.specs, INDUCTANCE_ALIASES);
      const rawPower = extractSpec(component.specs, POWER_ALIASES);
      const rawFrequency = extractSpec(component.specs, FREQUENCY_ALIASES);
      const packageType = extractSpec(component.specs, PACKAGE_ALIASES);

      // Normalize parameters via Unit Normalization Engine
      const normalizedVoltage = normalizeValue(rawVoltage, 'voltage');
      const normalizedCapacitance = normalizeValue(rawCapacitance, 'capacitance');
      const normalizedResistance = normalizeValue(rawResistance, 'resistance');
      const normalizedCurrent = normalizeValue(rawCurrent, 'current');
      const normalizedInductance = normalizeValue(rawInductance, 'inductance');
      const normalizedPower = normalizeValue(rawPower, 'power');
      const normalizedFrequency = normalizeValue(rawFrequency, 'frequency');

      // Calculate stock and price metrics
      let stockTotal = 0;
      let minPrice = 0.0;
      const prices: number[] = [];

      if (component.stock && component.stock.length > 0) {
        for (const s of component.stock) {
          stockTotal += s.stockQty;
          
          // Parse price tiers to extract the minimum unit price (e.g. qty 1 price)
          const tiers = typeof s.priceTiers === 'string' ? JSON.parse(s.priceTiers) : s.priceTiers;
          if (Array.isArray(tiers) && tiers.length > 0) {
            // Prefer price for quantity 1, otherwise fallback to the first tier
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

      // Split category path (e.g. "passives.capacitors.ceramic" -> ["passives", "capacitors", "ceramic"])
      const categoryPath = component.category.path
        ? component.category.path.split('.')
        : [component.category.name.toLowerCase()];

      // Build Typesense document
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
        normalized_power: normalizedPower?.value ?? null,
        normalized_frequency: normalizedFrequency?.value ?? null,
        
        // Standardized display strings for fast rendering
        voltage_display: normalizedVoltage?.display ?? null,
        capacitance_display: normalizedCapacitance?.display ?? null,
        resistance_display: normalizedResistance?.display ?? null,
        current_display: normalizedCurrent?.display ?? null,
        inductance_display: normalizedInductance?.display ?? null,
        power_display: normalizedPower?.display ?? null,
        frequency_display: normalizedFrequency?.display ?? null,
        
        package_type: packageType ? String(packageType) : null,
        has_cad_assets: component.assets.length > 0,
        created_at: component.createdAt.getTime(),
      };

      documents.push(doc);
    }

    // Import batch into Typesense
    if (documents.length > 0) {
      console.log(`Indexing ${documents.length} documents into Typesense...`);
      const results = await typesense
        .collections(COLLECTION_NAME)
        .documents()
        .import(documents, { action: 'upsert' });

      // Check for import errors
      const failed = results.filter(r => r.success === false);
      if (failed.length > 0) {
        console.error(`Warning: ${failed.length} documents failed to import.`);
        console.error('First failure:', JSON.stringify(failed[0]));
      }

      totalSynced += documents.length - failed.length;
      console.log(`Successfully indexed ${documents.length - failed.length} documents.`);
    }

    skip += BATCH_SIZE;
  }

  console.log(`Synchronization complete! Total components successfully synced: ${totalSynced}`);
}

main()
  .catch(error => {
    console.error('Synchronization failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
