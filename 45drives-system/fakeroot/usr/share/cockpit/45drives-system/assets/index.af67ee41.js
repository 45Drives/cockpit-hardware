var E=Object.defineProperty;var M=Object.getOwnPropertySymbols;var C=Object.prototype.hasOwnProperty,P=Object.prototype.propertyIsEnumerable;var O=(a,s,o)=>s in a?E(a,s,{enumerable:!0,configurable:!0,writable:!0,value:o}):a[s]=o,w=(a,s)=>{for(var o in s||(s={}))C.call(s,o)&&O(a,o,s[o]);if(M)for(var o of M(s))P.call(s,o)&&O(a,o,s[o]);return a};import{r as _,w as k,a as A,b as H,o as l,c as d,d as e,n as B,t as h,e as b,f as N,g as p,h as V,i as T,j as m,F as L,k as R,l as y,m as D,p as X}from"./vendor.00a83800.js";const z=function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const c of r)if(c.type==="childList")for(const i of c.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function o(r){const c={};return r.integrity&&(c.integrity=r.integrity),r.referrerpolicy&&(c.referrerPolicy=r.referrerpolicy),r.crossorigin==="use-credentials"?c.credentials="include":r.crossorigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function t(r){if(r.ep)return;r.ep=!0;const c=o(r);fetch(r.href,c)}};z();var x=(a,s)=>{const o=a.__vccOpts||a;for(const[t,r]of s)o[t]=r;return o};const q={props:{moduleName:String,centerName:Boolean},setup(a){const s=_(!0);function o(){let t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches,r=localStorage.getItem("color-theme");return r===null?t:r==="dark"}return s.value=o(),s.value?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark"),k(()=>s.value,(t,r)=>{localStorage.setItem("color-theme",t?"dark":"light"),t?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")},{lazy:!1}),{darkMode:s}},components:{SunIcon:A,MoonIcon:H}},U={class:"p-2 flex items-baseline justify-between bg-neutral-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700",style:{"font-family":"Red Hat Text",position:"relative"}},J={class:"flex flex-row items-baseline basis-10"},Q=["src"],K={class:"text-2xl"},W=e("span",{class:"text-gray-800 dark:text-red-600"},"Drives",-1),Y={key:0,class:"ml-5 text-red-800 dark:text-white text-2xl"};function G(a,s,o,t,r,c){const i=p("SunIcon"),n=p("MoonIcon");return l(),d("div",U,[e("div",J,[e("img",{class:"w-6 h-6 text-gray-50 mr-0.5 self-center",src:t.darkMode?"img/45d-fan-dark.svg":"img/45d-fan-light.svg"},null,8,Q),e("h1",K,[e("span",{class:"text-red-800 dark:text-white font-bold",style:B({"font-family":"Source Sans Pro","font-size":"1.6rem"})},"45",4),W]),o.centerName?b("",!0):(l(),d("h1",Y,h(o.moduleName),1))]),o.centerName?(l(),d("h1",{key:0,class:"text-red-800 dark:text-white text-2xl",style:B({position:"absolute",left:"50%",top:"50%",transform:"translateX(-50%) translateY(-50%)"})},h(o.moduleName),5)):b("",!0),e("button",{onClick:s[0]||(s[0]=f=>t.darkMode=!t.darkMode),id:"theme-toggle",type:"button",class:"text-gray-500 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none rounded-lg text-sm p-2.5 justify-self-end w-10 h-10 basis-10"},[t.darkMode?(l(),N(i,{key:0})):(l(),N(n,{key:1}))])])}var Z=x(q,[["render",G]]);function j(a=[],s={},o="out"){const t=V({loading:!1,status:0,stdout:"",stderr:""}),r=Boolean(s.promise);s.superuser||(s.superuser="require"),s.err=o==="out"?"out":"message";async function c(){t.loading=!0,t.status=0,t.stdout="",t.stderr="",cockpit.spawn(a,s).then((i,n)=>{t.stdout=i,t.stderr=n}).catch((i,n)=>{var f;t.stderr=n!=null?n:i.message,t.status=(f=i.exit_status)!=null?f:-1}).finally(()=>{t.loading=!1})}return c(),r?new Promise((i,n)=>{k(t,()=>{t.loading||(t.status!==0?n(w({},t)):i(w({},t)))})}):t}const ee={components:{XCircleIcon:T},props:{errorMsg:Array,FixButton:Boolean,FixButtonHandler:Function},setup(a){const s=_(a.errorMsg),o=_(a.FixButtonHandler);return k(()=>a.FixButtonHandler,t=>{o.value=t}),{errorMsg:s,FixButtonHandler:o}}},te={class:"flex items-center justify-evenly"},se={class:"rounded-md bg-red-50 p-4"},oe={class:"flex"},re={class:"flex-shrink-0"},ne={class:"ml-3"},ae=e("h3",{class:"text-sm font-medium text-red-800"}," 45Drives System Encountered an Error ",-1),ie={class:"mt-2 text-sm text-red-700"},ce={role:"list",class:"list-disc pl-5 space-y-1 whitespace-pre"};function le(a,s,o,t,r,c){const i=p("XCircleIcon");return l(),d("div",te,[e("div",se,[e("div",oe,[e("div",re,[m(i,{class:"h-5 w-5 text-red-400","aria-hidden":"true"})]),e("div",ne,[ae,e("div",ie,[e("ul",ce,[(l(!0),d(L,null,R(t.errorMsg,n=>(l(),d("li",null,h(n),1))),256))])])])])]),o.FixButton?(l(),d("button",{key:0,onClick:s[0]||(s[0]=(...n)=>t.FixButtonHandler&&t.FixButtonHandler(...n)),type:"button",class:"inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"}," Fix ")):b("",!0)])}var de=x(ee,[["render",le]]);const me={components:{RefreshIconOutline:y,ErrorMessage:de},setup(){const a=_(""),s=_(""),o=_(""),t=_(""),r=_(""),c=_("img/45dlogo.png"),i=_(!1),n=_([]),f=_(!1),S=_(()=>{console.log("Default handler was run for the fix button.")}),I=g=>{if(g==""||g=="?")return"img/45dlogo.png";const u=/(Storinator|Stornado).*(AV15|Q30|S45|XL60|2U|C8|MI4).*/,v=g.match(u),F={Storinator:{AV15:"img/storinatorAV15.jpg",Q30:"img/storinatorQ30.jpg",S45:"img/storinatorS45.jpg",XL60:"img/storinatorXL60.jpg",C8:"img/storinatorC8.jpg",MI4:"img/storinatorMI4.jpg"},Stornado:{"2U":"img/stornado2U.jpg",AV15:"img/stornadoAV15.jpg"}};return v?F[v[1]][v[2]]:"img/45dlogo.png"},$=async()=>{a.value="Loading...",s.value="Loading...",o.value="Loading...",t.value="Loading...",r.value="Loading...",c.value="img/45dlogo.png";try{const g=await j(["/usr/share/cockpit/45drives-system-vue/scripts/server_info"],{err:"out",superuser:"require",promise:!0});let u=JSON.parse(g.stdout);a.value=u.Model,s.value=u["Chassis Size"],o.value=u.Serial,t.value=u.Motherboard.Manufacturer+" "+u.Motherboard["Product Name"],r.value=u.Motherboard["Serial Number"],c.value=I(u.Model)}catch(g){console.log(g);try{let u=JSON.parse(g.stderr);n.value.length=0,n.value.push(u.error_msg),n.value.push('Click "Fix" to run /opt/45drives/tools/server_identifier'),i.value=!0,u.error_msg=="/etc/45drives/server_info/server_info.json does not exist"&&(f.value=!0,S.value=async()=>{try{const v=await j(["/opt/45drives/tools/server_identifier"],{err:"out",superuser:"require",promise:!0});i.value=!1,n.value.length=0,f.value=!1,$()}catch(v){console.log(v),i.value=!0,n.value.length=0,n.value.push(v.stderr),n.value.push("An error occurred when running /opt/45drives/tools/server_identifier"),f.value=!1,console.log(f.value)}})}catch(u){console.log(u),i.value=!0,n.value.length=0,n.value.push(u.stderr),n.value.push("An error occurred when trying to run /usr/share/cockpit/45drives-system/scripts/server_info"),f.value=!1,console.log(f.value)}}};return $(),{sysModel:a,sysChassis:s,sysSerial:o,moboModel:t,moboSerial:r,serverImgPath:c,getSystemInfo:$,getSystemImgPath:I,fatalError:i,fatalErrorMsg:n,showFixButton:f,fixButtonHandler:S}}},ue={class:"card"},_e={class:"card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"},he=e("h3",{class:"text-lg leading-6 font-semibold"},"System",-1),fe={class:"mt-3 sm:mt-0 sm:ml-4"},pe={class:"card-body"},ge={key:0,class:"flex flex-row justify-evenly"},xe={class:"bg-white shadow overflow-hidden sm:rounded-lg"},ve={class:"border-b border-gray-200"},ye={class:"bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"},be=e("dt",{class:"text-sm font-medium text-gray-500"},"Model",-1),$e={class:"mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"},we={class:"bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"},ke=e("dt",{class:"text-sm font-medium text-gray-500"},"Chassis Size",-1),Se={class:"mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"},Ie={class:"bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"},Me=e("dt",{class:"text-sm font-medium text-gray-500"},"Serial",-1),Oe={class:"mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"},Be={class:"bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"},Ne=e("dt",{class:"text-sm font-medium text-gray-500"},"Motherboard",-1),je={class:"mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"},Le={class:"bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"},Re=e("dt",{class:"text-sm font-medium text-gray-500"}," Motherboard Serial ",-1),Fe={class:"mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2"},Ee=["src"],Ce={key:1};function Pe(a,s,o,t,r,c){const i=p("RefreshIconOutline"),n=p("ErrorMessage");return l(),d("div",ue,[e("div",_e,[he,e("div",fe,[e("button",{type:"button",class:"card-refresh-btn",onClick:s[0]||(s[0]=f=>t.getSystemInfo())},[m(i,{class:"h-5 w-5","aria-hidden":"true"})])])]),e("div",pe,[t.fatalError?b("",!0):(l(),d("div",ge,[e("div",xe,[e("div",ve,[e("dl",null,[e("div",ye,[be,e("dd",$e,h(t.sysModel),1)]),e("div",we,[ke,e("dd",Se,h(t.sysChassis),1)]),e("div",Ie,[Me,e("dd",Oe,h(t.sysSerial),1)]),e("div",Be,[Ne,e("dd",je,h(t.moboModel),1)]),e("div",Le,[Re,e("dd",Fe,h(t.moboSerial),1)])])])]),e("img",{src:t.serverImgPath,class:"object-contain h-72 rounded-none justify-self-center"},null,8,Ee)])),t.fatalError?(l(),d("div",Ce,[m(n,{errorMsg:t.fatalErrorMsg,FixButton:t.showFixButton,FixButtonHandler:t.fixButtonHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):b("",!0)])])}var Ae=x(me,[["render",Pe]]);const He=[{name:"Lindsay Walton",title:"Front-end Developer",email:"lindsay.walton@example.com",role:"Member"}],Ve={setup(){return{people:He}},components:{RefreshIconOutline:y}},Te={class:"card"},De={class:"card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"},Xe=e("h3",{class:"text-lg leading-6 font-semibold"},"CPU",-1),ze={class:"mt-3 sm:mt-0 sm:ml-4"},qe={type:"button",class:"card-refresh-btn"},Ue={class:"card-body"},Je={class:"mt-8 flex flex-col"},Qe={class:"-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8"},Ke={class:"inline-block min-w-full py-2 align-middle md:px-6 lg:px-8"},We={class:"overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg"},Ye={class:"min-w-full divide-y divide-gray-300"},Ge=e("thead",{class:"bg-gray-50"},[e("tr",null,[e("th",{scope:"col",class:"py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"},"Name"),e("th",{scope:"col",class:"px-3 py-3.5 text-left text-sm font-semibold text-gray-900"},"Title"),e("th",{scope:"col",class:"px-3 py-3.5 text-left text-sm font-semibold text-gray-900"},"Email"),e("th",{scope:"col",class:"px-3 py-3.5 text-left text-sm font-semibold text-gray-900"},"Role"),e("th",{scope:"col",class:"relative py-3.5 pl-3 pr-4 sm:pr-6"},[e("span",{class:"sr-only"},"Edit")])])],-1),Ze={class:"divide-y divide-gray-200 bg-white"},et={class:"whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"},tt={class:"whitespace-nowrap px-3 py-4 text-sm text-gray-500"},st={class:"whitespace-nowrap px-3 py-4 text-sm text-gray-500"},ot={class:"whitespace-nowrap px-3 py-4 text-sm text-gray-500"},rt={class:"relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"},nt={href:"#",class:"text-indigo-600 hover:text-indigo-900"},at=D("Edit"),it={class:"sr-only"};function ct(a,s,o,t,r,c){const i=p("RefreshIconOutline");return l(),d("div",Te,[e("div",De,[Xe,e("div",ze,[e("button",qe,[m(i,{class:"h-5 w-5","aria-hidden":"true"})])])]),e("div",Ue,[e("div",Je,[e("div",Qe,[e("div",Ke,[e("div",We,[e("table",Ye,[Ge,e("tbody",Ze,[(l(!0),d(L,null,R(t.people,n=>(l(),d("tr",{key:n.email},[e("td",et,h(n.name),1),e("td",tt,h(n.title),1),e("td",st,h(n.email),1),e("td",ot,h(n.role),1),e("td",rt,[e("a",nt,[at,e("span",it,", "+h(n.name),1)])])]))),128))])])])])])])])])}var lt=x(Ve,[["render",ct]]);const dt={components:{RefreshIconOutline:y}},mt={class:"card"},ut={class:"card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"},_t=e("h3",{class:"text-lg leading-6 font-semibold"},"PCI",-1),ht={class:"mt-3 sm:mt-0 sm:ml-4"},ft={type:"button",class:"card-refresh-btn"},pt=e("div",{class:"card-body"}," This is a test... ",-1);function gt(a,s,o,t,r,c){const i=p("RefreshIconOutline");return l(),d("div",mt,[e("div",ut,[_t,e("div",ht,[e("button",ft,[m(i,{class:"h-5 w-5","aria-hidden":"true"})])])]),pt])}var xt=x(dt,[["render",gt]]);const vt={components:{RefreshIconOutline:y}},yt={class:"card"},bt={class:"card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"},$t=e("h3",{class:"text-lg leading-6 font-semibold"},"RAM",-1),wt={class:"mt-3 sm:mt-0 sm:ml-4"},kt={type:"button",class:"card-refresh-btn"},St=e("div",{class:"card-body"}," This is a test... ",-1);function It(a,s,o,t,r,c){const i=p("RefreshIconOutline");return l(),d("div",yt,[e("div",bt,[$t,e("div",wt,[e("button",kt,[m(i,{class:"h-5 w-5","aria-hidden":"true"})])])]),St])}var Mt=x(vt,[["render",It]]);const Ot={components:{RefreshIconOutline:y}},Bt={class:"card"},Nt={class:"card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"},jt=e("h3",{class:"text-lg leading-6 font-semibold"},"Network",-1),Lt={class:"mt-3 sm:mt-0 sm:ml-4"},Rt={type:"button",class:"card-refresh-btn"},Ft=e("div",{class:"card-body"}," This is a test... ",-1);function Et(a,s,o,t,r,c){const i=p("RefreshIconOutline");return l(),d("div",Bt,[e("div",Nt,[jt,e("div",Lt,[e("button",Rt,[m(i,{class:"h-5 w-5","aria-hidden":"true"})])])]),Ft])}var Ct=x(Ot,[["render",Et]]);const Pt={components:{RefreshIconOutline:y}},At={class:"card"},Ht={class:"card-header p-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between"},Vt=e("h3",{class:"text-lg leading-6 font-semibold"},"IPMI LAN",-1),Tt={class:"mt-3 sm:mt-0 sm:ml-4"},Dt={type:"button",class:"card-refresh-btn"},Xt=e("div",{class:"card-body"}," This is a test... ",-1);function zt(a,s,o,t,r,c){const i=p("RefreshIconOutline");return l(),d("div",At,[e("div",Ht,[Vt,e("div",Tt,[e("button",Dt,[m(i,{class:"h-5 w-5","aria-hidden":"true"})])])]),Xt])}var qt=x(Pt,[["render",zt]]);const Ut={class:"h-full w-full overflow-y-scroll"},Jt={class:"max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8 grow"},Qt={setup(a){return(s,o)=>(l(),d("div",Ut,[e("div",Jt,[m(Ae),m(lt),m(xt),m(Mt),m(Ct),m(qt)])]))}};const Kt={class:"h-full flex flex-col overflow-hidden"},Wt={setup(a){return(s,o)=>(l(),d("div",Kt,[m(Z,{moduleName:"System",centerName:""}),m(Qt)]))}};X(Wt).mount("#app");