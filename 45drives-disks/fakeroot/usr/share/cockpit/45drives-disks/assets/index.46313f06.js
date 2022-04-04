var M=Object.defineProperty;var b=Object.getOwnPropertySymbols;var I=Object.prototype.hasOwnProperty,$=Object.prototype.propertyIsEnumerable;var k=(n,e,t)=>e in n?M(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t,p=(n,e)=>{for(var t in e||(e={}))I.call(e,t)&&k(n,t,e[t]);if(b)for(var t of b(e))$.call(e,t)&&k(n,t,e[t]);return n};import{r as v,w as y,a as E,b as S,c as f,o as d,d as c,e as a,n as w,t as _,f as u,g as F,P as H,h as N,i as m,F as C,j as D,k as x,l as L,m as P}from"./vendor.dda642bf.js";const A=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerpolicy&&(i.referrerPolicy=s.referrerpolicy),s.crossorigin==="use-credentials"?i.credentials="include":s.crossorigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}};A();var h=(n,e)=>{const t=n.__vccOpts||n;for(const[r,s]of e)t[r]=s;return t};const O={props:{moduleName:String,centerName:Boolean},setup(n){const e=v(!0);function t(){let r=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches,s=localStorage.getItem("color-theme");return s===null?r:s==="dark"}return e.value=t(),e.value?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark"),y(()=>e.value,(r,s)=>{localStorage.setItem("color-theme",r?"dark":"light"),r?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")},{lazy:!1}),{darkMode:e}},components:{SunIcon:E,MoonIcon:S}},j={class:"p-2 flex items-baseline justify-between bg-neutral-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700",style:{"font-family":"Red Hat Text",position:"relative"}},X={class:"flex flex-row items-baseline basis-10"},q=["src"],z={class:"text-2xl"},V=a("span",{class:"text-gray-800 dark:text-red-600"},"Drives",-1),J={key:0,class:"ml-5 text-red-800 dark:text-white text-2xl"};function R(n,e,t,r,s,i){const o=f("SunIcon"),l=f("MoonIcon");return d(),c("div",j,[a("div",X,[a("img",{class:"w-6 h-6 text-gray-50 mr-0.5 self-center",src:r.darkMode?"img/45d-fan-dark.svg":"img/45d-fan-light.svg"},null,8,q),a("h1",z,[a("span",{class:"text-red-800 dark:text-white font-bold",style:w({"font-family":"Source Sans Pro","font-size":"1.6rem"})},"45",4),V]),t.centerName?u("",!0):(d(),c("h1",J,_(t.moduleName),1))]),t.centerName?(d(),c("h1",{key:0,class:"text-red-800 dark:text-white text-2xl",style:w({position:"absolute",left:"50%",top:"50%",transform:"translateX(-50%) translateY(-50%)"})},_(t.moduleName),5)):u("",!0),a("button",{onClick:e[0]||(e[0]=g=>r.darkMode=!r.darkMode),id:"theme-toggle",type:"button",class:"text-gray-500 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none rounded-lg text-sm p-2.5 justify-self-end w-10 h-10 basis-10"},[r.darkMode?(d(),F(o,{key:0})):(d(),F(l,{key:1}))])])}var T=h(O,[["render",R]]);const K={name:"P5Canvas",mounted(){const n=function(e){var t=2,r=35;e.setup=s=>{e.createCanvas(500,500).parent("p5-canvas")},e.draw=s=>{e.background(245);const i=e.frameCount*3,o=e.sin(e.radians(i))*50;e.push(),e.translate(0,e.height/2),e.fill(66,184,131),e.stroke(53,73,94),e.strokeWeight(5),e.ellipse(r,o,50,50),e.pop(),r+=t,(r>e.width-35||r<35)&&(t*=-1)}};new H(n)}},W={id:"p5-canvas",class:"mt-2 mx-auto"};function Y(n,e,t,r,s,i){return d(),c("div",W)}var G=h(K,[["render",Y]]);const Q={components:{XCircleIcon:N},props:{errorMsg:Array,FixButton:Boolean,FixButtonHandler:Function},setup(n){const e=v(n.errorMsg),t=v(n.FixButtonHandler);return y(()=>n.FixButtonHandler,r=>{t.value=r}),{errorMsg:e,FixButtonHandler:t}}},U={class:"flex items-center justify-evenly"},Z={class:"rounded-md bg-red-50 p-4"},ee={class:"flex"},re={class:"flex-shrink-0"},te={class:"ml-3"},oe=a("h3",{class:"text-sm font-medium text-red-800"}," 45Drives Disks Encountered an Error ",-1),se={class:"mt-2 text-sm text-red-700"},ne={role:"list",class:"list-disc pl-5 space-y-1 whitespace-pre"};function ae(n,e,t,r,s,i){const o=f("XCircleIcon");return d(),c("div",U,[a("div",Z,[a("div",ee,[a("div",re,[m(o,{class:"h-5 w-5 text-red-400","aria-hidden":"true"})]),a("div",te,[oe,a("div",se,[a("ul",ne,[(d(!0),c(C,null,D(r.errorMsg,l=>(d(),c("li",null,_(l),1))),256))])])])])]),t.FixButton?(d(),c("button",{key:0,onClick:e[0]||(e[0]=(...l)=>r.FixButtonHandler&&r.FixButtonHandler(...l)),type:"button",class:"inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"}," Fix ")):u("",!0)])}var ie=h(Q,[["render",ae]]);function B(n=[],e={},t="out"){const r=x({loading:!1,status:0,stdout:"",stderr:""}),s=Boolean(e.promise);e.superuser||(e.superuser="require"),e.err=t==="out"?"out":"message";async function i(){r.loading=!0,r.status=0,r.stdout="",r.stderr="",cockpit.spawn(n,e).then((o,l)=>{r.stdout=o,r.stderr=l}).catch((o,l)=>{var g;r.stderr=l!=null?l:o.message,r.status=(g=o.exit_status)!=null?g:-1}).finally(()=>{r.loading=!1})}return i(),s?new Promise((o,l)=>{y(r,()=>{r.loading||(r.status!==0?l(p({},r)):o(p({},r)))})}):r}const le={setup(){const n=v(),e=x({errorFlag:!1,errorMessage:[],showFixButton:!1,fixButtonHandler:()=>{console.log("Default handler was run for the fix button.")}}),t=v(),r=x({errorFlag:!1,errorMessage:[],showFixButton:!1,fixButtonHandler:()=>{console.log("Default handler was run for the fix button.")}});return console.log(e),console.log(r),{runServerInfo:async()=>{try{const o=await B(["/usr/share/cockpit/45drives-disks-vue/scripts/server_info"],{err:"out",superuser:"require",promise:!0});let l=JSON.parse(o.stdout);console.log(l),n.value=o.stdout,e.errorFlag=!1,e.errorMessage.length=0,e.showFixButton=!1}catch(o){console.log(o),e.errorFlag=!0,e.errorMessage.length=0,e.errorMessage.push(o.stderr),e.errorMessage.push("An error occurred when trying to run /usr/share/cockpit/45drives-disks/scripts/server_info"),e.showFixButton=!1}},runLsdev:async()=>{try{const o=await B(["/opt/45drives/tools/lsdev","--json"],{err:"out",superuser:"require",promise:!0});let l=JSON.parse(o.stdout);console.log(l),t.value=o.stdout,r.errorFlag=!1,r.errorMessage.length=0,r.showFixButton=!1}catch(o){console.log(o),r.errorFlag=!0,r.errorMessage.length=0,r.errorMessage.push(o.stderr),r.errorMessage.push("An error occurred when trying to run /opt/45drives/tools/lsdev"),r.showFixButton=!1}},serverInfo:n,serverInfoError:e,lsdevInfo:t,lsdevError:r}},components:{RefreshIconOutline:L,ErrorMessage:ie}},de={class:"card m-5"},ce=a("div",{class:"card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[a("h3",{class:"text-lg leading-6 font-semibold"},"Debug Section")],-1),ue={class:"card-body dark:bg-stone-700"},fe={class:"mt-3 sm:mt-0 sm:ml-4"},me={key:0},ge={class:"w-3/4 m-2"},ve={class:"whitespace-pre"},_e={key:1},he={class:"mt-3 sm:mt-0 sm:ml-4"},xe={key:2,class:"mt-2 flex"},pe={class:"w-3/4 m-2"},ye={class:"whitespace-pre"},be={key:3};function ke(n,e,t,r,s,i){const o=f("ErrorMessage");return d(),c("div",de,[ce,a("div",ue,[a("div",fe,[a("button",{type:"button",onClick:e[0]||(e[0]=l=>r.runServerInfo()),class:"inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"},' run "server_info" ')]),r.serverInfoError.errorFlag?u("",!0):(d(),c("div",me,[a("div",ge,[a("div",ve,_(r.serverInfo),1)])])),r.serverInfoError.errorFlag?(d(),c("div",_e,[m(o,{errorMsg:r.serverInfoError.errorMessage,FixButton:r.serverInfoError.showFixButton,FixButtonHandler:r.serverInfoError.fixButtonHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):u("",!0),a("div",he,[a("button",{type:"button",onClick:e[1]||(e[1]=l=>r.runLsdev()),class:"inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"},' run "lsdev" ')]),r.lsdevError.errorFlag?u("",!0):(d(),c("div",xe,[a("div",pe,[a("div",ye,_(r.lsdevInfo),1)])])),r.lsdevError.errorFlag?(d(),c("div",be,[m(o,{errorMsg:r.lsdevError.errorMessage,FixButton:r.lsdevError.showFixButton,FixButtonHandler:r.lsdevError.fixButtonHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):u("",!0)])])}var we=h(le,[["render",ke]]);const Fe={name:"App",components:{P5Canvas:G,FfdHeader:T,DebugBox:we},setup(){x({serverInfo:!1,lsdev:!1})}},Be={id:"App"},Me={class:"h-screen flex flex-col overflow-hidden"},Ie={class:"h-full flex flex-wrap overflow-y-auto"},$e={class:"h-full mx-auto sm:px-6 lg:px-8 grow"};function Ee(n,e,t,r,s,i){const o=f("FfdHeader"),l=f("P5Canvas"),g=f("DebugBox");return d(),c("div",Be,[a("div",Me,[m(o,{moduleName:"Disks",centerName:""}),a("div",Ie,[m(l),a("div",$e,[m(g)])])])])}var Se=h(Fe,[["render",Ee]]);P(Se).mount("#app");