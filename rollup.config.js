import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';
import json from '@rollup/plugin-json';
import ts from 'rollup-plugin-typescript2';
import dts from 'rollup-plugin-dts';
import typescript from 'typescript';
import { terser } from 'rollup-plugin-terser';

export default [
  {
    input: 'src/index.ts',
    output: {
      name: 'dtf',
      file: pkg.browser,
      format: 'umd',
      sourcemap: true,
      exports: 'named',
      assetFileNames: '[name][extname]'
    },
    plugins: [
      json(),
      nodeResolve(),
      ts({
        useTsconfigDeclarationDir: true,
        sourceMap: false,
        typescript
      }),
      terser()
    ]
  },
  {
    input: './dist/dts/index.d.ts',
    output: [{ file: './dist/dts/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
];
