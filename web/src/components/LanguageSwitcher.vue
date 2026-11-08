<script setup lang="ts">
import { language, setLanguage, type Language } from '@/i18n'

const labels: Record<Language, string> = {
  de: 'Sprache der Oberfläche',
  en: 'Interface language',
  zh: '界面语言',
}
</script>

<template>
  <label class="language-control" data-no-translate>
    <span class="language-control__icon" aria-hidden="true">🌐</span>
    <select :value="language" :aria-label="labels[language]" @change="setLanguage(($event.target as HTMLSelectElement).value as Language)">
      <option value="de">Deutsch</option>
      <option value="en">English</option>
      <option value="zh">简体中文</option>
    </select>
  </label>
</template>

<style scoped>
.language-control { display: inline-flex; align-items: center; gap: 5px; border: 1px solid var(--border-default);
  color: var(--text-primary); background: var(--bg-surface); border-radius: var(--radius-md); padding: 5px 7px;
  font-size: 12px; flex-shrink: 0; }
.language-control select { color: inherit; background: transparent; border: none; outline-offset: 3px;
  cursor: pointer; max-width: 110px; font: inherit; }
.language-control option { color: #111; }
.language-control__icon { line-height: 1; }
</style>
