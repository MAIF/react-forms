import del from 'rollup-plugin-delete'
import pkg from './package.json'
import { terser } from 'rollup-plugin-terser'
import copy from 'rollup-plugin-copy'
import command from 'rollup-plugin-command';
import scss from 'rollup-plugin-scss'
import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";
import commonjs from '@rollup/plugin-commonjs'
import resolve from "@rollup/plugin-node-resolve"
import { visualizer } from "rollup-plugin-visualizer";

const isDev = process.env.NODE_ENV !== 'production'
const isYalcActivated = process.env.YALC === 'activated'

export default [{
    input: pkg.source,
    output: [
      { file: pkg.main, format: 'esm' }
    ],
    plugins: [
      visualizer(),
      resolve(),
      commonjs(),
      del({ targets: ['dist/*', 'lib/*', 'examples/node_modules/@maif/react-forms/lib'], verbose: true }),
      typescript(),
      scss(),
      isDev ? undefined : terser(),
      copy({
        targets: [
          {
            src: 'lib',
            dest: 'examples/node_modules/@maif/react-forms'
          }
        ],
        verbose: true,
        hook: 'closeBundle'
      }),
      isYalcActivated ? command('yalc push --replace') : undefined,
    ].filter(f => f),
    external: Object.keys(pkg.peerDependencies || {})
  },
  {
    input: "./types/index.d.ts",
    output: [{ file: "lib/index.d.ts", format: "es" }],
    plugins: [dts()],
    external: [/\.css$/u, /\.scss$/u]
  },
];