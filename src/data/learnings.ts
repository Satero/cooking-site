// Pure helpers for learnings. A learning with recipeId === null is "general"
// and applies to all cooking.

import type { AppData, Learning } from '../types'
import { newId } from '../storage'

export type LearningInput = Omit<Learning, 'id'>

export function createLearning(data: AppData, input: LearningInput): AppData {
  return { ...data, learnings: [...data.learnings, { ...input, id: newId() }] }
}

export function updateLearning(data: AppData, id: string, input: LearningInput): AppData {
  return { ...data, learnings: data.learnings.map((l) => (l.id === id ? { ...l, ...input } : l)) }
}

export function deleteLearning(data: AppData, id: string): AppData {
  return { ...data, learnings: data.learnings.filter((l) => l.id !== id) }
}

/** Newest first; ties broken by insertion order (stable sort). */
export function sortLearnings(learnings: Learning[]): Learning[] {
  return [...learnings].sort((a, b) => b.date.localeCompare(a.date))
}

export function learningsForRecipe(data: AppData, recipeId: string): Learning[] {
  return sortLearnings(data.learnings.filter((l) => l.recipeId === recipeId))
}

export function generalLearnings(data: AppData): Learning[] {
  return sortLearnings(data.learnings.filter((l) => l.recipeId === null))
}
