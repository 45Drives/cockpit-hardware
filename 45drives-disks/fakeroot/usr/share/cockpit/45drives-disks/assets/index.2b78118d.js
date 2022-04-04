var N=Object.defineProperty;var j=Object.getOwnPropertySymbols;var P=Object.prototype.hasOwnProperty,J=Object.prototype.propertyIsEnumerable;var A=(i,o,r)=>o in i?N(i,o,{enumerable:!0,configurable:!0,writable:!0,value:r}):i[o]=r,O=(i,o)=>{for(var r in o||(o={}))P.call(o,r)&&A(i,r,o[r]);if(j)for(var r of j(o))J.call(o,r)&&A(i,r,o[r]);return i};import{r as v,w as I,a as L,b as T,c as p,o as a,d as u,e as s,n as C,t as m,f as _,g as B,P as D,h as q,i as w,F as Y,j as $,k as y,l as E,m as M,p as X,q as S,s as U}from"./vendor.d6a17607.js";const R=function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))e(n);new MutationObserver(n=>{for(const c of n)if(c.type==="childList")for(const t of c.addedNodes)t.tagName==="LINK"&&t.rel==="modulepreload"&&e(t)}).observe(document,{childList:!0,subtree:!0});function r(n){const c={};return n.integrity&&(c.integrity=n.integrity),n.referrerpolicy&&(c.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?c.credentials="include":n.crossorigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function e(n){if(n.ep)return;n.ep=!0;const c=r(n);fetch(n.href,c)}};R();var k=(i,o)=>{const r=i.__vccOpts||i;for(const[e,n]of o)r[e]=n;return r};const V={props:{moduleName:String,centerName:Boolean},setup(i){const o=v(!0);function r(){let e=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches,n=localStorage.getItem("color-theme");return n===null?e:n==="dark"}return o.value=r(),o.value?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark"),I(()=>o.value,(e,n)=>{localStorage.setItem("color-theme",e?"dark":"light"),e?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")},{lazy:!1}),{darkMode:o}},components:{SunIcon:L,MoonIcon:T}},z={class:"p-2 flex items-baseline justify-between bg-neutral-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700",style:{"font-family":"Red Hat Text",position:"relative"}},W={class:"flex flex-row items-baseline basis-10"},G=["src"],K={class:"text-2xl"},Q=s("span",{class:"text-gray-800 dark:text-red-600"},"Drives",-1),Z={key:0,class:"ml-5 text-red-800 dark:text-white text-2xl"};function ee(i,o,r,e,n,c){const t=p("SunIcon"),d=p("MoonIcon");return a(),u("div",z,[s("div",W,[s("img",{class:"w-6 h-6 text-gray-50 mr-0.5 self-center",src:e.darkMode?"img/45d-fan-dark.svg":"img/45d-fan-light.svg"},null,8,G),s("h1",K,[s("span",{class:"text-red-800 dark:text-white font-bold",style:C({"font-family":"Source Sans Pro","font-size":"1.6rem"})},"45",4),Q]),r.centerName?_("",!0):(a(),u("h1",Z,m(r.moduleName),1))]),r.centerName?(a(),u("h1",{key:0,class:"text-red-800 dark:text-white text-2xl",style:C({position:"absolute",left:"50%",top:"50%",transform:"translateX(-50%) translateY(-50%)"})},m(r.moduleName),5)):_("",!0),s("button",{onClick:o[0]||(o[0]=l=>e.darkMode=!e.darkMode),id:"theme-toggle",type:"button",class:"text-gray-500 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none rounded-lg text-sm p-2.5 justify-self-end w-10 h-10 basis-10"},[e.darkMode?(a(),B(t,{key:0})):(a(),B(d,{key:1}))])])}var se=k(V,[["render",ee]]);const te={name:"P5Canvas",mounted(){const i=function(o){var r=2,e=35;o.setup=n=>{o.createCanvas(570,900).parent("p5-canvas")},o.draw=n=>{o.background(245);const c=o.frameCount*3,t=o.sin(o.radians(c))*50;o.push(),o.translate(0,o.height/2),o.fill(66,184,131),o.stroke(53,73,94),o.strokeWeight(5),o.ellipse(e,t,50,50),o.pop(),e+=r,(e>o.width-35||e<35)&&(r*=-1)}};new D(i)}},oe={id:"p5-canvas",class:"mx-auto"};function ne(i,o,r,e,n,c){return a(),u("div",oe)}var re=k(te,[["render",ne]]);const de={components:{XCircleIcon:q},props:{errorMsg:Array,FixButton:Boolean,FixButtonHandler:Function},setup(i){const o=v(i.errorMsg),r=v(i.FixButtonHandler);return I(()=>i.FixButtonHandler,e=>{r.value=e}),{errorMsg:o,FixButtonHandler:r}}},ie={class:"flex items-center justify-evenly"},ae={class:"rounded-md bg-red-50 p-4"},ce={class:"flex"},le={class:"flex-shrink-0"},me={class:"ml-3"},ue=s("h3",{class:"text-sm font-medium text-red-800"}," 45Drives Disks Encountered an Error ",-1),fe={class:"mt-2 text-sm text-red-700"},_e={role:"list",class:"list-disc pl-5 space-y-1 whitespace-pre"};function ge(i,o,r,e,n,c){const t=p("XCircleIcon");return a(),u("div",ie,[s("div",ae,[s("div",ce,[s("div",le,[w(t,{class:"h-5 w-5 text-red-400","aria-hidden":"true"})]),s("div",me,[ue,s("div",fe,[s("ul",_e,[(a(!0),u(Y,null,$(e.errorMsg,d=>(a(),u("li",null,m(d),1))),256))])])])])]),r.FixButton?(a(),u("button",{key:0,onClick:o[0]||(o[0]=(...d)=>e.FixButtonHandler&&e.FixButtonHandler(...d)),type:"button",class:"inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"}," Fix ")):_("",!0)])}var H=k(de,[["render",ge]]);function F(i=[],o={},r="out"){const e=y({loading:!1,status:0,stdout:"",stderr:""}),n=Boolean(o.promise);o.superuser||(o.superuser="require"),o.err=r==="out"?"out":"message";async function c(){e.loading=!0,e.status=0,e.stdout="",e.stderr="",cockpit.spawn(i,o).then((t,d)=>{e.stdout=t,e.stderr=d}).catch((t,d)=>{var l;e.stderr=d!=null?d:t.message,e.status=(l=t.exit_status)!=null?l:-1}).finally(()=>{e.loading=!1})}return c(),n?new Promise((t,d)=>{I(e,()=>{e.loading||(e.status!==0?d(O({},e)):t(O({},e)))})}):e}const xe={setup(){const i=v(),o=y({errorFlag:!1,errorMessage:[],showFixButton:!1,fixButtonHandler:()=>{console.log("Default handler was run for the fix button.")}}),r=v(),e=y({errorFlag:!1,errorMessage:[],showFixButton:!1,fixButtonHandler:()=>{console.log("Default handler was run for the fix button.")}});return console.log(o),console.log(e),{runServerInfo:async()=>{try{const t=await F(["/usr/share/cockpit/45drives-disks-vue/scripts/server_info"],{err:"out",superuser:"require",promise:!0});let d=JSON.parse(t.stdout);console.log(d),i.value=t.stdout,o.errorFlag=!1,o.errorMessage.length=0,o.showFixButton=!1}catch(t){console.log(t),o.errorFlag=!0,o.errorMessage.length=0,o.errorMessage.push(t.stderr),o.errorMessage.push("An error occurred when trying to run /usr/share/cockpit/45drives-disks/scripts/server_info"),o.showFixButton=!1}},runLsdev:async()=>{try{const t=await F(["/opt/45drives/tools/lsdev","--json"],{err:"out",superuser:"require",promise:!0});let d=JSON.parse(t.stdout);console.log(d),r.value=t.stdout,e.errorFlag=!1,e.errorMessage.length=0,e.showFixButton=!1}catch(t){console.log(t),e.errorFlag=!0,e.errorMessage.length=0,e.errorMessage.push(t.stderr),e.errorMessage.push("An error occurred when trying to run /opt/45drives/tools/lsdev"),e.showFixButton=!1}},serverInfo:i,serverInfoError:o,lsdevInfo:r,lsdevError:e}},components:{RefreshIconOutline:E,ErrorMessage:H}},ve={class:"card m-3 grow"},he=s("div",{class:"card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[s("h3",{class:"text-lg leading-6 font-semibold"},"Debug Section")],-1),pe={class:"card-body dark:bg-stone-700"},ke={class:"mt-3 sm:mt-0 sm:ml-4"},ye={key:0},be={class:"w-3/4 m-2"},we={class:"whitespace-pre"},Ie={key:1},Be={class:"mt-3 sm:mt-0 sm:ml-4"},Me={key:2,class:"mt-2 flex"},Fe={class:"w-3/4 m-2"},Oe={class:"whitespace-pre"},Se={key:3};function je(i,o,r,e,n,c){const t=p("ErrorMessage");return a(),u("div",ve,[he,s("div",pe,[s("div",ke,[s("button",{type:"button",onClick:o[0]||(o[0]=d=>e.runServerInfo()),class:"inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"},' run "server_info" ')]),e.serverInfoError.errorFlag?_("",!0):(a(),u("div",ye,[s("div",be,[s("div",we,m(e.serverInfo),1)])])),e.serverInfoError.errorFlag?(a(),u("div",Ie,[w(t,{errorMsg:e.serverInfoError.errorMessage,FixButton:e.serverInfoError.showFixButton,FixButtonHandler:e.serverInfoError.fixButtonHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):_("",!0),s("div",Be,[s("button",{type:"button",onClick:o[1]||(o[1]=d=>e.runLsdev()),class:"inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"},' run "lsdev" ')]),e.lsdevError.errorFlag?_("",!0):(a(),u("div",Me,[s("div",Fe,[s("div",Oe,m(e.lsdevInfo),1)])])),e.lsdevError.errorFlag?(a(),u("div",Se,[w(t,{errorMsg:e.lsdevError.errorMessage,FixButton:e.lsdevError.showFixButton,FixButtonHandler:e.lsdevError.fixButtonHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):_("",!0)])])}var Ae=k(xe,[["render",je]]);const Ce={props:{serverInfo:Object,diskInfo:Object},setup(i){const o=M("lsdevJson"),r=v(i.diskInfo.rows.flat().filter(t=>t.occupied).length),e=v(i.diskInfo.rows.flat().filter(t=>t.occupied).map(t=>Number(t.capacity.split(" ")[0])).reduce((t,d)=>t+d).toFixed(2)),n=v((i.diskInfo.rows.flat().filter(t=>t.occupied).map(t=>Number(t["temp-c"].replace(/[^0-9]/g,""))).reduce((t,d)=>t+d)/Number(r.value)).toFixed(2));return I(o,()=>{r.value=o.rows.flat().filter(t=>t.occupied).length,console.log("diskCount.value",r.value),e.value=o.rows.flat().filter(t=>t.occupied).map(t=>Number(t.capacity.split(" ")[0])).reduce((t,d)=>t+d).toFixed(2),console.log("storageCapacity.value",e.value),n.value=(i.diskInfo.rows.flat().filter(t=>t.occupied).map(t=>Number(t["temp-c"].replace(/[^0-9]/g,""))).reduce((t,d)=>t+d)/Number(r.value)).toFixed(2),console.log("avgTemp.value",n.value)}),{diskCount:r,storageCapacity:e,avgTemp:n,lsdevJson:o}}},De={class:"card mx-2 grow flex flex-col"},Ye=s("div",{class:"card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[s("h3",{class:"text-lg py-1 leading-6 font-semibold"},"Server")],-1),$e={class:"card-body dark:bg-stone-700 grow flex"},Ee={class:"grow flex flex-col items-stretch"},He={class:"mt-0"},Ne={class:"sm:divide-y sm:divide-stone-200"},Pe={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},Je=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Model ",-1),Le={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-3"},Te={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},qe=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Disk Count ",-1),Xe={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-3"},Ue={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},Re=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Total Storage ",-1),Ve={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-3"},ze={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},We=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Disk Temperature (avg) ",-1),Ge={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-3"},Ke={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},Qe={class:"text-sm font-medium text-stone-500 dark:text-stone-400"},Ze=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Model ",-1),es={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"},ss=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Controller ID ",-1),ts={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"},os=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," PCI Slot ",-1),ns={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"};function rs(i,o,r,e,n,c){return a(),u("div",De,[Ye,s("div",$e,[s("div",Ee,[s("div",He,[s("dl",Ne,[s("div",Pe,[Je,s("dd",Le,m(r.serverInfo.Model),1)]),s("div",Te,[qe,s("dd",Xe,m(e.diskCount),1)]),s("div",Ue,[Re,s("dd",Ve,m(e.storageCapacity)+" GB ",1)]),s("div",ze,[We,s("dd",Ge,m(e.avgTemp)+" \xB0C / "+m((e.avgTemp*(9/5)+32).toFixed(2))+" \xB0F ",1)]),(a(!0),u(Y,null,$(r.serverInfo.HBA,t=>(a(),u("div",Ke,[s("dt",Qe," HBA"+m(t.Ctl+1),1),s("div",null,[Ze,s("dd",es,m(t.Model),1)]),s("div",null,[ss,s("dd",ts,m(t.Ctl),1)]),s("div",null,[os,s("dd",ns,m(t["PCI Slot"]),1)])]))),256))])])])])])}var ds=k(Ce,[["render",rs]]);const is={components:{RefreshIconOutline:E},props:{diskInfo:Object},setup(i){const o=M("currentDisk"),r=v("Click on a disk for more detail."),e=y({}),n=M("lsdevJson"),c=()=>{if(!o.value)return;const t=n.rows.flat().filter(d=>d.occupied).find(d=>d["bay-id"]===o.value);if(!t){console.log(`Unable to find info for disk in slot "${o.value}"`),o.value="";return}Object.assign(e,t)};return I(o,c),I(n,c),{wMsg:r,currentDisk:o,diskObj:e,lsdevJson:n}}},as={class:"card m-2 flex-auto flex flex-col min-w-[35%]"},cs=s("div",{class:"card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[s("h3",{class:"text-lg leading-6 font-semibold"},"Disk Information")],-1),ls={class:"card-body dark:bg-stone-700 grow flex flex-col"},ms={key:0},us={class:"grow flex items-start justify-evenly"},fs={class:"m-2 flex flex-col"},_s={class:"sm:divide-y sm:divide-stone-200"},gs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},xs=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Drive Slot ",-1),vs={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},hs={class:"sm:divide-y sm:divide-stone-200"},ps={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},ks=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Disk Type ",-1),ys={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},bs={class:"sm:divide-y sm:divide-stone-200"},ws={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Is=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Device Path (sd) ",-1),Bs={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ms={class:"sm:divide-y sm:divide-stone-200"},Fs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Os=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Device Path (by-path) ",-1),Ss={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},js={class:"sm:divide-y sm:divide-stone-200"},As={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Cs=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Partition Count ",-1),Ds={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ys={key:0,class:"sm:divide-y sm:divide-stone-200"},$s={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Es=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Model Family ",-1),Hs={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ns={key:1,class:"sm:divide-y sm:divide-stone-200"},Ps={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Js=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Model Name ",-1),Ls={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ts={class:"sm:divide-y sm:divide-stone-200"},qs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Xs=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Serial ",-1),Us={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Rs={class:"m-2 flex flex-col"},Vs={class:"sm:divide-y sm:divide-stone-200"},zs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Ws=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Capacity ",-1),Gs={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ks={key:0,class:"sm:divide-y sm:divide-stone-200"},Qs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Zs=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Firmware Version ",-1),et={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},st={key:1,class:"sm:divide-y sm:divide-stone-200"},tt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},ot=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Rotation Rate ",-1),nt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},rt={key:2,class:"sm:divide-y sm:divide-stone-200"},dt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},it=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Start/Stop count ",-1),at={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},ct={key:3,class:"sm:divide-y sm:divide-stone-200"},lt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},mt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Power Cycle Count ",-1),ut={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},ft={class:"sm:divide-y sm:divide-stone-200"},_t={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},gt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Temperature ",-1),xt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},vt={key:4,class:"sm:divide-y sm:divide-stone-200"},ht={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},pt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Current Pending Sector ",-1),kt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},yt={key:5,class:"sm:divide-y sm:divide-stone-200"},bt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},wt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Offline-Uncorrectable ",-1),It={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Bt={class:"sm:divide-y sm:divide-stone-200"},Mt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Ft=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Power On Time ",-1),Ot={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},St={class:"sm:divide-y sm:divide-stone-200"},jt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},At=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Health ",-1),Ct={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Dt={key:1,class:"grow flex justify-center items-center"},Yt={class:"p-5 bg-stone-100 dark:bg-stone-600 rounded-lg text-stone-500 dark:text-stone-300"};function $t(i,o,r,e,n,c){return a(),u("div",as,[cs,s("div",ls,[e.currentDisk?(a(),u("div",ms,[s("div",us,[s("div",fs,[s("dl",_s,[s("div",gs,[xs,s("dd",vs,m(e.diskObj["bay-id"]),1)])]),s("dl",hs,[s("div",ps,[ks,s("dd",ys,m(e.diskObj.disk_type),1)])]),s("dl",bs,[s("div",ws,[Is,s("dd",Bs,m(e.diskObj.dev),1)])]),s("dl",Ms,[s("div",Fs,[Os,s("dd",Ss,m(e.diskObj["dev-by-path"]),1)])]),s("dl",js,[s("div",As,[Cs,s("dd",Ds,m(e.diskObj.partitions),1)])]),e.diskObj["model-family"]&&!["?"].includes(e.diskObj["model-family"])?(a(),u("dl",Ys,[s("div",$s,[Es,s("dd",Hs,m(e.diskObj["model-family"]),1)])])):_("",!0),e.diskObj["model-name"]&&!["?"].includes(e.diskObj["model-name"])?(a(),u("dl",Ns,[s("div",Ps,[Js,s("dd",Ls,m(e.diskObj["model-name"]),1)])])):_("",!0),s("dl",Ts,[s("div",qs,[Xs,s("dd",Us,m(e.diskObj.serial),1)])])]),s("div",Rs,[s("dl",Vs,[s("div",zs,[Ws,s("dd",Gs,m(e.diskObj.capacity),1)])]),e.diskObj["firm-ver"]&&!["?"].includes(e.diskObj["firm-ver"])?(a(),u("dl",Ks,[s("div",Qs,[Zs,s("dd",et,m(e.diskObj["firm-ver"]),1)])])):_("",!0),e.diskObj["rotation-rate"]!=0?(a(),u("dl",st,[s("div",tt,[ot,s("dd",nt,m(e.diskObj["rotation-rate"]),1)])])):_("",!0),e.diskObj["start-stop-count"]&&!["?"].includes(e.diskObj["start-stop-count"])?(a(),u("dl",rt,[s("div",dt,[it,s("dd",at,m(e.diskObj["start-stop-count"]),1)])])):_("",!0),e.diskObj["power-cycle-count"]&&!["?"].includes(e.diskObj["power-cycle-count"])?(a(),u("dl",ct,[s("div",lt,[mt,s("dd",ut,m(e.diskObj["power-cycle-count"]),1)])])):_("",!0),s("dl",ft,[s("div",_t,[gt,s("dd",xt,m(e.diskObj["temp-c"].replace(/[^0-9]/g,""))+" \xB0C / "+m((e.diskObj["temp-c"].replace(/[^0-9]/g,"")*(9/5)+32).toFixed(1))+" \xB0F ",1)])]),e.diskObj["current-pending-sector"]&&!["?",0,"0"].includes(e.diskObj["current-pending-sector"])?(a(),u("dl",vt,[s("div",ht,[pt,s("dd",kt,m(e.diskObj["current-pending-sector"]),1)])])):_("",!0),e.diskObj["offline-uncorrectable"]&&!["?",0,"0"].includes(e.diskObj["offline-uncorrectable"])?(a(),u("dl",yt,[s("div",bt,[wt,s("dd",It,m(e.diskObj["offline-uncorrectable"]),1)])])):_("",!0),s("dl",Bt,[s("div",Mt,[Ft,s("dd",Ot,m(e.diskObj["power-on-time"]),1)])]),s("dl",St,[s("div",jt,[At,s("dd",Ct,m(e.diskObj.health),1)])])])])])):(a(),u("div",Dt,[s("div",Yt,m(e.wMsg),1)]))])])}var Et=k(is,[["render",$t]]);const h={chassis:{path:"img/2u-stornado/2u-stornado-chassis.png",image:null},disks:{default:{path:"img/disks/ssd-generic-2u.png",image:null},micron5200:{path:"img/disks/ssd-micron-2u.png",image:null},micron5300:{path:"img/disks/ssd-micron-5300-2u.png",image:null},seagate:{path:"img/disks/ssd-seagate-2u.png",image:null},seagateSas:{path:"img/disks/ssd-seagate-sas-2u.png",image:null}}},x=[{x:101,y:30,BAY:"1-1",occupied:!1,image:null},{x:123,y:30,BAY:"1-2",occupied:!1,image:null},{x:177,y:30,BAY:"1-3",occupied:!1,image:null},{x:200,y:30,BAY:"1-4",occupied:!1,image:null},{x:223,y:30,BAY:"1-5",occupied:!1,image:null},{x:246,y:30,BAY:"1-6",occupied:!1,image:null},{x:299,y:30,BAY:"1-7",occupied:!1,image:null},{x:322,y:30,BAY:"1-8",occupied:!1,image:null},{x:347,y:30,BAY:"1-9",occupied:!1,image:null},{x:369,y:30,BAY:"1-10",occupied:!1,image:null},{x:423,y:30,BAY:"1-11",occupied:!1,image:null},{x:446,y:30,BAY:"1-12",occupied:!1,image:null},{x:468,y:30,BAY:"1-13",occupied:!1,image:null},{x:491,y:30,BAY:"1-14",occupied:!1,image:null},{x:545,y:30,BAY:"1-15",occupied:!1,image:null},{x:568,y:30,BAY:"1-16",occupied:!1,image:null},{x:592,y:30,BAY:"2-1",occupied:!1,image:null},{x:615,y:30,BAY:"2-2",occupied:!1,image:null},{x:669,y:30,BAY:"2-3",occupied:!1,image:null},{x:692,y:30,BAY:"2-4",occupied:!1,image:null},{x:714,y:30,BAY:"2-5",occupied:!1,image:null},{x:737,y:30,BAY:"2-6",occupied:!1,image:null},{x:791,y:30,BAY:"2-7",occupied:!1,image:null},{x:814,y:30,BAY:"2-8",occupied:!1,image:null},{x:839,y:30,BAY:"2-9",occupied:!1,image:null},{x:861,y:30,BAY:"2-10",occupied:!1,image:null},{x:915,y:30,BAY:"2-11",occupied:!1,image:null},{x:938,y:30,BAY:"2-12",occupied:!1,image:null},{x:961,y:30,BAY:"2-13",occupied:!1,image:null},{x:984,y:30,BAY:"2-14",occupied:!1,image:null},{x:1037,y:30,BAY:"2-15",occupied:!1,image:null},{x:1060,y:30,BAY:"2-16",occupied:!1,image:null}],Ht={name:"P5Stornado2U",props:{diskInfo:Object},setup(i){const o=v({}),r=M("currentDisk"),e=M("lsdevJson");I(e,()=>{console.log("lsdevJson was updated"),console.log("lsdevJson",e),o.value=e,console.log("diskInfo was updated",o.value),o.value.rows.flat().forEach(t=>{const d=x.findIndex(l=>l.BAY===t["bay-id"]);x[d].occupied=t.occupied,x[d].image=n(t.occupied,t["model-name"],t["model-family"])})},{immediate:!0,deep:!0});function n(t,d,l){return t?/Seagate Nytro/.test(l)?h.disks.seagate.image:/SEAGATE XS400LE10003/.test(d)?h.disks.seagateSas.image:/Micron_5100_|Micron_5200_/.test(d)?h.disks.micron5200.image:/Micron_5300_/.test(d)?h.disks.micron5300.image:h.disks.default.image:null}const c=function(t){t.preload=d=>{h.chassis.image=t.loadImage(h.chassis.path),Object.entries(h.disks).forEach(([l,g])=>{h.disks[l].image=t.loadImage(g.path)}),o.value.rows.flat().forEach(l=>{const g=x.findIndex(f=>f.BAY===l["bay-id"]);x[g].occupied=l.occupied,x[g].image=n(l.occupied,l["model-name"],l["model-family"])})},t.setup=d=>{t.createCanvas(h.chassis.image.width,h.chassis.image.height).parent("p5-stornado2u")},t.draw=d=>{if(t.image(h.chassis.image,0,0),x.forEach(l=>{l.occupied&&t.image(l.image,l.x,l.y)}),r.value){let l=x.findIndex(g=>g.BAY===r.value);x[l].image&&(t.fill(255,255,255,50),t.stroke(206,242,212),t.strokeWeight(2),t.rect(x[l].x,x[l].y,x[l].image.width,x[l].image.height))}},t.mouseClicked=d=>{let l=t.mouseX,g=t.mouseY;x.forEach(f=>{f.occupied&&l>f.x&&l<f.x+f.image.width&&g>f.y&&g<f.y+f.image.height&&(r.value=f.BAY)})}};return X(()=>{new D(c)}),{diskInfoObj:o,currentDisk:r,lsdevJson:e}}},Nt={id:"p5-stornado2u",class:"m-2"};function Pt(i,o,r,e,n,c){return a(),u("div",Nt)}var Jt=k(Ht,[["render",Pt]]);const Lt={components:{P5Stornado2U:Jt},props:{diskInfo:Object},setup(i){return{diskInfo:v(i.diskInfo)}}},Tt={class:"card m-2 flex-auto"},qt=s("div",{class:"card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[s("h3",{class:"text-lg leading-6 font-semibold"},"Disk Viewer")],-1),Xt={class:"card-body dark:bg-stone-700 flex-auto flex flex-col items-center content-center p-0"};function Ut(i,o,r,e,n,c){const t=p("P5Stornado2U");return a(),u("div",Tt,[qt,s("div",Xt,[w(t,{diskInfo:e.diskInfo},null,8,["diskInfo"])])])}var Rt=k(Lt,[["render",Ut]]);const Vt={name:"App",components:{P5Canvas:re,FfdHeader:se,DebugBox:Ae,ServerSection:ds,DiskSection:Et,CanvasSection:Rt,ErrorMessage:H},setup(){const i=v("");S("currentDisk",i);const o=v("");S("lsdevState",o);const r=y({lsdevDuration:5});S("lsdevJson",r);const e=f=>new Promise(b=>setTimeout(b,f*1e3)),n=y({serverInfo:{content:y({}),finished:!1,failed:!1,errorMessage:[],fixAvailable:!1,fixHandler:()=>{console.log("Default handler was run for the fix button.")}},lsdev:{content:y({}),finished:!1,failed:!1,errorMessage:[],fixAvailable:!1,fixHandler:()=>{console.log("Default handler was run for the fix button.")}}}),c=async()=>{try{const f=await F(["/usr/share/cockpit/45drives-disks-vue/scripts/server_info"],{err:"out",superuser:"require",promise:!0});let b=JSON.parse(f.stdout);n.serverInfo.content=b,n.serverInfo.finished=!0,n.serverInfo.failed=!1,n.serverInfo.fixAvailable=!1}catch(f){console.log(f),n.serverInfo.content=null,n.serverInfo.finished=!1,n.serverInfo.failed=!0,n.serverInfo.fixAvailable=!1,n.serverInfo.errorMessage.length=0,n.serverInfo.errorMessage.push("An error occurred when trying to run /usr/share/cockpit/45drives-disks/scripts/server_info"),n.serverInfo.errorMessage.push(f.stderr)}},t=async()=>{try{const f=await F(["/opt/45drives/tools/lsdev","--json"],{err:"out",superuser:"require",promise:!0});let b=JSON.parse(f.stdout);return JSON.stringify(b.rows)!=JSON.stringify(r.rows)?(console.log("result and lsdevJson differed"),Object.assign(r,b),n.lsdev.content=b,n.lsdev.finished=!0,n.lsdev.failed=!1,n.lsdev.fixAvailable=!1,!0):!1}catch(f){return console.log(f),n.lsdev.content=null,n.lsdev.finished=!1,n.lsdev.failed=!0,n.lsdev.fixAvailable=!1,n.lsdev.errorMessage.length=0,n.lsdev.errorMessage.push("An error occurred when trying to run /opt/45drives/tools/lsdev"),n.lsdev.errorMessage.push(f.stderr),!1}},d=async()=>{await c(),await t()},l=async f=>{for(await e(f);await t();)console.log(`Waited ${f}s`),console.log("running lsdev again."),await e(f)},g=cockpit.file("/usr/share/cockpit/45drives-disks-vue/udev/state");return g.watch(async function(f){o.value=f,console.log("lsdevState updated: ",o),await t()&&l(r.lsdevDuration.toFixed(2)*2)}),d(),{preloadChecks:n,runServerInfo:c,runLsdev:t,udevState:g,lsdevJson:r,retryLsdev:l}}},zt={id:"App"},Wt={class:"h-screen flex flex-col overflow-hidden"},Gt={class:"flex flex-wrap overflow-y-auto"},Kt={class:"flex p-2 grow flex-wrap"},Qt={class:"flex p-2 mx-auto grow flex-col items-stretch"},Zt={class:"flex-auto flex items-center justify-evenly mt-2 mx-2"},eo={key:0,class:"p-2 m-2"},so={key:1,class:"p-2 m-2"};function to(i,o,r,e,n,c){const t=p("FfdHeader"),d=p("CanvasSection"),l=p("DiskSection"),g=p("ServerSection"),f=p("ErrorMessage");return a(),u("div",zt,[s("div",Wt,[w(t,{moduleName:"Disks",centerName:""}),s("div",Gt,[s("div",Kt,[e.preloadChecks.serverInfo.finished&&e.preloadChecks.lsdev.finished?(a(),B(d,{key:0,serverInfo:e.preloadChecks.serverInfo.content,diskInfo:e.preloadChecks.lsdev.content},null,8,["serverInfo","diskInfo"])):_("",!0),e.preloadChecks.serverInfo.finished&&e.preloadChecks.lsdev.finished?(a(),B(l,{key:1,diskInfo:e.preloadChecks.lsdev.content},null,8,["diskInfo"])):_("",!0)]),s("div",Qt,[e.preloadChecks.serverInfo.finished&&e.preloadChecks.lsdev.finished?(a(),B(g,{key:0,serverInfo:e.preloadChecks.serverInfo.content,diskInfo:e.preloadChecks.lsdev.content},null,8,["serverInfo","diskInfo"])):_("",!0)])]),s("div",Zt,[e.preloadChecks.serverInfo.failed?(a(),u("div",eo,[w(f,{errorMsg:e.preloadChecks.serverInfo.errorMessage,FixButton:e.preloadChecks.serverInfo.fixAvailable,FixButtonHandler:e.preloadChecks.serverInfo.fixHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):_("",!0),e.preloadChecks.lsdev.failed?(a(),u("div",so,[w(f,{errorMsg:e.preloadChecks.lsdev.errorMessage,FixButton:e.preloadChecks.lsdev.fixAvailable,FixButtonHandler:e.preloadChecks.lsdev.fixHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):_("",!0)])])])}var oo=k(Vt,[["render",to]]);U(oo).mount("#app");