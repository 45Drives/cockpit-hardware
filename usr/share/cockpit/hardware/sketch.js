let xpos = 0;
let ypos = 0;
let x_inc = 1;
let y_inc = 1;
let mobo_image;
let background_img;
let bg_loaded = false;
let mobo_json;
let pop_up;
let components = [];
let image_mask;
let bg_masked;
let mask_complete = false;

function testMask(){
  image_mask = createImage(bg_masked.width,bg_masked.height);
  image_mask.loadPixels();
  for (let i = 0; i < image_mask.width; i++) {
    for (let j = 0; j < image_mask.height; j++) {
      if((i > mobo_json[1]["x0"]) && (i < mobo_json[1]["x0"] + mobo_json[1]["width"]) &&
         (j > mobo_json[1]["y0"]) && (j < mobo_json[1]["y0"] + mobo_json[1]["height"])){
        image_mask.set(i, j, color(0, 0, 0, 0));
      }else{
        image_mask.set(i, j, color(0, 0, 0, 255));
      }
    }
  }
  image_mask.updatePixels();
  bg_masked.mask(image_mask);
  mask_complete = true;
}

class component{
  constructor(x0,y0,width,height,id,type,mask,popup){
    this.x0 = x0;
    this.y0 = y0;
    this.width = width;
    this.height = height;
    this.id = id;
    this.type = type;
    this.mask = mask;
    this.popup = popup;
  }
}

class popup_window{
  constructor(x0,y0,width,height,content,active=false,border="#000000",fill="#A0A0A0"){
    this.height = height;
    this.width = width;
    this.content = content;
    this.border = border;
    this.fill = fill;
    this.x0 = x0;
    this.y0 = y0;
    this.active = active;
  }
  show(){
    if(this.active){
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
}

function setup() {
  let cnv = createCanvas(1024,1024);
  cnv.parent("motherboard_app");
  cnv.mouseMoved(mouseActivity);
  pop_up = new popup_window(0,0,200,300,"example popup");
}

function draw() {
  if(bg_loaded){
    background(255);
    if(background_img){
      image(background_img,0,0);
    }
    if(pop_up.active){
      if(!mask_complete){
        testMask();
      }
      push();
      tint(100,100,100,128);
      image(bg_masked,0,0);
      pop();
    }
    pop_up.show();
  }
  else{
    loadBG();
    background(255);
  }
}

function drawBoundingRects(){
  push();
  stroke(100,100,0);
  strokeWeight(2);
  noFill();
  for(let i = 0; i < mobo_json.length; i++){
    if(mobo_json[i]["shape"] == "rect"){
      rect(mobo_json[i]["x0"],mobo_json[i]["y0"],mobo_json[i]["width"],mobo_json[i]["height"]);
    }
  }
  pop();
}

function loadBG(){
  mobo_image = document.getElementById("mobo_image");
  if(mobo_image.src){
    background_img = loadImage(mobo_image.src);
    bg_masked = loadImage(mobo_image.src);
    bg_loaded = true;
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
      for(let i = 0; i < mobo_json.length; i++){
        components.push(
          new component(
            mobo_json[i]["x0"],
            mobo_json[i]["y0"],
            mobo_json[i]["width"],
            mobo_json[i]["height"],
            mobo_json[i]["id"],
            mobo_json[i]["type"],
            loadImage(mobo_image.src),
            new popup_window( mobo_json[i]["x0"], mobo_json[i]["y0"], 200, 300,  mobo_json[i]["type"])
          )
        );
      }
      dfd.resolve();
    }
  );
}

function mouseActivity(){
  //mouse is moving over the canvas.
  let hit = false;
  for(let i = 0; i < mobo_json.length; i++){
    if(mobo_json[i]["shape"] == "rect"){
      if((mouseX > mobo_json[i]["x0"]) && (mouseX < mobo_json[i]["x0"]+mobo_json[i]["width"]) &&
        (mouseY > mobo_json[i]["y0"]) && (mouseY < mobo_json[i]["y0"]+mobo_json[i]["height"])){
        hit = true;
        if((mobo_json[i]["x0"] + mobo_json[i]["width"] + 20 + pop_up.width) < width){
          pop_up.x0 = mobo_json[i]["x0"] + mobo_json[i]["width"] + 20;
        }
        else{
          pop_up.x0 = mobo_json[i]["x0"] - 20 - pop_up.width;
        }

        if((mobo_json[i]["y0"] - 20 ) > 0 ){
          pop_up.y0 = mobo_json[i]["y0"] - 20;
        }
        else{
          pop_up.y0 = 0;
        }

        pop_up.content = mobo_json[i]["type"] + String(mobo_json[i]["id"]);
        break;
      }
    }
  }
  pop_up.active = hit;
  

}


cockpit.transport.wait(function() { });