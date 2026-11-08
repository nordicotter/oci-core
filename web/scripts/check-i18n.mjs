// Dependency-free sanity checks for the community translation catalogs.
import { readFileSync } from 'node:fs'
const load = name => JSON.parse(readFileSync(new URL(`../src/i18n/${name}.json`, import.meta.url), 'utf8'))
const de = load('de')
const en = load('en')
const patterns = load('patterns')
const chinese = /[\u3400-\u9fff]/u
const placeholders = input => [...input.matchAll(/\{(\d+)\}/g)].map(match => match[1]).sort()

const sources = Object.keys(de)
const englishSources = Object.keys(en)
if (sources.length !== englishSources.length) throw Error('Locale catalog sizes differ')
for (const source of sources) {
  if (!chinese.test(source)) throw Error(`Non-Chinese source key: ${source}`)
  if (!Object.hasOwn(en, source)) throw Error(`Missing English: ${source}`)
  if (!de[source].trim() || !en[source].trim()) throw Error(`Empty translation: ${source}`)
  if (chinese.test(de[source]) || chinese.test(en[source])) throw Error(`Still Chinese: ${source}`)
}
const seen = new Set()
for (const pattern of patterns) {
  if (!chinese.test(pattern.source)) throw Error(`Pattern missing source Chinese: ${pattern.source}`)
  if (seen.has(pattern.source)) throw Error(`Duplicate pattern: ${pattern.source}`)
  seen.add(pattern.source)
  const expected = placeholders(pattern.source).join(',')
  for (const lang of ['de', 'en']) {
    if (chinese.test(pattern[lang])) throw Error(`Untranslated ${lang} pattern: ${pattern.source}`)
    if (placeholders(pattern[lang]).join(',') !== expected) throw Error(`Placeholder mismatch: ${pattern.source}`)
  }
  const sample = pattern.source.replace(/\{\d+\}/g, 'TEST_VALUE')
  const parts = pattern.source.split(/\{\d+\}/g)
  const re = new RegExp(`^${parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('([\\s\\S]*?)')}$`, 'u')
  if (!re.test(sample)) throw Error(`Nonmatching dynamic pattern: ${pattern.source}`)
}
console.log(`${sources.length} static translations (DE + EN), ${patterns.length} dynamic patterns (DE + EN): OK`)
