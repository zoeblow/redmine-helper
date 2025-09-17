/**
 * @fileoverview Redmine Helper 扩展后台服务工作脚本
 * @description 管理扩展生命周期、开发环境热重载、设置同步和标签页管理
 * @author zoeblow
 * @email zoeblow#gmail.com
 * @date 2025-03-17 16:18:10
 * @lastEditTime 2025-08-29 15:07:36
 * @copyright Copyright (c) 2025 by zoeblow, All Rights Reserved.
 */

/**
 * 扩展设置接口
 * @interface Settings
 * @property {string} [url] - Redmine 网站 URL
 * @property {string} [path] - 默认打开路径
 * @property {unknown} [key] - 其他可选设置
 */
interface Settings {
  url?: string;
  path?: string;
  [key: string]: unknown;
}

/**
 * 文件缓存接口，用于开发环境热重载
 * @interface FileCache
 * @property {string} [url] - 文件 URL 到内容的映射
 */
interface FileCache {
  [url: string]: string;
}

/**
 * 开发环境热重载配置接口
 * @interface DevConfig
 * @property {string} ALARM_NAME - 闹钟名称
 * @property {number} CHECK_INTERVAL - 检查间隔（分钟）
 * @property {readonly string[]} FILE_LIST - 监控文件列表
 */
interface DevConfig {
  readonly ALARM_NAME: string;
  readonly CHECK_INTERVAL: number;
  readonly FILE_LIST: readonly string[];
}
/**
 * 开发环境热重载管理器
 * @class DevReloadManager
 * @description 负责在开发模式下监控文件变化并自动重载扩展
 */
class DevReloadManager {
  private readonly config: DevConfig = {
    ALARM_NAME: "REDMINE_HELPER_DEV_RELOAD",
    CHECK_INTERVAL: 0.1, // 6秒检查一次，减少资源消耗
    FILE_LIST: [
      "http://127.0.0.1:5501/dist/manifest.json",
      "http://127.0.0.1:5501/dist/options/options.js",
      "http://127.0.0.1:5501/dist/background/service-worker.js",
      "http://127.0.0.1:5501/dist/content/content.js",
    ] as const,
  };

  private fileCache: FileCache = {};
  private isInitialized = false;

  /**
   * 初始化热重载管理器
   * @returns {Promise<void>}
   * @description 设置定时检查机制并初始化文件缓存
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const existingAlarm = await chrome.alarms.get(this.config.ALARM_NAME);
      if (!existingAlarm) {
        await chrome.alarms.create(this.config.ALARM_NAME, {
          periodInMinutes: this.config.CHECK_INTERVAL,
        });
      }
      
      // 初始化文件缓存
      await this.checkForChanges();
      this.isInitialized = true;
      
      console.log('🔥 Redmine Helper 开发模式热重载已启用');
    } catch (error) {
      console.error('初始化开发热重载失败:', error);
    }
  }

  /**
   * 检查文件变化
   * @private
   * @returns {Promise<void>}
   * @description 检查监控文件列表中的文件是否有变化
   */
  private async checkForChanges(): Promise<void> {
    const checkPromises = this.config.FILE_LIST.map(async (fileUrl) => {
      try {
        const response = await fetch(fileUrl);
        if (!response.ok) return;
        
        const content = await response.text();
        const cachedContent = this.fileCache[fileUrl];
        
        if (cachedContent && cachedContent !== content) {
          console.log('📁 检测到文件变化:', fileUrl);
          this.reload();
          return;
        }
        
        this.fileCache[fileUrl] = content;
      } catch (error) {
        // 开发服务器可能未启动，忽略错误
      }
    });

    await Promise.all(checkPromises);
  }

  /**
   * 重载扩展和活动标签页
   * @private
   * @returns {Promise<void>}
   * @description 重载当前活动标签页并重新启动扩展
   */
  private async reload(): Promise<void> {
    try {
      // 重载当前活动标签页
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]?.id) {
        await chrome.tabs.reload(tabs[0].id);
      }
      
      // 重载扩展
      chrome.runtime.reload();
    } catch (error) {
      console.error('重载失败:', error);
      chrome.runtime.reload(); // 降级处理
    }
  }

  /**
   * 处理闹钟事件
   * @param {chrome.alarms.Alarm} alarm - Chrome 闹钟对象
   * @returns {void}
   * @description 当定时器触发时检查文件变化
   */
  handleAlarm = (alarm: chrome.alarms.Alarm): void => {
    if (alarm.name === this.config.ALARM_NAME) {
      this.checkForChanges().catch(console.error);
    }
  };
}

/**
 * 设置管理器
 * @class SettingsManager
 * @description 负责扩展设置的存储、读取和同步
 */
class SettingsManager {
  private static readonly STORAGE_KEY = 'settings';
  
  /**
   * 获取扩展设置
   * @static
   * @returns {Promise<Settings>} 扩展设置对象
   * @description 从 Chrome 本地存储中读取扩展设置
   */
  static async getSettings(): Promise<Settings> {
    try {
      const result = await chrome.storage.local.get(SettingsManager.STORAGE_KEY);
      return result[SettingsManager.STORAGE_KEY] || {};
    } catch (error) {
      console.error('获取设置失败:', error);
      return {};
    }
  }

  /**
   * 向指定标签页发送设置
   * @static
   * @param {number} tabId - 标签页 ID
   * @returns {Promise<void>}
   * @description 将当前设置发送到指定的标签页
   */
  static async sendSettingsToTab(tabId: number): Promise<void> {
    try {
      const settings = await this.getSettings();
      await chrome.tabs.sendMessage(tabId, settings);
    } catch (error) {
      // Tab可能已关闭或content script未准备好，这是正常情况
      console.debug('发送设置到标签页失败:', error);
    }
  }
}

/**
 * 标签页管理器
 * @class TabManager
 * @description 负责管理和导航 Redmine 标签页
 */
class TabManager {
  /**
   * 打开或更新 Redmine 页面
   * @static
   * @returns {Promise<void>}
   * @description 根据设置打开新的或激活现有的 Redmine 标签页
   */
  static async openOrUpdateRedminePage(): Promise<void> {
    try {
      const settings = await SettingsManager.getSettings();
      const { url, path } = settings;
      
      if (!url) {
        console.warn('未配置 Redmine 网址');
        return;
      }

      const baseUrl = url.split(',')[0].trim().replace(/\/$/, '');
      const targetPath = this.normalizePath(path);
      const targetUrl = new URL(targetPath, baseUrl).href;
      
      // 查找现有的Redmine标签页
      const existingTabs = await chrome.tabs.query({ url: `${baseUrl}/*` });
      
      if (existingTabs.length > 0) {
        // 激活并更新现有标签页
        const tab = existingTabs[0];
        await chrome.tabs.update(tab.id!, { 
          active: true, 
          url: targetUrl 
        });
      } else {
        // 创建新标签页
        await chrome.tabs.create({ url: targetUrl });
      }
    } catch (error) {
      console.error('打开Redmine页面失败:', error);
    }
  }

  /**
   * 规范化路径
   * @private
   * @static
   * @param {string} [path] - 可选的路径字符串
   * @returns {string} 规范化后的路径
   * @description 确保路径以斜杠开头，默认为 '/my/page'
   */
  private static normalizePath(path?: string): string {
    if (!path) return '/my/page';
    return path.startsWith('/') ? path : `/${path}`;
  }
}

/**
 * 初始化开发环境热重载
 * @returns {Promise<void>}
 * @description 在开发模式下初始化热重载功能
 */
const initializeDevelopment = async (): Promise<void> => {
  try {
    const extensionInfo = await chrome.management.getSelf();
    if (extensionInfo.installType === 'development') {
      const devManager = new DevReloadManager();
      await devManager.initialize();
      
      // 监听闹钟事件
      chrome.alarms.onAlarm.addListener(devManager.handleAlarm);
    }
  } catch (error) {
    console.error('初始化开发环境失败:', error);
  }
};

// 事件监听器
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await SettingsManager.sendSettingsToTab(activeInfo.tabId);
});

chrome.action.onClicked.addListener(async () => {
  await TabManager.openOrUpdateRedminePage();
});

// 扩展启动时初始化
chrome.runtime.onStartup.addListener(() => {
  initializeDevelopment().catch(console.error);
});

chrome.runtime.onInstalled.addListener(() => {
  initializeDevelopment().catch(console.error);
});

// 立即初始化（用于开发环境）
initializeDevelopment().catch(console.error);
