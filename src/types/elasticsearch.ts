import type { Client, ClientOptions } from '@elastic/elasticsearch'
import type { EventEmitter } from 'node:events'

export type ElasticConfig = {
  connection: string
  connections: {
    [key: string]: ClientOptions
  }
}

export type ConnectionNode = {
  name: string
  config: ClientOptions
  connection?: ConnectionContract
  state: 'registered' | 'migrating' | 'open' | 'closing' | 'closed'
}

export interface ConnectionManagerContract {
  /**
   * List of registered connection. You must check the connection state
   * to understand, if it is connected or not
   */
  connections: Map<string, ConnectionNode>

  /**
   * Add a new connection to the list of managed connection. You must call
   * connect separately to instantiate a connection instance
   */
  add(connectionName: string, config: ClientOptions): void

  /**
   * Instantiate a connection. It is a noop, when connection for the given
   * name is already instantiated
   */
  connect(connectionName: string): void

  /**
   * Get connection node
   */
  get(connectionName: string): ConnectionNode | undefined

  /**
   * Find if a connection name is managed by the manager or not
   */
  has(connectionName: string): boolean

  /**
   * Patch the existing connection config. This triggers the disconnect on the
   * old connection
   */
  patch(connectionName: string, config: ClientOptions): void

  /**
   * Find if a managed connection is instantiated or not
   */
  isConnected(connectionName: string): boolean

  /**
   * Close a given connection. This is also kill the underlying knex connection
   * pool
   */
  close(connectionName: string, release?: boolean): Promise<void>

  /**
   * Close all managed connections
   */
  closeAll(release?: boolean): Promise<void>

  /**
   * Release a given connection. Releasing a connection means, you will have to
   * re-add it using the `add` method
   */
  release(connectionName: string): Promise<void>
}

export interface ConnectionContract extends EventEmitter {
  client?: Client

  /**
   * Name of the connection
   */
  readonly name: string

  /**
   * Find if connection is ready or not
   */
  readonly ready: boolean

  /**
   * Untouched config
   */
  config: ClientOptions

  /**
   * List of emitted events
   */
  on(event: 'connect', callback: (connection: ConnectionContract) => void): this
  on(event: 'error', callback: (error: Error, connection: ConnectionContract) => void): this
  on(event: 'disconnect', callback: (connection: ConnectionContract) => void): this
  on(
    event: 'disconnect:error',
    callback: (error: Error, connection: ConnectionContract) => void
  ): this

  /**
   * Make knex connection
   */
  connect(): void

  /**
   * Disconnect knex
   */
  disconnect(): Promise<void>
}
