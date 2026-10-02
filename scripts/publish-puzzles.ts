import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ROOT, GENERATED, buildPuzzles, parseBuildOptions } from './build-puzzles';

let stage = 'configuration';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`[publish] Missing required configuration: ${name}`);
    throw new Error('Incomplete R2 configuration');
  }
  return value;
}

async function publishPuzzles(): Promise<void> {
  console.log('[publish] Checking R2 configuration...');
  try {
    loadEnvFile(resolve(ROOT, '.env.local'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  const endpoint = required('R2_ENDPOINT');
  const bucket = required('R2_BUCKET');
  const accessKeyId = required('R2_ACCESS_KEY_ID');
  const secretAccessKey = required('R2_SECRET_ACCESS_KEY');
  const options = parseBuildOptions(process.argv.slice(2));

  stage = 'puzzle generation';
  console.log('[publish] Building puzzles...');
  await buildPuzzles(options);

  stage = 'reading generated puzzles';
  const body = await readFile(resolve(GENERATED, 'puzzles.json'));

  stage = 'R2 upload';
  console.log('[publish] Uploading puzzles.json to R2...');
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: 'puzzles.json',
    Body: body,
    ContentType: 'application/json',
    CacheControl: 'no-cache,max-age=0,must-revalidate',
  }));
  console.log('[publish] Successfully published puzzles.json.');
}

publishPuzzles().catch(error => {
  const detail = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[publish] Failed during ${stage}: ${detail}`);
  process.exitCode = 1;
});
