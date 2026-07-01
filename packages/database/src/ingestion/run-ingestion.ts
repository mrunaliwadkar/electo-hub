import { importKiCadLibrary } from './kicad-importer';
import { importManufacturerData } from './manufacturer-importer';
import { importLcscData } from './lcsc-importer';
import { enrichDistributorData } from './distributor-enricher';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import * as path from 'path';

const prisma = new PrismaClient();

async function run() {
  console.log('=== STARTING ELECTROHUB DATASET EXPANSION PIPELINE ===');
  
  try {
    // Phase 1: KiCad Import System
    console.log('\n--- PHASE 1: KiCad Library Ingestion ---');
    await importKiCadLibrary('https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/master/Device.kicad_sym', 'passives.general', 'Generic');
    await importKiCadLibrary('https://gitlab.com/kicad/libraries/kicad-symbols/-/raw/master/74xx.kicad_sym', 'ics.logic', 'Texas Instruments');

    // Phase 2: Manufacturer Expansion
    console.log('\n--- PHASE 2: Manufacturer Portfolios Ingestion ---');
    await importManufacturerData();

    // Phase 3: LCSC Expansion
    console.log('\n--- PHASE 3: LCSC Catalog & EasyEDA Ingestion ---');
    await importLcscData();

    // Phase 4: Distributor Enrichment
    console.log('\n--- PHASE 4: Distributor Stock & Pricing Enrichment ---');
    await enrichDistributorData();

    // Trigger search index sync
    console.log('\n--- TRIGGERING TYPESENSE SYNCHRONIZATION ---');
    const searchPackagePath = path.resolve(__dirname, '../../../search');
    
    console.log(`Executing search sync command in: ${searchPackagePath}`);
    exec('npm run sync -- --recreate', { cwd: searchPackagePath }, (err: any, stdout: any, stderr: any) => {
      if (err) {
        console.warn('Typesense Sync script execution failed (Typesense is likely offline). This is expected if the local Typesense server is not running. Details:', err.message);
      } else {
        console.log('Typesense Sync completed successfully. Output:');
        console.log(stdout);
      }
    });

    console.log('\n=== PIPELINE INGESTION RUN COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('Ingestion pipeline execution encountered a fatal error:', error);
  }
}

run()
  .catch(e => {
    console.error('Unhandled pipeline execution error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
