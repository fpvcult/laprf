import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/laprf.js',
    format: 'cjs',
  },
  plugins: [commonjs(), typescript()],
};
