/*
 * @Description:
 * @Author: zoeblow
 * @Email: zoeblow#gmail.com
 * @Date: 2025-03-17 16:53:08
 * @LastEditors: zoeblow
 * @LastEditTime: 2025-03-20 11:33:18
 * @FilePath: \redmine-helper\src\options\App.tsx
 * Copyright (c) 2025 by zoeblow , All Rights Reserved.
 *
 */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from "react";
import { Input, Form, Switch, Button, message, Popover } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";

const formItemLayout = {
  labelCol: {
    sm: { span: 8 },
  },
  wrapperCol: {
    sm: { span: 16 },
  },
};

message.config({
  top: 100,
  duration: 1,
  maxCount: 1,
});

const App: React.FC = () => {
  const [form] = Form.useForm();
  const init = {
    url: "", // 网址
    path: "", // 打开页面
    assigned_author: true, // 指派给作者
    tracks: false, // 自动跟踪
    percent: true, // 显示进度条
    workingTime: true, // 显示工作时间
    workingNote: true, // 显示工作备注
  };
  useEffect(() => {
    chrome.storage.local.get("settings", (result) => {
      form.setFieldsValue({ ...init, ...result.settings });
    });
  }, []);

  const handleSubmit = async (e: { [name: string]: any }) => {
    chrome.storage.sync.set({ ...e }, () => {
      chrome.runtime.sendMessage({ settings: e });
      message.success("设置成功");
    });
    await chrome.storage.local.set({ settings: e });
  };

  return (
    <>
      <h1
        style={{
          margin: "20px 0",
          padding: "0 0 16px 16px",
          borderBottom: "1px solid #cecece",
        }}>
        设置
      </h1>
      <Form
        form={form}
        onFinish={handleSubmit}
        style={{ width: 500 }}
        size="large">
        <Form.Item
          {...formItemLayout}
          name="url"
          label="redmine网址"
          rules={[
            { required: true, message: "请输入redmine网址" },
            { type: "url", message: "请输入正确的网址" },
          ]}>
          <Input
            autoComplete="off"
            placeholder="http://redmine网址,多个以英文逗号 ’,‘ 相连"
          />
        </Form.Item>
        <Form.Item {...formItemLayout} name="path" label="打开页面">
          <Input autoComplete="off" placeholder="/my/page" />
        </Form.Item>
        {/* <Form.Item
                        {...formItemLayout}
                        label="用户名"
                        >
                        {getFieldDecorator('username', {
                            initialValue:state.username
                        })(
                            <Input autoComplete="off" />
                        )}
                    </Form.Item>
                    <Form.Item
                        {...formItemLayout}
                        label="密码"
                        >
                        {getFieldDecorator('password', {
                            initialValue:state.password
                        })(
                            <Input.Password />
                        )}
                    </Form.Item> */}
        <Form.Item
          {...formItemLayout}
          name="assigned_author"
          valuePropName="checked"
          label={
            <div style={{ display: "flex", alignItems: "center" }}>
              <span>指派给作者</span>
              <Popover
                placement="topRight"
                content="编辑任务单时，默认指派给作者">
                <QuestionCircleOutlined
                  style={{
                    color: "#1990fe",
                    verticalAlign: "middle",
                    marginLeft: 6,
                  }}
                />
              </Popover>
            </div>
          }>
          <Switch />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          name="tracks"
          valuePropName="checked"
          label={
            <div style={{ display: "flex", alignItems: "center" }}>
              <span>自动跟踪</span>
              <Popover
                placement="topRight"
                content="当任务状态设置为Started或Resolved，自动跟踪任务单">
                <QuestionCircleOutlined
                  style={{
                    color: "#1990fe",
                    verticalAlign: "middle",
                    marginLeft: 6,
                  }}
                />
              </Popover>
            </div>
          }>
          <Switch />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          name="percent"
          valuePropName="checked"
          label={
            <div style={{ display: "flex", alignItems: "center" }}>
              <span>自动完成</span>
              <Popover
                placement="topRight"
                content="当任务状态设置Resolved后，完成状态自动设置为100%">
                <QuestionCircleOutlined
                  style={{
                    color: "#1990fe",
                    verticalAlign: "middle",
                    marginLeft: 6,
                  }}
                />
              </Popover>
            </div>
          }>
          <Switch />
        </Form.Item>
        <Form.Item
          {...formItemLayout}
          name="workingNote"
          valuePropName="checked"
          label={
            <div style={{ display: "flex", alignItems: "center" }}>
              <span>工时注释</span>
              <Popover
                placement="topRight"
                content="开启后，工时注释将为必填项">
                <QuestionCircleOutlined
                  style={{
                    color: "#1990fe",
                    verticalAlign: "middle",
                    marginLeft: 6,
                  }}
                />
              </Popover>
            </div>
          }>
          <Switch />
        </Form.Item>
        <Form.Item {...formItemLayout} colon={false} label="&nbsp;">
          <Button type="primary" htmlType="submit">
            保 存
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default App;
