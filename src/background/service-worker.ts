/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * @Description:
 * @Author: zoeblow
 * @Email: zoeblow#gmail.com
 * @Date: 2025-03-17 16:18:10
 * @LastEditors: zoeblow
 * @LastEditTime: 2025-03-28 13:40:35
 * @FilePath: \redmine-helper\src\background\service-worker.ts
 * Copyright (c) 2025 by zoeblow , All Rights Reserved.
 *
 */
console.log(
  "%c Nuo Redmine Helper %c Copyright \xa9 2010-%s\n ",
  'font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:24px;color:#FD6E0E;-webkit-text-fill-color:#FD6E0E;-webkit-text-stroke: 1px #FD6E0E;',
  "font-size:12px;color:#999999;",
  new Date().getFullYear()
);
chrome.management.getSelf((self) => {
  if (self.installType === "development") {
    // 监听的文件列表
    const fileList = [
      "http://127.0.0.1:5501/dist/manifest.json",
      "http://127.0.0.1:5501/dist/options/options.js",
      "http://127.0.0.1:5501/dist/background/service-worker.js",
      "http://127.0.0.1:5501/dist/content/content.js",
    ];
    // 文件列表内容字段
    const fileObj: {
      [prop: string]: string;
    } = {};
    /**
     * reload 重新加载
     */
    const reload = () => {
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true,
        },
        (tabs: chrome.tabs.Tab[]) => {
          if (tabs[0]) {
            chrome.tabs.reload(tabs[0].id);
          }
          // 强制刷新页面
          chrome.runtime.reload();
        }
      );
    };

    /**
     * 遍历监听的文件，通过请求获取文件内容，判断是否需要刷新
     */
    const checkReloadPage = () => {
      fileList.forEach((item) => {
        fetch(item)
          .then((res) => res.text())
          .then((files) => {
            if (fileObj[item] && fileObj[item] !== files) {
              reload();
            } else {
              fileObj[item] = files;
            }
          })
          .catch((error) => {
            console.error("Error checking folder changes:", error);
          });
      });
    };

    // setInterval(() => {
    //   checkReloadPage()
    // }, 1000)

    /**
     * 设置闹钟(定时器)
     */
    // 闹钟名称
    const ALARM_NAME = "LISTENER_FILE_TEXT_CHANGE";
    /**
     * 创建闹钟
     */
    const createAlarm = async () => {
      const alarm = await chrome.alarms.get(ALARM_NAME);
      if (typeof alarm === "undefined") {
        chrome.alarms.create(ALARM_NAME, {
          periodInMinutes: 0.1,
        });
        checkReloadPage();
      }
    };
    createAlarm();
    // 监听闹钟
    chrome.alarms.onAlarm.addListener(checkReloadPage);
  }
});

chrome.tabs.onActivated.addListener(async (tab) => {
  const result = (await chrome.storage.local.get("settings")) || {};
  chrome.tabs.sendMessage(tab.tabId, result.settings);
});

// chrome.runtime.onMessage.addListener(
//   async (request: any, sender: any, sendResponse: any) => {
//     const result = (await chrome.storage.local.get("settings")) || {};
//     console.log(request, "request");
//     //和content_script通信，用于页面刷新或打开时获取设置信息
//     if (request === "settings_init") {
//       sendResponse(result.settings);
//     }
//   }
// );

//点击图标打开或者刷新页面
chrome.action.onClicked.addListener(async () => {
  const result = (await chrome.storage.local.get("settings")) || {};
  const { url, path } = result.settings || {};
  if (url) {
    const [baseUrl] = url.split(",");
    const urlName = baseUrl.replace(/\/$/, "");
    const pathName = path
      ? path.indexOf("/") === -1
        ? "/" + path
        : path
      : "/my/page";

    const targetUrl = new URL(pathName, urlName).href;
    const tabs = await chrome.tabs.query({
      url: [`${urlName}/*`],
    });

    if (tabs.length > 0) {
      chrome.tabs.update(tabs[0].id!, { active: true, url: targetUrl });
    } else {
      chrome.tabs.create({ url: targetUrl });
    }
  }
});
