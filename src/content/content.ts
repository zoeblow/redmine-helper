/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface WithdEnum {
  [key: string]: number;
}
// 宽度枚举
const withdEnum: WithdEnum = {
  project_quick_jump_box: 259,
  issue_project_id: 259,
  issue_tracker_id: 133,
  issue_done_ratio: 95,
  time_entry_activity_id: 146,
  default: 188,
};

interface CustomResponse {
  // 定义你的响应数据结构
  status: string;
  data?: any;
}

class FilterableSelect {
  wrapper: HTMLDivElement | any;
  input: HTMLDivElement | any;
  search: HTMLDivElement | any;
  optionsContainer: HTMLDivElement | any;
  originalSelect: any;
  options: any;
  inputBox: HTMLDivElement | any;
  searchBox: HTMLDivElement | any;
  constructor(originalSelect: Node | undefined) {
    this.originalSelect = originalSelect;
    this.init();
    console.log(
      "%c Nuo Redmine Helper %c Copyright \xa9 2010-%s\n ",
      'font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;font-size:24px;color:#FD6E0E;-webkit-text-fill-color:#FD6E0E;-webkit-text-stroke: 1px #FD6E0E;',
      "font-size:12px;color:#999999;",
      new Date().getFullYear()
    );
  }

  init() {
    this.createWrapper();
    this.bindEvents();
    this.syncOptions();
    this.otherInit();
  }

  addEventListener(selector: string, eventName: string, handler: any) {
    document.querySelectorAll(selector).forEach((element) => {
      element.addEventListener(eventName, (e) => handler.call(this, e));
    });
  }

  createWrapper() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "select-wrapper";

    const ids = this.originalSelect.getAttribute("id");
    this.wrapper.style.width = `${withdEnum[ids] || 188}px`;
    // const rect = this.originalSelect.getBoundingClientRect();
    // // 判断当前节点是不是已经显示
    // if (rect.width <= 0) {
    //   return;
    // }
    // 创建输入框
    this.input = document.createElement("input");
    this.input.className = "select-input";
    this.input.readOnly = true;

    this.inputBox = document.createElement("span");
    this.inputBox.className = "input-wrapper";
    this.inputBox.appendChild(this.input);

    this.searchBox = document.createElement("div");
    this.searchBox.className = "searchBox-wrapper";
    this.searchBox.style.display = "none";
    this.searchBox.style.width = `${withdEnum[ids] || 188}px`;

    // 创建搜索框
    this.search = document.createElement("input");
    this.search.className = "search-input";
    this.search.placeholder = "Search...";

    // 创建选项容器
    this.optionsContainer = document.createElement("div");
    this.optionsContainer.className = "options-container";

    // 组装结构
    this.wrapper.appendChild(this.inputBox);

    this.searchBox.appendChild(this.search);
    this.searchBox.appendChild(this.optionsContainer);

    this.wrapper.appendChild(this.searchBox);

    // this.originalSelect.parentNode.insertBefore(
    //   this.wrapper,
    //   this.originalSelect
    // );

    // 插入到DOM
    const parentElement = this.originalSelect.parentNode; //find parent element
    if (parentElement.lastChild == this.originalSelect) {
      //To determime确定,下决心 whether the last element of the parent element is the same as the target element
      parentElement.appendChild(this.wrapper);
    } else {
      parentElement.insertBefore(this.wrapper, this.originalSelect.nextSibling);
    }
    this.originalSelect.classList.add("native-select");
  }

  bindEvents() {
    // 输入框点击
    this.input.addEventListener("click", () => this.toggleDropdown());

    // 搜索框输入
    this.search.addEventListener("input", (e: any) =>
      this.filterOptions(e.target.value)
    );

    // 文档点击关闭
    document.addEventListener("click", (e) => {
      if (!this.wrapper.contains(e.target)) {
        this.closeDropdown();
      }
    });

    // 键盘事件
    this.wrapper.addEventListener("keydown", (e: any) => this.handleKeydown(e));
  }

  syncOptions() {
    this.options = Array.from(this.originalSelect.options).map(
      (option: any) => ({
        value: option.value,
        text: option.text,
        disabled: option.disabled,
      })
    );

    this.input.value = this.originalSelect.selectedOptions[0]?.text || "";
    this.renderOptions(this.options);
  }

  renderOptions(options: any[] | any) {
    this.optionsContainer.innerHTML = "";
    options.forEach((option: any) => {
      const div = document.createElement("div");
      div.className = `option-item ${option.disabled ? "disabled" : ""}`;
      div.textContent = option.text;

      if (!option.disabled) {
        div.addEventListener("click", () => this.selectOption(option));
      }

      this.optionsContainer.appendChild(div);
    });
  }

  toggleDropdown() {
    const isOpen = this.searchBox.style.display === "block";
    this.searchBox.style.display = isOpen ? "none" : "block";
    if (!isOpen) this.search.focus();
  }

  closeDropdown() {
    this.searchBox.style.display = "none";
    this.search.value = "";
    this.renderOptions(this.options);
  }

  filterOptions(searchText: string | any[] | any) {
    const filtered = this.options.filter((option: any) =>
      option.text.toLowerCase().includes(searchText.toLowerCase())
    );
    this.renderOptions(filtered);
  }

  selectOption(option: any) {
    this.input.value = option.text;
    this.originalSelect.value = option.value;
    this.closeDropdown();

    // 触发原生change事件
    const event = new Event("change", { bubbles: true });
    this.originalSelect.dispatchEvent(event);
  }

  handleKeydown(e: any) {
    if (e.key === "Escape") {
      this.closeDropdown();
      return;
    }

    if (e.key === "Enter" && this.search === document.activeElement) {
      const visibleOptions = this.optionsContainer.querySelectorAll(
        ".option-item:not(.disabled)"
      );
      if (visibleOptions.length > 0) {
        this.selectOption(
          this.options.find(
            (o: any) => o.text === visibleOptions[0].textContent
          )
        );
      }
      return;
    }

    if (["ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
      const currentHighlight =
        this.optionsContainer.querySelector(".highlight");
      let nextItem;

      if (!currentHighlight) {
        nextItem = this.optionsContainer.querySelector(
          ".option-item:not(.disabled)"
        );
      } else {
        const direction = e.key === "ArrowDown" ? 1 : -1;
        nextItem =
          currentHighlight[
            direction === 1 ? "nextElementSibling" : "previousElementSibling"
          ];
        while (nextItem && nextItem.classList.contains("disabled")) {
          nextItem =
            nextItem[
              direction === 1 ? "nextElementSibling" : "previousElementSibling"
            ];
        }
      }

      if (nextItem) {
        if (currentHighlight) currentHighlight.classList.remove("highlight");
        nextItem.classList.add("highlight");
        nextItem.scrollIntoView({ block: "nearest" });
      }
    }
  }

  otherInit() {
    // 将“指派给”设置为任务单作者
    this.changeAssign();
    // 状态切换
    this.addEventListener("#issue_status_id", "change", this.statusChange);
    this.addEventListener(
      "#issue-form #time_entry_hours",
      "change",
      this.commentsRequired
    );
  }

  // 设置 自定义 select DOM value
  setSelectValue(ele: HTMLElement, text: string) {
    (
      ele!.parentNode!.querySelector(".select-input") as HTMLInputElement
    ).value = text;
  }

  async changeAssign() {
    const { settings } = await chrome.storage.local.get("settings");
    const update = document.querySelector("#update") as HTMLElement;
    if (
      settings.assigned_author !== false &&
      update &&
      window?.getComputedStyle(update)?.display === "none"
    ) {
      const issue_assigned_to_id = document.querySelector(
        "#issue_assigned_to_id"
      ) as HTMLElement;
      const userNode = document.querySelector(".author > .user") as HTMLElement;
      const text = userNode.innerText;
      const id = userNode?.getAttribute("href")?.replace("/users/", "") ?? "";
      // 设置原始select value
      (issue_assigned_to_id as HTMLInputElement).value = id;
      // 设置DOM value
      this.setSelectValue(issue_assigned_to_id, text);
    }
  }
  async statusChange(event: Event) {
    const { settings } = await chrome.storage.local.get("settings");
    const select = event.target as HTMLSelectElement;
    //状态为Resolved时，将完成度设置为100%
    if (String(select?.value) === "3" && settings.percent !== false) {
      // 设置原始select value
      const issue_done_ratio = document.querySelector(
        "#issue_done_ratio"
      ) as HTMLElement;
      (issue_done_ratio as HTMLInputElement).value = "100";
      // 设置DOM value
      this.setSelectValue(issue_done_ratio, "100%");
    }
    let offZZ;
    const loggedas_user = document.querySelector(
      "#loggedas > .user"
    ) as HTMLElement;

    const assigned_user = document.querySelector(
      ".assigned-to > .user"
    ) as HTMLElement;

    // console.log("settings", settings, String(select?.value));
    // 状态为Started或Resolved时，设置跟踪
    if (
      (String(select?.value) === "3" || String(select?.value) === "2") &&
      settings.tracks &&
      // 没有设置为跟踪
      (offZZ = document.querySelector(".icon-fav-off") as HTMLElement) &&
      // 任务单的被指派人和当前用户相同（表示该单子是你的）
      assigned_user.getAttribute("href") === loggedas_user.getAttribute("href")
    ) {
      offZZ.classList?.remove("icon-fav-off");
      offZZ.classList?.add("icon-fav");
      offZZ.textContent = "取消跟踪";
      offZZ.setAttribute("data-method", "delete");

      const csrf_token = document.querySelector(
        'meta[name="csrf-token"]'
      ) as HTMLMetaElement;
      const href = offZZ.getAttribute("href");
      if (href) {
        fetch(href, {
          method: "POST",
          headers: {
            // AJAX请求时必传token
            "X-CSRF-Token": csrf_token.getAttribute("content"),
          } as Record<string, string>,
        })
          .then((response) => {
            console.log("response :", response, response.text());
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      } else {
        // 处理href不存在的情况，例如：
        console.error("href属性不存在");
        // 或抛出错误 throw new Error("href属性不存在");
      }
    }
  }

  async commentsRequired(event: Event) {
    const inputEle = event.target as HTMLSelectElement;
    const form = document.getElementById("issue-form") as HTMLElement;

    // console.log(event, "event", !!inputEle.value.trim());
    commentsRequired(form, !!inputEle.value.trim());
  }
}

const commentsRequired = async (form: any, required = true) => {
  const { settings } = await chrome.storage.local.get("settings");
  const { time_entry_comments } = form;
  // console.log(time_entry_comments, required, "time_entry_comments");
  if (time_entry_comments) {
    if (settings.workingNote !== false && required) {
      time_entry_comments.setAttribute("required", true);
    } else {
      time_entry_comments.removeAttribute("required");
    }
  }
};

//设置工时统计注释是否必填
const setCommentsRequired = () => {
  let form;
  //工时统计页面
  if ((form = document.getElementById("new_time_entry"))) {
    commentsRequired(form);
  }
  //工时编辑页面
  else if ((form = document.querySelector(".edit_time_entry"))) {
    commentsRequired(form);
  }
  //任务单编辑页面，工时填入时，才会检测是否必填
  else if (
    (form = document.getElementById("issue-form")) &&
    form.time_entry_hours
  ) {
    // console.log(form, form.time_entry_hours.value, "commentsRequired");
    commentsRequired(form, !!form.time_entry_hours.value.trim());
  }
};

//初始化设置信息
// chrome.runtime.sendMessage("settings_init", (response: CustomResponse) => {
//   // 使用 response 的逻辑
//   console.log(response, "settings_init");
//   setCommentsRequired();
// });

// 初始化设置信息
// chrome.runtime.sendMessage("settings_init", (response) => {
//   // settings = setCurrentUrl(response);
// });
setCommentsRequired();

// 和background通信，更新设置信息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  setCommentsRequired();
  // 返回 true 表示将进行异步响应
  return true;
});

function initCss() {
  const style = document.createElement("style");
  style.type = "text/css";
  style.appendChild(
    document.createTextNode(`
      #top-menu{
        font-size: 12px!important;
      }

      #quick-search{
        display: flex;
      }

      #quick-search .select-wrapper{
        margin-right: 20px;
        margin-left: 10px;
        display: inline-block;
      }

      .select-wrapper {
        max-width: 95%;
        display: inline-block;
      }

      .searchBox-wrapper {
        position: absolute;
        z-index: 1010;
      }

      .select-input {
        padding: 4px;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        z-index: 999;
        position: relative;
        width: 100%;
      }

      .input-wrapper {
        position: relative;
      }

      .input-wrapper::after {
        position: absolute;
        z-index: 999;
        right: 7px;
        top: 8px;
        content: "";
        border-style: solid dashed dashed;
        border-width: 6px 3px 3px;
        border-color: rgb(51, 51, 51) transparent transparent;
      }

      .search-input {
        width: 100%;
        max-width: 100%!important;
        padding: 4px;
        box-sizing: border-box;
        z-index: 999;
        max-width: 100%;
        position: relative;
      }

      .options-container {
        width: 100%;
        max-width: 100%;
        max-height: 256px;
        overflow-y: auto;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
      }

      .option-item {
        padding: 3px;
        cursor: pointer;
        color: #333;
      }

      .option-item:hover {
        background: rgb(241, 244, 251);
      }

      .highlight {
        background: #e6f7ff;
      }

      .native-select {
        opacity: 0;
        position: absolute;
        display: none !important;
        left: -9999px;
      }
      `)
  );
  document.head.appendChild(style);
}
// 初始化所有select
function initSelects() {
  initCss();

  document.querySelectorAll("select").forEach((select) => {
    new FilterableSelect(select);
  });

  // 监听动态添加的select
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node: any) => {
        if (node.nodeName === "SELECT") {
          new FilterableSelect(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll("select").forEach((newSelect: any) => {
            new FilterableSelect(newSelect);
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// 启动初始化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSelects);
} else {
  initSelects();
}
