#!/usr/bin/env node
/**
 * Copy 03-OneAI research_demo export → 23 public bundle (Step 3 sync).
 * Usage: node scripts/sync-oneai-feed-sample.mjs
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, '../../03-OneAI/exports/research_demo_feed.sample.json')
const destDir = join(root, 'public/oneai')
const dest = join(destDir, 'research_demo_feed.sample.json')

mkdirSync(destDir, { recursive: true })
copyFileSync(src, dest)
console.log(`synced → ${dest}`)
