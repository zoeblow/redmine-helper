/**
 * @fileoverview React 应用程序入口文件
 * @description 初始化和渲染 Redmine Helper 选项页面的 React 应用
 * @author zoeblow
 * @email zoeblow#gmail.com
 * @date 2025-03-17 16:55:36
 * @lastEditTime 2025-03-18 13:58:43
 * @copyright Copyright (c) 2025 by zoeblow, All Rights Reserved.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";

/**
 * 初始化并渲染 React 应用程序
 * @description 创建 React 根组件并在严格模式下渲染到 DOM
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
