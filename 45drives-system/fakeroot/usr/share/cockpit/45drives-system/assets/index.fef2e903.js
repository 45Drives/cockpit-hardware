import { r as ref, w as watch, a as render, b as render$1, o as openBlock, c as createElementBlock, d as createBaseVNode, n as normalizeStyle, t as toDisplayString, e as createCommentVNode, f as createBlock, g as resolveComponent, h as render$2, i as createVNode, F as Fragment, j as renderList, k as render$3, u as useSpawn, l as createApp } from "./vendor.534de466.js";
const p = function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(script) {
    const fetchOpts = {};
    if (script.integrity)
      fetchOpts.integrity = script.integrity;
    if (script.referrerpolicy)
      fetchOpts.referrerPolicy = script.referrerpolicy;
    if (script.crossorigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (script.crossorigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
};
p();
var _600 = "";
var _400 = "";
var _700 = "";
var sourceSansPro = "";
var _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_main$9 = {
  props: {
    moduleName: String,
    centerName: Boolean
  },
  setup(props) {
    const darkMode = ref(true);
    function getTheme() {
      let prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      let theme = localStorage.getItem("color-theme");
      if (theme === null)
        return prefersDark;
      if (theme === "dark")
        return true;
      return false;
    }
    darkMode.value = getTheme();
    if (darkMode.value) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    watch(() => darkMode.value, (darkMode2, oldDarkMode) => {
      localStorage.setItem("color-theme", darkMode2 ? "dark" : "light");
      if (darkMode2) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }, { lazy: false });
    return {
      darkMode
    };
  },
  components: {
    SunIcon: render,
    MoonIcon: render$1
  }
};
const _hoisted_1$9 = {
  class: "p-2 flex items-baseline justify-between bg-neutral-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700",
  style: { "font-family": "Red Hat Text", position: "relative" }
};
const _hoisted_2$8 = { class: "flex flex-row items-baseline basis-10" };
const _hoisted_3$7 = ["src"];
const _hoisted_4$7 = { class: "text-2xl" };
const _hoisted_5$7 = /* @__PURE__ */ createBaseVNode("span", { class: "text-gray-800 dark:text-red-600" }, "Drives", -1);
const _hoisted_6$7 = {
  key: 0,
  class: "ml-5 text-red-800 dark:text-white text-2xl"
};
function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_SunIcon = resolveComponent("SunIcon");
  const _component_MoonIcon = resolveComponent("MoonIcon");
  return openBlock(), createElementBlock("div", _hoisted_1$9, [
    createBaseVNode("div", _hoisted_2$8, [
      createBaseVNode("img", {
        class: "w-6 h-6 text-gray-50 mr-0.5 self-center",
        src: $setup.darkMode ? "img/45d-fan-dark.svg" : "img/45d-fan-light.svg"
      }, null, 8, _hoisted_3$7),
      createBaseVNode("h1", _hoisted_4$7, [
        createBaseVNode("span", {
          class: "text-red-800 dark:text-white font-bold",
          style: normalizeStyle({ "font-family": "Source Sans Pro", "font-size": "1.6rem" })
        }, "45", 4),
        _hoisted_5$7
      ]),
      !$props.centerName ? (openBlock(), createElementBlock("h1", _hoisted_6$7, toDisplayString($props.moduleName), 1)) : createCommentVNode("", true)
    ]),
    $props.centerName ? (openBlock(), createElementBlock("h1", {
      key: 0,
      class: "text-red-800 dark:text-white text-2xl",
      style: normalizeStyle({ position: "absolute", left: "50%", top: "50%", transform: "translateX(-50%) translateY(-50%)" })
    }, toDisplayString($props.moduleName), 5)) : createCommentVNode("", true),
    createBaseVNode("button", {
      onClick: _cache[0] || (_cache[0] = ($event) => $setup.darkMode = !$setup.darkMode),
      id: "theme-toggle",
      type: "button",
      class: "text-gray-500 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none rounded-lg text-sm p-2.5 justify-self-end w-10 h-10 basis-10"
    }, [
      $setup.darkMode ? (openBlock(), createBlock(_component_SunIcon, { key: 0 })) : (openBlock(), createBlock(_component_MoonIcon, { key: 1 }))
    ])
  ]);
}
var FfdHeader = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$7]]);
const _sfc_main$8 = {
  components: {
    XCircleIcon: render$2
  },
  props: {
    errorMsg: Array,
    FixButton: Boolean,
    FixButtonHandler: Function
  },
  setup(props) {
    const errorMsg = ref(props.errorMsg);
    const FixButtonHandler = ref(props.FixButtonHandler);
    watch(() => props.FixButtonHandler, (fn) => {
      FixButtonHandler.value = fn;
    });
    return {
      errorMsg,
      FixButtonHandler
    };
  }
};
const _hoisted_1$8 = { class: "flex items-center justify-evenly" };
const _hoisted_2$7 = { class: "rounded-md bg-red-50 p-4" };
const _hoisted_3$6 = { class: "flex" };
const _hoisted_4$6 = { class: "flex-shrink-0" };
const _hoisted_5$6 = { class: "ml-3" };
const _hoisted_6$6 = /* @__PURE__ */ createBaseVNode("h3", { class: "text-sm font-medium text-red-800" }, " 45Drives System Encountered an Error ", -1);
const _hoisted_7$6 = { class: "mt-2 text-sm text-red-700" };
const _hoisted_8$6 = {
  role: "list",
  class: "list-disc pl-5 space-y-1 whitespace-pre"
};
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_XCircleIcon = resolveComponent("XCircleIcon");
  return openBlock(), createElementBlock("div", _hoisted_1$8, [
    createBaseVNode("div", _hoisted_2$7, [
      createBaseVNode("div", _hoisted_3$6, [
        createBaseVNode("div", _hoisted_4$6, [
          createVNode(_component_XCircleIcon, {
            class: "h-5 w-5 text-red-400",
            "aria-hidden": "true"
          })
        ]),
        createBaseVNode("div", _hoisted_5$6, [
          _hoisted_6$6,
          createBaseVNode("div", _hoisted_7$6, [
            createBaseVNode("ul", _hoisted_8$6, [
              (openBlock(true), createElementBlock(Fragment, null, renderList($setup.errorMsg, (entry) => {
                return openBlock(), createElementBlock("li", null, toDisplayString(entry), 1);
              }), 256))
            ])
          ])
        ])
      ])
    ]),
    $props.FixButton ? (openBlock(), createElementBlock("button", {
      key: 0,
      onClick: _cache[0] || (_cache[0] = (...args) => $setup.FixButtonHandler && $setup.FixButtonHandler(...args)),
      type: "button",
      class: "inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
    }, " Fix ")) : createCommentVNode("", true)
  ]);
}
var ErrorMessage = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$6]]);
const _sfc_main$7 = {
  components: {
    RefreshIconOutline: render$3,
    ErrorMessage
  },
  setup() {
    const sysModel = ref("");
    const sysChassis = ref("");
    const sysSerial = ref("");
    const moboModel = ref("");
    const moboSerial = ref("");
    const serverImgPath = ref("img/45dlogo.png");
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getSystemImgPath = (model) => {
      if (model == "" || model == "?") {
        return "img/45dlogo.png";
      }
      const regExpModel = /(Storinator|Stornado).*(AV15|Q30|S45|XL60|2U|C8|MI4).*/;
      const match = model.match(regExpModel);
      const imgPathLookup = {
        "Storinator": {
          "AV15": "img/storinatorAV15.png",
          "Q30": "img/storinatorQ30.png",
          "S45": "img/storinatorS45.png",
          "XL60": "img/storinatorXL60.png",
          "C8": "img/storinatorC8.png",
          "MI4": "img/storinatorMI4.png"
        },
        "Stornado": {
          "2U": "img/stornado2U.png",
          "AV15": "img/stornadoAV15.png"
        }
      };
      if (!match)
        return "img/45dlogo.png";
      return imgPathLookup[match[1]][match[2]];
    };
    const getSystemInfo = async () => {
      sysModel.value = "Loading...";
      sysChassis.value = "Loading...";
      sysSerial.value = "Loading...";
      moboModel.value = "Loading...";
      moboSerial.value = "Loading...";
      serverImgPath.value = "img/45dlogo.png";
      try {
        const state = await useSpawn(["/usr/share/cockpit/45drives-system-vue/scripts/server_info"], {
          err: "out",
          superuser: "require"
        }).promise();
        let sysInfo = JSON.parse(state.stdout);
        sysModel.value = sysInfo["Model"];
        sysChassis.value = sysInfo["Chassis Size"];
        sysSerial.value = sysInfo["Serial"];
        moboModel.value = sysInfo["Motherboard"]["Manufacturer"] + " " + sysInfo["Motherboard"]["Product Name"];
        moboSerial.value = sysInfo["Motherboard"]["Serial Number"];
        serverImgPath.value = getSystemImgPath(sysInfo["Model"]);
      } catch (err) {
        console.log(err);
        try {
          let errorJson = JSON.parse(err.stderr);
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(errorJson["error_msg"]);
          fatalErrorMsg.value.push('Click "Fix" to run /opt/45drives/tools/server_identifier');
          fatalError.value = true;
          if (errorJson["error_msg"] == "/etc/45drives/server_info/server_info.json does not exist") {
            showFixButton.value = true;
            fixButtonHandler.value = async () => {
              try {
                const fixState = await useSpawn(["/opt/45drives/tools/server_identifier"], {
                  err: "out",
                  superuser: "require",
                  promise: true
                });
                fatalError.value = false;
                fatalErrorMsg.value.length = 0;
                showFixButton.value = false;
                getSystemInfo();
              } catch (error) {
                console.log(error);
                fatalError.value = true;
                fatalErrorMsg.value.length = 0;
                fatalErrorMsg.value.push(error.stderr);
                fatalErrorMsg.value.push("An error occurred when running /opt/45drives/tools/server_identifier");
                showFixButton.value = false;
                console.log(showFixButton.value);
              }
            };
          } else {
          }
        } catch (error) {
          console.log(error);
          fatalError.value = true;
          fatalErrorMsg.value.length = 0;
          fatalErrorMsg.value.push(error.stderr);
          fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/server_info");
          showFixButton.value = false;
          console.log(showFixButton.value);
        }
      }
    };
    getSystemInfo();
    return {
      sysModel,
      sysChassis,
      sysSerial,
      moboModel,
      moboSerial,
      serverImgPath,
      getSystemInfo,
      getSystemImgPath,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler
    };
  }
};
const _hoisted_1$7 = { class: "card mt-2" };
const _hoisted_2$6 = { class: "card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between" };
const _hoisted_3$5 = /* @__PURE__ */ createBaseVNode("h3", { class: "text-lg leading-6 font-semibold" }, "System", -1);
const _hoisted_4$5 = { class: "mt-3 sm:mt-0 sm:ml-4" };
const _hoisted_5$5 = { class: "card-body dark:bg-stone-700" };
const _hoisted_6$5 = {
  key: 0,
  class: "flex flex-row justify-evenly"
};
const _hoisted_7$5 = { class: "bg-white dark:bg-stone-600 shadow overflow-hidden sm:rounded-lg" };
const _hoisted_8$5 = { class: "border-b border-stone-200 dark:border-stone-600" };
const _hoisted_9$5 = { class: "bg-stone-50 dark:bg-stone-600 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" };
const _hoisted_10$5 = /* @__PURE__ */ createBaseVNode("dt", { class: "text-sm font-medium text-stone-900 dark:text-stone-200" }, "Model", -1);
const _hoisted_11$5 = { class: "mt-1 text-sm text-stone-500 dark:text-stone-400 sm:mt-0 sm:col-span-2" };
const _hoisted_12$5 = { class: "bg-white dark:bg-stone-600 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" };
const _hoisted_13$5 = /* @__PURE__ */ createBaseVNode("dt", { class: "text-sm font-medium text-stone-900 dark:text-stone-200" }, "Chassis Size", -1);
const _hoisted_14$5 = { class: "mt-1 text-sm text-stone-500 dark:text-stone-400 sm:mt-0 sm:col-span-2" };
const _hoisted_15$5 = { class: "bg-stone-50 dark:bg-stone-600 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" };
const _hoisted_16$5 = /* @__PURE__ */ createBaseVNode("dt", { class: "text-sm font-medium text-stone-900 dark:text-stone-200" }, "Serial", -1);
const _hoisted_17$5 = { class: "mt-1 text-sm text-stone-500 dark:text-stone-400 sm:mt-0 sm:col-span-2" };
const _hoisted_18$4 = { class: "bg-white dark:bg-stone-600 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" };
const _hoisted_19$3 = /* @__PURE__ */ createBaseVNode("dt", { class: "text-sm font-medium text-stone-900 dark:text-stone-200" }, "Motherboard", -1);
const _hoisted_20$1 = { class: "mt-1 text-sm text-stone-500 dark:text-stone-400 sm:mt-0 sm:col-span-2" };
const _hoisted_21$1 = { class: "bg-stone-50 dark:bg-stone-600 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6" };
const _hoisted_22 = /* @__PURE__ */ createBaseVNode("dt", { class: "text-sm font-medium text-stone-900 dark:text-stone-200" }, " Motherboard Serial ", -1);
const _hoisted_23 = { class: "mt-1 text-sm text-stone-500 dark:text-stone-400 sm:mt-0 sm:col-span-2" };
const _hoisted_24 = ["src"];
const _hoisted_25 = { key: 1 };
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_RefreshIconOutline = resolveComponent("RefreshIconOutline");
  const _component_ErrorMessage = resolveComponent("ErrorMessage");
  return openBlock(), createElementBlock("div", _hoisted_1$7, [
    createBaseVNode("div", _hoisted_2$6, [
      _hoisted_3$5,
      createBaseVNode("div", _hoisted_4$5, [
        createBaseVNode("button", {
          type: "button",
          class: "card-refresh-btn",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.getSystemInfo())
        }, [
          createVNode(_component_RefreshIconOutline, {
            class: "h-5 w-5",
            "aria-hidden": "true"
          })
        ])
      ])
    ]),
    createBaseVNode("div", _hoisted_5$5, [
      !$setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_6$5, [
        createBaseVNode("div", _hoisted_7$5, [
          createBaseVNode("div", _hoisted_8$5, [
            createBaseVNode("dl", null, [
              createBaseVNode("div", _hoisted_9$5, [
                _hoisted_10$5,
                createBaseVNode("dd", _hoisted_11$5, toDisplayString($setup.sysModel), 1)
              ]),
              createBaseVNode("div", _hoisted_12$5, [
                _hoisted_13$5,
                createBaseVNode("dd", _hoisted_14$5, toDisplayString($setup.sysChassis), 1)
              ]),
              createBaseVNode("div", _hoisted_15$5, [
                _hoisted_16$5,
                createBaseVNode("dd", _hoisted_17$5, toDisplayString($setup.sysSerial), 1)
              ]),
              createBaseVNode("div", _hoisted_18$4, [
                _hoisted_19$3,
                createBaseVNode("dd", _hoisted_20$1, toDisplayString($setup.moboModel), 1)
              ]),
              createBaseVNode("div", _hoisted_21$1, [
                _hoisted_22,
                createBaseVNode("dd", _hoisted_23, toDisplayString($setup.moboSerial), 1)
              ])
            ])
          ])
        ]),
        createBaseVNode("img", {
          src: $setup.serverImgPath,
          class: "object-contain h-72 rounded-none justify-self-center"
        }, null, 8, _hoisted_24)
      ])) : createCommentVNode("", true),
      $setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_25, [
        createVNode(_component_ErrorMessage, {
          errorMsg: $setup.fatalErrorMsg,
          FixButton: $setup.showFixButton,
          FixButtonHandler: $setup.fixButtonHandler
        }, null, 8, ["errorMsg", "FixButton", "FixButtonHandler"])
      ])) : createCommentVNode("", true)
    ])
  ]);
}
var SectionSystem = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$5]]);
const _sfc_main$6 = {
  setup() {
    const cpus = ref([
      { socket: "Loading...", model: "Loading...", maxSpeed: "Loading...", currentSpeed: "Loading...", temperature: "Loading..." }
    ]);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getCpuInfo = async () => {
      cpus.value.length = 0;
      cpus.value.push({ socket: "Loading...", model: "Loading...", maxSpeed: "Loading...", currentSpeed: "Loading...", temperature: "Loading..." });
      try {
        const state = await useSpawn(["/usr/share/cockpit/45drives-system-vue/scripts/cpu_info"], {
          err: "out",
          superuser: "require"
        }).promise();
        let cpuInfo = JSON.parse(state.stdout);
        cpus.value.length = 0;
        cpuInfo.cpus.forEach((cpu) => {
          cpus.value.push(cpu);
        });
        fatalError.value = false;
        fatalErrorMsg.value.length = 0;
        showFixButton.value = false;
      } catch (error) {
        console.log(error);
        fatalError.value = true;
        fatalErrorMsg.value.length = 0;
        fatalErrorMsg.value.push(error.stderr);
        fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/cpu_info");
        showFixButton.value = false;
      }
    };
    getCpuInfo();
    return {
      cpus,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getCpuInfo
    };
  },
  components: {
    RefreshIconOutline: render$3,
    ErrorMessage
  }
};
const _hoisted_1$6 = { class: "card" };
const _hoisted_2$5 = { class: "card-header card-header flex flex-row items-center sm:justify-between" };
const _hoisted_3$4 = /* @__PURE__ */ createBaseVNode("h3", { class: "text-header text-default" }, "CPU", -1);
const _hoisted_4$4 = { class: "mt-3 sm:mt-0 sm:ml-4" };
const _hoisted_5$4 = { class: "card-body" };
const _hoisted_6$4 = {
  key: 0,
  class: "mt-2 flex flex-col"
};
const _hoisted_7$4 = { class: "-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8" };
const _hoisted_8$4 = { class: "inline-block min-w-full py-2 align-middle md:px-6 lg:px-8" };
const _hoisted_9$4 = { class: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg" };
const _hoisted_10$4 = { class: "min-w-full divide-y divide-default" };
const _hoisted_11$4 = /* @__PURE__ */ createBaseVNode("thead", { class: "bg-accent" }, [
  /* @__PURE__ */ createBaseVNode("tr", null, [
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6"
    }, "Socket"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold"
    }, "Model"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold"
    }, "Max Speed"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold"
    }, "Current Speed"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold"
    }, "Temperature")
  ])
], -1);
const _hoisted_12$4 = { class: "divide-y divide-default bg-default" };
const _hoisted_13$4 = { class: "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6" };
const _hoisted_14$4 = { class: "whitespace-nowrap px-3 py-4 text-sm text-muted" };
const _hoisted_15$4 = { class: "whitespace-nowrap px-3 py-4 text-sm text-muted" };
const _hoisted_16$4 = { class: "whitespace-nowrap px-3 py-4 text-sm text-muted" };
const _hoisted_17$4 = { class: "whitespace-nowrap px-3 py-4 text-sm text-muted" };
const _hoisted_18$3 = { key: 1 };
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_RefreshIconOutline = resolveComponent("RefreshIconOutline");
  const _component_ErrorMessage = resolveComponent("ErrorMessage");
  return openBlock(), createElementBlock("div", _hoisted_1$6, [
    createBaseVNode("div", _hoisted_2$5, [
      _hoisted_3$4,
      createBaseVNode("div", _hoisted_4$4, [
        createBaseVNode("button", {
          type: "button",
          class: "card-refresh-btn",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.getCpuInfo())
        }, [
          createVNode(_component_RefreshIconOutline, {
            class: "h-5 w-5",
            "aria-hidden": "true"
          })
        ])
      ])
    ]),
    createBaseVNode("div", _hoisted_5$4, [
      !$setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_6$4, [
        createBaseVNode("div", _hoisted_7$4, [
          createBaseVNode("div", _hoisted_8$4, [
            createBaseVNode("div", _hoisted_9$4, [
              createBaseVNode("table", _hoisted_10$4, [
                _hoisted_11$4,
                createBaseVNode("tbody", _hoisted_12$4, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList($setup.cpus, (cpu) => {
                    return openBlock(), createElementBlock("tr", {
                      key: cpu.socket
                    }, [
                      createBaseVNode("td", _hoisted_13$4, toDisplayString(cpu.socket), 1),
                      createBaseVNode("td", _hoisted_14$4, toDisplayString(cpu.model), 1),
                      createBaseVNode("td", _hoisted_15$4, toDisplayString(cpu.maxSpeed), 1),
                      createBaseVNode("td", _hoisted_16$4, toDisplayString(cpu.currentSpeed), 1),
                      createBaseVNode("td", _hoisted_17$4, toDisplayString(cpu.temperature), 1)
                    ]);
                  }), 128))
                ])
              ])
            ])
          ])
        ])
      ])) : createCommentVNode("", true),
      $setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_18$3, [
        createVNode(_component_ErrorMessage, {
          errorMsg: $setup.fatalErrorMsg,
          FixButton: $setup.showFixButton,
          FixButtonHandler: $setup.fixButtonHandler
        }, null, 8, ["errorMsg", "FixButton", "FixButtonHandler"])
      ])) : createCommentVNode("", true)
    ])
  ]);
}
var SectionCpu = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$4]]);
const _sfc_main$5 = {
  setup() {
    const pcis = ref([
      { slot: "Loading...", type: "Loading...", availibility: "Loading...", busAddress: "Loading...", cardType: "Loading...", cardModel: "Loading..." }
    ]);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getPciInfo = async () => {
      pcis.value.length = 0;
      pcis.value.push({ slot: "Loading...", type: "Loading...", availibility: "Loading...", busAddress: "Loading...", cardType: "Loading...", cardModel: "Loading..." });
      try {
        const state = await useSpawn(["/usr/share/cockpit/45drives-system-vue/scripts/pci"], {
          err: "out",
          superuser: "require"
        }).promise();
        let pciInfo = JSON.parse(state.stdout);
        pcis.value.length = 0;
        pciInfo.forEach((pci) => {
          pcis.value.push(pci);
        });
        fatalError.value = false;
        fatalErrorMsg.value.length = 0;
        showFixButton.value = false;
      } catch (error) {
        console.log(error);
        fatalError.value = true;
        fatalErrorMsg.value.length = 0;
        fatalErrorMsg.value.push(error.stderr);
        fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/pci");
        showFixButton.value = false;
      }
    };
    getPciInfo();
    return {
      pcis,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getPciInfo
    };
  },
  components: {
    RefreshIconOutline: render$3,
    ErrorMessage
  }
};
const _hoisted_1$5 = { class: "card" };
const _hoisted_2$4 = { class: "card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between" };
const _hoisted_3$3 = /* @__PURE__ */ createBaseVNode("h3", { class: "text-lg leading-6 font-semibold" }, "PCI", -1);
const _hoisted_4$3 = { class: "mt-3 sm:mt-0 sm:ml-4" };
const _hoisted_5$3 = { class: "card-body dark:bg-stone-700" };
const _hoisted_6$3 = {
  key: 0,
  class: "mt-2 flex flex-col"
};
const _hoisted_7$3 = { class: "-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8" };
const _hoisted_8$3 = { class: "inline-block min-w-full py-2 align-middle md:px-6 lg:px-8" };
const _hoisted_9$3 = { class: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg" };
const _hoisted_10$3 = { class: "min-w-full divide-y divide-stone-400 dark:divide-stone-600" };
const _hoisted_11$3 = /* @__PURE__ */ createBaseVNode("thead", { class: "bg-stone-50 dark:bg-stone-500" }, [
  /* @__PURE__ */ createBaseVNode("tr", null, [
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stone-900 dark:text-stone-200 sm:pl-6"
    }, "Slot"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Type"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Availability"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Bus Address"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Card Type"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Card Model")
  ])
], -1);
const _hoisted_12$3 = { class: "divide-y divide-stone-200 bg-white dark:bg-stone-600 dark:divide-stone-500" };
const _hoisted_13$3 = { class: "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-stone-900 dark:text-stone-300 sm:pl-6" };
const _hoisted_14$3 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_15$3 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_16$3 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_17$3 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_18$2 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_19$2 = { key: 1 };
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_RefreshIconOutline = resolveComponent("RefreshIconOutline");
  const _component_ErrorMessage = resolveComponent("ErrorMessage");
  return openBlock(), createElementBlock("div", _hoisted_1$5, [
    createBaseVNode("div", _hoisted_2$4, [
      _hoisted_3$3,
      createBaseVNode("div", _hoisted_4$3, [
        createBaseVNode("button", {
          type: "button",
          class: "card-refresh-btn",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.getPciInfo())
        }, [
          createVNode(_component_RefreshIconOutline, {
            class: "h-5 w-5",
            "aria-hidden": "true"
          })
        ])
      ])
    ]),
    createBaseVNode("div", _hoisted_5$3, [
      !$setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_6$3, [
        createBaseVNode("div", _hoisted_7$3, [
          createBaseVNode("div", _hoisted_8$3, [
            createBaseVNode("div", _hoisted_9$3, [
              createBaseVNode("table", _hoisted_10$3, [
                _hoisted_11$3,
                createBaseVNode("tbody", _hoisted_12$3, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList($setup.pcis, (pci) => {
                    return openBlock(), createElementBlock("tr", {
                      key: pci.socket
                    }, [
                      createBaseVNode("td", _hoisted_13$3, toDisplayString(pci.slot), 1),
                      createBaseVNode("td", _hoisted_14$3, toDisplayString(pci.type), 1),
                      createBaseVNode("td", _hoisted_15$3, toDisplayString(pci.availibility), 1),
                      createBaseVNode("td", _hoisted_16$3, toDisplayString(pci.busAddress), 1),
                      createBaseVNode("td", _hoisted_17$3, toDisplayString(pci.cardType), 1),
                      createBaseVNode("td", _hoisted_18$2, toDisplayString(pci.cardModel), 1)
                    ]);
                  }), 128))
                ])
              ])
            ])
          ])
        ])
      ])) : createCommentVNode("", true),
      $setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_19$2, [
        createVNode(_component_ErrorMessage, {
          errorMsg: $setup.fatalErrorMsg,
          FixButton: $setup.showFixButton,
          FixButtonHandler: $setup.fixButtonHandler
        }, null, 8, ["errorMsg", "FixButton", "FixButtonHandler"])
      ])) : createCommentVNode("", true)
    ])
  ]);
}
var SectionPci = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$3]]);
const _sfc_main$4 = {
  setup() {
    const rams = ref([
      { locator: "Loading...", type: "Loading...", size: "Loading...", manufacturer: "Loading...", serialNumber: "Loading...", temperature: "Loading..." }
    ]);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getRamInfo = async () => {
      rams.value.length = 0;
      rams.value.push({ locator: "Loading...", type: "Loading...", size: "Loading...", manufacturer: "Loading...", serialNumber: "Loading...", temperature: "Loading..." });
      try {
        const state = await useSpawn(["/usr/share/cockpit/45drives-system-vue/scripts/ram"], {
          err: "out",
          superuser: "require"
        }).promise();
        let ramInfo = JSON.parse(state.stdout);
        console.log(ramInfo);
        rams.value.length = 0;
        ramInfo.forEach((ram) => {
          rams.value.push(ram);
        });
        fatalError.value = false;
        fatalErrorMsg.value.length = 0;
        showFixButton.value = false;
      } catch (error) {
        console.log(error);
        fatalError.value = true;
        fatalErrorMsg.value.length = 0;
        fatalErrorMsg.value.push(error.stderr);
        fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/ram");
        showFixButton.value = false;
      }
    };
    getRamInfo();
    return {
      rams,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getRamInfo
    };
  },
  components: {
    RefreshIconOutline: render$3,
    ErrorMessage
  }
};
const _hoisted_1$4 = { class: "card" };
const _hoisted_2$3 = { class: "card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between" };
const _hoisted_3$2 = /* @__PURE__ */ createBaseVNode("h3", { class: "text-lg leading-6 font-semibold" }, "RAM", -1);
const _hoisted_4$2 = { class: "mt-3 sm:mt-0 sm:ml-4" };
const _hoisted_5$2 = { class: "card-body dark:bg-stone-700" };
const _hoisted_6$2 = {
  key: 0,
  class: "mt-2 flex flex-col"
};
const _hoisted_7$2 = { class: "-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8" };
const _hoisted_8$2 = { class: "inline-block min-w-full py-2 align-middle md:px-6 lg:px-8" };
const _hoisted_9$2 = { class: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg" };
const _hoisted_10$2 = { class: "min-w-full divide-y divide-stone-400 dark:divide-stone-600" };
const _hoisted_11$2 = /* @__PURE__ */ createBaseVNode("thead", { class: "bg-stone-50 dark:bg-stone-500" }, [
  /* @__PURE__ */ createBaseVNode("tr", null, [
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stone-900 dark:text-stone-200 sm:pl-6"
    }, "Locator"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Type"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Size"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Manufacturer"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Serial Number"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Temperature")
  ])
], -1);
const _hoisted_12$2 = { class: "divide-y divide-stone-200 bg-white dark:bg-stone-600 dark:divide-stone-500" };
const _hoisted_13$2 = { class: "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-stone-900 dark:text-stone-300 sm:pl-6" };
const _hoisted_14$2 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_15$2 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_16$2 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_17$2 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_18$1 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_19$1 = { key: 1 };
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_RefreshIconOutline = resolveComponent("RefreshIconOutline");
  const _component_ErrorMessage = resolveComponent("ErrorMessage");
  return openBlock(), createElementBlock("div", _hoisted_1$4, [
    createBaseVNode("div", _hoisted_2$3, [
      _hoisted_3$2,
      createBaseVNode("div", _hoisted_4$2, [
        createBaseVNode("button", {
          type: "button",
          class: "card-refresh-btn",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.getRamInfo())
        }, [
          createVNode(_component_RefreshIconOutline, {
            class: "h-5 w-5",
            "aria-hidden": "true"
          })
        ])
      ])
    ]),
    createBaseVNode("div", _hoisted_5$2, [
      !$setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_6$2, [
        createBaseVNode("div", _hoisted_7$2, [
          createBaseVNode("div", _hoisted_8$2, [
            createBaseVNode("div", _hoisted_9$2, [
              createBaseVNode("table", _hoisted_10$2, [
                _hoisted_11$2,
                createBaseVNode("tbody", _hoisted_12$2, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList($setup.rams, (ram) => {
                    return openBlock(), createElementBlock("tr", {
                      key: ram.locator
                    }, [
                      createBaseVNode("td", _hoisted_13$2, toDisplayString(ram.locator), 1),
                      createBaseVNode("td", _hoisted_14$2, toDisplayString(ram.type), 1),
                      createBaseVNode("td", _hoisted_15$2, toDisplayString(ram.size), 1),
                      createBaseVNode("td", _hoisted_16$2, toDisplayString(ram.manufacturer), 1),
                      createBaseVNode("td", _hoisted_17$2, toDisplayString(ram.serialNumber), 1),
                      createBaseVNode("td", _hoisted_18$1, toDisplayString(ram.temperature), 1)
                    ]);
                  }), 128))
                ])
              ])
            ])
          ])
        ])
      ])) : createCommentVNode("", true),
      $setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_19$1, [
        createVNode(_component_ErrorMessage, {
          errorMsg: $setup.fatalErrorMsg,
          FixButton: $setup.showFixButton,
          FixButtonHandler: $setup.fixButtonHandler
        }, null, 8, ["errorMsg", "FixButton", "FixButtonHandler"])
      ])) : createCommentVNode("", true)
    ])
  ]);
}
var SectionRam = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$2]]);
const _sfc_main$3 = {
  setup() {
    const networks = ref([
      { connectionName: "Loading...", connectionState: "Loading...", connectionType: "Loading...", mac: "Loading...", ipv4: "Loading...", ipv6: "Loading...", pciSlot: "Loading...", busAddress: "Loading..." }
    ]);
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getNetworkInfo = async () => {
      networks.value.length = 0;
      networks.value.push({ connectionName: "Loading...", connectionState: "Loading...", connectionType: "Loading...", mac: "Loading...", ipv4: "Loading...", ipv6: "Loading...", pciSlot: "Loading...", busAddress: "Loading..." });
      try {
        const state = await useSpawn(["/usr/share/cockpit/45drives-system-vue/scripts/network"], {
          err: "out",
          superuser: "require"
        }).promise();
        let networkInfo = JSON.parse(state.stdout);
        networks.value.length = 0;
        networkInfo.forEach((network) => {
          networks.value.push(network);
        });
        fatalError.value = false;
        fatalErrorMsg.value.length = 0;
        showFixButton.value = false;
      } catch (error) {
        console.log(error);
        fatalError.value = true;
        fatalErrorMsg.value.length = 0;
        fatalErrorMsg.value.push(error.stderr);
        fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/network");
        showFixButton.value = false;
      }
    };
    getNetworkInfo();
    return {
      networks,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getNetworkInfo
    };
  },
  components: {
    RefreshIconOutline: render$3,
    ErrorMessage
  }
};
const _hoisted_1$3 = { class: "card" };
const _hoisted_2$2 = { class: "card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between" };
const _hoisted_3$1 = /* @__PURE__ */ createBaseVNode("h3", { class: "text-lg leading-6 font-semibold" }, "Network", -1);
const _hoisted_4$1 = { class: "mt-3 sm:mt-0 sm:ml-4" };
const _hoisted_5$1 = { class: "card-body dark:bg-stone-700" };
const _hoisted_6$1 = {
  key: 0,
  class: "mt-2 flex flex-col"
};
const _hoisted_7$1 = { class: "-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8" };
const _hoisted_8$1 = { class: "inline-block min-w-full py-2 align-middle md:px-6 lg:px-8" };
const _hoisted_9$1 = { class: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg" };
const _hoisted_10$1 = { class: "min-w-full divide-y divide-stone-400 dark:divide-stone-600" };
const _hoisted_11$1 = /* @__PURE__ */ createBaseVNode("thead", { class: "bg-stone-50 dark:bg-stone-500" }, [
  /* @__PURE__ */ createBaseVNode("tr", null, [
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-stone-900 dark:text-stone-200 sm:pl-6"
    }, "Connection Name"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Connection State"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Type"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "MAC"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "IPv4"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "IPv6"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "PCI Slot"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold text-stone-900 dark:text-stone-200"
    }, "Bus Address")
  ])
], -1);
const _hoisted_12$1 = { class: "divide-y divide-stone-200 bg-white dark:bg-stone-600 dark:divide-stone-500" };
const _hoisted_13$1 = { class: "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-stone-900 dark:text-stone-200 sm:pl-6" };
const _hoisted_14$1 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_15$1 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_16$1 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_17$1 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_18 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_19 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_20 = { class: "whitespace-nowrap px-3 py-4 text-sm text-stone-500 dark:text-stone-400" };
const _hoisted_21 = { key: 1 };
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_RefreshIconOutline = resolveComponent("RefreshIconOutline");
  const _component_ErrorMessage = resolveComponent("ErrorMessage");
  return openBlock(), createElementBlock("div", _hoisted_1$3, [
    createBaseVNode("div", _hoisted_2$2, [
      _hoisted_3$1,
      createBaseVNode("div", _hoisted_4$1, [
        createBaseVNode("button", {
          type: "button",
          class: "card-refresh-btn",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.getNetworkInfo())
        }, [
          createVNode(_component_RefreshIconOutline, {
            class: "h-5 w-5",
            "aria-hidden": "true"
          })
        ])
      ])
    ]),
    createBaseVNode("div", _hoisted_5$1, [
      !$setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_6$1, [
        createBaseVNode("div", _hoisted_7$1, [
          createBaseVNode("div", _hoisted_8$1, [
            createBaseVNode("div", _hoisted_9$1, [
              createBaseVNode("table", _hoisted_10$1, [
                _hoisted_11$1,
                createBaseVNode("tbody", _hoisted_12$1, [
                  (openBlock(true), createElementBlock(Fragment, null, renderList($setup.networks, (network) => {
                    return openBlock(), createElementBlock("tr", {
                      key: network.connectionName
                    }, [
                      createBaseVNode("td", _hoisted_13$1, toDisplayString(network.connectionName), 1),
                      createBaseVNode("td", _hoisted_14$1, toDisplayString(network.connectionState), 1),
                      createBaseVNode("td", _hoisted_15$1, toDisplayString(network.connectionType), 1),
                      createBaseVNode("td", _hoisted_16$1, toDisplayString(network.mac), 1),
                      createBaseVNode("td", _hoisted_17$1, toDisplayString(network.ipv4), 1),
                      createBaseVNode("td", _hoisted_18, toDisplayString(network.ipv6), 1),
                      createBaseVNode("td", _hoisted_19, toDisplayString(network.pciSlot), 1),
                      createBaseVNode("td", _hoisted_20, toDisplayString(network.busAddress), 1)
                    ]);
                  }), 128))
                ])
              ])
            ])
          ])
        ])
      ])) : createCommentVNode("", true),
      $setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_21, [
        createVNode(_component_ErrorMessage, {
          errorMsg: $setup.fatalErrorMsg,
          FixButton: $setup.showFixButton,
          FixButtonHandler: $setup.fixButtonHandler
        }, null, 8, ["errorMsg", "FixButton", "FixButtonHandler"])
      ])) : createCommentVNode("", true)
    ])
  ]);
}
var SectionNetwork = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$1]]);
const _sfc_main$2 = {
  setup() {
    const ipmi = ref({ ipAddress: "Loading...", subnetMask: "Loading...", macAddress: "Loading...", defaultGatewayIp: "Loading..." });
    const fatalError = ref(false);
    const fatalErrorMsg = ref([]);
    const showFixButton = ref(false);
    const fixButtonHandler = ref(() => {
      console.log("Default handler was run for the fix button.");
    });
    const getIpmiInfo = async () => {
      ipmi.value = { ipAddress: "Loading...", subnetMask: "Loading...", macAddress: "Loading...", defaultGatewayIp: "Loading..." };
      try {
        const state = await useSpawn(["/usr/share/cockpit/45drives-system-vue/scripts/ipmi"], {
          err: "out",
          superuser: "require"
        }).promise();
        let ipmiInfo = JSON.parse(state.stdout);
        ipmi.value = ipmiInfo;
        fatalError.value = false;
        fatalErrorMsg.value.length = 0;
        showFixButton.value = false;
      } catch (error) {
        console.log(error);
        fatalError.value = true;
        fatalErrorMsg.value.length = 0;
        fatalErrorMsg.value.push(error.stderr);
        fatalErrorMsg.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/ipmi");
        showFixButton.value = false;
      }
    };
    getIpmiInfo();
    return {
      ipmi,
      fatalError,
      fatalErrorMsg,
      showFixButton,
      fixButtonHandler,
      getIpmiInfo
    };
  },
  components: {
    RefreshIconOutline: render$3,
    ErrorMessage
  }
};
const _hoisted_1$2 = { class: "card" };
const _hoisted_2$1 = { class: "card-header card-header flex flex-row items-center sm:justify-between" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("h3", { class: "text-header text-default" }, "IPMI", -1);
const _hoisted_4 = { class: "mt-3 sm:mt-0 sm:ml-4" };
const _hoisted_5 = { class: "card-body" };
const _hoisted_6 = {
  key: 0,
  class: "mt-2 flex flex-col"
};
const _hoisted_7 = { class: "-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8" };
const _hoisted_8 = { class: "inline-block min-w-full py-2 align-middle md:px-6 lg:px-8" };
const _hoisted_9 = { class: "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg" };
const _hoisted_10 = { class: "min-w-full divide-y divide-default" };
const _hoisted_11 = /* @__PURE__ */ createBaseVNode("thead", { class: "bg-accent" }, [
  /* @__PURE__ */ createBaseVNode("tr", null, [
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "py-3.5 pl-4 pr-3 text-left text-sm font-semibold sm:pl-6"
    }, "IP Address"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold"
    }, "Subnet Mask"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold"
    }, "MAC Address"),
    /* @__PURE__ */ createBaseVNode("th", {
      scope: "col",
      class: "px-3 py-3.5 text-left text-sm font-semibold"
    }, "Default Gateway IP")
  ])
], -1);
const _hoisted_12 = { class: "divide-y divide-default" };
const _hoisted_13 = { class: "whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium sm:pl-6" };
const _hoisted_14 = { class: "whitespace-nowrap px-3 py-4 text-sm text-muted" };
const _hoisted_15 = { class: "whitespace-nowrap px-3 py-4 text-sm text-muted" };
const _hoisted_16 = { class: "whitespace-nowrap px-3 py-4 text-sm text-muted" };
const _hoisted_17 = { key: 1 };
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_RefreshIconOutline = resolveComponent("RefreshIconOutline");
  const _component_ErrorMessage = resolveComponent("ErrorMessage");
  return openBlock(), createElementBlock("div", _hoisted_1$2, [
    createBaseVNode("div", _hoisted_2$1, [
      _hoisted_3,
      createBaseVNode("div", _hoisted_4, [
        createBaseVNode("button", {
          type: "button",
          class: "card-refresh-btn",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.getIpmiInfo())
        }, [
          createVNode(_component_RefreshIconOutline, {
            class: "h-5 w-5",
            "aria-hidden": "true"
          })
        ])
      ])
    ]),
    createBaseVNode("div", _hoisted_5, [
      !$setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_6, [
        createBaseVNode("div", _hoisted_7, [
          createBaseVNode("div", _hoisted_8, [
            createBaseVNode("div", _hoisted_9, [
              createBaseVNode("table", _hoisted_10, [
                _hoisted_11,
                createBaseVNode("tbody", _hoisted_12, [
                  createBaseVNode("tr", null, [
                    createBaseVNode("td", _hoisted_13, toDisplayString($setup.ipmi.ipAddress), 1),
                    createBaseVNode("td", _hoisted_14, toDisplayString($setup.ipmi.subnetMask), 1),
                    createBaseVNode("td", _hoisted_15, toDisplayString($setup.ipmi.macAddress), 1),
                    createBaseVNode("td", _hoisted_16, toDisplayString($setup.ipmi.defaultGatewayIp), 1)
                  ])
                ])
              ])
            ])
          ])
        ])
      ])) : createCommentVNode("", true),
      $setup.fatalError ? (openBlock(), createElementBlock("div", _hoisted_17, [
        createVNode(_component_ErrorMessage, {
          errorMsg: $setup.fatalErrorMsg,
          FixButton: $setup.showFixButton,
          FixButtonHandler: $setup.fixButtonHandler
        }, null, 8, ["errorMsg", "FixButton", "FixButtonHandler"])
      ])) : createCommentVNode("", true)
    ])
  ]);
}
var SectionIpmiLan = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render]]);
const _hoisted_1$1 = { class: "h-full w-full overflow-y-scroll well" };
const _hoisted_2 = { class: "max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8 grow gap-well" };
const _sfc_main$1 = {
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$1, [
        createBaseVNode("div", _hoisted_2, [
          createVNode(SectionSystem),
          createVNode(SectionPci),
          createVNode(SectionCpu),
          createVNode(SectionRam),
          createVNode(SectionNetwork),
          createVNode(SectionIpmiLan)
        ])
      ]);
    };
  }
};
var App_vue_vue_type_style_index_0_lang = "";
const _hoisted_1 = { class: "h-full flex flex-col overflow-hidden" };
const _sfc_main = {
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(FfdHeader, {
          moduleName: "System",
          centerName: ""
        }),
        createVNode(_sfc_main$1)
      ]);
    };
  }
};
var index = "";
createApp(_sfc_main).mount("#app");
