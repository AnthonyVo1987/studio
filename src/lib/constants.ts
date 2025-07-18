export const PENDING_STATUS_JSON_VARIANTS = [
  '{ "status": "pending..." }',
  '{ "status": "initializing..." }',
  '{ "status": "processing..." }',
  '{ "status": "analyzing..." }',
  '{ "status": "loading..." }'
] as const

export const ERROR_STATUS_JSON_VARIANTS = [
  '{ "status": "error" }',
  '{ "error": "',
  '"error":'
] as const

export const SUCCESS_STATUS_INDICATORS = [
  '"takeaways"',
  '"analysis"',
  '"summary"'
] as const
