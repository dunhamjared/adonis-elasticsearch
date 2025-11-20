import type Configure from '@adonisjs/core/commands/configure'
import { join } from 'node:path'

const STUBS_ROOT = join(import.meta.dirname, './stubs')

/**
 * Configures the package
 */
export async function configure(command: Configure) {
  const codemods = await command.createCodemods()

  /**
   * Publish config file
   */
  await codemods.makeUsingStub(STUBS_ROOT, 'config/elasticsearch.stub', {})

  /**
   * Add provider to rc file
   */
  // @ts-ignore
  await codemods.updateRcFile((rcFile) => {
    rcFile.addProvider('@dunhamjared/adonis-elasticsearch/elasticsearch_provider')
  })
    
  /**
   * Install peer dependencies
   */
  await codemods.installPackages([{ name: '@elastic/elasticsearch', isDevDependency: false }])

}
