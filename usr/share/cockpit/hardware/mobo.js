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

// steps:
// - load the background image
// - load the .json file
// - create components (including their masks)
// - gather component specific info
// - draw populated slots


function createComponentMasks(a){
  var dfd = cockpit.defer();
  MASK_ARR.push(createImage(background_img.width, background_img.height));
  MASK_ARR[a].loadPixels();
  for(let i = 0; i < MASK_ARR[a].width; i++){
    for(let j = 0; j < MASK_ARR[a].height; j++){
      if((i > components[a].x0) && (i < components[a].x0 + components[a].width) &&
         (j > components[a].y0) && (j < components[a].y0 + components[a].height)){
        MASK_ARR[a].set(i, j, color(0, 0, 0, 0));
      }else{
        MASK_ARR[a].set(i, j, color(0, 0, 0, 255));
      }
    }
  }
  MASK_ARR[a].updatePixels();
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
    rect(this.x0,this.y0,this.width,this.height);
    stroke(0);
    strokeWeight(1);
    textSize(16);
    fill(0);
    text(this.content,this.x0+20,this.y0+20);
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
    if(POPUP_ACTIVE){
      push();
      tint(100,100,100,128);
      image(MASK_ARR[POPUP_IDX],0,0);
      pop();
      components[POPUP_IDX].popup.show();
    }
  }
  else if(STATE == 0){
    background(255);
    text("Loading Motherboard Info ... Please Wait.",40,40);
    loadAssets();
    STATE = 1;
  }
  else if(STATE == 1){
    background(255);
    text("Loading Motherboard Assets ... Please Wait.",40,40);
    if(verifyAssetsLoaded()){
      STATE = 2;
    }
  }
  else if(STATE == 2){
    background(255);
    text("Generating Masks ... Please Wait.",40,40);
    if(components.length > 0){
      let myStr = "Mask: " + String(MASK_COUNT) + " of " + String(components.length);
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

//    if(background_img){
//      image(background_img,0,0);
//    }
//    //if(pop_up.active){
//    //  if(!mask_complete){
//    //    testMask();
//    //  }
//    //  push();
//    //  tint(100,100,100,128);
//    //  image(bg_masked,0,0);
//    //  pop();
//    //}
//    //pop_up.show();
//    //}
//    else{
//    }
}

function populateSlots(){
  console.log(hardware_info);
  console.log(mobo_info);
  getRam();
  getPCI();
  getCPU();
}

function getRam(){
  console.log("getRam");
}

function getPCI(){
  console.log("getPCI");
}

function getCPU(){
  console.log("getcpu");
  let contentStr;
  for(let i = 0; i < components.length; i++){
    if(components[i].type == "cpu" && components[i].id == 1){
      contentStr = "";
      contentStr += "Socket Designation: " + mobo_info["Motherboard Info"][1]["CPU"][0]["Socket Designation"] + "\n";
      contentStr += "Version: " + mobo_info["Motherboard Info"][1]["CPU"][0]["Version"] + "\n";
      contentStr += "Max Speed: " + mobo_info["Motherboard Info"][1]["CPU"][0]["Max Speed"] + "\n";
      contentStr += "Temperature: " + mobo_info["Motherboard Info"][2]["Sensor Readings"][0]["CPU1 Temp"] + "\n";
      components[i].popup.content = contentStr;
    }
    else if(components[i].type == "cpu" && components[i].id == 2){
      contentStr = "";
      contentStr += "Socket Designation: " + mobo_info["Motherboard Info"][1]["CPU"][1]["Socket Designation"] + "\n";
      contentStr += "Version: " + mobo_info["Motherboard Info"][1]["CPU"][1]["Version"] + "\n";
      contentStr += "Max Speed: " + mobo_info["Motherboard Info"][1]["CPU"][1]["Max Speed"] + "\n";
      contentStr += "Temperature: " + mobo_info["Motherboard Info"][2]["Sensor Readings"][0]["CPU2 Temp"] + "\n";
      components[i].popup.content = contentStr;
    }
  }
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
              new popup_window( mobo_json[i]["x0"], mobo_json[i]["y0"], 450, 200,  mobo_json[i]["type"])
            )
          );
        }
      }
      dfd.resolve();
    }
  );
}

//function mouseActivity(){
//  //mouse is moving over the canvas.
//  let hit = false;
//  for(let i = 0; i < mobo_json.length; i++){
//    if(mobo_json[i]["shape"] == "rect"){
//      if((mouseX > mobo_json[i]["x0"]) && (mouseX < mobo_json[i]["x0"]+mobo_json[i]["width"]) &&
//        (mouseY > mobo_json[i]["y0"]) && (mouseY < mobo_json[i]["y0"]+mobo_json[i]["height"])){
//        hit = true;
//        if((mobo_json[i]["x0"] + mobo_json[i]["width"] + 20 + pop_up.width) < width){
//          pop_up.x0 = mobo_json[i]["x0"] + mobo_json[i]["width"] + 20;
//        }
//        else{
//          pop_up.x0 = mobo_json[i]["x0"] - 20 - pop_up.width;
//        }
//
//        if((mobo_json[i]["y0"] - 20 ) > 0 ){
//          pop_up.y0 = mobo_json[i]["y0"] - 20;
//        }
//        else{
//          pop_up.y0 = 0;
//        }
//
//        pop_up.content = mobo_json[i]["type"] + String(mobo_json[i]["id"]);
//        break;
//      }
//    }
//  }
//  pop_up.active = hit;
//}

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