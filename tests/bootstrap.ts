import { assert } from '@japa/assert'
import { processCLIArgs, configure, run } from '@japa/runner'
import * as reporters from '@japa/runner/reporters'

processCLIArgs(process.argv.slice(2))

configure({
  files: ['tests/**/*.spec.ts'],
  plugins: [assert()],
  reporters: {
    activated: ['spec'],
    list: [reporters.spec()],
  },
  importer: (filePath) => import(filePath.toString()),
})

run()
