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

let peripherals = [];

// steps:
// - load the background image
// - load the .json file
// - create components (including their masks)
// - gather component specific info
// - draw populated slots


function createComponentMasks(a){
  var dfd = cockpit.defer();
  //MASK_ARR.push(createImage(background_img.width, background_img.height));
  //MASK_ARR[a].loadPixels();
  //for(let i = 0; i < MASK_ARR[a].width; i++){
  //  for(let j = 0; j < MASK_ARR[a].height; j++){
  //    if((i > components[a].x0) && (i < components[a].x0 + components[a].width) &&
  //       (j > components[a].y0) && (j < components[a].y0 + components[a].height)){
  //      MASK_ARR[a].set(i, j, color(0, 0, 0, 0));
  //    }else{
  //      MASK_ARR[a].set(i, j, color(0, 0, 0, 255));
  //    }
  //  }
  //}
  //MASK_ARR[a].updatePixels();
  //var msk = document.createElement("img");
  //msk.onload = function(){
  //  MASK_ARR[a].src = "img/motherboard/" + String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + "/" + mobo_json[a]["type"] + String(mobo_json[a]["id"]) + ".png";
  //  MASK_ARR[a].setAttribute("style","display:none;");
  //};
  var img_path = "img/motherboard/" + String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + "/" + mobo_json[a]["type"] + String(mobo_json[a]["id"]) + ".png";
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
      let myStr = "Mask: " + String(MASK_COUNT) + " of " + String(components.length);
      textFont("Courier New");
      text(myStr,40,70);
      createComponentMasks(MASK_COUNT);
      MASK_COUNT++;
    }
    if(MASK_ARR.length == components.length && MASK_ARR.length != 0){
      STATE = 3;
    }
  }
  else if(STATE == 3){
    populateSlots();
    READY = true;
  }
}

class peripheral{
  constructor(x0,y0,width,height,fill){
    this.x0 = x0;
    this.y0 = y0;
    this.width = width;
    this.height = height;
    this.fill = fill;
  }
  show(){
    push();
    fill(this.fill);
    noStroke();
    rect(this.x0,this.y0,this.width,this.height);
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
              components[c]["x0"],
              components[c]["y0"],
              components[c]["width"],
              components[c]["height"],
              "#8080FF80"
              )
            );
          }
        }
      }
    }
  }
  dfd.resolve();
}

function getPCI(){
  var dfd = cockpit.defer();
  if(pci_info){
    for(let i = 0; i < pci_info["PCI Info"].length; i++){
      if(pci_info["PCI Info"][i].hasOwnProperty("ID")){
        for(let c = 0; c < components.length; c++){
          if(components[c]["id"] == pci_info["PCI Info"][i]["ID"] && components[c]["type"].search("pci") != -1){
            components[c].popup.content = JSON.stringify(pci_info["PCI Info"][i],null," ").replaceAll("{\n","").replaceAll("\"","").replaceAll("[","").replaceAll("]\n","").replaceAll("}","").replaceAll(",","").replaceAll("    ","  ");
            components[c].popup.content = components[c].popup.content.slice(0,-1);
            if(pci_info["PCI Info"][i].hasOwnProperty("Card Type")){
              if(pci_info["PCI Info"][i]["Card Type"] == "SAS9305-24i"){
                peripherals.push(
                  new peripheral(
                    components[c]["x0"],
                    components[c]["y0"],
                    components[c]["width"],
                    components[c]["height"],
                    "#FF800080"
                    )
                  );
              }
              else if(pci_info["PCI Info"][i]["Card Type"] == "SAS9305-16i"){
                peripherals.push(
                  new peripheral(
                    components[c]["x0"],
                    components[c]["y0"],
                    components[c]["width"],
                    components[c]["height"],
                    "#80FF0080"
                    )
                  );
              }
              else if(pci_info["PCI Info"][i]["Card Type"] == "Network Card"){
                peripherals.push(
                  new peripheral(
                    components[c]["x0"],
                    components[c]["y0"],
                    components[c]["width"],
                    components[c]["height"],
                    "#0080FF80"
                    )
                  );
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
              components[c]["x0"],
              components[c]["y0"],
              components[c]["width"],
              components[c]["height"],
              "#FF80FF80"
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
        POPUP_ACTIVE = true;
        POPUP_IDX = i;
        if((components[i].x0 + components[i].width + 20 + components[i].popup.width) < width){
          components[i].popup.x0 = components[i].x0 + components[i].width + 20;
        }
        else{
          components[i].popup.x0 = components[i].x0 - 20 - components[i].popup.width;
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