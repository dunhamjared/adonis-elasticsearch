import { createError } from '@poppinss/utils'

export const E_RUNTIME_EXCEPTION = createError('%s', 'E_RUNTIME_EXCEPTION', 500)

export const E_UNMANAGED_ELASTICSEARCH_CONNECTION = createError(
  'Unmanaged elasticsearch connection %s',
  'E_UNMANAGED_ELASTICSEARCH_CONNECTION',
  500
)
