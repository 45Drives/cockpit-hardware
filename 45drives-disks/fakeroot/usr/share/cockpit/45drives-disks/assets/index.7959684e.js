var H=Object.defineProperty;var F=Object.getOwnPropertySymbols;var N=Object.prototype.hasOwnProperty,P=Object.prototype.propertyIsEnumerable;var A=(d,o,n)=>o in d?H(d,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):d[o]=n,M=(d,o)=>{for(var n in o||(o={}))N.call(o,n)&&A(d,n,o[n]);if(F)for(var n of F(o))P.call(o,n)&&A(d,n,o[n]);return d};import{r as g,w,a as L,b as T,c as p,o as a,d as u,e as s,n as C,t as m,f,g as I,P as O,h as q,i as b,F as Y,j as $,k as y,l as D,m as B,p as X,q as j,s as U}from"./vendor.d6a17607.js";const R=function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))e(i);new MutationObserver(i=>{for(const l of i)if(l.type==="childList")for(const t of l.addedNodes)t.tagName==="LINK"&&t.rel==="modulepreload"&&e(t)}).observe(document,{childList:!0,subtree:!0});function n(i){const l={};return i.integrity&&(l.integrity=i.integrity),i.referrerpolicy&&(l.referrerPolicy=i.referrerpolicy),i.crossorigin==="use-credentials"?l.credentials="include":i.crossorigin==="anonymous"?l.credentials="omit":l.credentials="same-origin",l}function e(i){if(i.ep)return;i.ep=!0;const l=n(i);fetch(i.href,l)}};R();var k=(d,o)=>{const n=d.__vccOpts||d;for(const[e,i]of o)n[e]=i;return n};const V={props:{moduleName:String,centerName:Boolean},setup(d){const o=g(!0);function n(){let e=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches,i=localStorage.getItem("color-theme");return i===null?e:i==="dark"}return o.value=n(),o.value?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark"),w(()=>o.value,(e,i)=>{localStorage.setItem("color-theme",e?"dark":"light"),e?document.documentElement.classList.add("dark"):document.documentElement.classList.remove("dark")},{lazy:!1}),{darkMode:o}},components:{SunIcon:L,MoonIcon:T}},J={class:"p-2 flex items-baseline justify-between bg-neutral-50 dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-700",style:{"font-family":"Red Hat Text",position:"relative"}},z={class:"flex flex-row items-baseline basis-10"},G=["src"],W={class:"text-2xl"},K=s("span",{class:"text-gray-800 dark:text-red-600"},"Drives",-1),Q={key:0,class:"ml-5 text-red-800 dark:text-white text-2xl"};function Z(d,o,n,e,i,l){const t=p("SunIcon"),r=p("MoonIcon");return a(),u("div",J,[s("div",z,[s("img",{class:"w-6 h-6 text-gray-50 mr-0.5 self-center",src:e.darkMode?"img/45d-fan-dark.svg":"img/45d-fan-light.svg"},null,8,G),s("h1",W,[s("span",{class:"text-red-800 dark:text-white font-bold",style:C({"font-family":"Source Sans Pro","font-size":"1.6rem"})},"45",4),K]),n.centerName?f("",!0):(a(),u("h1",Q,m(n.moduleName),1))]),n.centerName?(a(),u("h1",{key:0,class:"text-red-800 dark:text-white text-2xl",style:C({position:"absolute",left:"50%",top:"50%",transform:"translateX(-50%) translateY(-50%)"})},m(n.moduleName),5)):f("",!0),s("button",{onClick:o[0]||(o[0]=c=>e.darkMode=!e.darkMode),id:"theme-toggle",type:"button",class:"text-gray-500 dark:text-gray-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none rounded-lg text-sm p-2.5 justify-self-end w-10 h-10 basis-10"},[e.darkMode?(a(),I(t,{key:0})):(a(),I(r,{key:1}))])])}var ee=k(V,[["render",Z]]);const se={name:"P5Canvas",mounted(){const d=function(o){var n=2,e=35;o.setup=i=>{o.createCanvas(570,900).parent("p5-canvas")},o.draw=i=>{o.background(245);const l=o.frameCount*3,t=o.sin(o.radians(l))*50;o.push(),o.translate(0,o.height/2),o.fill(66,184,131),o.stroke(53,73,94),o.strokeWeight(5),o.ellipse(e,t,50,50),o.pop(),e+=n,(e>o.width-35||e<35)&&(n*=-1)}};new O(d)}},te={id:"p5-canvas",class:"mx-auto"};function oe(d,o,n,e,i,l){return a(),u("div",te)}var ne=k(se,[["render",oe]]);const re={components:{XCircleIcon:q},props:{errorMsg:Array,FixButton:Boolean,FixButtonHandler:Function},setup(d){const o=g(d.errorMsg),n=g(d.FixButtonHandler);return w(()=>d.FixButtonHandler,e=>{n.value=e}),{errorMsg:o,FixButtonHandler:n}}},de={class:"flex items-center justify-evenly"},ie={class:"rounded-md bg-red-50 p-4"},ae={class:"flex"},ce={class:"flex-shrink-0"},le={class:"ml-3"},me=s("h3",{class:"text-sm font-medium text-red-800"}," 45Drives Disks Encountered an Error ",-1),ue={class:"mt-2 text-sm text-red-700"},fe={role:"list",class:"list-disc pl-5 space-y-1 whitespace-pre"};function _e(d,o,n,e,i,l){const t=p("XCircleIcon");return a(),u("div",de,[s("div",ie,[s("div",ae,[s("div",ce,[b(t,{class:"h-5 w-5 text-red-400","aria-hidden":"true"})]),s("div",le,[me,s("div",ue,[s("ul",fe,[(a(!0),u(Y,null,$(e.errorMsg,r=>(a(),u("li",null,m(r),1))),256))])])])])]),n.FixButton?(a(),u("button",{key:0,onClick:o[0]||(o[0]=(...r)=>e.FixButtonHandler&&e.FixButtonHandler(...r)),type:"button",class:"inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"}," Fix ")):f("",!0)])}var E=k(re,[["render",_e]]);function S(d=[],o={},n="out"){const e=y({loading:!1,status:0,stdout:"",stderr:""}),i=Boolean(o.promise);o.superuser||(o.superuser="require"),o.err=n==="out"?"out":"message";async function l(){e.loading=!0,e.status=0,e.stdout="",e.stderr="",cockpit.spawn(d,o).then((t,r)=>{e.stdout=t,e.stderr=r}).catch((t,r)=>{var c;e.stderr=r!=null?r:t.message,e.status=(c=t.exit_status)!=null?c:-1}).finally(()=>{e.loading=!1})}return l(),i?new Promise((t,r)=>{w(e,()=>{e.loading||(e.status!==0?r(M({},e)):t(M({},e)))})}):e}const xe={setup(){const d=g(),o=y({errorFlag:!1,errorMessage:[],showFixButton:!1,fixButtonHandler:()=>{console.log("Default handler was run for the fix button.")}}),n=g(),e=y({errorFlag:!1,errorMessage:[],showFixButton:!1,fixButtonHandler:()=>{console.log("Default handler was run for the fix button.")}});return console.log(o),console.log(e),{runServerInfo:async()=>{try{const t=await S(["/usr/share/cockpit/45drives-disks-vue/scripts/server_info"],{err:"out",superuser:"require",promise:!0});let r=JSON.parse(t.stdout);console.log(r),d.value=t.stdout,o.errorFlag=!1,o.errorMessage.length=0,o.showFixButton=!1}catch(t){console.log(t),o.errorFlag=!0,o.errorMessage.length=0,o.errorMessage.push(t.stderr),o.errorMessage.push("An error occurred when trying to run /usr/share/cockpit/45drives-disks/scripts/server_info"),o.showFixButton=!1}},runLsdev:async()=>{try{const t=await S(["/opt/45drives/tools/lsdev","--json"],{err:"out",superuser:"require",promise:!0});let r=JSON.parse(t.stdout);console.log(r),n.value=t.stdout,e.errorFlag=!1,e.errorMessage.length=0,e.showFixButton=!1}catch(t){console.log(t),e.errorFlag=!0,e.errorMessage.length=0,e.errorMessage.push(t.stderr),e.errorMessage.push("An error occurred when trying to run /opt/45drives/tools/lsdev"),e.showFixButton=!1}},serverInfo:d,serverInfoError:o,lsdevInfo:n,lsdevError:e}},components:{RefreshIconOutline:D,ErrorMessage:E}},ge={class:"card m-3 grow"},he=s("div",{class:"card-header p-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[s("h3",{class:"text-lg leading-6 font-semibold"},"Debug Section")],-1),ve={class:"card-body dark:bg-stone-700"},pe={class:"mt-3 sm:mt-0 sm:ml-4"},ke={key:0},ye={class:"w-3/4 m-2"},be={class:"whitespace-pre"},we={key:1},Ie={class:"mt-3 sm:mt-0 sm:ml-4"},Be={key:2,class:"mt-2 flex"},Se={class:"w-3/4 m-2"},Me={class:"whitespace-pre"},Fe={key:3};function Ae(d,o,n,e,i,l){const t=p("ErrorMessage");return a(),u("div",ge,[he,s("div",ve,[s("div",pe,[s("button",{type:"button",onClick:o[0]||(o[0]=r=>e.runServerInfo()),class:"inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"},' run "server_info" ')]),e.serverInfoError.errorFlag?f("",!0):(a(),u("div",ke,[s("div",ye,[s("div",be,m(e.serverInfo),1)])])),e.serverInfoError.errorFlag?(a(),u("div",we,[b(t,{errorMsg:e.serverInfoError.errorMessage,FixButton:e.serverInfoError.showFixButton,FixButtonHandler:e.serverInfoError.fixButtonHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):f("",!0),s("div",Ie,[s("button",{type:"button",onClick:o[1]||(o[1]=r=>e.runLsdev()),class:"inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"},' run "lsdev" ')]),e.lsdevError.errorFlag?f("",!0):(a(),u("div",Be,[s("div",Se,[s("div",Me,m(e.lsdevInfo),1)])])),e.lsdevError.errorFlag?(a(),u("div",Fe,[b(t,{errorMsg:e.lsdevError.errorMessage,FixButton:e.lsdevError.showFixButton,FixButtonHandler:e.lsdevError.fixButtonHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):f("",!0)])])}var Ce=k(xe,[["render",Ae]]);const je={props:{serverInfo:Object,diskInfo:Object},setup(d){y({});const o=B("lsdevState"),n=g(d.diskInfo.rows.flat().filter(t=>t.occupied).length),e=g(d.diskInfo.rows.flat().filter(t=>t.occupied).map(t=>Number(t.capacity.split(" ")[0])).reduce((t,r)=>t+r).toFixed(2)),i=g((d.diskInfo.rows.flat().filter(t=>t.occupied).map(t=>Number(t["temp-c"].replace(/[^0-9]/g,""))).reduce((t,r)=>t+r)/Number(n.value)).toFixed(2));return w(o,()=>{n.value=d.diskInfo.rows.flat().filter(t=>t.occupied).length,console.log("diskCount.value",n.value),e.value=d.diskInfo.rows.flat().filter(t=>t.occupied).map(t=>Number(t.capacity.split(" ")[0])).reduce((t,r)=>t+r).toFixed(2),console.log("storageCapacity.value",e.value),i.value=(d.diskInfo.rows.flat().filter(t=>t.occupied).map(t=>Number(t["temp-c"].replace(/[^0-9]/g,""))).reduce((t,r)=>t+r)/Number(n.value)).toFixed(2),console.log("avgTemp.value",i.value)}),{diskCount:n,storageCapacity:e,avgTemp:i,lsdevState:o}}},Oe={class:"card mx-2 grow flex flex-col"},Ye=s("div",{class:"card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[s("h3",{class:"text-lg py-1 leading-6 font-semibold"},"Server")],-1),$e={class:"card-body dark:bg-stone-700 grow flex"},De={class:"grow flex flex-col items-stretch"},Ee={class:"mt-0"},He={class:"sm:divide-y sm:divide-stone-200"},Ne={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},Pe=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Model ",-1),Le={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-3"},Te={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},qe=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Disk Count ",-1),Xe={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-3"},Ue={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},Re=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Total Storage ",-1),Ve={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-3"},Je={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},ze=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Disk Temperature (avg) ",-1),Ge={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-3"},We={class:"py-2 sm:py-2 sm:grid sm:grid-cols-4 sm:gap-4"},Ke={class:"text-sm font-medium text-stone-500 dark:text-stone-400"},Qe=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Model ",-1),Ze={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"},es=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Controller ID ",-1),ss={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"},ts=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," PCI Slot ",-1),os={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0 sm:col-span-1"};function ns(d,o,n,e,i,l){return a(),u("div",Oe,[Ye,s("div",$e,[s("div",De,[s("div",Ee,[s("dl",He,[s("div",Ne,[Pe,s("dd",Le,m(n.serverInfo.Model),1)]),s("div",Te,[qe,s("dd",Xe,m(e.diskCount),1)]),s("div",Ue,[Re,s("dd",Ve,m(e.storageCapacity)+" GB ",1)]),s("div",Je,[ze,s("dd",Ge,m(e.avgTemp)+" \xB0C / "+m((e.avgTemp*(9/5)+32).toFixed(2))+" \xB0F ",1)]),(a(!0),u(Y,null,$(n.serverInfo.HBA,t=>(a(),u("div",We,[s("dt",Ke," HBA"+m(t.Ctl+1),1),s("div",null,[Qe,s("dd",Ze,m(t.Model),1)]),s("div",null,[es,s("dd",ss,m(t.Ctl),1)]),s("div",null,[ts,s("dd",os,m(t["PCI Slot"]),1)])]))),256))])])])])])}var rs=k(je,[["render",ns]]);const ds={components:{RefreshIconOutline:D},props:{diskInfo:Object},setup(d){const o=B("currentDisk"),n=g("Click on a disk for more detail."),e=y({}),i=()=>{if(!o.value)return;const l=d.diskInfo.rows.flat().filter(t=>t.occupied).find(t=>t["bay-id"]===o.value);if(!l){console.log(`Unable to find info for disk in slot "${o.value}"`),o.value="";return}Object.assign(e,l)};return w(o,i),w(d.diskInfo,i),{wMsg:n,currentDisk:o,diskObj:e}}},is={class:"card m-2 flex-auto flex flex-col min-w-[35%]"},as=s("div",{class:"card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[s("h3",{class:"text-lg leading-6 font-semibold"},"Disk Information")],-1),cs={class:"card-body dark:bg-stone-700 grow flex flex-col"},ls={key:0},ms={class:"grow flex items-start justify-evenly"},us={class:"m-2 flex flex-col"},fs={class:"sm:divide-y sm:divide-stone-200"},_s={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},xs=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Drive Slot ",-1),gs={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},hs={class:"sm:divide-y sm:divide-stone-200"},vs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},ps=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Disk Type ",-1),ks={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},ys={class:"sm:divide-y sm:divide-stone-200"},bs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},ws=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Device Path (sd) ",-1),Is={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Bs={class:"sm:divide-y sm:divide-stone-200"},Ss={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Ms=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Device Path (by-path) ",-1),Fs={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},As={class:"sm:divide-y sm:divide-stone-200"},Cs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},js=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Partition Count ",-1),Os={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ys={key:0,class:"sm:divide-y sm:divide-stone-200"},$s={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Ds=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Model Family ",-1),Es={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Hs={key:1,class:"sm:divide-y sm:divide-stone-200"},Ns={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Ps=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Model Name ",-1),Ls={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ts={class:"sm:divide-y sm:divide-stone-200"},qs={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Xs=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Serial ",-1),Us={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Rs={class:"m-2 flex flex-col"},Vs={class:"sm:divide-y sm:divide-stone-200"},Js={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},zs=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Capacity ",-1),Gs={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ws={key:0,class:"sm:divide-y sm:divide-stone-200"},Ks={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Qs=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Firmware Version ",-1),Zs={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},et={key:1,class:"sm:divide-y sm:divide-stone-200"},st={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},tt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Rotation Rate ",-1),ot={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},nt={key:2,class:"sm:divide-y sm:divide-stone-200"},rt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},dt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Start/Stop count ",-1),it={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},at={key:3,class:"sm:divide-y sm:divide-stone-200"},ct={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},lt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Power Cycle Count ",-1),mt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},ut={class:"sm:divide-y sm:divide-stone-200"},ft={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},_t=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Temperature ",-1),xt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},gt={key:4,class:"sm:divide-y sm:divide-stone-200"},ht={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},vt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Current Pending Sector ",-1),pt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},kt={key:5,class:"sm:divide-y sm:divide-stone-200"},yt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},bt=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Offline-Uncorrectable ",-1),wt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},It={class:"sm:divide-y sm:divide-stone-200"},Bt={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},St=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Power On Time ",-1),Mt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ft={class:"sm:divide-y sm:divide-stone-200"},At={class:"py-2 sm:py-2 sm:grid sm:grid-cols-2 sm:gap-4"},Ct=s("dt",{class:"text-sm font-medium text-stone-500 dark:text-stone-400"}," Health ",-1),jt={class:"mt-1 text-sm text-stone-900 dark:text-stone-300 sm:mt-0"},Ot={key:1,class:"grow flex justify-center items-center"},Yt={class:"p-5 bg-stone-100 dark:bg-stone-600 rounded-lg text-stone-500 dark:text-stone-300"};function $t(d,o,n,e,i,l){return a(),u("div",is,[as,s("div",cs,[e.currentDisk?(a(),u("div",ls,[s("div",ms,[s("div",us,[s("dl",fs,[s("div",_s,[xs,s("dd",gs,m(e.diskObj["bay-id"]),1)])]),s("dl",hs,[s("div",vs,[ps,s("dd",ks,m(e.diskObj.disk_type),1)])]),s("dl",ys,[s("div",bs,[ws,s("dd",Is,m(e.diskObj.dev),1)])]),s("dl",Bs,[s("div",Ss,[Ms,s("dd",Fs,m(e.diskObj["dev-by-path"]),1)])]),s("dl",As,[s("div",Cs,[js,s("dd",Os,m(e.diskObj.partitions),1)])]),e.diskObj["model-family"]&&!["?"].includes(e.diskObj["model-family"])?(a(),u("dl",Ys,[s("div",$s,[Ds,s("dd",Es,m(e.diskObj["model-family"]),1)])])):f("",!0),e.diskObj["model-name"]&&!["?"].includes(e.diskObj["model-name"])?(a(),u("dl",Hs,[s("div",Ns,[Ps,s("dd",Ls,m(e.diskObj["model-name"]),1)])])):f("",!0),s("dl",Ts,[s("div",qs,[Xs,s("dd",Us,m(e.diskObj.serial),1)])])]),s("div",Rs,[s("dl",Vs,[s("div",Js,[zs,s("dd",Gs,m(e.diskObj.capacity),1)])]),e.diskObj["firm-ver"]&&!["?"].includes(e.diskObj["firm-ver"])?(a(),u("dl",Ws,[s("div",Ks,[Qs,s("dd",Zs,m(e.diskObj["firm-ver"]),1)])])):f("",!0),e.diskObj["rotation-rate"]!=0?(a(),u("dl",et,[s("div",st,[tt,s("dd",ot,m(e.diskObj["rotation-rate"]),1)])])):f("",!0),e.diskObj["start-stop-count"]&&!["?"].includes(e.diskObj["start-stop-count"])?(a(),u("dl",nt,[s("div",rt,[dt,s("dd",it,m(e.diskObj["start-stop-count"]),1)])])):f("",!0),e.diskObj["power-cycle-count"]&&!["?"].includes(e.diskObj["power-cycle-count"])?(a(),u("dl",at,[s("div",ct,[lt,s("dd",mt,m(e.diskObj["power-cycle-count"]),1)])])):f("",!0),s("dl",ut,[s("div",ft,[_t,s("dd",xt,m(e.diskObj["temp-c"].replace(/[^0-9]/g,""))+" \xB0C / "+m((e.diskObj["temp-c"].replace(/[^0-9]/g,"")*(9/5)+32).toFixed(1))+" \xB0F ",1)])]),e.diskObj["current-pending-sector"]&&!["?",0,"0"].includes(e.diskObj["current-pending-sector"])?(a(),u("dl",gt,[s("div",ht,[vt,s("dd",pt,m(e.diskObj["current-pending-sector"]),1)])])):f("",!0),e.diskObj["offline-uncorrectable"]&&!["?",0,"0"].includes(e.diskObj["offline-uncorrectable"])?(a(),u("dl",kt,[s("div",yt,[bt,s("dd",wt,m(e.diskObj["offline-uncorrectable"]),1)])])):f("",!0),s("dl",It,[s("div",Bt,[St,s("dd",Mt,m(e.diskObj["power-on-time"]),1)])]),s("dl",Ft,[s("div",At,[Ct,s("dd",jt,m(e.diskObj.health),1)])])])])])):(a(),u("div",Ot,[s("div",Yt,m(e.wMsg),1)]))])])}var Dt=k(ds,[["render",$t]]);const h={chassis:{path:"img/2u-stornado/2u-stornado-chassis.png",image:null},disks:{default:{path:"img/disks/ssd-generic-2u.png",image:null},micron5200:{path:"img/disks/ssd-micron-2u.png",image:null},micron5300:{path:"img/disks/ssd-micron-5300-2u.png",image:null},seagate:{path:"img/disks/ssd-seagate-2u.png",image:null},seagateSas:{path:"img/disks/ssd-seagate-sas-2u.png",image:null}}},_=[{x:101,y:30,BAY:"1-1",occupied:!1,image:null},{x:123,y:30,BAY:"1-2",occupied:!1,image:null},{x:177,y:30,BAY:"1-3",occupied:!1,image:null},{x:200,y:30,BAY:"1-4",occupied:!1,image:null},{x:223,y:30,BAY:"1-5",occupied:!1,image:null},{x:246,y:30,BAY:"1-6",occupied:!1,image:null},{x:299,y:30,BAY:"1-7",occupied:!1,image:null},{x:322,y:30,BAY:"1-8",occupied:!1,image:null},{x:347,y:30,BAY:"1-9",occupied:!1,image:null},{x:369,y:30,BAY:"1-10",occupied:!1,image:null},{x:423,y:30,BAY:"1-11",occupied:!1,image:null},{x:446,y:30,BAY:"1-12",occupied:!1,image:null},{x:468,y:30,BAY:"1-13",occupied:!1,image:null},{x:491,y:30,BAY:"1-14",occupied:!1,image:null},{x:545,y:30,BAY:"1-15",occupied:!1,image:null},{x:568,y:30,BAY:"1-16",occupied:!1,image:null},{x:592,y:30,BAY:"2-1",occupied:!1,image:null},{x:615,y:30,BAY:"2-2",occupied:!1,image:null},{x:669,y:30,BAY:"2-3",occupied:!1,image:null},{x:692,y:30,BAY:"2-4",occupied:!1,image:null},{x:714,y:30,BAY:"2-5",occupied:!1,image:null},{x:737,y:30,BAY:"2-6",occupied:!1,image:null},{x:791,y:30,BAY:"2-7",occupied:!1,image:null},{x:814,y:30,BAY:"2-8",occupied:!1,image:null},{x:839,y:30,BAY:"2-9",occupied:!1,image:null},{x:861,y:30,BAY:"2-10",occupied:!1,image:null},{x:915,y:30,BAY:"2-11",occupied:!1,image:null},{x:938,y:30,BAY:"2-12",occupied:!1,image:null},{x:961,y:30,BAY:"2-13",occupied:!1,image:null},{x:984,y:30,BAY:"2-14",occupied:!1,image:null},{x:1037,y:30,BAY:"2-15",occupied:!1,image:null},{x:1060,y:30,BAY:"2-16",occupied:!1,image:null}],Et={name:"P5Stornado2U",props:{diskInfo:Object},setup(d){const o=g({}),n=B("currentDisk"),e=B("lsdevState");w(d,()=>{o.value=d.diskInfo,o.value.rows.flat().forEach(t=>{const r=_.findIndex(c=>c.BAY===t["bay-id"]);_[r].occupied=t.occupied,_[r].image=i(t.occupied,t["model-name"],t["model-family"])})},{immediate:!0,deep:!0});function i(t,r,c){return t?/Seagate Nytro/.test(c)?h.disks.seagate.image:/SEAGATE XS400LE10003/.test(r)?h.disks.seagateSas.image:/Micron_5100_|Micron_5200_/.test(r)?h.disks.micron5200.image:/Micron_5300_/.test(r)?h.disks.micron5300.image:h.disks.default.image:null}const l=function(t){t.preload=r=>{h.chassis.image=t.loadImage(h.chassis.path),Object.entries(h.disks).forEach(([c,v])=>{h.disks[c].image=t.loadImage(v.path)}),o.value.rows.flat().forEach(c=>{const v=_.findIndex(x=>x.BAY===c["bay-id"]);_[v].occupied=c.occupied,_[v].image=i(c.occupied,c["model-name"],c["model-family"])})},t.setup=r=>{t.createCanvas(h.chassis.image.width,h.chassis.image.height).parent("p5-stornado2u"),t.noLoop()},t.draw=r=>{if(t.image(h.chassis.image,0,0),_.forEach(c=>{c.occupied&&t.image(c.image,c.x,c.y)}),n.value){let c=_.findIndex(v=>v.BAY===n.value);_[c].image&&(t.fill(255,255,255,50),t.stroke(206,242,212),t.strokeWeight(2),t.rect(_[c].x,_[c].y,_[c].image.width,_[c].image.height))}},t.mouseClicked=r=>{let c=t.mouseX,v=t.mouseY;_.forEach(x=>{x.occupied&&c>x.x&&c<x.x+x.image.width&&v>x.y&&v<x.y+x.image.height&&(n.value=x.BAY,t.redraw())})}};return X(()=>{new O(l)}),{diskInfo:o,currentDisk:n,lsdevState:e}}},Ht={id:"p5-stornado2u",class:"m-2"};function Nt(d,o,n,e,i,l){return a(),u("div",Ht)}var Pt=k(Et,[["render",Nt]]);const Lt={components:{P5Stornado2U:Pt},props:{diskInfo:Object},setup(d){return{diskInfo:g(d.diskInfo)}}},Tt={class:"card m-2 flex-auto"},qt=s("div",{class:"card-header py-2 px-5 border-b border-stone-200 dark:border-stone-500 dark:bg-stone-700 sm:flex sm:items-center sm:justify-between"},[s("h3",{class:"text-lg leading-6 font-semibold"},"Disk Viewer")],-1),Xt={class:"card-body dark:bg-stone-700 flex-auto flex flex-col items-center content-center p-0"};function Ut(d,o,n,e,i,l){const t=p("P5Stornado2U");return a(),u("div",Tt,[qt,s("div",Xt,[b(t,{diskInfo:e.diskInfo},null,8,["diskInfo"])])])}var Rt=k(Lt,[["render",Ut]]);const Vt={name:"App",components:{P5Canvas:ne,FfdHeader:ee,DebugBox:Ce,ServerSection:rs,DiskSection:Dt,CanvasSection:Rt,ErrorMessage:E},setup(){const d=g("");j("currentDisk",d);const o=g("");j("lsdevState",o);const n=y({serverInfo:{content:y({}),finished:!1,failed:!1,errorMessage:[],fixAvailable:!1,fixHandler:()=>{console.log("Default handler was run for the fix button.")}},lsdev:{content:y({}),finished:!1,failed:!1,errorMessage:[],fixAvailable:!1,fixHandler:()=>{console.log("Default handler was run for the fix button.")}}}),e=async()=>{try{const r=await S(["/usr/share/cockpit/45drives-disks-vue/scripts/server_info"],{err:"out",superuser:"require",promise:!0});let c=JSON.parse(r.stdout);n.serverInfo.content=c,n.serverInfo.finished=!0,n.serverInfo.failed=!1,n.serverInfo.fixAvailable=!1}catch(r){console.log(r),n.serverInfo.content=null,n.serverInfo.finished=!1,n.serverInfo.failed=!0,n.serverInfo.fixAvailable=!1,n.serverInfo.errorMessage.length=0,n.serverInfo.errorMessage.push("An error occurred when trying to run /usr/share/cockpit/45drives-disks/scripts/server_info"),n.serverInfo.errorMessage.push(r.stderr)}},i=async()=>{try{const r=await S(["/opt/45drives/tools/lsdev","--json"],{err:"out",superuser:"require",promise:!0});let c=JSON.parse(r.stdout);n.lsdev.content=c,n.lsdev.finished=!0,n.lsdev.failed=!1,n.lsdev.fixAvailable=!1}catch(r){console.log(r),n.lsdev.content=null,n.lsdev.finished=!1,n.lsdev.failed=!0,n.lsdev.fixAvailable=!1,n.lsdev.errorMessage.length=0,n.lsdev.errorMessage.push("An error occurred when trying to run /opt/45drives/tools/lsdev"),n.lsdev.errorMessage.push(r.stderr)}},l=async()=>{await e(),await i()},t=cockpit.file("/usr/share/cockpit/45drives-disks-vue/udev/state");return t.watch(function(r){console.log("State File Content",r),o.value=r,i()}),l(),{preloadChecks:n,runServerInfo:e,runLsdev:i,udevState:t}}},Jt={id:"App"},zt={class:"h-screen flex flex-col overflow-hidden"},Gt={class:"flex flex-wrap overflow-y-auto"},Wt={class:"flex p-2 grow flex-wrap"},Kt={class:"flex p-2 mx-auto grow flex-col items-stretch"},Qt={class:"flex-auto flex items-center justify-evenly mt-2 mx-2"},Zt={key:0,class:"p-2 m-2"},eo={key:1,class:"p-2 m-2"};function so(d,o,n,e,i,l){const t=p("FfdHeader"),r=p("CanvasSection"),c=p("DiskSection"),v=p("ServerSection"),x=p("ErrorMessage");return a(),u("div",Jt,[s("div",zt,[b(t,{moduleName:"Disks",centerName:""}),s("div",Gt,[s("div",Wt,[e.preloadChecks.serverInfo.finished&&e.preloadChecks.lsdev.finished?(a(),I(r,{key:0,serverInfo:e.preloadChecks.serverInfo.content,diskInfo:e.preloadChecks.lsdev.content},null,8,["serverInfo","diskInfo"])):f("",!0),e.preloadChecks.serverInfo.finished&&e.preloadChecks.lsdev.finished?(a(),I(c,{key:1,diskInfo:e.preloadChecks.lsdev.content},null,8,["diskInfo"])):f("",!0)]),s("div",Kt,[e.preloadChecks.serverInfo.finished&&e.preloadChecks.lsdev.finished?(a(),I(v,{key:0,serverInfo:e.preloadChecks.serverInfo.content,diskInfo:e.preloadChecks.lsdev.content},null,8,["serverInfo","diskInfo"])):f("",!0)])]),s("div",Qt,[e.preloadChecks.serverInfo.failed?(a(),u("div",Zt,[b(x,{errorMsg:e.preloadChecks.serverInfo.errorMessage,FixButton:e.preloadChecks.serverInfo.fixAvailable,FixButtonHandler:e.preloadChecks.serverInfo.fixHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):f("",!0),e.preloadChecks.lsdev.failed?(a(),u("div",eo,[b(x,{errorMsg:e.preloadChecks.lsdev.errorMessage,FixButton:e.preloadChecks.lsdev.fixAvailable,FixButtonHandler:e.preloadChecks.lsdev.fixHandler},null,8,["errorMsg","FixButton","FixButtonHandler"])])):f("",!0)])])])}var to=k(Vt,[["render",so]]);U(to).mount("#app");