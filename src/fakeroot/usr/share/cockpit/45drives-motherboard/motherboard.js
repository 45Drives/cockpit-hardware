//mobo app

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

var hardware_info = null;
var mobo_info = null;
var mobo_json_path = null;
var pci_info = null;
var ram_info = null;
var sata_info = null;
var network_info = null;
var supported_motherboards = ["X11DPL-i","X11SPL-F","H11SSL-i","X11SSH-CTF","X11SSM-F"];
var mobo_supported = false;
var root_check = null;

var mobo_app = function( m ) {
// steps:
// - load the background image
// - load the .json file
// - create components (including their masks)
// - gather component specific info
// - draw populated slots


m.createComponentMasks = function(a){
	var img_path = (
		"img/motherboard/" + 
		String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + 
		"/" + mobo_json[a]["type"] + 
		String(mobo_json[a]["id"]) + ".png"
	);
	MASK_ARR.push(m.loadImage(img_path));
};

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
		m.push();
		m.fill(this.fill);
		m.stroke(this.border);
		m.rect(this.x0,this.y0,this.width,this.height,10,10);
		m.stroke(0);
		m.strokeWeight(1);
		try{m.textSize(14);}catch(err) {}
		m.fill(0);
		try{try{m.textFont("Courier New");}catch(err) {}}catch(err){}
		try{m.text(this.content,this.x0+9,this.y0+20);}catch(err){}
		m.pop();
	}
}

m.verifyAssetsLoaded = function(){
	let ret_val = true;
	if(!background_img){
		ret_val = false;
	}
	return ret_val;
};

m.setup = function(){
	let cnv = m.createCanvas(1024,1024);
	cnv.mouseMoved(m.mouseActivity);
	mobo_image = document.getElementById("mobo_image");
	m.frameRate(20);
};

m.draw = function (){
	if(READY){
		m.background(255);
		m.image(background_img,0,0);
		for(let i = 0; i < peripherals.length; i++){
			peripherals[i].show();
		}
		if(POPUP_ACTIVE){
			m.push();
			m.image(MASK_ARR[POPUP_IDX],0,0);
			m.pop();
			components[POPUP_IDX].popup.show();
		}
	}
	else if(STATE == 0){
		m.background(255);
		try{m.textFont("Courier New");}catch(err){}
		try{m.text("Loading Motherboard Info ... Please Wait.",40,40);}catch(err){}
		m.loadAssets();
		STATE = 1;
	}
	else if(STATE == 1){
		m.background(255);
		try{m.textFont("Courier New");}catch(err){}
		try{m.text("Loading Motherboard Assets ... Please Wait.",40,40);}catch(err){}
		if(m.verifyAssetsLoaded()){
			STATE = 2;
		}
	}
	else if(STATE == 2){
		m.background(255);
		try{m.textFont("Courier New");}catch(err){}
		try{m.text("Generating Masks ... Please Wait.",40,40);}catch(err){}
		if(components.length > 0){
			m.createComponentMasks(MASK_COUNT);
			MASK_COUNT++;
			let myStr = "Mask: " + String(MASK_COUNT) + " of " + String(components.length);
			try{m.textFont("Courier New");}catch(err){}
			try{m.text(myStr,40,70);}catch(err){}
		}
		if(MASK_ARR.length == components.length && MASK_ARR.length != 0){
			STATE = 3;
			m.background(255);
			try{m.textFont("Courier New");}catch(err){}
			try{m.text("Creating graphics for supported PCI cards ... Please Wait.",40,40);}catch(err){}
		}
	}
	else if(STATE == 3){
		m.populateSlots();
		m.setGlobalMask();
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

m.setGlobalMask = function(){
	let inset = 30;
	let yTrim = 30;
	globalMask = m.generateMask(background_img.width,background_img.height,inset,inset+yTrim,background_img.width-(2*inset),background_img.height-((2*inset)+yTrim),true);
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
		m.push();
		if(this.img_idx != -1){
			let aspectRatio = peripheralImages[this.img_idx].width/peripheralImages[this.img_idx].height;
			let newWidth = peripheralImages[this.img_idx].width*this.wScale;
			let newHeight = newWidth/aspectRatio;
			m.image(peripheralImages[this.img_idx],this.x0,this.y0,newWidth,newHeight);
		}else{
			m.fill(this.fill);
			m.noStroke();
			m.rect(this.x0,this.y0,this.width,this.height);
		}
		m.pop();
	}
}

m.populateSlots = function(){
	m.getRam();
	m.getPCI();
	m.getCPU();
	m.getSATA();
	m.resizePopups();
};

m.generateMask = function(w,h,x0,y0,x1,y1,invert=false){
	let mask = m.createImage(w,h);
	let padding = 50;
	mask.loadPixels();
	for(let i = 0; i < w; i++){
		for(let j = 0; j < h; j++){
			if((i > x0) && (i < x0 + x1) &&
				(j > y0) && (j < y0 + y1)){
				// inside footprint of component.
					if(invert){
						mask.set(i, j, m.color(0, 0, 0, 255));
					}else{
						mask.set(i, j, m.color(0, 0, 0, 0));
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
					r = m.sqrt(x*x + y*y);
					r_map = m.map(r,0,padding,0,128,true);
					if(invert){
						r_map = m.map(r,0,padding,0,255,true);
						mask.set(i,j,m.color(0,0,0,127+(128-r_map)));
					}else{
						mask.set(i,j,m.color(0,0,0,r_map));  
					}
					corner = true;
				}else if(i > x0 + x1 && j < y0 ){
					//top right
					x = x0 + x1 - i;
					y = y0 - j;
					r = m.int(m.sqrt(x*x + y*y));
					r_map = m.map(r,0,padding,0,128,true);
					if(invert){
						r_map = m.map(r,0,padding,0,255,true);
						mask.set(i,j,m.color(0,0,0,127+(128-r_map)));
					}else{
						mask.set(i,j,m.color(0,0,0,r_map));  
					}
					
					corner = true;
				}
				else if(i < x0 && j > y0 + y1){
					//bottom left
					x = x0 - i;
					y = y0 + y1 - j;
					r = m.int(m.sqrt(x*x + y*y));
					r_map = m.map(r,0,padding,0,128,true);
					if(invert){
						r_map = m.map(r,0,padding,0,255,true);
						mask.set(i,j,m.color(0,0,0,127+(128-r_map)));
					}else{
						mask.set(i,j,m.color(0,0,0,r_map));  
					}
					
					corner = true;
				}
				else if(i > x0 + x1 && j > y0 + y1) {
					//bottom right
					x = x0 + x1 - i;
					y = y0 + y1 - j;
					r = m.int(m.sqrt(x*x + y*y));
					r_map = m.map(r,0,padding,0,128,true);
					if(invert){
						r_map = m.map(r,0,padding,0,255,true);
						mask.set(i,j,m.color(0,0,0,127+(128-r_map)));
					}else{
						mask.set(i,j,m.color(0,0,0,r_map));  
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
					x_map = m.map(falloff_x,0,padding,0,128);
					y_map = m.map(falloff_y,0,padding,0,128);
					if(x_map > y_map){
						if(invert){
							x_map = m.map(falloff_x,0,padding,0,255);
							mask.set(i,j,m.color(0,0,0,127+(128-x_map)));
						}else{
							mask.set(i,j,m.color(0,0,0,x_map));  
						}
					}
					else{
						if(invert){
							y_map = m.map(falloff_y,0,padding,0,255);
							mask.set(i,j,m.color(0,0,0,127+(128-y_map)));
						}else{
							mask.set(i,j,m.color(0,0,0,y_map));  
						}
						
					}
				}
			}
			else{
				//outside box
				if(invert){
					mask.set(i, j, m.color(0, 0, 0, 0));
				}else{
					mask.set(i, j, m.color(0, 0, 0, 128));  
				}
			}
		}
	}
	mask.updatePixels();
	return mask;
};


m.resizePopups = function(){
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
};

m.getRam= function(){
	if(ram_info){
		for(let i = 0; i < ram_info["Ram Info"].length; i++){
			for(let c = 0; c < components.length; c++){
				if(ram_info["Ram Info"][i]["Locator"] == components[c]["type"]){
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
						peripheralImages.push(m.loadImage("img/motherboard/ram.png"));
					}
				}
			}
		}
	}
};

m.getPCI = function(){
	let VERTOFFSET = 5.37;
	let VERTSCALE = 19.0;
	let WIDTHOFFSET = 1.24;
	if(pci_info){
		for(let i = 0; i < pci_info["PCI Info"].length; i++){
			if(pci_info["PCI Info"][i].hasOwnProperty("ID")){
				for(let c = 0; c < components.length; c++){
					if(components[c]["id"] == pci_info["PCI Info"][i]["ID"] && components[c]["type"].search("pci") != -1){
						components[c].popup.content = JSON.stringify(pci_info["PCI Info"][i],null," ").replaceAll("{\n","").replaceAll("\"","").replaceAll("[","").replaceAll("]\n","").replaceAll("}","").replaceAll(",","").replaceAll("    ","  ");
						if(pci_info["PCI Info"][i].hasOwnProperty("Card Type") && pci_info["PCI Info"][i].hasOwnProperty("Card Model")){
							if(pci_info["PCI Info"][i]["Card Type"] == "HBA" && pci_info["PCI Info"][i]["Card Model"] == "SAS9305-24i"){
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
								peripheralImages.push(m.loadImage("img/motherboard/24i.png"));
								components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
								components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
								components[c]["width"] = 108.0*components[c]["width"]*pciScale;
								components[c]["height"] = components[c]["width"]/(108.0/884.0);
								components[c].popup.content = components[c].popup.content.slice(0,-1);
								let newMask = m.generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
								MASK_ARR[c] = newMask;
							}
							else if(pci_info["PCI Info"][i]["Card Type"] == "HBA" && pci_info["PCI Info"][i]["Card Model"] == "SAS9305-16i"){
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
								peripheralImages.push(m.loadImage("img/motherboard/16i.png"));
								components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
								components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
								components[c]["width"] = 108.0*components[c]["width"]*pciScale;
								components[c]["height"] = components[c]["width"]/(108.0/884.0);
								components[c].popup.content = components[c].popup.content.slice(0,-1);
								let newMask = m.generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
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
								peripheralImages.push(m.loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
								components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
								components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
								components[c]["width"] = 99.0*components[c]["width"]*pciScale;
								components[c]["height"] = components[c]["width"]/(99.0/593.0);
								components[c].popup.content = components[c].popup.content.slice(0,-5);
								let newMask = m.generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
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
								peripheralImages.push(m.loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
								components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
								components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
								components[c]["width"] = 98.0*components[c]["width"]*pciScale;
								components[c]["height"] = components[c]["width"]/(98.0/813.0);
								components[c].popup.content = components[c].popup.content.slice(0,-5);
								let newMask = m.generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
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
								peripheralImages.push(m.loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
								components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
								components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
								components[c]["width"] = 99.0*components[c]["width"]*pciScale;
								components[c]["height"] = components[c]["width"]/(99.0/886.0);
								components[c].popup.content = components[c].popup.content.slice(0,-5);
								let newMask = m.generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
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
								peripheralImages.push(m.loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
								components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
								components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
								components[c]["width"] = 98.0*components[c]["width"]*pciScale;
								components[c]["height"] = components[c]["width"]/(98.0/886.0);
								components[c].popup.content = components[c].popup.content.slice(0,-5);
								let newMask = m.generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
								MASK_ARR[c] = newMask;
							}
							else if(pci_info["PCI Info"][i]["Card Type"] == "Serial ATA Controller" && pci_info["PCI Info"][i]["Card Model"] == "ASM1062"){
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
								peripheralImages.push(m.loadImage("img/motherboard/" + pci_info["PCI Info"][i]["Card Model"] + ".png"));
								components[c]["x0"] = components[c]["x0"]-(components[c]["width"]*WIDTHOFFSET);
								components[c]["y0"] = components[c]["y0"]-(components[c]["width"]*VERTOFFSET);
								components[c]["width"] = 97.0*components[c]["width"]*pciScale;
								components[c]["height"] = components[c]["width"]/(97.0/365.0);
								let contentStr = "";
								contentStr += "Designation: " + pci_info["PCI Info"][i]["Designation"] + "\n";
								contentStr += "Type: " + pci_info["PCI Info"][i]["Type"] + "\n";
								contentStr += "Current Usage: " + pci_info["PCI Info"][i]["Current Usage"] + "\n";
								contentStr += "ID: " + pci_info["PCI Info"][i]["ID"] + "\n";
								contentStr += "Bus Address: " + pci_info["PCI Info"][i]["Bus Address"] + "\n";
								contentStr += "Card Type: " + pci_info["PCI Info"][i]["Card Type"] + "\n";
								contentStr += "Card Model: " + pci_info["PCI Info"][i]["Card Model"] + "\n";
								if(pci_info["PCI Info"][i].hasOwnProperty("Connections")){
									let padding = 11;
									contentStr += "Connections: \n"
									for(let con = 0; con < pci_info["PCI Info"][i]["Connections"].length; con++){
										contentStr += "\tDevice: " + pci_info["PCI Info"][i]["Connections"][con]["Device"] + "\n";
										contentStr += "\tPath: " + pci_info["PCI Info"][i]["Connections"][con]["Path"] + "\n";
										contentStr += "\tPartition Information:\n";
										contentStr += (
											"\t\t| " + "Name".padEnd(padding," ") + 
											"Size".padEnd(padding," ") + 
											"Type".padEnd(padding," ") + 
											"Mount Point".padEnd(padding," ") + " |\n"
											);
										for(let p = 0; p < pci_info["PCI Info"][i]["Connections"][con]["Partitions"].length; p++){
											contentStr += "\t\t| " + pci_info["PCI Info"][i]["Connections"][con]["Partitions"][p]["Name"].padEnd(padding," ");
											contentStr += pci_info["PCI Info"][i]["Connections"][con]["Partitions"][p]["Size"].padEnd(padding," ");
											contentStr += pci_info["PCI Info"][i]["Connections"][con]["Partitions"][p]["Type"].padEnd(padding," ");
											contentStr += pci_info["PCI Info"][i]["Connections"][con]["Partitions"][p]["Mount Point"].padEnd(padding," ") + " |\n";
										}
									}
								}
								components[c].popup.content = contentStr.slice(0,-1);;
								let newMask = m.generateMask(background_img.width,background_img.height,components[c]["x0"],components[c]["y0"],components[c]["width"],components[c]["height"]);
								MASK_ARR[c] = newMask;
							}
						}
					}
				}
			}
		}

	}
};

m.getCPU = function(){
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
};

m.getSATA = function(){
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
};

m.loadAssets = function(){
	mobo_image = document.getElementById("mobo_image");
	if(mobo_image.src){
		background_img = m.loadImage(mobo_image.src);
		m.jsonLoadMotherboard(mobo_json_path);
	}
};

m.jsonLoadMotherboard = function(fname){
	var proc = cockpit.spawn(
			[
				"/usr/share/cockpit/45drives-motherboard/helper_scripts/dump_json",
				fname 
			], 
			{err: "out", superuser: "require"}
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
		}
	);
};

	m.mouseActivity = function(){
		if(READY){
			POPUP_ACTIVE = false;
			for(let i = 0; i < components.length; i++){
				if((m.mouseX > components[i].x0) && (m.mouseX < components[i].x0 + components[i].width) &&
					(m.mouseY > components[i].y0) && (m.mouseY < components[i].y0 + components[i].height)){
					//cursor is within the boundaries of a component.
					POPUP_ACTIVE = true;
					POPUP_IDX = i;
					if((components[i].x0 + components[i].width + 20 + components[i].popup.width) < m.width){
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
	};
};

var moboP5;

function resourceSleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function motherboard_script(){
	while(!document.getElementById("motherboard_output") || !document.getElementById("mobo_image") || !document.getElementById("motherboard_msg_state")){await resourceSleep(300);}
	var m_output = document.getElementById("motherboard_output");
	var mobo_img = document.getElementById("mobo_image");
	var motherboard_proc = cockpit.spawn(
			[
				"/usr/share/cockpit/45drives-motherboard/helper_scripts/motherboard"
			], 
			{err: "out", superuser: "require"}
	);
	motherboard_proc.stream(
		function(data)
		{
			mobo_info = JSON.parse(data);
			console.log("mobo_info");
			console.log(mobo_info);
			mobo_img.src = ("img/motherboard/" + 
				String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + "/" +
				String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".png");
			mobo_img.setAttribute("style","display:none;");
				mobo_json_path = ("img/motherboard/" + 
					String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + "/" +
					String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".json");
				document.getElementById("motherboard_msg_state").innerHTML = "&#10003;";
		}
	);
}

async function pci_script(){
	// load the pci information
	while(!document.getElementById("pci_msg_state")){await resourceSleep(300);}
	var pci_proc = cockpit.spawn(
	[
		"/usr/share/cockpit/45drives-motherboard/helper_scripts/pci"
	], 
	{err: "out", superuser: "require"}
	);

	pci_proc.stream(
		function(data){
			pci_info = JSON.parse(data);
			console.log("pci_info");
			console.log(pci_info);
			document.getElementById("pci_msg_state").innerHTML = "&#10003;";
			//pci_promise.resolve();
		}
	);
}

async function sata_script(){
	//load the sata information
	while(!document.getElementById("sata_msg_state")){await resourceSleep(300);}
	var sata_proc = cockpit.spawn(
		[
			"/usr/share/cockpit/45drives-motherboard/helper_scripts/sata"
		], 
		{err: "out", superuser: "require"}
	);

	sata_proc.stream(
		function(data){
			sata_info = JSON.parse(data);
			console.log("sata_info");
			console.log(sata_info);
			document.getElementById("sata_msg_state").innerHTML = "&#10003;";
		}
	);
}

async function ram_script(){
	//load the ram information
	while(!document.getElementById("ram_msg_state")){await resourceSleep(300);}
	var ram_proc = cockpit.spawn(
		[
			"/usr/share/cockpit/45drives-motherboard/helper_scripts/ram"
		], 
		{err: "out", superuser: "require"}
	);
	ram_proc.stream(
		function(data){
			ram_info = JSON.parse(data);
			console.log("ram_info");
			console.log(ram_info);
			document.getElementById("ram_msg_state").innerHTML = "&#10003;";
		}
	);
}

async function network_script(){
	while(!document.getElementById("network_msg_state")){await resourceSleep(300);}
	// load the pci information
	var network_proc = cockpit.spawn(
		[

			"/usr/share/cockpit/45drives-motherboard/helper_scripts/network"
		], 
		{err: "out", superuser: "require"}
	);

	network_proc.stream(
		function(data){
			network_info = JSON.parse(data);
			console.log("network_info");
			console.log(network_info);
			document.getElementById("network_msg_state").innerHTML = "&#10003;";

		}
	);
}

function runServerSideScripts(){
	root_check = cockpit.permission({ admin: true });
	root_check.addEventListener(
		"changed", 
		function() {
			if(root_check.allowed){
				//user is an administrator, start the module as normal
				motherboard_script();
				pci_script();
				ram_script();
				sata_script();
				network_script();
			}else{
				//user is not an administrator, don't run any scripts
				let page_content = document.getElementById("motherboard_content");
				page_content.innerHTML = "";
				let user_msg = document.createElement("div");
				user_msg.className = "content_block_msg";
				user_msg.innerHTML = "You must be an administrator to use this feature.";
				page_content.appendChild(user_msg);

			}
	 	}
	)
}

async function startMoboApp(){
	while(!document.getElementById("motherboard_app")){	await resourceSleep(300);}
	var timeout = 0;
	runServerSideScripts();
	while((!mobo_info || !mobo_json_path || !pci_info || !sata_info || !ram_info) || timeout > 20){await resourceSleep(500); timeout++;}
	while(
		document.getElementById("motherboard_msg_state").innerHTML != "✓" &&
		document.getElementById("pci_msg_state").innerHTML != "✓" &&
		document.getElementById("sata_msg_state").innerHTML != "✓" &&
		document.getElementById("ram_msg_state").innerHTML != "✓" &&
		document.getElementById("network_msg_state").innerHTML != "✓"
		){await resourceSleep(500);}
	console.log("Motherboard scripts completed.");
	if(mobo_info){
		for(let i = 0; i < supported_motherboards.length; i++){
			if(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"] == supported_motherboards[i]){
				mobo_supported = true;
				document.getElementById("loading_messages").classList.add("hidden");
				moboP5 = new p5(mobo_app, 'motherboard_app');
			}
		}
		if(!mobo_supported){
			document.getElementById("motherboard_output").innerHTML = (
				"Interactive Motherboard Support for " +
				mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"] +
				" is not available at this time.");
		}
	}
}

startMoboApp();