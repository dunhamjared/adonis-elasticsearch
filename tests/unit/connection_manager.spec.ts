import { test } from '@japa/runner'
import { Emitter } from '@adonisjs/core/events'
import { Logger } from '@adonisjs/core/logger'
import { ConnectionManager } from '../../src/connection/manager.js'

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
            level: 'trace'
        })
        emitter = await createEmitter()
    })

    test('add a new connection', ({ assert }) => {
        const manager = new ConnectionManager(logger, emitter)
        manager.add('main', { node: 'http://localhost:9200' })
        assert.isTrue(manager.has('main'))
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

    test('remove a connection', async ({ assert }) => {
        const manager = new ConnectionManager(logger, emitter)
        manager.add('main', { node: 'http://localhost:9200' })
        await manager.release('main')
        assert.isFalse(manager.has('main'))
    })

    test('close a connection', async ({ assert }) => {
        const manager = new ConnectionManager(logger, emitter)
        manager.add('main', { node: 'http://localhost:9200' })
        manager.connect('main')
        await manager.close('main')
        assert.isTrue(manager.has('main'))
        assert.isFalse(manager.isConnected('main'))
    })
})
