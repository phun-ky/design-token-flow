import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'dtf',
      file: pkg.browser,
      format: 'umd',
      // plugins: [terser()],
      assetFileNames: '[name][extname]',
      globals: {
        '@babel/runtime/regenerator': 'regeneratorRuntime',
        '@babel/runtime/helpers/asyncToGenerator': 'asyncToGenerator'
      },
      exports: 'named'
    },

    plugins: [
      nodeResolve(),
      commonjs({
        include: 'node_modules/**'
      }),
      babel({
        babelHelpers: 'runtime',
        plugins: [
          [
            '@babel/plugin-transform-runtime',
            {
              regenerator: true,
              helpers: true
            }
          ],
          '@babel/transform-regenerator',
          '@babel/transform-async-to-generator'
        ],
        exclude: ['node_modules/**']
      })
    ]
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.js',
    external: [/@babel\/runtime/],
    output: [
      { file: pkg.main, assetFileNames: '[name][extname]', exports: 'named', plugins: [terser()], format: 'cjs' },
      { file: pkg.module, assetFileNames: '[name][extname]', exports: 'named', plugins: [terser()], format: 'es' }
    ],
    plugins: [
      nodeResolve(),
      commonjs({
        include: 'node_modules/**'
      }),
      babel({
        babelHelpers: 'runtime',

        plugins: [
          [
            '@babel/plugin-transform-runtime',
            {
              regenerator: true,
              helpers: true
            }
          ],
          '@babel/transform-regenerator',
          '@babel/transform-async-to-generator'
        ],
        exclude: ['node_modules/**']
      })
    ]
  }
];
