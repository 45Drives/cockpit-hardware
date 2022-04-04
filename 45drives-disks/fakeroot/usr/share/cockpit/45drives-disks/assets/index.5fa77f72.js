var $=Object.defineProperty;var y=Object.getOwnPropertySymbols;var B=Object.prototype.hasOwnProperty,I=Object.prototype.propertyIsEnumerable;var k=(o,e,r)=>e in o?$(o,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):o[e]=r,x=(o,e)=>{for(var r in e||(e={}))B.call(e,r)&&k(o,r,e[r]);if(y)for(var r of y(e))I.call(e,r)&&k(o,r,e[r]);return o};import{r as u,w as p,a as F,b as M,c as f,o as l,d,e as c,n as b,t as g,f as h,g as w,P as S,h as E,i as _,F as N,j as C,k as H,l as P,m as D}from"./vendor.dda642bf.js";const L=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))t(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&t(a)}).observe(document,{childList:!0,subtree:!0});function r(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerpolicy&&(n.referrerPolicy=s.referrerpolicy),s.crossorigin==="use-credentials"?n.credentials="include":s.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function t(s){if(s.ep)return;s.ep=!0;const n=r(s);fetch(s.href,n)}};L();var v=(o,e)=>{const r=o.__vccOpts||o;for(const[t,s]of e)r[t]=s;return r};const O={props:{moduleName:String,centerName:Boolean},setup(o){const e=u(!0);function r(){let t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches,s=localStorage.getItem("color-theme");return s===null?t:s==="dark"}return e.value=r(),e.value?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark"),p(()=>e.value,(t,s)=>{localStorage.setItem("color-theme",t?"dark":"light"),t?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")},{lazy:!1}),{darkMode:e}},components:{SunIcon:F,MoonIcon:M}},A={class:"p-2 flex items-baseline justify-between bg-neutral-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700",style:{"font-family":"Red Hat Text",position:"relative"}},j={class:"flex flex-row items-baseline basis-10"},X=["src"],R={class:"text-2xl"},q=c("span",{class:"text-gray-800 dark:text-red-600"},"Drives",-1),z={key:0,class:"ml-5 text-red-800 dark:text-white text-2xl"};function V(o,e,r,t,s,n){const a=f("SunIcon"),i=f("MoonIcon");return l(),d("div",A,[c("div",j,[c("img",{class:"w-6 h-6 text-gray-50 mr-0.5 self-center",src:t.darkMode?"img/45d-fan-dark.svg":"img/45d-fan-light.svg"},null,8,X),c("h1",R,[c("span",{class:"text-red-800 dark:text-white font-bold",style:b({"font-family":"Source Sans Pro","font-size":"1.6rem"})},"45",4),q]),r.centerName?h("",!0):(l(),d("h1",z,g(r.moduleName),1))]),r.centerName?(l(),d("h1",{key:0,class:"text-red-800 dark:text-white text-2xl",style:b({position:"absolute",left:"50%",top:"50%",transform:"translateX(-50%) translateY(-50%)"})},g(r.moduleName),5)):h("",!0),c("button",{onClick:e[0]||(e[0]=m=>t.darkMode=!t.darkMode),id:"theme-toggle",type:"button",class:"text-gray-500 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none rounded-lg text-sm p-2.5 justify-self-end w-10 h-10 basis-10"},[t.darkMode?(l(),w(a,{key:0})):(l(),w(i,{key:1}))])])}var T=v(O,[["render",V]]);const G={name:"P5Canvas",mounted(){const o=function(e){var r=2,t=35;e.setup=s=>{e.createCanvas(500,500).parent("p5-canvas")},e.draw=s=>{e.background(245);const n=e.frameCount*3,a=e.sin(e.radians(n))*50;e.push(),e.translate(0,e.height/2),e.fill(66,184,131),e.stroke(53,73,94),e.strokeWeight(5),e.ellipse(t,a,50,50),e.pop(),t+=r,(t>e.width-35||t<35)&&(r*=-1)}};new S(o)}},J={id:"p5-canvas",class:"mt-2 mx-auto"};function K(o,e,r,t,s,n){return l(),d("div",J)}var W=v(G,[["render",K]]);const Y={components:{XCircleIcon:E},props:{errorMsg:Array,FixButton:Boolean,FixButtonHandler:Function},setup(o){const e=u(o.errorMsg),r=u(o.FixButtonHandler);return p(()=>o.FixButtonHandler,t=>{r.value=t}),{errorMsg:e,FixButtonHandler:r}}},Q={class:"flex items-center justify-evenly"},U={class:"rounded-md bg-red-50 p-4"},Z={class:"flex"},ee={class:"flex-shrink-0"},te={class:"ml-3"},re=c("h3",{class:"text-sm font-medium text-red-800"}," 45Drives Disks Encountered an Error ",-1),oe={class:"mt-2 text-sm text-red-700"},se={role:"list",class:"list-disc pl-5 space-y-1 whitespace-pre"};function ne(o,e,r,t,s,n){const a=f("XCircleIcon");return l(),d("div",Q,[c("div",U,[c("div",Z,[c("div",ee,[_(a,{class:"h-5 w-5 text-red-400","aria-hidden":"true"})]),c("div",te,[re,c("div",oe,[c("ul",se,[(l(!0),d(N,null,C(t.errorMsg,i=>(l(),d("li",null,g(i),1))),256))])])])])]),r.FixButton?(l(),d("button",{key:0,onClick:e[0]||(e[0]=(...i)=>t.FixButtonHandler&&t.FixButtonHandler(...i)),type:"button",class:"inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"}," Fix ")):h("",!0)])}var ae=v(Y,[["render",ne]]);function ce(o=[],e={},r="out"){const t=H({loading:!1,status:0,stdout:"",stderr:""}),s=Boolean(e.promise);e.superuser||(e.superuser="require"),e.err=r==="out"?"out":"message";async function n(){t.loading=!0,t.status=0,t.stdout="",t.stderr="",cockpit.spawn(o,e).then((a,i)=>{t.stdout=a,t.stderr=i}).catch((a,i)=>{var m;t.stderr=i!=null?i:a.message,t.status=(m=a.exit_status)!=null?m:-1}).finally(()=>{t.loading=!1})}return n(),s?new Promise((a,i)=>{p(t,()=>{t.loading||(t.status!==0?i(x({},t)):a(x({},t)))})}):t}async function ie(){try{const o=await ce(["/usr/share/cockpit/45drives-disks/scripts/server_info"],{err:"out",superuser:"require",promise:!0});return JSON.parse(o.stdout)}catch(o){return console.log(o),o}}const le={setup(){const o=u(!1),e=u([]),r=u(!1),t=u(""),s=u(()=>{console.log("Default handler was run for the fix button.")});return{fatalError:o,fatalErrorMsg:e,showFixButton:r,fixButtonHandler:s,runServerInfo:()=>{t.value=ie(),console.log(t.value)},serverInfo:t}},components:{RefreshIconOutline:P,ErrorMessage:ae}},de={class:"card"},ue={class:"card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},fe=c("h3",{class:"text-lg leading-6 font-semibold"},"Get Server Info",-1),me={class:"mt-3 sm:mt-0 sm:ml-4"},_e={class:"card-body dark:bg-stone-700"},he={key:0,class:"mt-2 flex flex-col"},ve={class:"-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8"},ge={key:0};function xe(o,e,r,t,s,n){const a=f("RefreshIconOutline"),i=f("ErrorMessage");return l(),d("div",de,[c("div",ue,[fe,c("div",me,[c("button",{type:"button",class:"card-refresh-btn",onClick:e[0]||(e[0]=m=>t.runServerInfo())},[_(a,{class:"h-5 w-5","aria-hidden":"true"})])])]),c("div",_e,[t.fatalError?h("",!0):(l(),d("div",he,[c("div",ve,g(t.serverInfo),1),t.fatalError?(l(),d("div",ge,[_(i,{errorMsg:t.fatalErrorMsg,FixButton:t.showFixButton,FixButtonHandler:t.fixButtonHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):h("",!0)]))])])}var pe=v(le,[["render",xe]]);const ye={name:"App",components:{P5Canvas:W,FfdHeader:T,DebugBox:pe}},ke={id:"App"},be={class:"h-full flex flex-col overflow-hidden"};function we(o,e,r,t,s,n){const a=f("FfdHeader"),i=f("P5Canvas"),m=f("DebugBox");return l(),d("div",ke,[c("div",be,[_(a,{moduleName:"Disks",centerName:""}),_(i),_(m)])])}var $e=v(ye,[["render",we]]);D($e).mount("#app");