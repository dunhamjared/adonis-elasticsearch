import { EventEmitter } from 'node:events'
import type { ConnectionContract } from '../types/elasticsearch.js'
import { ClientOptions, Client } from '@elastic/elasticsearch'
import type { Logger } from '@adonisjs/core/logger'

export class Connection extends EventEmitter implements ConnectionContract {
  client?: Client

  get ready(): boolean {
    return !!this.client
  }

  constructor(
    public name: string,
    public config: ClientOptions,
    private logger: Logger
  ) {
    super()
    this.name = name
  }

  connect(): void {
    try {
      this.client = new Client(this.config)
      this.emit('connect', this)
    } catch (error) {
      this.emit('error', error, this)
      throw error
    }
    this.logger.info(`Connected to Elasticsearch cluster with connection name: ${this.name}`)
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return
    }
    try {
      await this.client.close()
      this.emit('disconnect', this)
      this.logger.info(`Disconnected from Elasticsearch cluster with connection name: ${this.name}`)
    } catch (error) {
      this.emit('disconnect:error', error, this)
      throw error
    }
  }
}
