import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import copy from "rollup-plugin-copy";

// https://vitejs.dev/config/
export default defineConfig({
  root: "src/",
  plugins: [
    react(),
    copy({
      targets: [
        { src: "manifest.json", dest: "dist" },
        { src: "src/icons/**", dest: "dist/icons" },
      ],
    }),
  ],
  resolve: {
    alias: [
      {
        find: /^~/,
        replacement: "",
      },
    ],
  },
  css: {
    // 预处理器配置项
    preprocessorOptions: {
      less: {
        // 支持内联 JavaScript
        javascriptEnabled: true, // 一般只需要配置  javascriptEnabled就行，modifyVars也可以稍微配置
        charset: false,
        modifyVars: {
          // 更改主题在这里
          // "primary-color": "#52c41a",
        },
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist"),
    rollupOptions: {
      input: {
        options: path.resolve(__dirname, "src/options/index.html"),
        content: path.resolve(__dirname, "src/content/content.ts"),
        background: path.resolve(__dirname, "src/background/service-worker.ts"),
      },
      output: {
        assetFileNames: "assets/[name]-[hash].[ext]", // 静态资源
        chunkFileNames: "js/[name]-[hash].js", // 代码分割中产生的 chunk
        entryFileNames: (chunkInfo) => {
          // 入口文件
          const baseName = path.basename(
            chunkInfo.facadeModuleId,
            path.extname(chunkInfo.facadeModuleId)
          );
          const saveArr = ["content", "service-worker"];
          return `[name]/${
            saveArr.includes(baseName) ? baseName : chunkInfo.name
          }.js`;
        },
        name: "[name].js",
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
