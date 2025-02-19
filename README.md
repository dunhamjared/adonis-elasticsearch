# Adonis.js Elasticsearch Wrapper

> [!WARNING]
> THIS PROJECT IS STILL IN DEVELOPMENT AND NOT READY FOR PRODUCTION USE.

This package is a wrapper for the official [elasticsearch-js](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html) package.  
It provides a simple way to use Elasticsearch in your Adonis.js application.

## Installation

// TODO

```bash
npm install @dunhamjared/adonis-elasticsearch
```

Once done, you must run the following command to configure Elasticsearch.

```bash
node ace configure @dunhamjared/adonis-elasticsearch
```

## Configuration

The configuration is stored inside the config/elasticsearch.ts file.

```typescript
import { defineConfig } from '@dunhamjared/adonis-elasticsearch'

const esConfig = defineConfig({
  connection: 'main',
  connections: {
    main: {
      cloud: {
        id: '<cloud-id>',
      },
      auth: {
        username: 'elastic',
        password: 'changeme',
      },
    },
  },
})

export default esConfig
```

See the [official documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-configuration.html) for more configuration options.

## Basic Usage

Select query with pagination:

```typescript
import es from '@dunahmjared/elasticsearch/services/elastic'

export default class PostsController {
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 20

    const posts = await es
      .client()
      .search({
        index: 'posts',
        body: {
          from: (page - 1) * limit,
          size: limit,
          query: {
            match_all: {},
          },
        },
      })

    return posts
  }
}
```

Insert query:

```ts
import es from '@dunahmjared/elasticsearch/services/elastic'

export default class PostsController {
  async store({ request }: HttpContext) {
    const title = request.input('title')
    const description = request.input('description')

    const results = await es
      .client()
      .index({
        index: 'posts',
        body: {
          title,
          description,
        },
      })

    return results._id
  }
}
```

See the [official documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/index.html) for more query options.

## Switching between connections

You can switch between connections by passing the connection name to the connection method.

```typescript
import es from '@dunahmjared/elasticsearch/services/elastic'

const example = elastic.connection('example')

await example
  .client()
  .get({ 
    index: 'items', 
    id: '1' 
  })
```

## Closing connections

You can close connections by calling the close method.

Note: All connections are automatically closed at the end of the application lifecycle.

```typescript
import es from '@dunahmjared/elasticsearch/services/elastic'

// Close the default connection
es.connection().close()

// Close a specific connection
es.manager.close('example')

// Close all connections
es.manager.closeAll()
```
