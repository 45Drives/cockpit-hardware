import{r as k,w as y,a as x,b,o as s,c as d,d as c,n as i,t as u,e as m,f,g as _,p as w,h as p,i as N}from"./vendor.e77d5746.js";const M=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const a of e)if(a.type==="childList")for(const l of a.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function n(e){const a={};return e.integrity&&(a.integrity=e.integrity),e.referrerpolicy&&(a.referrerPolicy=e.referrerpolicy),e.crossorigin==="use-credentials"?a.credentials="include":e.crossorigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(e){if(e.ep)return;e.ep=!0;const a=n(e);fetch(e.href,a)}};M();var g=(o,t)=>{const n=o.__vccOpts||o;for(const[r,e]of t)n[r]=e;return n};const S={props:{moduleName:String,centerName:Boolean},setup(o){const t=k(!0);function n(){let r=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches,e=localStorage.getItem("color-theme");return e===null?r:e==="dark"}return t.value=n(),t.value?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark"),y(()=>t.value,(r,e)=>{localStorage.setItem("color-theme",r?"dark":"light"),r?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")},{lazy:!1}),{darkMode:t}},components:{SunIcon:x,MoonIcon:b}},I={class:"p-2 flex items-baseline justify-between bg-neutral-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700",style:{"font-family":"Red Hat Text",position:"relative"}},L={class:"flex flex-row items-baseline basis-10"},$=["src"],C={class:"text-2xl"},E=c("span",{class:"text-gray-800 dark:text-red-600"},"Drives",-1),B={key:0,class:"ml-5 text-red-800 dark:text-white text-2xl"};function D(o,t,n,r,e,a){const l=_("SunIcon"),v=_("MoonIcon");return s(),d("div",I,[c("div",L,[c("img",{class:"w-6 h-6 text-gray-50 mr-0.5 self-center",src:r.darkMode?"img/45d-fan-dark.svg":"img/45d-fan-light.svg"},null,8,$),c("h1",C,[c("span",{class:"text-red-800 dark:text-white font-bold",style:i({"font-family":"Source Sans Pro","font-size":"1.6rem"})},"45",4),E]),n.centerName?m("",!0):(s(),d("h1",B,u(n.moduleName),1))]),n.centerName?(s(),d("h1",{key:0,class:"text-red-800 dark:text-white text-2xl",style:i({position:"absolute",left:"50%",top:"50%",transform:"translateX(-50%) translateY(-50%)"})},u(n.moduleName),5)):m("",!0),c("button",{onClick:t[0]||(t[0]=K=>r.darkMode=!r.darkMode),id:"theme-toggle",type:"button",class:"text-gray-500 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none rounded-lg text-sm p-2.5 justify-self-end w-10 h-10 basis-10"},[r.darkMode?(s(),f(l,{key:0})):(s(),f(v,{key:1}))])])}var O=g(S,[["render",D]]);const P=o=>{let t=0;o.setup=()=>{o.createCanvas(400,400),o.background(0)},o.draw=()=>{t=t++%255,o.background(t)}};let h;const A={name:"App",beforeMount(){h=new w(P,"p5Canvas")},mounted(){h.background("red")}},z={id:"app"},V=c("div",{id:"p5Canvas"},null,-1),j=[V];function F(o,t,n,r,e,a){return s(),d("div",z,j)}var H=g(A,[["render",F]]);const T={class:"h-full flex flex-col overflow-hidden"},q={setup(o){return(t,n)=>(s(),d("div",T,[p(O,{moduleName:"Disks",centerName:""}),p(H)]))}};N(q).mount("#app");