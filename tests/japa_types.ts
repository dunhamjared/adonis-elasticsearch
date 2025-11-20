import { Assert } from '@japa/assert'

declare module '@japa/runner/core' {
  interface TestContext {
    assert: Assert
  }
}
