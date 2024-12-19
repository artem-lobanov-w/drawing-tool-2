export default {
  base: './', // Указывает на относительные пути для GitHub Pages
  esbuild: {
    // Enable support for importing ES modules
    // and specify the entry point for the build
    include: /src\/(.*\.js|.*\.jsx|.*\.ts|.*\.tsx)$/,
  },
  server: {
    port: 3000, // Порт сервера
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist', // Папка для сборки
  },
};