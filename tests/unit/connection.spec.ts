import { test } from '@japa/runner'
import { Logger } from '@adonisjs/core/logger'
import { Connection } from '../../src/connection/index.js'
import { MockConnection } from '../helpers.js'

test.group('Connection', (group) => {
  let logger: Logger

  group.setup(async () => {
    logger = new Logger({
      enabled: false,
      level: 'trace',
    })
  })

  test('instantiate client on connect', ({ assert }) => {
    const connection = new Connection(
      'main',
      { node: 'http://localhost:9200', Connection: MockConnection },
      logger
    )

    assert.isUndefined(connection.client)
    assert.isFalse(connection.ready)

    connection.connect()

    assert.isDefined(connection.client)
    assert.isTrue(connection.ready)
  })

  test('disconnect closes client', async ({ assert }) => {
    const connection = new Connection(
      'main',
      { node: 'http://localhost:9200', Connection: MockConnection },
      logger
    )

    connection.connect()
    assert.isDefined(connection.client)

    let disconnectEventEmitted = false
    connection.on('disconnect', () => {
      disconnectEventEmitted = true
    })

    await connection.disconnect()
    assert.isTrue(disconnectEventEmitted)
  })

  test('disconnect does nothing if no client', async ({ assert }) => {
    const connection = new Connection(
      'main',
      { node: 'http://localhost:9200', Connection: MockConnection },
      logger
    )

    // Should not throw
    await connection.disconnect()
    assert.isUndefined(connection.client)
  })

  test('disconnect emits error if client close fails', async ({ assert }) => {
    const connection = new Connection(
      'main',
      { node: 'http://localhost:9200', Connection: MockConnection },
      logger
    )

    connection.connect()

    // Mock internal client close to throw
    if (connection.client) {
      connection.client.close = async () => {
        throw new Error('Close failed')
      }
    }

    let errorEmitted: any
    connection.on('disconnect:error', (err) => {
      errorEmitted = err
    })

    try {
      await connection.disconnect()
    } catch (error) {
      assert.equal(error.message, 'Close failed')
    }

    assert.exists(errorEmitted)
    assert.equal(errorEmitted.message, 'Close failed')
  })

  test('emit error if connection fails', async ({ assert }) => {
    const connection = new Connection(
      'main',
      { node: 'invalid-url', Connection: MockConnection },
      logger
    )

    let errorEmitted: any

    connection.on('error', (err) => {
      errorEmitted = err
    })

    try {
      connection.connect()
    } catch (e) {
      // The client constructor might throw synchronously for invalid URL
      errorEmitted = e
    }

    assert.exists(errorEmitted)
  })
})
