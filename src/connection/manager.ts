import type { Emitter } from '@adonisjs/core/events'
import type { Logger } from '@adonisjs/core/logger'
import {
  ConnectionManagerContract,
  ConnectionNode,
  ConnectionContract,
} from '../types/elasticsearch.js'
import { ClientOptions } from '@elastic/elasticsearch'
import * as errors from '../errors.js'
import { Connection } from './index.js'

export class ConnectionManager implements ConnectionManagerContract {
  connections: ConnectionManagerContract['connections'] = new Map()

  private orphanConnections: Set<ConnectionContract> = new Set()

  constructor(
    private logger: Logger,
    private emitter: Emitter<any>
  ) {}

  private monitorConnection(connection: ConnectionContract): void {
    connection.on('disconnect', ($connection) => this.handleDisconnect($connection))
    connection.on('connect', ($connection) => this.handleConnect($connection))
    connection.on('error', (error, $connection) => {
      this.emitter.emit('es:connection:error', [error, $connection])
    })
  }

  private handleDisconnect(connection: ConnectionContract): void {
    if (this.orphanConnections.has(connection)) {
      this.orphanConnections.delete(connection)
      this.emitter.emit('es:connection:disconnect', connection)
      this.logger.trace({ connection: connection.name }, 'disconnecting connection inside manager')
      return
    }

    const internalConnection = this.get(connection.name)

    if (!internalConnection) {
      return
    }

    this.emitter.emit('es:connection:disconnect', connection)
    this.logger.trace({ connection: connection.name }, 'disconnecting connection inside manager')

    delete internalConnection.connection
    internalConnection.state = 'closed'
  }

  private handleConnect(connection: ConnectionContract): void {
    const internalConnection = this.get(connection.name)

    if (!internalConnection) {
      return
    }

    this.emitter.emit('es:connection:connect', connection)
    this.logger.trace({ connection: connection.name }, 'connection connected inside manager')

    internalConnection.state = 'open'
  }

  add(connectionName: string, config: ClientOptions): void {
    if (this.has(connectionName)) {
      return
    }

    this.logger.trace({ connection: connectionName }, 'adding new connection to the manager')

    this.connections.set(connectionName, {
      name: connectionName,
      config: config,
      state: 'registered',
    })
  }

  connect(connectionName: string): void {
    const connection = this.connections.get(connectionName)

    // Raise error when connection is not registered
    if (!connection) {
      throw new errors.E_UNMANAGED_ELASTICSEARCH_CONNECTION([connectionName])
    }

    // Do nothing if connection is already instantiated
    if (this.isConnected(connection.name)) {
      return
    }

    connection.connection = new Connection(connection.name, connection.config, this.logger)
    this.monitorConnection(connection.connection)
    connection.connection.connect()
  }

  get(connectionName: string): ConnectionNode | undefined {
    return this.connections.get(connectionName)
  }

  has(connectionName: string): boolean {
    return this.connections.has(connectionName)
  }

  patch(connectionName: string, config: ClientOptions): void {
    const connection = this.get(connectionName)

    // Add the connection
    if (!connection) {
      return this.add(connectionName, config)
    }

    // Disconnect the connection
    if (connection.connection) {
      this.orphanConnections.add(connection.connection)
      connection.connection.disconnect()
    }

    // Update the config
    connection.state = 'migrating'
    connection.config = config

    // Remove the connection instance
    delete connection.connection
  }

  isConnected(connectionName: string): boolean {
    if (!this.has(connectionName)) {
      return false
    }

    const connection = this.get(connectionName)!
    return !!connection.connection && connection.state === 'open'
  }

  async close(connectionName: string, release?: boolean): Promise<void> {
    if (this.isConnected(connectionName)) {
      const connection = this.get(connectionName)!
      await connection.connection!.disconnect()
      connection.state = 'closing'
    }

    if (release) {
      await this.release(connectionName)
    }
  }

  async closeAll(release?: boolean): Promise<void> {
    await Promise.all(Array.from(this.connections.keys()).map((name) => this.close(name, release)))
  }

  async release(connectionName: string): Promise<void> {
    if (this.isConnected(connectionName)) {
      await this.close(connectionName, true)
    } else {
      this.connections.delete(connectionName)
    }
  }
}
