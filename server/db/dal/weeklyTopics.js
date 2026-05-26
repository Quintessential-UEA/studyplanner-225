// ─── server/db/dal/weeklyTopics.js ───────────────────────────────────────────
// Data Access Layer for: weekly_topics, weekly_topic_subtopics
//
// Weekly topics track the teaching schedule for each module week-by-week.
// Each weekly topic can have ordered subtopics for more granular detail.
// ──────────────────────────────────────────────────────────────────────────────

import db from '../index.js'

// ═══ WEEKLY TOPICS ═══════════════════════════════════════════════════════════

const findWeeklyTopicsByModule = db.prepare(`
  SELECT * FROM weekly_topics WHERE module_code = ? ORDER BY week
`)

const findSubtopicsForWeek = db.prepare(`
  SELECT subtopic FROM weekly_topic_subtopics
  WHERE weekly_topic_id = ?
  ORDER BY position
`)

/** Get all weekly topics for a module, ordered by week number. */
export function getWeeklyTopicsByModule(moduleCode) {
  return findWeeklyTopicsByModule.all(moduleCode)
}

/** Get ordered subtopics for a weekly topic. */
export function getSubtopicsForWeek(weeklyTopicId) {
  return findSubtopicsForWeek.all(weeklyTopicId).map(r => r.subtopic)
}

/**
 * Get weekly topics for a module with subtopics attached to each.
 * @param {string} moduleCode
 * @returns {object[]} Weekly topics with a `subtopics` string array
 */
export function getWeeklyTopicsWithSubtopics(moduleCode) {
  const weeks = getWeeklyTopicsByModule(moduleCode)
  return weeks.map(w => ({
    ...w,
    subtopics: getSubtopicsForWeek(w.id),
  }))
}
