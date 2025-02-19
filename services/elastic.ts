import app from '@adonisjs/core/services/app'
import { Elasticsearch } from '../src/elasticsearch/main.js'

let elastic: Elasticsearch

await app.booted(async () => {
  elastic = await app.container.make(Elasticsearch)
})

export { elastic as default }
