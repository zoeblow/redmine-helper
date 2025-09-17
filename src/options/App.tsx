/**
 * @fileoverview Redmine Helper 扩展选项页面主组件
 * @description 提供扩展设置界面，包括 URL 配置、功能开关等
 * @author zoeblow
 * @email zoeblow#gmail.com
 * @date 2025-03-17 16:53:08
 * @lastEditTime 2025-09-17 15:35:15
 * @copyright Copyright (c) 2025 by zoeblow, All Rights Reserved.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  Input,
  Form,
  Switch,
  Button,
  message,
  Popover,
  Spin,
  Card,
} from "antd";
import { QuestionCircleOutlined, SaveOutlined } from "@ant-design/icons";

/**
 * 扩展设置接口
 * @interface Settings
 * @property {string} url - Redmine 站点 URL，支持多个 URL 用逗号分隔
 * @property {string} path - 默认打开路径
 * @property {boolean} assigned_author - 是否自动分配任务给作者
 * @property {boolean} tracks - 是否自动跟踪任务
 * @property {boolean} percent - 是否自动设置完成度
 * @property {boolean} workingTime - 工作时间相关设置
 * @property {boolean} workingNote - 是否工作注释必填
 */
interface Settings {
  url: string;
  path: string;
  assigned_author: boolean;
  tracks: boolean;
  percent: boolean;
  workingTime: boolean;
  workingNote: boolean;
}

/**
 * 帮助弹窗组件属性
 * @interface HelpPopoverProps
 * @property {string} content - 帮助文本内容
 * @property {React.ReactNode} children - 子组件
 */
interface HelpPopoverProps {
  content: string;
  children: React.ReactNode;
}

/**
 * 表单布局配置
 * @const {object} formItemLayout
 * @description 定义 Ant Design 表单的标签和输入框布局比例
 */
const formItemLayout = {
  labelCol: {
    sm: { span: 8 },
  },
  wrapperCol: {
    sm: { span: 16 },
  },
};

/**
 * 帮助信息弹窗组件
 * @param {HelpPopoverProps} props - 组件属性
 * @returns {JSX.Element} 帮助弹窗组件
 * @description 在表单标签旁显示问号图标，点击显示帮助信息
 */
const HelpPopover: React.FC<HelpPopoverProps> = ({ content, children }) => (
  <div style={{ display: "flex", alignItems: "center" }}>
    {children}
    <Popover placement="topRight" content={content}>
      <QuestionCircleOutlined
        style={{
          color: "#1990fe",
          verticalAlign: "middle",
          marginLeft: 6,
          cursor: "help",
        }}
      />
    </Popover>
  </div>
);

/**
 * 配置全局消息提示
 * @description 设置消息的位置、持续时间和最大数量
 */
message.config({
  top: 100,
  duration: 1,
  maxCount: 1,
});

/**
 * 主应用组件
 * @returns {JSX.Element} 应用组件
 * @description Redmine Helper 扩展的选项设置页面主组件
 */
const App: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * 默认设置配置
   * @const {Settings} defaultSettings
   * @description 定义扩展的默认设置值
   */
  const defaultSettings: Settings = {
    url: "",
    path: "/my/page",
    assigned_author: true,
    tracks: false,
    percent: true,
    workingTime: true,
    workingNote: true,
  };

  /**
   * 加载扩展设置
   * @returns {Promise<void>}
   * @description 从 Chrome 存储中加载设置并填充表单
   */
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const result = await chrome.storage.local.get("settings");
      const settings = { ...defaultSettings, ...result.settings };
      form.setFieldsValue(settings);
    } catch (error) {
      console.error("加载设置失败:", error);
      message.error("加载设置失败，请检查扩展权限");
      form.setFieldsValue(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /**
   * 保存设置到存储
   * @param {Settings} values - 表单设置值
   * @returns {Promise<void>}
   * @description 将设置同时保存到本地和同步存储
   */
  const handleSubmit = useCallback(async (values: Settings) => {
    try {
      setSaving(true);

      // 同时保存到 local 和 sync storage
      await Promise.all([
        chrome.storage.local.set({ settings: values }),
        new Promise<void>((resolve, reject) => {
          chrome.storage.sync.set({ settings: values }, () => {
            const lastError = (
              chrome.runtime as unknown as { lastError?: { message: string } }
            ).lastError;
            if (lastError) {
              reject(new Error(lastError.message));
            } else {
              resolve();
            }
          });
        }),
      ]);

      // 通知 background script 更新设置
      try {
        await chrome.runtime.sendMessage({ settings: values });
      } catch (error) {
        console.warn("通知 background script 失败:", error);
      }

      message.success("设置保存成功！");
    } catch (error) {
      console.error("保存设置失败:", error);
      message.error("保存设置失败，请重试");
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}>
        <Spin size="large" tip="加载设置中..." />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "700px" }}>
      <Card
        title="Redmine 助手设置"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="horizontal"
          {...formItemLayout}
          size="large"
          disabled={saving}>
          <Form.Item
            name="url"
            label="Redmine 网址"
            rules={[
              { required: true, message: "请输入 Redmine 网址" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const urls = value
                    .split(",")
                    .map((url: string) => url.trim());
                  const urlPattern = /^https?:\/\/.+/;
                  const invalidUrl = urls.find(
                    (url: string) => !urlPattern.test(url)
                  );
                  if (invalidUrl) {
                    return Promise.reject(
                      new Error(`"${invalidUrl}" 不是有效的网址`)
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
            tooltip="支持多个网址，用英文逗号分隔">
            <Input
              autoComplete="off"
              placeholder="https://redmine.example.com, https://redmine2.example.com"
            />
          </Form.Item>

          <Form.Item
            name="path"
            label="默认打开页面"
            tooltip="点击扩展图标时打开的页面路径">
            <Input autoComplete="off" placeholder="my/page" addonBefore="/" />
          </Form.Item>

          <Form.Item
            name="assigned_author"
            valuePropName="checked"
            label={
              <HelpPopover content="编辑任务单时，默认指派给作者">
                <span>指派给作者</span>
              </HelpPopover>
            }>
            <Switch />
          </Form.Item>
          <Form.Item
            name="tracks"
            valuePropName="checked"
            label={
              <HelpPopover content="当任务状态设置为 Started 或 Resolved 时，自动跟踪任务单">
                <span>自动跟踪</span>
              </HelpPopover>
            }>
            <Switch />
          </Form.Item>
          <Form.Item
            name="percent"
            valuePropName="checked"
            label={
              <HelpPopover content="当任务状态设置为 Resolved 后，完成状态自动设置为 100%">
                <span>自动完成</span>
              </HelpPopover>
            }>
            <Switch />
          </Form.Item>
          <Form.Item
            name="workingNote"
            valuePropName="checked"
            label={
              <HelpPopover content="开启后，工时注释将为必填项">
                <span>工时注释必填</span>
              </HelpPopover>
            }>
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginTop: 32, textAlign: "center" }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={saving}
              icon={<SaveOutlined />}
              style={{ minWidth: 120 }}>
              {saving ? "保存中..." : "保存设置"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default App;
