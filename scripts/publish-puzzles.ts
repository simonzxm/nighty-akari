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
  const index = await buildPuzzles(options);

  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  try {
    // Fixed board URLs are overwritten first; publish the index only if every upload succeeds.
    for (const key of [...index.map(puzzle => puzzle.file), 'index.json']) {
      stage = `uploading ${key}`;
      console.log(`[publish] Uploading ${key} to R2...`);
      const body = await readFile(resolve(GENERATED, key));
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: 'application/json',
        CacheControl: 'no-cache,max-age=0,must-revalidate',
      }));
    }
  } finally {
    client.destroy();
  }
  console.log(`[publish] Successfully published ${index.length} boards and index.json.`);
}

publishPuzzles().catch(error => {
  const detail = error instanceof Error ? error.message : 'Unknown error';
  console.error(`[publish] Failed during ${stage}: ${detail}`);
  process.exitCode = 1;
});
