// server/services/hub/validateHubPayload.js

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normaliseEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

export function validateHubPayload(payload, authenticatedEmail) {
  const errors = []

  if (!isObject(payload)) {
    return ['Uploaded file must contain a JSON object at the top level']
  }

  const meta = payload.file_metadata
  const student = payload.student
  const modules = payload.modules

  if (!isObject(meta)) {
    errors.push('Missing file_metadata object')
  } else {
    if (!meta.version) errors.push('file_metadata.version is required')
    if (!meta.generated_at) errors.push('file_metadata.generated_at is required')
    if (!meta.academic_year) errors.push('file_metadata.academic_year is required')
    if (!meta.semester) errors.push('file_metadata.semester is required')

    if (
      meta.semester &&
      !['1', '2', 'year_long'].includes(String(meta.semester))
    ) {
      errors.push('file_metadata.semester must be 1, 2, or year_long')
    }
  }

  if (!isObject(student)) {
    errors.push('Missing student object')
  } else {
    if (!student.student_number) errors.push('student.student_number is required')
    if (!student.email) errors.push('student.email is required')
    if (!isObject(student.name) || !student.name.full_name) {
      errors.push('student.name.full_name is required')
    }
    if (!isObject(student.school) || !student.school.name || !student.school.acronym) {
      errors.push('student.school.name and student.school.acronym are required')
    }
    if (!isObject(student.programme) || !student.programme.code || !student.programme.title) {
      errors.push('student.programme.code and student.programme.title are required')
    }
    if (student.year_of_study == null) {
      errors.push('student.year_of_study is required')
    }

    const fileEmail = normaliseEmail(student.email)
    const authEmail = normaliseEmail(authenticatedEmail)

    if (fileEmail && authEmail && fileEmail !== authEmail) {
      errors.push('Uploaded file email does not match the logged-in account')
    }
  }

  if (!Array.isArray(modules) || modules.length === 0) {
    errors.push('modules must be a non-empty array')
  } else {
    modules.forEach((module, moduleIndex) => {
      const prefix = `modules[${moduleIndex}]`

      if (!isObject(module)) {
        errors.push(`${prefix} must be an object`)
        return
      }

      if (!module.code) errors.push(`${prefix}.code is required`)
      if (!module.title) errors.push(`${prefix}.title is required`)
      if (module.credits == null) errors.push(`${prefix}.credits is required`)
      if (!module.semester) errors.push(`${prefix}.semester is required`)
      if (!module.level) errors.push(`${prefix}.level is required`)

      if (module.assessments != null) {
        if (!Array.isArray(module.assessments)) {
          errors.push(`${prefix}.assessments must be an array`)
        } else {
          module.assessments.forEach((assessment, assessmentIndex) => {
            const assessmentPrefix = `${prefix}.assessments[${assessmentIndex}]`

            if (!isObject(assessment)) {
              errors.push(`${assessmentPrefix} must be an object`)
              return
            }

            if (!assessment.title) errors.push(`${assessmentPrefix}.title is required`)
            if (!assessment.type) errors.push(`${assessmentPrefix}.type is required`)
            if (assessment.weighting == null) errors.push(`${assessmentPrefix}.weighting is required`)
            if (!assessment.deadline) errors.push(`${assessmentPrefix}.deadline is required`)
          })
        }
      }
    })
  }

  return errors
}