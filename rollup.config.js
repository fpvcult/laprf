import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/LapRF.ts',
  output: {
    file: 'dist/laprf.js',
    format: 'cjs',
  },
  external: ['@bitmachina/binary'],
  plugins: [typescript()],
};
