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

var mobo_app = function( m ) {
// steps:
// - load the background image
// - load the .json file
// - create components (including their masks)
// - gather component specific info
// - draw populated slots


m.createComponentMasks = function(a){
	//var dfd = cockpit.defer();
	var img_path = (
		"img/motherboard/" + 
		String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + 
		"/" + mobo_json[a]["type"] + 
		String(mobo_json[a]["id"]) + ".png"
	);
	MASK_ARR.push(m.loadImage(img_path));
	//dfd.resolve();
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
		m.textSize(14);
		m.fill(0);
		m.textFont("Courier New");
		m.text(this.content,this.x0+9,this.y0+20);
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
	//cnv.parent("motherboard_app");
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
		m.textFont("Courier New");
		m.text("Loading Motherboard Info ... Please Wait.",40,40);
		m.loadAssets();
		STATE = 1;
	}
	else if(STATE == 1){
		m.background(255);
		m.textFont("Courier New");
		m.text("Loading Motherboard Assets ... Please Wait.",40,40);
		if(m.verifyAssetsLoaded()){
			STATE = 2;
		}
	}
	else if(STATE == 2){
		m.background(255);
		m.textFont("Courier New");
		m.text("Generating Masks ... Please Wait.",40,40);
		if(components.length > 0){
			m.createComponentMasks(MASK_COUNT);
			MASK_COUNT++;
			let myStr = "Mask: " + String(MASK_COUNT) + " of " + String(components.length);
			m.textFont("Courier New");
			m.text(myStr,40,70);
		}
		if(MASK_ARR.length == components.length && MASK_ARR.length != 0){
			STATE = 3;
			m.background(255);
			m.textFont("Courier New");
			m.text("Creating graphics for supported PCI cards ... Please Wait.",40,40);
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
	//var dfd = cockpit.defer();
	let inset = 30;
	let yTrim = 30;
	globalMask = m.generateMask(background_img.width,background_img.height,inset,inset+yTrim,background_img.width-(2*inset),background_img.height-((2*inset)+yTrim),true);
	//dfd.resolve();
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
	//var dfd = cockpit.defer();
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
	//dfd.resolve();
};

m.getRam= function(){
	//var dfd = cockpit.defer();
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
	//dfd.resolve();
};

m.getPCI = function(){
	//var dfd = cockpit.defer();
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
	//dfd.resolve();
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
	//var dfd = cockpit.defer();
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
	//dfd.resolve();
};

m.loadAssets = function(){
	mobo_image = document.getElementById("mobo_image");
	if(mobo_image.src){
		background_img = m.loadImage(mobo_image.src);
		m.jsonLoadMotherboard(mobo_json_path);
	}
};

m.jsonLoadMotherboard = function(fname){
	//var dfd = cockpit.defer();
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
			//dfd.resolve();
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

//disk app
var disk_app = function( d ) {
	let chassis_img;
	let row_hdd_img;
	let row_ssd_img;
	let row_h16_img;
	let front_plate_img;
	let server_info;
	let server_img_arr = [];
	let row_img_arr = [];

	let server_rows = [];
	const ROW_HDD = 0;
	const ROW_SSD = 1;
	const ROW_H16 = 2;

	let ROW_JSON_KEYS = ["ROW_HDD","ROW_SSD","ROW_H16"];

	let json_row;
	let json_row_arr = [];
	let json_lsdev;

	let ALIAS_TEMPLATE = {
		"H16":{
			"Q30":[ROW_H16,ROW_HDD],
			"S45":[ROW_H16,ROW_HDD,ROW_HDD],
			"XL60":[ROW_H16,ROW_HDD,ROW_HDD,ROW_HDD]
		},
		"H32":{
			"Q30":[ROW_SSD,ROW_HDD],
			"S45":[ROW_SSD,ROW_HDD,ROW_HDD],
			"XL60":[ROW_SSD,ROW_HDD,ROW_HDD,ROW_HDD]
		},
		"STORINATOR":{
			"AV15":[ROW_HDD],
			"Q30":[ROW_HDD,ROW_HDD],
			"S45":[ROW_HDD,ROW_HDD,ROW_HDD],
			"XL60":[ROW_HDD,ROW_HDD,ROW_HDD]	
		},
		"STORNADO":{
			"AV15":[ROW_SSD]
		},
		"AV15-BASE":{
			"AV15":[ROW_HDD]
		}
	}

	let LABEL_TEMPLATE = {
		"H16":{
			"Q30":[
				[
					"2-23","2-22","2-21","2-20","2-19","2-18","2-17",
					"2-16","2-15","2-14","2-13","2-12","2-11","2-10","2-9",
					"2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1"
				],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			],
			"S45":[
				[
					"3-23","3-22","3-21","3-20","3-19","3-18","3-17",
					"3-16","3-15","3-14","3-13","3-12","3-11","3-10","3-9",
					"3-8","3-7","3-6","3-5","3-4","3-3","3-2","3-1"
				],
				["2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1"],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			],
			"XL60":[
				[
					"4-23","4-22","4-21","4-20","4-19","4-18","4-17",
					"4-16","4-15","4-14","4-13","4-12","4-11","4-10","4-9",
					"4-8","4-7","4-6","4-5","4-4","4-3","4-2","4-1"
				],
				["3-15","3-14","3-13","3-12","3-11","3-10","3-9","3-8","3-7","3-6","3-5","3-4","3-3","3-2","3-1"],
				["2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1"],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			]
		},
		"H32":{
			"Q30":[
				[
					"2-24","2-23","2-22","2-21","2-20","2-19","2-18","2-17",
					"2-16","2-15","2-14","2-13","2-12","2-11","2-10","2-9",
					"2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1",
					"1-23","1-22","1-21","1-20","1-19","1-18","1-17","1-16"
				],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			],
			"S45":[
				[
					"3-24","3-23","3-22","3-21","3-20","3-19","3-18","3-17",
					"3-16","3-15","3-14","3-13","3-12","3-11","3-10","3-9",
					"3-8","3-7","3-6","3-5","3-4","3-3","3-2","3-1",
					"2-23","2-22","2-21","2-20","2-19","2-18","2-17","2-16"
				],
				["2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1"],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			],
			"XL60":[
				[
					"4-24","4-23","4-22","4-21","4-20","4-19","4-18","4-17",
					"4-16","4-15","4-14","4-13","4-12","4-11","4-10","4-9",
					"4-8","4-7","4-6","4-5","4-4","4-3","4-2","4-1",
					"3-23","3-22","3-21","3-20","3-19","3-18","3-17","3-16"
				],
				["3-15","3-14","3-13","3-12","3-11","3-10","3-9","3-8","3-7","3-6","3-5","3-4","3-3","3-2","3-1"],
				["2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1"],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			]
		},
		"STORINATOR":{
			"AV15":[
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
				],
			"Q30":[
				["2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1"],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
				],
			"S45":[
				["3-15","3-14","3-13","3-12","3-11","3-10","3-9","3-8","3-7","3-6","3-5","3-4","3-3","3-2","3-1"],
				["2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1"],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			],
			"XL60":[
				["4-15","4-14","4-13","4-12","4-11","4-10","4-9","4-8","4-7","4-6","4-5","4-4","4-3","4-2","4-1"],
				["3-15","3-14","3-13","3-12","3-11","3-10","3-9","3-8","3-7","3-6","3-5","3-4","3-3","3-2","3-1"],
				["2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1"],
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			]	
		},
		"STORNADO":{
			"AV15":[
				["2-16","2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1",
				"1-16","1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			]
		},
		"AV15-BASE":{
			"AV15":[
				["1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			]
		}
	}

	class ServerRow{
		constructor(row_type,y_offset,row_index,alias_style,chassis,json_values,lsdev_values){
			this.row_type = row_type;
			this.y_offset = y_offset;
			this.row_index = row_index;
			this.label_values = LABEL_TEMPLATE[alias_style][chassis][row_index];
			this.json_values = json_values;
			this.occupied = [];
			for(let i = 0; i < json_values.length && i < lsdev_values.length; i++){
				this.occupied.push(lsdev_values[i]["occupied"])
			}
		}
		show(){
			for(let i = 0; i < this.json_values.length; i++){
				if(this.json_values[i].HDD){
					if(this.occupied[i]){
						d.image(
							hdd_seagate_img,
							this.json_values[i].x,
							this.json_values[i].y + this.y_offset
						);
					}
					d.push();
					d.fill(255);
					d.textSize(11);
					d.textAlign(d.CENTER);
					d.text(this.label_values[i],this.json_values[i].x + 16, this.json_values[i].y + this.y_offset -10);
					d.pop();
				}
				else if(!this.json_values[i].HDD){
					if(this.occupied[i]){
						d.image(
							ssd_micron_img,
							this.json_values[i].x,
							this.json_values[i].y + this.y_offset
							);
					}
					d.push();
					d.fill(255);
					d.textSize(11);
					d.translate(this.json_values[i].x, this.json_values[i].y + this.y_offset);
					d.rotate(d.radians(90));
					let offset = 0;
					if (this.row_type == ROW_SSD){d.text(this.label_values[i],-45,-1);}
					else{d.text(this.label_values[i],-38,-1);}
					d.pop();
				}
			}
		}
	}

	d.preload = function(){
		chassis_img = d.loadImage("img/disk/CHASSIS.png");
		row_hdd_img = d.loadImage("img/disk/ROW_HDD.png");
		row_ssd_img = d.loadImage("img/disk/ROW_SSD.png");
		row_h16_img = d.loadImage("img/disk/ROW_H16.png");
		front_plate_img = d.loadImage("img/disk/FRONT_PLATE.png");
		ssd_micron_img = d.loadImage("img/disk/SSD_micron.png");
		hdd_seagate_img = d.loadImage("img/disk/HDD_seagate.png");
		get_server_info();
		get_drive_info();
		d.jsonLoadRowPositions();
	}

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function get_drive_info(){
		var drive_info_proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/opt/45drives/tools/lsdev",
				"-j"
			], 
			{err: "out"}
		);
		drive_info_proc.done(
				function(data){
					json_lsdev = JSON.parse(data);
					json_lsdev["rows"].reverse();
					for(let i = 0; i < json_lsdev["rows"].length; i++){
						json_lsdev["rows"][i].reverse();
					}
					//var lsdev_output = document.createElement("P");
					//lsdev_output.innerHTML = data;
					//document.getElementById("disk_info_box").appendChild(lsdev_output);
				}
			);
	}

	function get_server_info(){
		//var server_info_promise = cockpit.defer();
		// get the server_info.json file
		var server_info_proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/usr/share/cockpit/hardware/helper_scripts/server_info"
			], 
			{err: "out"}
		);
		server_info_proc.stream(
				function(data){
					server_info = JSON.parse(data);
					//server_info_promise.resolve();
				}
			);
	}

	d.jsonLoadRowPositions = function(){
	var proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/usr/share/cockpit/hardware/helper_scripts/dump_json",
				"/img/disk/ROW.json"
			], 
			{err: "out"}
	);
	proc.stream(
		function(data){
				json_row = JSON.parse(data);
			}
		);
	};

	d.setup = async function() {
		d.createCanvas(600, 900);
		d.frameRate(10);

		while(!row_hdd_img ||!row_ssd_img || !row_h16_img || !chassis_img || !front_plate_img){await sleep(300)}
		//put the p5 images for each row in the row img array
		row_img_arr.push(row_hdd_img);
		row_img_arr.push(row_ssd_img);
		row_img_arr.push(row_h16_img);
		
		//put the chassis image at the start of the server_img_arr
		//we will draw from top to bottom. the chassis is always at the top.
		server_img_arr.push(chassis_img);

		//ensure that the server_info.json file and ROW.json files have been parsed for us.
		while(!server_info || !json_row || !json_lsdev){await sleep(300)}
		if(server_info.hasOwnProperty("error_msg")){
			//we were unable to get the server_info.json file
			//TODO: PUT ERROR MESSAGE OUT TO THE USER
			console.log(server_info);
		}

		else if(server_info.hasOwnProperty("Alias Style") && server_info.hasOwnProperty("Chassis Size")){
			//We can draw the background rows based on the alias style and chassis size

			//push the relevant row image into the server_img_arr based on the index stored in the 
			//relevant ALIAS_TEMPLATE array. And create the row objects required and store them in 
			//the server_rows array.
			for(let i = 0; i < ALIAS_TEMPLATE[server_info["Alias Style"]][server_info["Chassis Size"]].length; i++){

				//calculate the y offset for the next row.
				let y_off = 0;
				for(let j = 0; j < server_img_arr.length; j++){
					y_off += server_img_arr[j].height;
				}

				//add the relevant row image to the server_imf arr
				server_img_arr.push(row_img_arr[ALIAS_TEMPLATE[server_info["Alias Style"]][server_info["Chassis Size"]][i]]);

				console.log(json_lsdev["rows"]);

				//let lsdev_row_copy = json_lsdev["rows"][i];
				//lsdev_row_copy.reverse();
				//create a new ServerRow Object.
				server_rows.push(
					new ServerRow(
						ALIAS_TEMPLATE[server_info["Alias Style"]][server_info["Chassis Size"]][i],
						y_off,
						i,
						server_info["Alias Style"],
						server_info["Chassis Size"],
						json_row[
							ROW_JSON_KEYS[
								ALIAS_TEMPLATE[server_info["Alias Style"]][server_info["Chassis Size"]][i]
							]
						],
						json_lsdev["rows"][i]
					)
				);
			}

			//Lastly, push the front plate image into the server_img_arr. Now we have the 
			//images stored in the order we need to draw them (from top to bottom), in the
			//server_img_arr. We can 
			server_img_arr.push(front_plate_img)

		}
	};

	d.draw = function() {
		d.background(255);

		// draw the server to the screen, using the images stored in
		// the server_img_arr.
		let server_y_offset = 0;
		for(let i = 0; i < server_img_arr.length; i++){
			d.image(server_img_arr[i],0,server_y_offset);
			server_y_offset += server_img_arr[i].height-1;
		}
		for(let i = 0; i < server_rows.length; i++){
			server_rows[i].show();
		}
	};
};



var moboP5;
var diskP5;

function resourceSleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function startDiskApp(){
	while(!document.getElementById("disk_app")){await resourceSleep(300);}
	document.getElementById("disk_app").innerHTML = "";
	diskP5 = new p5(disk_app, 'disk_app');
}

async function startMoboApp(){
	while(!document.getElementById("motherboard_app")){	await resourceSleep(300);}
	var timeout = 0;
	while(document.getElementById("motherboard_app").innerHTML != "" || timeout > 20){await resourceSleep(500); timeout++;}
	if(mobo_supported){	moboP5 = new p5(mobo_app, 'motherboard_app');}
}

startDiskApp();
startMoboApp();