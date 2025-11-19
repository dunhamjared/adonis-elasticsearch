import type { Logger } from '@adonisjs/core/logger'
import type { ConnectionManagerContract, ElasticConfig } from '../types/elasticsearch.js'
import type { Emitter } from '@adonisjs/core/events'
import Macroable from '@poppinss/macroable'
import { ConnectionManager } from '../connection/manager.js'
import type { Client } from '@elastic/elasticsearch'

export class Elasticsearch extends Macroable {
  manager: ConnectionManagerContract

  primaryConnectionName: string

  constructor(
    public config: ElasticConfig,
    private logger: Logger,
    private emitter: Emitter<any>
  ) {
    super()
    this.manager = new ConnectionManager(this.logger, this.emitter)
    this.primaryConnectionName = config.connection
    this.registerConnections()
  }

  private registerConnections() {
    Object.keys(this.config.connections).forEach((name) => {
      this.manager.add(name, this.config.connections[name])
    })
  }

  getRawConnection(name: string) {
    return this.manager.get(name)
  }

  connection(connection: string = this.primaryConnectionName): Client {
    this.manager.connect(connection)
    const rawConnection = this.getRawConnection(connection)!.connection!

    if (!rawConnection?.client) {
      throw new Error(`Cannot get connection for ${connection}`)
    }

    this.logger.trace({ connection }, 'acquiring elasticsearch connection')

    return rawConnection?.client
  }

  client() {
    return this.connection(this.primaryConnectionName)
  }

  async close(connection: string = this.primaryConnectionName) {
    return this.manager.close(connection)
  }

  async closeAll() {
    return this.manager.closeAll()
  }

  async release(connection: string = this.primaryConnectionName) {
    return this.manager.release(connection)
  }
}
