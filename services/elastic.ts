import app from '@adonisjs/core/services/app'
import { Elasticsearch } from '../src/elasticsearch/main.js'

let es: Elasticsearch

await app.booted(async () => {
  es = await app.container.make(Elasticsearch)
})

export { es as default }
