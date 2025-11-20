import { test } from '@japa/runner'
import { Logger } from '@adonisjs/core/logger'
import { Emitter } from '@adonisjs/core/events'
import { Elasticsearch } from '../../src/elasticsearch/main.js'
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

test.group('Elasticsearch', (group) => {
  let logger: Logger
  let emitter: Emitter<any>

  group.setup(async () => {
    logger = new Logger({
      enabled: false,
      level: 'trace',
    })
    emitter = await createEmitter()
  })

  test('instantiate with config', ({ assert }) => {
    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)
    assert.equal(es.primaryConnectionName, 'main')
  })

  test('get default client', async ({ assert }) => {
    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)
    const client = es.client()

    assert.isDefined(client)

    // verify we can make a request
    // We just check if client is usable, as response mocking is tricky with internals
    assert.isFunction(client.info)
  })

  test('get specific connection', async ({ assert }) => {
    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
        secondary: {
          node: 'http://localhost:9201',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)
    const client = es.connection('secondary')

    assert.isDefined(client)
  })

  test('getRawConnection returns connection node', ({ assert }) => {
    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)
    const node = es.getRawConnection('main')
    assert.isDefined(node)
    assert.equal(node?.name, 'main')
  })

  test('throw error for missing connection', ({ assert }) => {
    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)

    try {
      es.connection('missing')
      assert.fail('Should have thrown error')
    } catch (error) {
      assert.include(error.message, 'Unmanaged elasticsearch connection missing')
    }
  })

  test('connection throws if client cannot be created', ({ assert }) => {
    // This case is hard to hit because manager.connect() usually succeeds in creating a connection instance
    // unless config is invalid or something.
    // The 'if (!rawConnection?.client)' check in main.ts line 39 seems to be a safety check
    // in case connection exists but client wasn't initialized (which shouldn't happen if connect() works).
    // We can force it by messing with internal state.

    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)

    // Mock manager.connect to do nothing or fail to set client
    es.manager.connect = () => {}
    // Mock manager.get to return a node without connection/client
    es.manager.get = (name) => ({ name, config: {}, state: 'registered' }) as any

    try {
      es.connection('main')
      assert.fail('Should throw')
    } catch (error) {
      assert.equal(error.message, 'Cannot get connection for main')
    }
  })

  test('close specific connection', async ({ assert }) => {
    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)
    es.client()

    await es.close('main')
    // Should be closed
    const raw = es.getRawConnection('main')
    assert.equal(raw?.state, 'closing')
  })

  test('release connection', async ({ assert }) => {
    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)
    es.client()

    await es.release('main')

    const raw = es.getRawConnection('main')
    assert.isUndefined(raw)
  })

  test('close all connections', async () => {
    const config = {
      connection: 'main',
      connections: {
        main: {
          node: 'http://localhost:9200',
          Connection: mockConnection(),
        },
      },
    }
    const es = new Elasticsearch(config, logger, emitter)
    // Ensure it's connected
    es.client()

    await es.closeAll()
  })
})
