import type { ApplicationService } from '@adonisjs/core/types'
import type { ConnectionContract, ElasticConfig } from '../src/types/elasticsearch.js'
import { Elasticsearch } from '../src/elasticsearch/main.js'
import { Client } from '@elastic/elasticsearch'

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    elasticsearch: Elasticsearch
  }
  export interface EventsList {
    'elasticsearch:connection:connect': ConnectionContract
    'elasticsearch:connection:disconnect': ConnectionContract
    'elasticsearch:connection:error': [Error, ConnectionContract]
  }
}

export default class ElasticProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bind    ings to the container
   */
  register() {
    this.app.container.singleton(Elasticsearch, async (resolver) => {
      const config = this.app.config.get<ElasticConfig>('elasticsearch')
      const emitter = await resolver.make('emitter')
      const logger = await resolver.make('logger')
      const elasticsearch = new Elasticsearch(config, logger, emitter)
      return elasticsearch
    })

    this.app.container.singleton(Client, async (resolver) => {
      const elasticsearch = await resolver.make('elasticsearch')
      return elasticsearch.connection() as Client
    })

    this.app.container.alias('elasticsearch', Elasticsearch)
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    const elasticsearch = await this.app.container.make('elasticsearch')
    await elasticsearch.manager.closeAll()
  }
}
