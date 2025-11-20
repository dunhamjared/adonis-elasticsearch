import pkg from '@elastic/elasticsearch'
const { BaseConnection } = pkg

export class MockConnection extends BaseConnection {
  async request(_params: any, _options: any) {
    const body = JSON.stringify({
      name: 'mock-es-node',
      cluster_name: 'mock-cluster',
      cluster_uuid: 'mock-uuid',
      version: {
        number: '8.0.0',
        build_flavor: 'default',
        build_type: 'mock',
        build_hash: 'mock',
        build_date: '2022-01-01T00:00:00.000Z',
        build_snapshot: false,
        lucene_version: '9.0.0',
        minimum_wire_compatibility_version: '7.17.0',
        minimum_index_compatibility_version: '7.0.0',
      },
      tagline: 'You Know, for Search',
    })

    return {
      body: body,
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'x-elastic-product': 'Elasticsearch',
      },
      warnings: null,
      meta: {},
    } as any
  }

  async close() {
    return Promise.resolve()
  }
}
