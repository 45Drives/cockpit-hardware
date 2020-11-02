let mobo_image;
let background_img;
let bg_loaded = false;
let mobo_json;
let pop_up;
let components = [];
let image_mask;
let bg_masked;
let mask_complete = false;

let STATE = 0;
let READY = false;
let POPUP_ACTIVE = false;
let POPUP_IDX = 0;

let MASK_ARR = [];
let MASK_COUNT = 0;

let peripheralImages = [];
let peripherals = [];

let pciScale = 0.02;
let ramScale = 0.026;

let globalMask;
let APPLIED_COUNT = 0;

// steps:
// - load the background image
// - load the .json file
// - create components (including their masks)
// - gather component specific info
// - draw populated slots


function createComponentMasks(a){
  var dfd = cockpit.defer();
  var img_path = (
    "img/motherboard/" + 
    String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + 
    "/" + mobo_json[a]["type"] + 
    String(mobo_json[a]["id"]) + ".png"
  );
  MASK_ARR.push(loadImage(img_path));
  dfd.resolve();
}

class component{
  constructor(x0,y0,width,height,id,type,popup){
    this.x0 = x0;
    this.y0 = y0;
    this.width = width;
    this.height = height;
    this.id = id;
    this.type = type;
    this.popup = popup;
  }
}

class popup_window{
  constructor(x0,y0,width,height,content,border="#000000",fill="#FFFFFF"){
    this.height = height;
    this.width = width;
    this.content = content;
    this.border = border;
    this.fill = fill;
    this.x0 = x0;
    this.y0 = y0;
  }
  show(){
    push();
    fill(this.fill);
    stroke(this.border);
    rect(this.x0,this.y0,this.width,this.height,10,10);
    stroke(0);
    strokeWeight(1);
    textSize(14);
    fill(0);
    textFont("Courier New");
    text(this.content,this.x0+9,this.y0+20);
    pop();
  }
}

function verifyAssetsLoaded(){
  let ret_val = true;
  if(!background_img){
    ret_val = false;
  }
  return ret_val;
}

function setup() {
  let cnv = createCanvas(1024,1024);
  cnv.parent("motherboard_app");
  cnv.mouseMoved(mouseActivity);
  mobo_image = document.getElementById("mobo_image");
}

function draw(){
  if(READY){
    background(255);
    image(background_img,0,0);
    for(let i = 0; i < peripherals.length; i++){
      peripherals[i].show();
    }
    if(POPUP_ACTIVE){
      push();
      image(MASK_ARR[POPUP_IDX],0,0);
      pop();
      components[POPUP_IDX].popup.show();
    }
  }
  else if(STATE == 0){
    background(255);
    textFont("Courier New");
    text("Loading Motherboard Info ... Please Wait.",40,40);
    loadAssets();
    STATE = 1;
  }
  else if(STATE == 1){
    background(255);
    textFont("Courier New");
    text("Loading Motherboard Assets ... Please Wait.",40,40);
    if(verifyAssetsLoaded()){
      STATE = 2;
    }
  }
  else if(STATE == 2){
    background(255);
    textFont("Courier New");
    text("Generating Masks ... Please Wait.",40,40);
    if(components.length > 0){
      createComponentMasks(MASK_COUNT);
      MASK_COUNT++;
      let myStr = "Mask: " + String(MASK_COUNT) + " of " + String(components.length);
      textFont("Courier New");
      text(myStr,40,70);
    }
    if(MASK_ARR.length == components.length && MASK_ARR.length != 0){
      STATE = 3;
      background(255);
      textFont("Courier New");
      text("Creating graphics for supported PCI cards ... Please Wait.",40,40);
    }
  }
  else if(STATE == 3){
    populateSlots();
    setGlobalMask();
    STATE = 4;
  }else if(STATE == 4){
    if(APPLIED_COUNT < components.length){
      MASK_ARR[APPLIED_COUNT].mask(globalMask);
      APPLIED_COUNT++;
    }else{
      READY = true;
    }
  }
}

function setGlobalMask(){
  var dfd = cockpit.defer();
  let inset = 30;
  let yTrim = 30;
  globalMask = generateMask(background_img.width,background_img.height,inset,inset+yTrim,background_img.width-(2*inset),background_img.height-((2*inset)+yTrim),true);
  dfd.resolve();
}


class peripheral{
  constructor(pType,x0,y0,width,height,fill,img_idx,wScale=1.0){
    this.pType = pType;
    this.x0 = x0;
    this.y0 = y0;
    this.width = width;
    this.height = height;
    this.fill = fill;
    this.img_idx = img_idx;
    this.wScale = wScale;
  }
  show(){
    push();
    if(this.img_idx != -1){
      let aspectRatio = peripheralImages[this.img_idx].width/peripheralImages[this.img_idx].height;
      let newWidth = peripheralImages[this.img_idx].width*this.wScale;
      let newHeight = newWidth/aspectRatio;
      image(peripheralImages[this.img_idx],this.x0,this.y0,newWidth,newHeight);
    }else{
      fill(this.fill);
      noStroke();
      rect(this.x0,this.y0,this.width,this.height);
    }
    pop();
  }
}

function populateSlots(){
  getRam();
  getPCI();
  getCPU();
  getSATA();
  resizePopups();
}

function generateMask(w,h,x0,y0,x1,y1,invert=false){
  let mask = createImage(w,h);
  let padding = 50;
  mask.loadPixels();
  for(let i = 0; i < w; i++){
    for(let j = 0; j < h; j++){
      if((i > x0) && (i < x0 + x1) &&
        (j > y0) && (j < y0 + y1)){
        // inside footprint of component.
          if(invert){
            mask.set(i, j, color(0, 0, 0, 255));
          }else{
            mask.set(i, j, color(0, 0, 0, 0));
          }
      }
      else if((i > x0 - padding) && (i < x0 -padding + x1 + 2*padding) &&
        (j > y0-padding) && (j < y0 - padding + y1 + 2*padding)){
        //inside transition between box and background.
        let falloff_x;
        let falloff_y;
        let x_map;
        let y_map;
        let r_map;
        let corner=false;
        let y;
        let x;
        let r;
        if(i < x0 && j < y0){
          //top left
          x = x0 - i;
          y = y0 - j;
          r = sqrt(x*x + y*y);
          r_map = map(r,0,padding,0,128,true);
          if(invert){
            r_map = map(r,0,padding,0,255,true);
            mask.set(i,j,color(0,0,0,127+(128-r_map)));
          }else{
            mask.set(i,j,color(0,0,0,r_map));  
          }
          corner = true;
        }else if(i > x0 + x1 && j < y0 ){
          //top right
          x = x0 + x1 - i;
          y = y0 - j;
          r = int(sqrt(x*x + y*y));
          r_map = map(r,0,padding,0,128,true);
          if(invert){
            r_map = map(r,0,padding,0,255,true);
            mask.set(i,j,color(0,0,0,127+(128-r_map)));
          }else{
            mask.set(i,j,color(0,0,0,r_map));  
          }
          
          corner = true;
        }
        else if(i < x0 && j > y0 + y1){
          //bottom left
          x = x0 - i;
          y = y0 + y1 - j;
          r = int(sqrt(x*x + y*y));
          r_map = map(r,0,padding,0,128,true);
          if(invert){
            r_map = map(r,0,padding,0,255,true);
            mask.set(i,j,color(0,0,0,127+(128-r_map)));
          }else{
            mask.set(i,j,color(0,0,0,r_map));  
          }
          
          corner = true;
        }
        else if(i > x0 + x1 && j > y0 + y1) {
          //bottom right
          x = x0 + x1 - i;
          y = y0 + y1 - j;
          r = int(sqrt(x*x + y*y));
          r_map = map(r,0,padding,0,128,true);
          if(invert){
            r_map = map(r,0,padding,0,255,true);
            mask.set(i,j,color(0,0,0,127+(128-r_map)));
          }else{
            mask.set(i,j,color(0,0,0,r_map));  
          }
          
          corner = true;
        }
        if(!corner){
          if(i < x0){
            falloff_x = x0 - i;
          }
          else{
            falloff_x = i - (x0 + x1);
          }
          if(j < y0){
            falloff_y = y0 - j;
          }
          else{
            falloff_y = j - (y0 + y1);
          }
          x_map = map(falloff_x,0,padding,0,128);
          y_map = map(falloff_y,0,padding,0,128);
          if(x_map > y_map){
            if(invert){
              x_map = map(falloff_x,0,padding,0,255);
              mask.set(i,j,color(0,0,0,127+(128-x_map)));
            }else{
              mask.set(i,j,color(0,0,0,x_map));  
            }
          }
          else{
            if(invert){
              y_map = map(falloff_y,0,padding,0,255);
              mask.set(i,j,color(0,0,0,127+(128-y_map)));
            }else{
              mask.set(i,j,color(0,0,0,y_map));  
            }
            
          }
        }
      }
      else{
        //outside box
        if(invert){
          mask.set(i, j, color(0, 0, 0, 0));
        }else{
          mask.set(i, j, color(0, 0, 0, 128));  
        }
      }
    }
  }
  mask.updatePixels();
  return mask;
}


function resizePopups(){
  var dfd = cockpit.defer();
  for(let i = 0; i < components.length; i++){
    var lines = components[i].popup.content.split(/\r\n|\r|\n/);
    var linecount = components[i].popup.content.split(/\r\n|\r|\n/).length;
    components[i].popup.height = 18*linecount + 10;
    
    var max_chars = 0;
    for(let j=0; j<lines.length; j++){
      if(lines[j].length > max_chars){
        max_chars = lines[j].length;
      }
    }
    components[i].popup.width = 9*max_chars + 10;
  }
  dfd.resolve();
}

function getRam(){
  var dfd = cockpit.defer();
  if(ram_info){
    for(let i = 0; i < ram_info["Ram Info"].length; i++){
      for(let c = 0; c < components.length; c++){
        if(ram_info["Ram Info"][i]["Locator"] == components[c]["type"]){
          components[c].popup.content = JSON.stringify(ram_info["Ram Info"][i],null,"\t");
          
          var content_str = "";
          content_str += "Connector: " + ram_info["Ram Info"][i]["Locator"] + "\n";
          content_str += "Capacity: " + ram_info["Ram Info"][i]["Size"] + "\n";
          content_str += "Form Factor: " + ram_info["Ram Info"][i]["Form Factor"] + "\n";
          content_str += "Type: " + ram_info["Ram Info"][i]["Type"] + "\n";
          content_str += "Manufacturer: " + ram_info["Ram Info"][i]["Manufacturer"] + "\n";
          content_str += "Temperature: " + ram_info["Ram Info"][i]["Temperature"];

          components[c].popup.content = content_str;

          if(ram_info["Ram Info"][i]["Size"] != "No Module Installed"){
            peripherals.push(
              new peripheral(
              "RAM",
              components[c]["x0"]+components[c]["width"]*0.08,
              components[c]["y0"]+components[c]["height"]*0.09,
              components[c]["width"],
              components[c]["height"],
              "#8080FF80",
              peripheralImages.length,
              components[c]["width"]*ramScale,
              )
            );
            peripheralImages.push(loadImage("img/motherboard/ram.png"));
          }
        }
      }
    }
  }
  dfd.resolve();
}

function getPCI(){
  var dfd = cockpit.defer();
  let VERTOFFSET = 5.37;
  let VERTSCALE = 19.0;
  let WIDTHOFFSET = 1.24;
  if(pci_info){
    for(let i = 0; i < pci_info["PCI Info"].length; i++){
      if(pci_info["PCI Info"][i].hasOwnProperty("ID")){
        for(let c = 0; c < components.length; c++){
          if(components[c]["id"] == pci_info["PCI Info"][i]["ID"] && components[c]["type"].search("pci") != -1){
            components[c].popup.content = JSON.stringify(pci_info["PCI Info"][i],null," ").replaceAll("{\n","").replaceAll("\"","").replaceAll("[","").replaceAll("]\n","").replaceAll("}","").replaceAll(",","").replaceAll("    ","  ");
            if(pci_info["PCI Info"][i].hasOwnProperty("Card Type")){
              if(pci_info["PCI Info"][i]["Card Type"] == "SAS9305-24i"){
                peripherals.push(
                  new peripheral(
                    "PCI",
                    components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET),
                    components[c]["y0"]-(components[c]["width"]*VERTOFFSET),
                    components[c]["width"],
                    components[c]["height"],
                    "#FF800080",
                    peripheralImages.length,
                    components[c]["width"]*pciScale
                    )
                  );
                peripheralImages.push(loadImage("img/motherboard/24i.png"));
                components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
                components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
                components[c]["width"] = 108.0*components[c]["width"]*pciScale;
                components[c]["height"] = components[c]["width"]/(108.0/884.0);
                components[c].popup.content = components[c].popup.content.slice(0,-1);
                let newMask = generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
                MASK_ARR[c] = newMask;
              }
              else if(pci_info["PCI Info"][i]["Card Type"] == "SAS9305-16i"){
                peripherals.push(
                  new peripheral(
                    "PCI",
                    components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET),
                    components[c]["y0"]-(components[c]["width"]*VERTOFFSET),
                    components[c]["width"],
                    components[c]["height"],
                    "#FF800080",
                    peripheralImages.length,
                    components[c]["width"]*pciScale
                    )
                  );
                peripheralImages.push(loadImage("img/motherboard/16i.png"));
                components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
                components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
                components[c]["width"] = 108.0*components[c]["width"]*pciScale;
                components[c]["height"] = components[c]["width"]/(108.0/884.0);
                components[c].popup.content = components[c].popup.content.slice(0,-1);
                let newMask = generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
                MASK_ARR[c] = newMask;
              }
              else if(pci_info["PCI Info"][i]["Card Type"] == "Network Card" && pci_info["PCI Info"][i]["Card Model"] == "82599ES"){
                peripherals.push(
                  new peripheral(
                    "PCI",
                    components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET),
                    components[c]["y0"]-(components[c]["width"]*VERTOFFSET),
                    components[c]["width"],
                    components[c]["height"],
                    "#FF800080",
                    peripheralImages.length,
                    components[c]["width"]*pciScale
                    )
                  );
                peripheralImages.push(loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
                components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
                components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
                components[c]["width"] = 99.0*components[c]["width"]*pciScale;
                components[c]["height"] = components[c]["width"]/(99.0/593.0);
                components[c].popup.content = components[c].popup.content.slice(0,-5);
                let newMask = generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
                MASK_ARR[c] = newMask;
              }
              else if(pci_info["PCI Info"][i]["Card Type"] == "Network Card" && pci_info["PCI Info"][i]["Card Model"] == "X540-AT2"){
                peripherals.push(
                  new peripheral(
                    "PCI",
                    components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET),
                    components[c]["y0"]-(components[c]["width"]*VERTOFFSET),
                    components[c]["width"],
                    components[c]["height"],
                    "#FF800080",
                    peripheralImages.length,
                    components[c]["width"]*pciScale
                    )
                  );
                peripheralImages.push(loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
                components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
                components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
                components[c]["width"] = 98.0*components[c]["width"]*pciScale;
                components[c]["height"] = components[c]["width"]/(98.0/813.0);
                components[c].popup.content = components[c].popup.content.slice(0,-5);
                let newMask = generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
                MASK_ARR[c] = newMask;
              }
              else if(pci_info["PCI Info"][i]["Card Type"] == "Network Card" && pci_info["PCI Info"][i]["Card Model"] == "XL710"){
                peripherals.push(
                  new peripheral(
                    "PCI",
                    components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET),
                    components[c]["y0"]-(components[c]["width"]*VERTOFFSET),
                    components[c]["width"],
                    components[c]["height"],
                    "#FF800080",
                    peripheralImages.length,
                    components[c]["width"]*pciScale
                    )
                  );
                peripheralImages.push(loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
                components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
                components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
                components[c]["width"] = 99.0*components[c]["width"]*pciScale;
                components[c]["height"] = components[c]["width"]/(99.0/886.0);
                components[c].popup.content = components[c].popup.content.slice(0,-5);
                let newMask = generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
                MASK_ARR[c] = newMask;
              }
              else if(pci_info["PCI Info"][i]["Card Type"] == "Network Card" && pci_info["PCI Info"][i]["Card Model"] == "XXV710"){
                peripherals.push(
                  new peripheral(
                    "PCI",
                    components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET),
                    components[c]["y0"]-(components[c]["width"]*VERTOFFSET),
                    components[c]["width"],
                    components[c]["height"],
                    "#FF800080",
                    peripheralImages.length,
                    components[c]["width"]*pciScale
                    )
                  );
                peripheralImages.push(loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
                components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
                components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
                components[c]["width"] = 98.0*components[c]["width"]*pciScale;
                components[c]["height"] = components[c]["width"]/(98.0/886.0);
                components[c].popup.content = components[c].popup.content.slice(0,-5);
                let newMask = generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
                MASK_ARR[c] = newMask;
              }
            }
          }
        }
      }
    }

  }
  dfd.resolve();
}

function getCPU(){
  let contentStr;
  for(let i = 0; i < components.length; i++){
    if(components[i].type == "cpu" && components[i].id == 1){
      contentStr = "";
      contentStr += "Socket Designation: " + mobo_info["Motherboard Info"][1]["CPU"][0]["Socket Designation"] + "\n";
      contentStr += "Version: " + mobo_info["Motherboard Info"][1]["CPU"][0]["Version"] + "\n";
      contentStr += "Max Speed: " + mobo_info["Motherboard Info"][1]["CPU"][0]["Max Speed"] + "\n";
      contentStr += "Temperature: " + mobo_info["Motherboard Info"][2]["Sensor Readings"][0]["CPU1 Temp"] + "\n";
      components[i].popup.content = contentStr;
      components[i].popup.content = components[i].popup.content.slice(0,-1);
    }
    else if(components[i].type == "cpu" && components[i].id == 2){
      contentStr = "";
      contentStr += "Socket Designation: " + mobo_info["Motherboard Info"][1]["CPU"][1]["Socket Designation"] + "\n";
      contentStr += "Version: " + mobo_info["Motherboard Info"][1]["CPU"][1]["Version"] + "\n";
      contentStr += "Max Speed: " + mobo_info["Motherboard Info"][1]["CPU"][1]["Max Speed"] + "\n";
      contentStr += "Temperature: " + mobo_info["Motherboard Info"][2]["Sensor Readings"][0]["CPU2 Temp"] + "\n";
      components[i].popup.content = contentStr;
      components[i].popup.content = components[i].popup.content.slice(0,-1);
    }
  }
}

function getSATA(){
  var dfd = cockpit.defer();
  if(sata_info){
    //sata info is a global variable in hardware.js
    for(let i = 0; i < sata_info["SATA Info"].length; i++){
      for(let c = 0; c < components.length; c++){
        if(sata_info["SATA Info"][i]["Connector"] == components[c].type){
          let popup_str = ""
          let padding = 11;
          popup_str += "Connector: " + sata_info["SATA Info"][i]["Connector"] + "\n";
          popup_str += "Device: " + sata_info["SATA Info"][i]["Device"] + "\n";
          popup_str += "Partition Information: \n";
          popup_str += (
            "| " + "Name".padEnd(padding," ") + 
            "Size".padEnd(padding," ") + 
            "Type".padEnd(padding," ") + 
            "Mount Point".padEnd(padding," ") + " |\n"
            );
          for(let p = 0; p < sata_info["SATA Info"][i]["Partitions"].length; p++){
            popup_str += "| " + sata_info["SATA Info"][i]["Partitions"][p]["Name"].padEnd(padding," ");
            popup_str += sata_info["SATA Info"][i]["Partitions"][p]["Size"].padEnd(padding," ");
            popup_str += sata_info["SATA Info"][i]["Partitions"][p]["Type"].padEnd(padding," ");
            popup_str += sata_info["SATA Info"][i]["Partitions"][p]["Mount Point"].padEnd(padding," ") + " |\n";
          }
          components[c].popup.content = popup_str.slice(0,-1);
            peripherals.push(
            new peripheral(
              "SATA",
              components[c]["x0"],
              components[c]["y0"],
              components[c]["width"],
              components[c]["height"],
              "#FFFFFF40",
              -1,
              1.0
              )
            );
          break;
        }
      }
    }
  }
  dfd.resolve();
}

function loadAssets(){
  mobo_image = document.getElementById("mobo_image");
  if(mobo_image.src){
    background_img = loadImage(mobo_image.src);
    jsonLoadMotherboard(mobo_json_path);
  }
}

function jsonLoadMotherboard(fname){
  var dfd = cockpit.defer();
  var proc = cockpit.spawn(
      [
        "/usr/bin/pkexec",
        "/usr/share/cockpit/hardware/helper_scripts/dump_json",
        fname 
      ], 
      {err: "out"}
  );
  proc.stream(
    function(data){
      mobo_json = JSON.parse(data);
      mobo_image = document.getElementById("mobo_image");
      let im_path = mobo_image.src;
      for(let i = 0; i < mobo_json.length; i++){
        if(mobo_json[i]["shape"] == "rect"){
          components.push(
            new component(
              mobo_json[i]["x0"],
              mobo_json[i]["y0"],
              mobo_json[i]["width"],
              mobo_json[i]["height"],
              mobo_json[i]["id"],
              mobo_json[i]["type"],
              new popup_window( mobo_json[i]["x0"], mobo_json[i]["y0"], 550, 200,  mobo_json[i]["type"])
            )
          );
        }
      }
      dfd.resolve();
    }
  );
}

function mouseActivity(){
  if(READY){
    POPUP_ACTIVE = false;
    for(let i = 0; i < components.length; i++){
      if((mouseX > components[i].x0) && (mouseX < components[i].x0 + components[i].width) &&
        (mouseY > components[i].y0) && (mouseY < components[i].y0 + components[i].height)){
        //cursor is within the boundaries of a component.
        POPUP_ACTIVE = true;
        POPUP_IDX = i;
        if((components[i].x0 + components[i].width + 20 + components[i].popup.width) < width){
          //popup window can fit if placed near the top right of the component and 
          //still fit on screen.
          components[i].popup.x0 = components[i].x0 + components[i].width + 20;
        }
        else if((components[i].x0 - 20 -components[i].popup.width)>20){
          //popup window can be placed near the upper left region of the component footprint
          components[i].popup.x0 = components[i].x0 - 20 - components[i].popup.width;
        }else{
          //popup window is very wide, we need to place it above the component,
          //starting from the left and sliding it toward the right
          //until it fits on the canvas.
          components[i].popup.x0 = ((components[i].x0 - 20 -components[i].popup.width)*-1)+20;
           
        }
        if((components[i].y0 - 20 ) > 0 ){
        components[i].popup.y0 = components[i].y0 - 20;
        }
        else{
          components[i].popup.y0 = 0;
        }
        break;
      }
    }
  }
}

cockpit.transport.wait(function() { });