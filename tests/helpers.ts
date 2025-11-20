import _Mock from '@elastic/elasticsearch-mock'

// a little type assertion workaround
const Mock = _Mock as unknown as typeof _Mock.default
export const mock = new Mock()

export function mockConnection() {
  return mock.getConnection()
}
