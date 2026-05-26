// ─── server/db/dal/resources.js ──────────────────────────────────────────────
// Data Access Layer for: resources, resource_authors
//
// Resources are learning materials (textbooks, online links) associated with
// modules. Textbooks can have multiple authors via the resource_authors table.
// ──────────────────────────────────────────────────────────────────────────────

import db from '../index.js'

// ═══ RESOURCES ═══════════════════════════════════════════════════════════════

const findResourcesByModule = db.prepare(`
  SELECT * FROM resources WHERE module_code = ? ORDER BY is_required DESC, title
`)

const findAuthorsForResource = db.prepare(`
  SELECT author_name FROM resource_authors WHERE resource_id = ?
`)

/** Get all resources for a module, required items first. */
export function getResourcesByModule(moduleCode) {
  return findResourcesByModule.all(moduleCode)
}

/** Get authors for a resource (textbooks). */
export function getAuthorsForResource(resourceId) {
  return findAuthorsForResource.all(resourceId).map(r => r.author_name)
}

/**
 * Get all resources for a module with authors attached to each one.
 * @param {string} moduleCode
 * @returns {object[]} Resources with an `authors` array
 */
export function getResourcesWithAuthors(moduleCode) {
  const resources = getResourcesByModule(moduleCode)
  return resources.map(r => ({
    ...r,
    authors: getAuthorsForResource(r.id),
  }))
}
