// server/services/hub/importHubData.js

import db from '../../db/index.js'
import { upsertStudentProfile } from '../../db/dal/users.js'

class ImportConflictError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ImportConflictError'
    this.code = 'IMPORT_ALREADY_EXISTS'
  }
}

const countUserModulesForUserStmt = db.prepare(`
  SELECT COUNT(*) AS count
  FROM user_modules
  WHERE user_id = ?
`)

const findModuleOrganiserByEmailStmt = db.prepare(`
  SELECT id FROM module_organisers WHERE email = ?
`)

const insertModuleOrganiserStmt = db.prepare(`
  INSERT INTO module_organisers (name, email, office, office_hours)
  VALUES (?, ?, ?, ?)
`)

const updateModuleOrganiserStmt = db.prepare(`
  UPDATE module_organisers
  SET name = ?, office = ?, office_hours = ?
  WHERE id = ?
`)

const upsertModuleStmt = db.prepare(`
  INSERT INTO modules (
    code,
    title,
    credits,
    semester,
    level,
    description,
    module_organiser_id,
    blackboard_url
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(code) DO UPDATE SET
    title = excluded.title,
    credits = excluded.credits,
    semester = excluded.semester,
    level = excluded.level,
    description = excluded.description,
    module_organiser_id = excluded.module_organiser_id,
    blackboard_url = excluded.blackboard_url
`)

const insertUserModuleStmt = db.prepare(`
  INSERT OR IGNORE INTO user_modules (user_id, module_code, academic_year)
  VALUES (?, ?, ?)
`)

const findStaffByEmailStmt = db.prepare(`
  SELECT id FROM staff WHERE email = ?
`)

const insertStaffStmt = db.prepare(`
  INSERT INTO staff (name, email, office)
  VALUES (?, ?, ?)
`)

const updateStaffStmt = db.prepare(`
  UPDATE staff
  SET name = ?, office = ?
  WHERE id = ?
`)

const insertModuleStaffStmt = db.prepare(`
  INSERT OR IGNORE INTO module_staff (module_code, staff_id, role, responsibilities)
  VALUES (?, ?, ?, ?)
`)

const countAssessmentsForModuleStmt = db.prepare(`
  SELECT COUNT(*) AS count FROM assessments WHERE module_code = ?
`)

const insertAssessmentStmt = db.prepare(`
  INSERT INTO assessments (
    module_code,
    title,
    type,
    weighting,
    deadline,
    submission_method,
    description,
    word_limit,
    location
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertAssessmentFileTypeStmt = db.prepare(`
  INSERT OR IGNORE INTO assessment_file_types (assessment_id, file_type)
  VALUES (?, ?)
`)

const insertSuggestedMilestoneStmt = db.prepare(`
  INSERT INTO suggested_milestones (
    assessment_id,
    title,
    suggested_deadline,
    description,
    completion_percentage
  ) VALUES (?, ?, ?, ?, ?)
`)

const insertSuggestedTaskStmt = db.prepare(`
  INSERT INTO suggested_tasks (
    assessment_id,
    title,
    type,
    estimated_hours,
    description
  ) VALUES (?, ?, ?, ?, ?)
`)

const countEventsForModuleStmt = db.prepare(`
  SELECT COUNT(*) AS count FROM events WHERE module_code = ?
`)

const insertEventStmt = db.prepare(`
  INSERT INTO events (
    module_code,
    title,
    type,
    start_time,
    end_time,
    location,
    is_recurring,
    recurrence_pattern,
    recurrence_end_date,
    is_mandatory,
    notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertEventStaffStmt = db.prepare(`
  INSERT OR IGNORE INTO event_staff (event_id, staff_id)
  VALUES (?, ?)
`)

const countResourcesForModuleStmt = db.prepare(`
  SELECT COUNT(*) AS count FROM resources WHERE module_code = ?
`)

const insertResourceStmt = db.prepare(`
  INSERT INTO resources (
    module_code,
    type,
    title,
    edition,
    isbn,
    is_required,
    url,
    description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`)

const insertResourceAuthorStmt = db.prepare(`
  INSERT OR IGNORE INTO resource_authors (resource_id, author_name)
  VALUES (?, ?)
`)

const countWeeklyTopicsForModuleStmt = db.prepare(`
  SELECT COUNT(*) AS count FROM weekly_topics WHERE module_code = ?
`)

const insertWeeklyTopicStmt = db.prepare(`
  INSERT INTO weekly_topics (
    module_code,
    week,
    week_start_date,
    topic,
    reading,
    notes
  ) VALUES (?, ?, ?, ?, ?, ?)
`)

const insertWeeklyTopicSubtopicStmt = db.prepare(`
  INSERT OR REPLACE INTO weekly_topic_subtopics (
    weekly_topic_id,
    position,
    subtopic
  ) VALUES (?, ?, ?)
`)

function getOrCreateModuleOrganiserId(organiser) {
  if (!organiser?.email) return null

  const existing = findModuleOrganiserByEmailStmt.get(organiser.email)

  if (existing) {
    updateModuleOrganiserStmt.run(
      organiser.name ?? '',
      organiser.office ?? null,
      organiser.office_hours ?? null,
      existing.id
    )
    return existing.id
  }

  const result = insertModuleOrganiserStmt.run(
    organiser.name ?? '',
    organiser.email,
    organiser.office ?? null,
    organiser.office_hours ?? null
  )

  return Number(result.lastInsertRowid)
}

function getOrCreateStaffId(staffMember) {
  if (!staffMember?.email) return null

  const existing = findStaffByEmailStmt.get(staffMember.email)

  if (existing) {
    updateStaffStmt.run(
      staffMember.name ?? '',
      staffMember.office ?? null,
      existing.id
    )
    return existing.id
  }

  const result = insertStaffStmt.run(
    staffMember.name ?? '',
    staffMember.email,
    staffMember.office ?? null
  )

  return Number(result.lastInsertRowid)
}

function countForModule(stmt, moduleCode) {
  return Number(stmt.get(moduleCode)?.count ?? 0)
}

const importHubDataTxn = db.transaction(({ userId, payload }) => {
  const existingModuleCount = Number(
    countUserModulesForUserStmt.get(userId)?.count ?? 0
  )

  if (existingModuleCount > 0) {
    throw new ImportConflictError(
      'This user already has imported academic data. Re-import is not supported yet.'
    )
  }

  const { file_metadata, student, modules } = payload

  upsertStudentProfile({
    user_id: userId,
    student_number: student.student_number,
    full_name: student.name?.full_name ?? null,
    preferred_name: student.name?.preferred_name ?? null,
    school_name: student.school?.name ?? null,
    school_acronym: student.school?.acronym ?? null,
    programme_code: student.programme?.code ?? null,
    programme_title: student.programme?.title ?? null,
    year_of_study: student.year_of_study ?? null,
    level_of_study: student.level_of_study ?? null,
    has_reasonable_adjustments: student.has_reasonable_adjustments ?? false,
    advisor_name: student.academic_advisor?.name ?? null,
    advisor_email: student.academic_advisor?.email ?? null,
    advisor_office: student.academic_advisor?.office ?? null,
  })

  const summary = {
    academic_year: file_metadata.academic_year,
    semester: file_metadata.semester,
    modulesImported: 0,
    assessmentsImported: 0,
    eventsImported: 0,
    resourcesImported: 0,
    weeklyTopicsImported: 0,
  }

  for (const module of modules) {
    const organiserId = getOrCreateModuleOrganiserId(module.module_organiser)

    upsertModuleStmt.run(
      module.code,
      module.title,
      module.credits,
      module.semester,
      module.level,
      module.description ?? null,
      organiserId,
      module.resources?.blackboard_url ?? null
    )

    insertUserModuleStmt.run(
      userId,
      module.code,
      file_metadata.academic_year
    )

    summary.modulesImported += 1

    const staffIdByName = new Map()

    for (const staffMember of module.teaching_staff ?? []) {
      const staffId = getOrCreateStaffId(staffMember)

      if (!staffId) continue

      staffIdByName.set(staffMember.name, staffId)

      insertModuleStaffStmt.run(
        module.code,
        staffId,
        staffMember.role ?? 'lecturer',
        staffMember.responsibilities ?? null
      )
    }

    if (countForModule(countAssessmentsForModuleStmt, module.code) === 0) {
      for (const assessment of module.assessments ?? []) {
        const assessmentResult = insertAssessmentStmt.run(
          module.code,
          assessment.title,
          assessment.type,
          assessment.weighting,
          assessment.deadline,
          assessment.submission_method ?? null,
          assessment.description ?? null,
          assessment.word_limit ?? null,
          assessment.location ?? null
        )

        const assessmentId = Number(assessmentResult.lastInsertRowid)
        summary.assessmentsImported += 1

        for (const fileType of assessment.file_types ?? []) {
          insertAssessmentFileTypeStmt.run(assessmentId, fileType)
        }

        for (const milestone of assessment.suggested_milestones ?? []) {
          insertSuggestedMilestoneStmt.run(
            assessmentId,
            milestone.title,
            milestone.suggested_deadline ?? null,
            milestone.description ?? null,
            milestone.completion_percentage ?? null
          )
        }

        for (const suggestedTask of assessment.suggested_tasks ?? []) {
          insertSuggestedTaskStmt.run(
            assessmentId,
            suggestedTask.title,
            suggestedTask.type ?? 'other',
            suggestedTask.estimated_hours ?? null,
            suggestedTask.description ?? null
          )
        }
      }
    }

    if (countForModule(countEventsForModuleStmt, module.code) === 0) {
      for (const event of module.events ?? []) {
        const eventResult = insertEventStmt.run(
          module.code,
          event.title,
          event.type ?? 'other',
          event.start_time ?? null,
          event.end_time ?? null,
          event.location ?? null,
          event.is_recurring ? 1 : 0,
          event.recurrence_pattern ?? null,
          event.recurrence_end_date ?? null,
          event.is_mandatory ? 1 : 0,
          event.notes ?? null
        )

        const eventId = Number(eventResult.lastInsertRowid)
        summary.eventsImported += 1

        for (const staffName of event.teaching_staff ?? []) {
          const staffId = staffIdByName.get(staffName)
          if (staffId) {
            insertEventStaffStmt.run(eventId, staffId)
          }
        }
      }
    }

    if (countForModule(countResourcesForModuleStmt, module.code) === 0) {
      for (const textbook of module.resources?.textbooks ?? []) {
        const resourceResult = insertResourceStmt.run(
          module.code,
          'textbook',
          textbook.title,
          textbook.edition ?? null,
          textbook.isbn ?? null,
          textbook.is_required ? 1 : 0,
          textbook.library_link ?? null,
          null
        )

        const resourceId = Number(resourceResult.lastInsertRowid)
        summary.resourcesImported += 1

        for (const authorName of textbook.authors ?? []) {
          insertResourceAuthorStmt.run(resourceId, authorName)
        }
      }

      for (const resource of module.resources?.online_resources ?? []) {
        const resourceResult = insertResourceStmt.run(
          module.code,
          'online_resource',
          resource.title,
          null,
          null,
          0,
          resource.url ?? null,
          resource.description ?? null
        )

        const resourceId = Number(resourceResult.lastInsertRowid)
        summary.resourcesImported += 1

        for (const authorName of resource.authors ?? []) {
          insertResourceAuthorStmt.run(resourceId, authorName)
        }
      }
    }

    if (countForModule(countWeeklyTopicsForModuleStmt, module.code) === 0) {
      for (const weeklyTopic of module.weekly_topics ?? []) {
        const weeklyTopicResult = insertWeeklyTopicStmt.run(
          module.code,
          weeklyTopic.week,
          weeklyTopic.week_start_date ?? null,
          weeklyTopic.topic,
          weeklyTopic.reading ?? null,
          weeklyTopic.notes ?? null
        )

        const weeklyTopicId = Number(weeklyTopicResult.lastInsertRowid)
        summary.weeklyTopicsImported += 1

        ;(weeklyTopic.subtopics ?? []).forEach((subtopic, index) => {
          insertWeeklyTopicSubtopicStmt.run(
            weeklyTopicId,
            index + 1,
            subtopic
          )
        })
      }
    }
  }

  return summary
})

export function getImportStatusForUser(userId) {
  const moduleCount = Number(
    countUserModulesForUserStmt.get(userId)?.count ?? 0
  )

  return {
    hasImportedData: moduleCount > 0,
    moduleCount,
  }
}

export function importHubDataForUser({ userId, payload }) {
  return importHubDataTxn({ userId, payload })
}

export { ImportConflictError }