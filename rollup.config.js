import babel from '@rollup/plugin-babel'
import external from 'rollup-plugin-peer-deps-external'
import del from 'rollup-plugin-delete'
import pkg from './package.json'
import commonjs from '@rollup/plugin-commonjs'
import resolve from "@rollup/plugin-node-resolve"
import { terser } from 'rollup-plugin-terser'
import copy from 'rollup-plugin-copy'

const isDev = process.env.NODE_ENV !== 'production'

export default [
  {
    input: "./src/codemirror-editor.js",
    inlineDynamicImports: true,
    output: {
      file: "./src/inputs/__generated/editor.js",
      format: "esm",
      strict: false
    },
    plugins: [
      babel({
        exclude: [
          'node_modules/**',
          'src/inputs/editor.js'
        ],
        babelHelpers: 'bundled'
      }),
      resolve(),
      commonjs(),
      isDev ? undefined : terser()
    ].filter(f => f)
  },
  {
    input: pkg.source,
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'esm' }
    ],
    plugins: [
      external(),
      babel({
        exclude: [
          'node_modules/**',
          'src/inputs/__generated/editor.js'
        ],
        babelHelpers: 'bundled'
      }),
      del({ targets: ['dist/*', 'lib/*', 'examples/node_modules/@maif/react-forms/lib'], verbose: true }),
      isDev ? undefined : terser(),
      copy({
        targets: [
          {
            src: 'lib/index.js',
            dest: 'examples/node_modules/@maif/react-forms/lib'
          }
        ],
        verbose: true,
        hook: 'closeBundle'
      })
    ].filter(f => f),
    external: Object.keys(pkg.peerDependencies || {})
  }
];