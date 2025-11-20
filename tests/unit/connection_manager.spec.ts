import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { Logger } from '@adonisjs/core/logger'
import { ConnectionManager } from '../../src/connection/manager.js'
import { mockConnection } from '../helpers.js'

async function createEmitter() {
  const { Application } = await import('@adonisjs/core/app')
  const app = new Application(new URL('./', import.meta.url), {
    environment: 'test',
  })
  await app.init()
  await app.boot()

  return new Emitter(app)
}

test.group('ConnectionManager', (group) => {
  let logger: Logger
  let emitter: Emitter<any>

  group.setup(async () => {
    logger = new Logger({
      enabled: false,
      level: 'trace',
    })
    emitter = await createEmitter()
  })

  test('add a new connection', ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200' })
    assert.isTrue(manager.has('main'))
    assert.deepEqual(manager.get('main')?.config, { node: 'http://localhost:9200' })
  })

  test('add existing connection does nothing', ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200' })
    manager.add('main', { node: 'http://localhost:9201' })
    assert.deepEqual(manager.get('main')?.config, { node: 'http://localhost:9200' })
  })

  test('get a connection', ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200' })
    const connection = manager.get('main')
    assert.deepEqual(connection?.config, { node: 'http://localhost:9200' })
  })

  test('patch a connection', ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200' })
    manager.patch('main', { node: 'http://localhost:9201' })
    assert.deepEqual(manager.get('main')?.config, { node: 'http://localhost:9201' })
  })

  test('patch adds connection if not exists', ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.patch('main', { node: 'http://localhost:9201' })
    assert.isTrue(manager.has('main'))
    assert.deepEqual(manager.get('main')?.config, { node: 'http://localhost:9201' })
  })

  test('patch disconnects existing connection', async ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200', Connection: mockConnection() })
    manager.connect('main')

    const conn = manager.get('main')!
    const originalConnectionInstance = conn.connection

    assert.isDefined(originalConnectionInstance)

    // We track if disconnect event is handled as "orphan"
    // The manager logs "disconnecting connection inside manager"
    // We can check if the event is emitted by manager, but manager emits 'es:connection:disconnect' for orphans too.

    let disconnectEmitted = false
    emitter.on('es:connection:disconnect', () => {
      disconnectEmitted = true
    })

    manager.patch('main', { node: 'http://localhost:9201', Connection: mockConnection() })

    // Patch calls disconnect async, so wait a bit
    await new Promise((resolve) => setTimeout(resolve, 10))

    assert.isTrue(disconnectEmitted)
    assert.isUndefined(conn.connection)
    assert.equal(conn.state, 'migrating')
  })

  test('handle events for removed connection', async ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200', Connection: mockConnection() })
    manager.connect('main')

    const connection = manager.get('main')!.connection!

    // Remove connection from manager
    manager.connections.delete('main')

    // Emit events
    let eventEmitted = false
    emitter.on('es:connection:disconnect', () => (eventEmitted = true))
    emitter.on('es:connection:connect', () => (eventEmitted = true))

    connection.emit('disconnect', connection)
    connection.emit('connect', connection)

    await new Promise((resolve) => setTimeout(resolve, 10))

    assert.isFalse(eventEmitted)
  })

  test('remove a connection', async ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200' })
    await manager.release('main')
    assert.isFalse(manager.has('main'))
  })

  test('close a connection', async ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200', Connection: mockConnection() })
    manager.connect('main')
    await manager.close('main')
    assert.isTrue(manager.has('main'))
    assert.isFalse(manager.isConnected('main'))
  })

  test('close unmanaged connection does nothing', async ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    await manager.close('missing')
    assert.isFalse(manager.has('missing'))
  })

  test('connect throws if connection not registered', ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    try {
      manager.connect('missing')
    } catch (e) {
      assert.equal(e.message, 'Unmanaged elasticsearch connection missing')
    }
  })

  test('connect does nothing if already connected', ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200', Connection: mockConnection() })
    manager.connect('main')
    const conn1 = manager.get('main')!.connection

    manager.connect('main')
    const conn2 = manager.get('main')!.connection

    assert.strictEqual(conn1, conn2)
  })

  test('isConnected returns false if not registered', ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    assert.isFalse(manager.isConnected('missing'))
  })

  test('monitor connect event', async ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200', Connection: mockConnection() })

    let connectEmitted = false
    emitter.on('es:connection:connect', () => {
      connectEmitted = true
    })

    manager.connect('main')

    await new Promise((resolve) => setTimeout(resolve, 10))

    assert.isTrue(connectEmitted)
    assert.equal(manager.get('main')!.state, 'open')
  })

  test('monitor disconnect event', async ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200', Connection: mockConnection() })
    manager.connect('main')

    const connection = manager.get('main')!.connection!

    let disconnectEmitted = false
    emitter.on('es:connection:disconnect', () => {
      disconnectEmitted = true
    })

    await connection.disconnect()

    await new Promise((resolve) => setTimeout(resolve, 10))

    assert.isTrue(disconnectEmitted)
    assert.equal(manager.get('main')!.state, 'closed')
  })

  test('monitor error event', async ({ assert }) => {
    const manager = new ConnectionManager(logger, emitter)
    manager.add('main', { node: 'http://localhost:9200', Connection: mockConnection() })
    manager.connect('main')

    const connection = manager.get('main')!.connection!

    let errorEmitted = false
    emitter.on('es:connection:error', () => {
      errorEmitted = true
    })

    connection.emit('error', new Error('Fail'), connection)

    await new Promise((resolve) => setTimeout(resolve, 10))

    assert.isTrue(errorEmitted)
  })
})
