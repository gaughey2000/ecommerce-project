import postcssPresetEnv from 'postcss-preset-env';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    postcssPresetEnv({
      stage: 1,
      features: {
        'nesting-rules': true,
      },
    }),
    tailwindcss,
    autoprefixer,
  ],
};