

//disk app
var disk_app = function( d ) {

	//row images
	let chassis_img;
	let row_hdd_img;
	let row_ssd_img;
	let row_h16_img;
	let front_plate_img;

	//drive images
	let ssd_micron_img;
	let ssd_micron_5300_img;
	let ssd_seagate_img;
	let ssd_seagate_sas_img;
	let ssd_generic_img;
	let hdd_seagate_img;
	let hdd_seagate_st_img;
	let hdd_toshiba_img;
	let hdd_generic_img;
	let caddy_micron_img;
	let caddy_micron_5300_img;
	let caddy_seagate_img;
	let caddy_seagate_sas_img;
	let caddy_generic_img;
	let caddy_c8_mi4_img;
	let ssd_seagate_sas_2u_img;
	let ssd_seagate_2u_img;
	let ssd_micron_2u_img;
	let ssd_micron_5300_2u_img;
	let ssd_generic_2u_img;

	//json files
	let json_server_info;
	let json_row;
	let json_row_arr = [];
	let json_lsdev;
	let json_zfs;

	//image arrays
	let server_img_arr = [];
	let row_img_arr = [];

	//ServerRow Object arrays
	let server_rows = [];

	//Lookup Table variables
	const ROW_HDD = 0;
	const ROW_SSD = 1;
	const ROW_H16 = 2;
	const ROW_C8 = 3;
	const ROW_MI4 = 4;
	const ROW_2U_STORNADO = 5;

	//draw variables
	let drive_rect_x = 0;
	let drive_rect_y = 0;
	let drive_rect_w = 0;
	let drive_rect_h = 0;
	let draw_drive_rect = false;
	let loaded = false;
	let loading_rotation = 0;
	let alt_server = false;
	let error_state = false;
	let error_msg = "";
	let error_shown = false;

	let ROW_JSON_KEYS = ["ROW_HDD","ROW_SSD","ROW_H16","ROW_C8","ROW_MI4","ROW_2U_STORNADO"];

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
			"XL60":[ROW_HDD,ROW_HDD,ROW_HDD,ROW_HDD],
			"C8":[ROW_C8],
			"MI4":[ROW_MI4]
		},
		"STORNADO":{
			"AV15":[ROW_SSD],
			"F32":[ROW_SSD]
		},
		"2USTORNADO":{
			"2U":[ROW_2U_STORNADO]
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
			],
			"C8":[
				["1-1","1-2","1-3","1-4","2-1","2-2","2-3","2-4"],
			],
			"MI4":[
				["1-1","1-2","1-3","1-4"]
			]
		},
		"STORNADO":{
			"AV15":[
				["2-16","2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1",
				"1-16","1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			],
			"F32":[
				["2-16","2-15","2-14","2-13","2-12","2-11","2-10","2-9","2-8","2-7","2-6","2-5","2-4","2-3","2-2","2-1",
				"1-16","1-15","1-14","1-13","1-12","1-11","1-10","1-9","1-8","1-7","1-6","1-5","1-4","1-3","1-2","1-1"]
			]
		},
		"2USTORNADO":{
			"2U":[
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
		constructor(row_type,y_offset,row_index,alias_style,chassis,json_values,lsdev_values,x0,y0,w,h){
			this.row_type = row_type;
			this.y_offset = y_offset;
			this.row_index = row_index;
			this.label_values = LABEL_TEMPLATE[alias_style][chassis][row_index];
			this.json_values = json_values;
			this.occupied = [];
			this.drive_img_arr = [];
			this.lsdev_values = lsdev_values;
			this.alias_style = alias_style;
			this.x0 = x0;
			this.y0 = y0;
			this.w = w;
			this.h = h;
			let drive_img = null;
			for(let i = 0; i < json_values.length && i < lsdev_values.length; i++){
				this.occupied.push(lsdev_values[i]["occupied"])
				drive_img = null;
				if(this.json_values[i].HDD){
					// HDD Sized slot
					if(this.occupied[i]){
						// There is a drive in this slot
						if(this.lsdev_values[i]["rotation-rate"] != 0){
							//hard drive in slot
							if(/ST18000|ST16000|ST20000|ST14000|ST12000/.test(this.lsdev_values[i]["model-name"])){
								//console.log(this.lsdev_values[i]["model-name"],/ST18000|ST16000|ST20000|ST14000|ST12000/.test(this.lsdev_values[i]["model-name"]));
								drive_img = hdd_seagate_st_img;
							}
							else if(/Seagate Enterprise/.test(this.lsdev_values[i]["model-family"])){
								drive_img = hdd_seagate_img;
							}
							else if(/TOSHIBA/.test(this.lsdev_values[i]["model-name"])){
								drive_img = hdd_toshiba_img;
							}
							else{
								drive_img = hdd_generic_img;
							}
						}
						else{
							//ssd in slot
							if(/Seagate Nytro/.test(this.lsdev_values[i]["model-family"])){
								drive_img = caddy_seagate_img;
							}
							else if(/SEAGATE XS400LE10003/.test(this.lsdev_values[i]["model-name"])){
								drive_img = caddy_seagate_sas_img;
							}
							else if(/Micron_5100_|Mircon_5200_/.test(this.lsdev_values[i]["model-name"])){
								drive_img = caddy_micron_img;
							}
							else if(/Micron_5300_/.test(this.lsdev_values[i]["model-name"])){
								drive_img = caddy_micron_5300_img;
							}
							else{
								drive_img = caddy_generic_img;
							}
						}
					}
				}
				else if(this.json_values[i].SSD && alias_style == "2USTORNADO"){
					//SSD sized slot
					if(this.occupied[i]){
						// There is a drive in this slot
						if(/Seagate Nytro/.test(this.lsdev_values[i]["model-family"])){
							drive_img = ssd_seagate_2u_img;
						}
						else if(/SEAGATE XS400LE10003/.test(this.lsdev_values[i]["model-name"])){
							drive_img = ssd_seagate_sas_2u_img;
						}
						else if(/Micron_5100_|Micron_5200_/.test(this.lsdev_values[i]["model-name"])){
							drive_img = ssd_micron_2u_img;
						}
						else if(/Micron_5300_/.test(this.lsdev_values[i]["model-name"])){
							drive_img = ssd_micron_5300_2u_img;
						}
						else{
							drive_img = ssd_generic_2u_img;
						}
					}
				}
				else if(this.json_values[i].SSD){
					//SSD sized slot
					if(this.occupied[i]){
						// There is a drive in this slot
						if(/SEAGATE XS400LE10003/.test(this.lsdev_values[i]["model-name"])){
							drive_img = ssd_seagate_sas_img;
						}
						else if(/Seagate Nytro/.test(this.lsdev_values[i]["model-family"])){
							drive_img = ssd_seagate_img;
						}
						else if(/Micron_5100_|Micron_5200_/.test(this.lsdev_values[i]["model-name"])){
							drive_img = ssd_micron_img;
						}
						else if(/Micron_5300_/.test(this.lsdev_values[i]["model-name"])){
							drive_img = ssd_micron_5300_img;
						}
						else{
							drive_img = ssd_generic_img;
						}
					}
				}
				else if(this.json_values[i].CADDY){
					//this slot is a caddy slot, (C8 or MI4 servers)
					drive_img = caddy_c8_mi4_img;
				}
				//push the required drive image onto the drive image array.
				this.drive_img_arr.push(drive_img);
			}
		}

		show(){
			for(let i = 0; i < this.json_values.length; i++){
				if(this.json_values[i].HDD){
					// HDD Sized slot
					d.push();
					d.fill(255);
					try {d.textFont(monospace_font,11);}catch(err) {/*console.log("textFont failed for HDD");*/}
					try {d.textAlign(d.CENTER);}catch(err){/*console.log("textAlign failed for HDD");*/}
					d.text(this.label_values[i],this.json_values[i].x + 16, this.json_values[i].y + this.y_offset -10);
					d.pop();
				}
				else if(this.json_values[i].SSD && this.alias_style != "2USTORNADO"){
					//SSD sized slot
					d.push();
					d.fill(255);
					try{d.textFont(monospace_font,11);}catch(err) {/*console.log("textFont failed for SSD");*/}
					d.translate(this.json_values[i].x, this.json_values[i].y + this.y_offset);
					d.rotate(d.radians(90));
					//let offset = 0;
					if (this.row_type == ROW_SSD){d.text(this.label_values[i],-45,-1);}
					else{d.text(this.label_values[i],-38,-1);}
					d.pop();
				}

				if(this.occupied[i] && this.drive_img_arr[i] != null){
					// There is a drive in this slot, draw the image to the screen.
					d.image(
						this.drive_img_arr[i],
						this.json_values[i].x,
						this.json_values[i].y + this.y_offset
					);
				}
			}
		}

		async updateDiskInfo(drive_idx){
			document.getElementById("disk_fields").classList.remove("hidden");
			document.getElementById("disk_fields_loading_content").classList.add("hidden");
			document.getElementById("zfs_fields_loading_content").classList.add("hidden");
			document.getElementById("bay-id").innerHTML = (this.lsdev_values[drive_idx]["bay-id"] != "" ? this.lsdev_values[drive_idx]["bay-id"] : "(unavailable)");
			document.getElementById("dev").innerHTML = (this.lsdev_values[drive_idx]["dev"] != "" ? this.lsdev_values[drive_idx]["dev"] : "(unavailable)");
			document.getElementById("capacity").innerHTML = (this.lsdev_values[drive_idx]["capacity"] != "" ? this.lsdev_values[drive_idx]["capacity"] : "(unavailable)");
			document.getElementById("partitions").innerHTML = (this.lsdev_values[drive_idx]["partitions"] != "" ? this.lsdev_values[drive_idx]["partitions"] : "None");
			document.getElementById("health").innerHTML = (this.lsdev_values[drive_idx]["health"] != "" ? this.lsdev_values[drive_idx]["health"] : "(unavailable)");
			document.getElementById("temp-c").innerHTML = ((this.lsdev_values[drive_idx]["temp-c"] != "?" && this.lsdev_values[drive_idx]["temp-c"] != "") ? this.lsdev_values[drive_idx]["temp-c"] : "(unavailable)");
			document.getElementById("power-on-time").innerHTML = (this.lsdev_values[drive_idx]["power-on-time"] != "" ? this.lsdev_values[drive_idx]["power-on-time"] : "(unavailable)");
			document.getElementById("model-family").innerHTML = (this.lsdev_values[drive_idx]["model-family"] != "?" ? this.lsdev_values[drive_idx]["model-family"] : "(unavailable)");
			document.getElementById("model-name").innerHTML = (this.lsdev_values[drive_idx]["model-name"] != "" ? this.lsdev_values[drive_idx]["model-name"] : "(unavailable)");
			document.getElementById("serial").innerHTML = (this.lsdev_values[drive_idx]["serial"] != "" ? this.lsdev_values[drive_idx]["serial"] : "(unavailable)");
			document.getElementById("firm-ver").innerHTML = ((this.lsdev_values[drive_idx]["firm-ver"] != "?" && this.lsdev_values[drive_idx]["firm-ver"] != "") ? this.lsdev_values[drive_idx]["firm-ver"] : "(unavailable)"); 
			document.getElementById("rotation-rate").innerHTML = this.lsdev_values[drive_idx]["rotation-rate"];
			document.getElementById("start-stop-count").innerHTML = ((this.lsdev_values[drive_idx]["start-stop-count"] != "?" && this.lsdev_values[drive_idx]["start-stop-count"] != "") ? this.lsdev_values[drive_idx]["start-stop-count"] : "(unavailable)");
			document.getElementById("power-cycle-count").innerHTML = ((this.lsdev_values[drive_idx]["power-cycle-count"] != "?" && this.lsdev_values[drive_idx]["power-cycle-count"] != "") ? this.lsdev_values[drive_idx]["power-cycle-count"] : "(unavailable)");
			document.getElementById("current-pending-sector").innerHTML = ((this.lsdev_values[drive_idx]["current-pending-sector"] != "?" && this.lsdev_values[drive_idx]["current-pending-sector"] != "") ? this.lsdev_values[drive_idx]["current-pending-sector"] : "(unavailable)");
			document.getElementById("offline-uncorrectable").innerHTML = ((this.lsdev_values[drive_idx]["offline-uncorrectable"] != "?" && this.lsdev_values[drive_idx]["offline-uncorrectable"] != "") ? this.lsdev_values[drive_idx]["offline-uncorrectable"] : "(unavailable)");
			var health = document.getElementById("health");
			if(health.innerHTML == "OK") {
				health.style.color = "#19911d";
			}else if(health.innerHTML == "POOR") {
				health.style.color = "#e39500";
			}else{
				health.style.color = "";
			}

			if(json_zfs["zfs_installed"]){
				if(json_zfs.hasOwnProperty("zfs_disks")){
					if(json_zfs["zfs_disks"].hasOwnProperty(this.lsdev_values[drive_idx]["bay-id"])){
						document.getElementById("zfs-data").classList.remove("hidden");
						document.getElementById("zfs_fields_loading_content").classList.add("hidden");
						document.getElementById("zpool_name").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["zpool_name"];
						document.getElementById("zpool_used").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["zpool_used"];
						document.getElementById("zpool_avail").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["zpool_avail"];
						document.getElementById("zpool_mountpoint").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["zpool_mountpoint"];
						document.getElementById("zpool_state").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["zpool_state"];
						document.getElementById("vdev_raid_level").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["vdev_raid_level"];
						document.getElementById("read_ops").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["read_ops"];
						document.getElementById("write_ops").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["write_ops"];
						document.getElementById("read_bw").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["read_bw"];
						document.getElementById("write_bw").innerHTML=json_zfs["zfs_disks"][this.lsdev_values[drive_idx]["bay-id"]]["write_bw"];
						let state = document.getElementById("zpool_state");
						if (state.innerHTML == "ONLINE"){
							state.style.color = "#19911d";
						}else{
							// zpool is not online, make it red.
							state.style.color = "#e39500";
						}
					}
					else{
						let msg = document.getElementById("zfs_fields_loading_content");
						msg.innerHTML = "Selected Disk (" + this.lsdev_values[drive_idx]["bay-id"] +") is not a member of a zfs pool";
						msg.classList.remove("hidden");
						document.getElementById("zfs-data").classList.add("hidden");
					}
				}
			}
		}
	}

	d.preload = function(){
		// row images
		chassis_img = d.loadImage("img/disk/CHASSIS.png");
		row_hdd_img = d.loadImage("img/disk/ROW_HDD.png");
		row_ssd_img = d.loadImage("img/disk/ROW_SSD.png");
		row_h16_img = d.loadImage("img/disk/ROW_H16.png");
		front_plate_img = d.loadImage("img/disk/FRONT_PLATE.png");

		// c8 & mi4 images
		c8_chassis_img = d.loadImage("img/disk/C8_CHASSIS.png");
		mi4_chassis_img = d.loadImage("img/disk/MI4_CHASSIS.png");

		//2u stornado image
		stornado_2u_img = d.loadImage("img/disk/2U_STORNADO_CHASSIS.png");
		
		//drive images
		ssd_micron_img = d.loadImage("img/disk/SSD_micron.png");
		ssd_micron_5300_img = d.loadImage("img/disk/SSD_micron_5300.png");
		ssd_seagate_img = d.loadImage("img/disk/SSD_seagate.png");
		ssd_seagate_sas_img = d.loadImage("img/disk/SSD_seagate_sas.png");
		ssd_generic_img = d.loadImage("img/disk/SSD_generic.png");

		ssd_micron_2u_img = d.loadImage("img/disk/SSD_micron_2u.png");
		ssd_micron_5300_2u_img = d.loadImage("img/disk/SSD_micron_5300_2u.png");
		ssd_seagate_2u_img = d.loadImage("img/disk/SSD_seagate_2u.png");
		ssd_generic_2u_img = d.loadImage("img/disk/SSD_generic_2u.png");
		ssd_seagate_sas_2u_img = d.loadImage("img/disk/SSD_seagate_sas_2u.png");

		hdd_seagate_img = d.loadImage("img/disk/HDD_seagate.png");
		hdd_seagate_st_img = d.loadImage("img/disk/HDD_seagate_ST.png");
		hdd_toshiba_img = d.loadImage("img/disk/HDD_toshiba.png");
		hdd_generic_img = d.loadImage("img/disk/HDD_generic.png");

		caddy_micron_img = d.loadImage("img/disk/CADDY_micron.png");
		caddy_micron_5300_img = d.loadImage("img/disk/CADDY_micron_5300.png");
		caddy_seagate_img = d.loadImage("img/disk/CADDY_seagate.png");
		caddy_seagate_sas_img = d.loadImage("img/disk/CADDY_seagate_sas.png");
		caddy_generic_img = d.loadImage("img/disk/CADDY_generic.png");

		caddy_c8_mi4_img = d.loadImage("img/disk/CADDY_c8_mi4.png");

		monospace_font = d.loadFont("fonts/RobotoMono-Regular.ttf");

		get_server_info();
		get_drive_info();
		get_zfs_info();
		d.jsonLoadRowPositions();
	}

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	function get_drive_info(){
		var drive_info_proc = cockpit.spawn(
			[
				"/opt/45drives/tools/lsdev",
				"-j"
			], 
			{err: "out", superuser: "require"}
		);
		drive_info_proc.done(
				function(data){
					json_lsdev = JSON.parse(data);
					json_lsdev["rows"].reverse();
					for(let i = 0; i < json_lsdev["rows"].length; i++){
						json_lsdev["rows"][i].reverse();
					}
					let controller = document.getElementById("controller");
					let driver_vers = document.getElementById("driver-vers");
					if(controller && driver_vers){
						controller.innerHTML = json_lsdev["meta"]["disk-controller"];
						driver_vers.innerHTML = json_lsdev["meta"]["driver-version"];
					}
					console.log("JSON_LSDEV");
					console.log(json_lsdev);
				}
		);

		drive_info_proc.fail(
			function(ex,data){
				let disk_info_box = document.getElementById("disk_info_box");
				if(disk_info_box){disk_info_box.classList.add("hidden")};
				if (confirm("Disks requires a valid drive map.\n Would you like to run dmap?")) {
						var dmap_proc = cockpit.spawn(
							[
								"/opt/45drives/tools/dmap"
							], 
							{err: "out", superuser: "require"}
						);
						dmap_proc.done(
							function(data){
								alert("dmap completed successfully.");
								error_state = false;
								let disk_info_box_post = document.getElementById("disk_info_box");
								if(disk_info_box_post){disk_info_box_post.classList.remove("hidden")};
								json_server_info = null;
								get_drive_info();
								get_server_info();

							}
						);
						dmap_proc.fail(
							function(ex,data){
								alert("ERROR: dmap failed!\n" + data)
								error_state = true;
								error_msg = "ERROR: dmap was unsuccessful.";
							}
						);
				}else{
					error_state = true;
					error_msg = "Error Running lsdev: \n\nlsdev message: " + data;
				}
			}
		);
	}

	function get_server_info(){
		// get the server_info.json file
		var server_info_proc = cockpit.spawn(
			[
				"/usr/share/cockpit/45drives-disks/helper_scripts/server_info"
			], 
			{err: "out", superuser: "require"}
		);
		server_info_proc.stream(
				function(data){
					json_server_info = JSON.parse(data);
					console.log("JSON_SERVER_INFO");
					console.log(json_server_info);
					if(json_server_info.hasOwnProperty("error_msg")){
						alert("Error: " + json_server_info["error_msg"]);
						json_server_info = null;
					}
				}
			);
	}

	function get_zfs_info(){
		var drive_info_proc = cockpit.spawn(
			[
				"/usr/share/cockpit/45drives-disks/helper_scripts/zfs_info"
			], 
			{err: "out", superuser: "require"}
		);
		drive_info_proc.done(
				function(data){
					json_zfs = JSON.parse(data);
					if(json_zfs.hasOwnProperty("zfs_installed")){
						if(json_zfs["zfs_installed"]){
							//server has zfs installed on it. show zfs-info-window
							document.getElementById("zfs-info-window").classList.remove("hidden");
						} 
					}
					console.log("JSON_ZFS");
					console.log(json_zfs);
				}
			);
	}

	d.jsonLoadRowPositions = function(){
	var proc = cockpit.spawn(
			[
				"/usr/share/cockpit/45drives-disks/helper_scripts/dump_json",
				"/img/disk/ROW.json"
			], 
			{err: "out", superuser: "require"}
	);
	proc.done(
		function(data){
				console.log("DEBUG: ",data);
				json_row = JSON.parse(data);
				console.log("JSON_ROW");
				console.log(json_row);
			}
		);
	};

	function assetsLoaded(){
		return (
			chassis_img &&
			row_hdd_img &&
			row_ssd_img &&
			row_h16_img &&
			front_plate_img &&
			ssd_micron_img &&
			ssd_seagate_img &&
			ssd_seagate_sas_img &&
			ssd_generic_img &&
			hdd_seagate_img &&
			hdd_seagate_st_img &&
			hdd_toshiba_img &&
			hdd_generic_img &&
			caddy_micron_img &&
			caddy_micron_5300_img &&
			caddy_seagate_img &&
			caddy_seagate_sas_img &&
			caddy_generic_img &&
			c8_chassis_img &&
			mi4_chassis_img &&
			stornado_2u_img &&
			ssd_seagate_sas_2u_img &&
			ssd_seagate_2u_img &&
			ssd_micron_2u_img &&
			ssd_generic_2u_img
		);
	}

	function jsonLoaded(){
		return (
			json_server_info &&
			json_row &&
			json_lsdev &&
			json_zfs
		);
	}

	function showError(){
		if (!error_shown){
			let disk_info_box_post = document.getElementById("disk_info_box");
			if(disk_info_box_post){disk_info_box_post.classList.add("hidden")};
		}
			d.push();
			d.stroke(200,30,30);
			d.fill(200,30,30);
			try{
				d.textAlign(d.LEFT);
				d.textFont(monospace_font);
				d.textSize(14);
				d.text(error_msg,50,50);
			}catch(err) {}
			d.pop();
	}

	d.setup = async function() {
		dcnv = d.createCanvas(570, 900);
		dcnv.mousePressed(d.mouseWasClicked);
		d.frameRate(30);

		while(!assetsLoaded()){await sleep(300)}

		//put the p5 images for each row in the row img array
		row_img_arr.push(row_hdd_img);
		row_img_arr.push(row_ssd_img);
		row_img_arr.push(row_h16_img);
		row_img_arr.push(c8_chassis_img);
		row_img_arr.push(mi4_chassis_img);
		row_img_arr.push(stornado_2u_img);

		//ensure that the /etc/45drives/server_info/server_info.json file 
		//and /usr/share/cockpit/hardware/img/disk/ROW.json files have been parsed for us.
		while(!jsonLoaded()){await sleep(300)}
		if(json_server_info.hasOwnProperty("Alias Style") && json_server_info.hasOwnProperty("Chassis Size")){
			//We can draw the background rows based on the alias style and chassis size

			if(json_server_info["Chassis Size"] != "MI4" && json_server_info["Chassis Size"] != "C8" && json_server_info["Chassis Size"] != "2U"){
				// We have a top down server view to display.

				//put the chassis image at the start of the server_img_arr
				//we will draw from top to bottom. the chassis is always at the top.
				server_img_arr.push(chassis_img);

				//push the relevant row image into the server_img_arr based on the index stored in the 
				//relevant ALIAS_TEMPLATE array. And create the row objects required and store them in 
				//the server_rows array.
				for(let i = 0; i < ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]].length; i++){

					//calculate the y offset for the next row.
					let y_off = 0;
					for(let j = 0; j < server_img_arr.length; j++){
						y_off += server_img_arr[j].height;
					}

					//add the relevant row image to the server_imf arr
					server_img_arr.push(row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]]);

					console.log(server_img_arr.length);
					console.log(server_rows);
					//create a new ServerRow Object.
					server_rows.push(
						new ServerRow(
							ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i],
							y_off,
							i,
							json_server_info["Alias Style"],
							json_server_info["Chassis Size"],
							json_row[
								ROW_JSON_KEYS[
									ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]
								]
							],
							json_lsdev["rows"][i],
							0,
							y_off,
							row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]].width,
							row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]].height
						)
					);
				}

				//Lastly, push the front plate image into the server_img_arr. Now we have the 
				//images stored in the order we need to draw them (from top to bottom), in the
				//server_img_arr. We can 
				server_img_arr.push(front_plate_img);
			}
			else if(json_server_info["Chassis Size"] == "C8"){
				//adjust the page layout to accomodate the different form factor
				//of the server.
				d.resizeCanvas(c8_chassis_img.width,c8_chassis_img.height);
				let disk_content_div = document.getElementById("disk_output");
				disk_content_div.style.flexDirection = "column";
				let disk_info_box_div = document.getElementById("disk_info_box");
				disk_info_box.style.display = "flex";
				disk_info_box.style.width = "1141px";
				let disk_info_window = document.getElementById("disk-info-window");
				disk_info_window.style.flexGrow = 1;
				let zfs_info_window = document.getElementById("zfs-info-window");
				zfs_info_window.style.flexGrow = 1;
				zfs_info_window.style.marginBottom = "inherit";

				//Flip json back around for this server.
				//The order is 1-1, 1-2, 1-3, 1-4, 2-1, 2-2, 2-3, 2-4
				json_lsdev["rows"].reverse();
				for(let i = 0; i < json_lsdev["rows"].length; i++){
					json_lsdev["rows"][i].reverse();
				}
				
				let json_lsdev_second_row = json_lsdev["rows"].pop();
				let second_row_length = json_lsdev_second_row.length;
				for(let i = 0; i < second_row_length; i++){
					json_lsdev["rows"][0].push(json_lsdev_second_row.shift());
				}

				//create the c8 server row objects.
				for(let i = 0; i < ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]].length; i++){

					//add the relevant row image to the server_img arr
					server_img_arr.push(row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]]);

					console.log(server_img_arr.length);
					console.log(server_rows);
					//create a new ServerRow Object.
					server_rows.push(
						new ServerRow(
							ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i],
							0,
							i,
							json_server_info["Alias Style"],
							json_server_info["Chassis Size"],
							json_row[
								ROW_JSON_KEYS[
									ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]
								]
							],
							json_lsdev["rows"][i],
							0,
							0,
							row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]].width,
							row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]].height
						)
					);
				}
				// this is a flag for draw to ket it know that it can start drawing the server. 
				alt_server = true;
			}
			else if(json_server_info["Chassis Size"] == "MI4"){
				//adjust the page layout to accomodate the different form factor
				//of the server.
				d.resizeCanvas(mi4_chassis_img.width,mi4_chassis_img.height);
				let disk_content_div = document.getElementById("disk_output");
				disk_content_div.style.flexDirection = "column";
				let disk_info_box_div = document.getElementById("disk_info_box");
				disk_info_box.style.display = "flex";
				disk_info_box.style.width = "1141px";
				let disk_info_window = document.getElementById("disk-info-window");
				disk_info_window.style.flexGrow = 1;
				let zfs_info_window = document.getElementById("zfs-info-window");
				zfs_info_window.style.flexGrow = 1;
				zfs_info_window.style.marginBottom = "inherit";

				//Flip json back around for this server.
				//The order is 1-1, 1-2, 1-3, 1-4
				json_lsdev["rows"].reverse();
				for(let i = 0; i < json_lsdev["rows"].length; i++){
					json_lsdev["rows"][i].reverse();
				}
				//create the c8 server row objects.
				for(let i = 0; i < ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]].length; i++){

					//add the relevant row image to the server_img arr
					server_img_arr.push(row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]]);

					console.log(server_img_arr.length);
					console.log(server_rows);
					//create a new ServerRow Object.
					server_rows.push(
						new ServerRow(
							ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i],
							0,
							i,
							json_server_info["Alias Style"],
							json_server_info["Chassis Size"],
							json_row[
								ROW_JSON_KEYS[
									ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]
								]
							],
							json_lsdev["rows"][i],
							0,
							0,
							row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]].width,
							row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]].height
						)
					);
				}
				// this is a flag for draw to ket it know that it can start drawing the server. 
				alt_server = true;
			}
			else if(json_server_info["Chassis Size"] == "2U"){
				//adjust the page layout to accomodate the different form factor
				//of the server.
				d.resizeCanvas(stornado_2u_img.width,stornado_2u_img.height);
				let disk_content_div = document.getElementById("disk_output");
				disk_content_div.style.flexDirection = "column";
				let disk_info_box_div = document.getElementById("disk_info_box");
				disk_info_box.style.display = "flex";
				disk_info_box.style.width = "1178px";
				let disk_info_window = document.getElementById("disk-info-window");
				disk_info_window.style.flexGrow = 1;
				let zfs_info_window = document.getElementById("zfs-info-window");
				zfs_info_window.style.flexGrow = 1;
				zfs_info_window.style.marginBottom = "inherit";

				//Flip json back around for this server.
				//The order is 1-1, 1-2, 1-3, 1-4
				json_lsdev["rows"].reverse();
				for(let i = 0; i < json_lsdev["rows"].length; i++){
					json_lsdev["rows"][i].reverse();
				}
				//create the c8 server row objects.
				for(let i = 0; i < ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]].length; i++){

					//add the relevant row image to the server_img arr
					server_img_arr.push(row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]]);

					console.log(server_img_arr.length);
					console.log(server_rows);
					//create a new ServerRow Object.
					server_rows.push(
						new ServerRow(
							ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i],
							0,
							i,
							json_server_info["Alias Style"],
							json_server_info["Chassis Size"],
							json_row[
								ROW_JSON_KEYS[
									ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]
								]
							],
							json_lsdev["rows"][i],
							0,
							0,
							row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]].width,
							row_img_arr[ALIAS_TEMPLATE[json_server_info["Alias Style"]][json_server_info["Chassis Size"]][i]].height
						)
					);
				}
				// this is a flag for draw to ket it know that it can start drawing the server. 
				alt_server = true;
			}
			else{
					alert("Unrecognized hardware configuration detected. \nDisks module needs recognizable 45drives hardware to operate properly");
					error_state = true;
			}
		}
		else{
			alert("Unrecognized hardware configuration detected. \nDisks module needs recognizable 45drives hardware to operate properly");
			error_state = true;
		}
	};

	d.draw = function() {
		d.background(255);

		// draw the server to the screen, using the images stored in
		// the server_img_arr.
		if(loaded){
			let server_y_offset = 0;
			for(let i = 0; i < server_img_arr.length; i++){
				d.image(server_img_arr[i],0,server_y_offset);
				server_y_offset += server_img_arr[i].height-1;
			}
			for(let i = 0; i < server_rows.length; i++){
				server_rows[i].show();
			}
		}
		else if (server_img_arr.length > 2 || alt_server){
			loaded = true;
			document.getElementById("disk_fields_loading_content").innerHTML = "Click on a disk to display more information.";
			document.getElementById("zfs_fields_loading_content").innerHTML = "Click on a disk to display more information.";
		}
		else if (error_state){
			showError();
		}
		else{
			d.push();
			loading_rotation += 0.1;
			d.translate(d.width / 2, d.height / 4);
			try{
				d.textAlign(d.CENTER);
				d.textFont(monospace_font);
				d.textSize(16);
				d.text("Loading Please Wait",0,-100);
			}catch(err) {}
			d.rotate(loading_rotation);
			d.noStroke();
			d.fill("#f3f3f3");
			d.circle(0,0,100);
			d.fill("#981C20");
			d.arc(0,0,100,100,0,d.HALF_PI);
			d.fill(255);
			d.circle(0,0,93);
			d.pop();
		}

		if(draw_drive_rect){
			d.push();
			d.fill(255,255,255,50);
			d.stroke(206, 242, 212);
			d.strokeWeight(2);
			d.rect(drive_rect_x,drive_rect_y,drive_rect_w,drive_rect_h);
			d.pop();
		}
	};

	d.mouseWasClicked = function(){
		for(let i = 0; i < server_rows.length; i++){
			if(d.mouseX > server_rows[i].x0 && d.mouseX < server_rows[i].x0 + server_rows[i].w &&
				d.mouseY > server_rows[i].y0 && d.mouseY < server_rows[i].y0 + server_rows[i].h){
				// the mouse click was inside this particular row.
				for(let j = 0; j < server_rows[i].occupied.length; j++){
					if(server_rows[i].occupied[j] == true && server_rows[i].drive_img_arr[j] != null){
						//there is a drive here, see if it was the drive 
						//that was clicked on.
						if(d.mouseX > server_rows[i].x0 + server_rows[i].json_values[j].x && 
							d.mouseX < server_rows[i].x0 + server_rows[i].json_values[j].x + server_rows[i].drive_img_arr[j].width &&
							d.mouseY > server_rows[i].y0 + server_rows[i].json_values[j].y && 
							d.mouseY < server_rows[i].y0 + server_rows[i].json_values[j].y + server_rows[i].drive_img_arr[j].height){
							// This was the drive that was clicked on. 
							// update the drive info.
							server_rows[i].updateDiskInfo(j);
							drive_rect_x = server_rows[i].x0 + server_rows[i].json_values[j].x;
							drive_rect_y = server_rows[i].y0 + server_rows[i].json_values[j].y;
							drive_rect_w = server_rows[i].drive_img_arr[j].width;
							drive_rect_h = server_rows[i].drive_img_arr[j].height;
							draw_drive_rect = true;
							break;
						}
					}
				}
				break;
			}
		}
		return false;
	};
};

var diskP5;
let dcnv;
let monospace_font;

function resourceSleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function startDiskApp(){
	while(!document.getElementById("disk_app")){await resourceSleep(300);}
	let root_check = cockpit.permission({ admin: true });
	root_check.addEventListener(
		"changed", 
		function() {
			if(root_check.allowed){
				//user is an administrator, start the module as normal
				document.getElementById("disk_app").innerHTML = "";
				diskP5 = new p5(disk_app, 'disk_app');
			}else{
				//user is not an administrator, replace the page content with message
				let page_content = document.getElementById("disk_content");
				page_content.innerHTML = "";
				let user_msg = document.createElement("div");
				user_msg.className = "content_block_msg";
				user_msg.innerHTML = "You must be an administrator to use this feature.";
				page_content.appendChild(user_msg);
			}
	 	}
	)

}

startDiskApp();