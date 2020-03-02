import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/laprf.ts',
  output: {
    file: 'dist/laprf.js',
    format: 'cjs',
  },
  external: ['@bitmachina/binary', 'debug'],
  plugins: [typescript()],
};
