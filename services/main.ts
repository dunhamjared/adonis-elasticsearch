import app from '@adonisjs/core/services/app'
import { Elasticsearch } from '../src/elasticsearch/main.js'

let es: Elasticsearch

/**
 * Returns a singleton instance of the Elasticsearch class from the
 * container
 */
await app.booted(async () => {
  es = await app.container.make('elasticsearch')
})

export { es as default }
