# Adonis.js Elasticsearch Wrapper

This package is a wrapper for the official [elasticsearch-js](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html) package.
It provides a simple way to use Elasticsearch in your Adonis.js application.

## Installation

Install the package from the npm registry as follows:

```bash
npm install @dunhamjared/adonis-elasticsearch
```

Once done, you must run the following command to configure the package.

```bash
node ace configure @dunhamjared/adonis-elasticsearch
```

> [!NOTE]
> The configure command will automatically attempt to install the latest stable version of `@elastic/elasticsearch` as a peer dependency. If you require a specific version, please install it manually before running the configure command.

## Compatibility

This package is compatible with the following versions:

- **AdonisJS**: v6
- **@elastic/elasticsearch**: v8.x, v9.x

> [!NOTE]
> It is recommended that the `@elastic/elasticsearch` client version matches your Elasticsearch server version (e.g. use client v8 for server v8). Language clients are forward compatible (support communicating with greater or equal minor versions). For more details, see the [official compatibility documentation](https://www.npmjs.com/package/@elastic/elasticsearch).

## Configuration

The configuration is stored inside the `config/elasticsearch.ts` file.

```typescript
import { defineConfig } from '@dunhamjared/adonis-elasticsearch'
import env from '#start/env'

const esConfig = defineConfig({
  connection: env.get('ES_CONNECTION', 'main'),
  connections: {
    main: {
      node: env.get('ES_NODE_URL', 'http://localhost:9200'),
    },
  },
})

export default esConfig
```

See the [official documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-configuration.html) for more configuration options.

## Basic Usage

### Get Client

Here's how you can get the elasticsearch client instance.

```typescript
import es from '@dunhamjared/adonis-elasticsearch/services/main'

const client = es.client()
```

### Search query with pagination

```typescript
const posts = await es.client().search({
  index: 'posts',
  from: (page - 1) * limit,
  size: limit,
  query: {
    match_all: {},
  },
})
```

### Insert query

```ts
const results = await es.client().index({
  index: 'posts',
  body: {
    title,
    description,
  },
})
```

### Update query

```ts
const results = await es.client().update({
  index: 'posts',
  id: '1',
  body: {
    doc: {
      title,
      description,
    },
  },
})
```

### Delete query

```ts
const results = await es.client().delete({
  index: 'posts',
  id: '1',
})
```

### Health Check

```ts
const health = await es.client().cluster.health()
```

See the [official documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html) for more query options.

## Switching between connections

You can switch between connections by passing the connection name to the `connection` method.

```typescript
import es from '@dunhamjared/adonis-elasticsearch/services/main'

const example = es.connection('example')

await example.get({
  index: 'items',
  id: '1',
})
```

## Closing connections

You can close a specific connection by calling the `close` method. This will disconnect the client, but keep the configuration in the manager.

Note: All connections are automatically closed at the end of the application lifecycle.

```typescript
import es from '@dunhamjared/adonis-elasticsearch/services/main'

// Close the default connection
await es.close()

// Close a specific connection
await es.close('example')

// Close all connections
await es.closeAll()
```

## Releasing connections

You can release a specific connection by calling the `release` method. This will disconnect the client and remove the configuration from the manager.

```typescript
import es from '@dunhamjared/adonis-elasticsearch/services/main'

// Release the default connection
await es.release()

// Release a specific connection
await es.release('example')
```
