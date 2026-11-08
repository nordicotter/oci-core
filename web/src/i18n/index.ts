/**
 * OCI Core community localization (de/en/zh).
 *
 * The upstream Vue UI contains literal Chinese labels. This compatibility layer
 * translates those labels at render time, without modifying API request values,
 * instance identifiers, credentials or the server database. Source Chinese is
 * always available as the lossless fallback.
 *
 * See TRANSLATIONS.md for the intended longer-term migration to explicit keys.
 */
import { ref } from 'vue'
import de from './de.json'
import en from './en.json'
import patterns from './patterns.json'

export type Language = 'de' | 'en' | 'zh'
type Locale = Exclude<Language, 'zh'>
const STORAGE_KEY = 'ocicore.ui.language'
const dictionaries: Record<Locale, Record<string, string>> = { de, en }

function preferredLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'de' || saved === 'en' || saved === 'zh') return saved
  } catch { /* browser may prevent persistent storage */ }
  const preferred = navigator.language.toLowerCase()
  return preferred.startsWith('de') ? 'de' : preferred.startsWith('zh') ? 'zh' : 'en'
}

export const language = ref<Language>(preferredLanguage())

// Compile the translation templates once. Captures correspond to numbered
// placeholders, e.g. "删除 {0} 的引导卷" -> "Boot-Volume von {0} trennen".
function compiledPattern(source: string): RegExp {
  const parts = source.split(/\{\d+\}/g)
  const escaped = parts.map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`^${escaped.join('([\\s\\S]*?)')}$`, 'u')
}
const dynamicPatterns = patterns
  .filter(p => /[\u3400-\u9fff]/u.test(p.source))
  .map(p => ({
    ...p,
    expression: compiledPattern(p.source),
    score: p.source.replace(/\{\d+\}/g, '').length,
  }))
  .sort((a, b) => b.score - a.score)

function renderTranslation(source: string, locale: Locale): string {
  const dictionary = dictionaries[locale]
  if (Object.prototype.hasOwnProperty.call(dictionary, source)) return dictionary[source]
  for (const pattern of dynamicPatterns) {
    const translated = pattern[locale]
    const matches = pattern.expression.exec(source)
    if (!matches) continue
    return translated.replace(/\{(\d+)\}/g, (_matched, position: string) => {
      const captured = matches[Number(position) + 1]
      return captured ?? ''
    })
  }
  return source
}

export function translate(source: string): string {
  const locale = language.value
  if (locale === 'zh' || !source || !/[\u3400-\u9fff]/u.test(source)) return source
  const exact = renderTranslation(source, locale)
  if (exact !== source) return exact
  // Preserve the layout whitespace surrounding template labels.
  const trimmed = source.trim()
  if (!trimmed || trimmed === source) return source
  const translated = renderTranslation(trimmed, locale)
  if (translated === trimmed) return source
  return source.replace(trimmed, translated)
}

const sourceText = new WeakMap<Text, string>()
const renderedText = new WeakMap<Text, string>()
const sourceAttrs = new WeakMap<Element, Map<string, string>>()
const renderedAttrs = new WeakMap<Element, Map<string, string>>()
let observer: MutationObserver | undefined
let processing = false
let scheduled = false

// User data, commands and editable areas must not be rewritten. Textarea
// placeholders are still translated; only their text/value are excluded.
const ignoreText = 'script,style,code,pre,textarea,input,[contenteditable], [data-no-translate]'
const ignoreAttrs = 'script,style,code,pre,[contenteditable], [data-no-translate]'
const attributes = ['title', 'placeholder', 'aria-label', 'aria-description', 'alt'] as const

function visitText(node: Text): void {
  const parent = node.parentElement
  if (!parent || parent.closest(ignoreText)) return
  const current = node.nodeValue ?? ''
  let original = sourceText.get(node)
  if (original === undefined || current !== renderedText.get(node)) {
    original = current
    sourceText.set(node, original)
  }
  const next = translate(original)
  if (current !== next) node.nodeValue = next
  renderedText.set(node, next)
}

function visitElement(element: Element): void {
  if (element.matches(ignoreAttrs) || element.closest(ignoreAttrs)) return
  let entries = sourceAttrs.get(element)
  if (!entries) {
    entries = new Map()
    sourceAttrs.set(element, entries)
  }
  let lastValues = renderedAttrs.get(element)
  if (!lastValues) {
    lastValues = new Map()
    renderedAttrs.set(element, lastValues)
  }
  for (const name of attributes) {
    const current = element.getAttribute(name)
    if (current === null) continue
    let original = entries.get(name)
    if (original === undefined || current !== lastValues.get(name)) {
      original = current
      entries.set(name, original)
    }
    const next = translate(original)
    if (next !== current) element.setAttribute(name, next)
    lastValues.set(name, next)
  }
}

export function refreshTranslations(): void {
  // Vue Teleport renders dropdowns directly under <body>, outside #app.
  const root = document.body
  if (!root || processing) return
  processing = true
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
    let node: Node | null = walker.currentNode
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) visitText(node as Text)
      else if (node.nodeType === Node.ELEMENT_NODE) visitElement(node as Element)
      node = walker.nextNode()
    }
    document.documentElement.lang = language.value === 'zh' ? 'zh-CN' : language.value
  } finally {
    processing = false
  }
}

function scheduleRefresh(): void {
  if (scheduled) return
  scheduled = true
  queueMicrotask(() => {
    scheduled = false
    refreshTranslations()
  })
}

export function setLanguage(next: Language): void {
  if (next !== 'de' && next !== 'en' && next !== 'zh') return
  language.value = next
  try { localStorage.setItem(STORAGE_KEY, next) } catch { /* optional persistence */ }
  refreshTranslations()
}

export function installTranslationObserver(): void {
  if (observer) return
  refreshTranslations()
  const root = document.body
  if (!root) return
  observer = new MutationObserver(() => { if (!processing) scheduleRefresh() })
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [...attributes],
  })
}
