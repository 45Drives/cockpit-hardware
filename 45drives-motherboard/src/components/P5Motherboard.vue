<template>
	<div id="motherboard_app" class="flex flex-col items-center"></div>
</template>

<script>
import { onMounted, inject, ref, watch } from "vue";
import P5 from "p5";
import resizeHook from "./resizeHook.js";

export default {
	name: "P5Motherboard",
	setup() {
		const mobo_info = inject("mobo_info");
		const pci_info = inject("pci_info");
		const ram_info = inject("ram_info");
		const sata_info = inject("sata_info");
		const network_info = inject("network_info");
		const server_info = inject("server_info");
		const darkMode = inject("darkModeInjectionKey");
		const bg_color = darkMode.value ? ref("#171717") : ref("#e5e5e5");
		const text_color = darkMode.value ? ref("#f3f4f6") : ref("#111827");

		watch(darkMode, (newDarkMode) => {
			bg_color.value = newDarkMode ? "#171717" : "#e5e5e5";
			text_color.value = newDarkMode ? "#f3f4f6" : "#111827";
		});

		const mobo_app = function (m) {
			// steps:
			// - load the background image
			// - load the .json file
			// - create components (including their masks)
			// - gather component specific info
			// - draw populated slots


			const translatedMoboNameExceptions = {
				"B550I AORUS PRO AX": "B550I_AORUS_PRO_AX",
				"EC266D2I-2T/AQC": "EC266D2I-2T_AQC",
				"ROMED8-2T/BCM" : "ROMED8-2T",
				"ProArt X870E-CREATOR WIFI": "ProArt_X870E-CREATOR_WIFI"
			};

			const raw_mobo_name = String(
				mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]
			);

			const chassis_size = server_info["Chassis Size"];

			// Append Chassis Size directly to the translated motherboard name if HL4 or HL8, otherwise use translated name
			// or if not in exceptions dict then use raw name
			const mobo_name = raw_mobo_name in translatedMoboNameExceptions
				? (chassis_size === 'HL4' || chassis_size === 'HL8' 
					? `${translatedMoboNameExceptions[raw_mobo_name]}_${chassis_size}`
					: translatedMoboNameExceptions[raw_mobo_name])
				: raw_mobo_name;
			let bgImgPath = `img/motherboard/${String(mobo_name)}/${String(mobo_name)}.png`;

			let background_img;

			let mobo_json;
			let components = [];

			let STATE = 0;
			let READY = false;
			let POPUP_ACTIVE = false;
			let POPUP_IDX = 0;

			let MASK_ARR = [];
			let MASK_COUNT = 0;

			let peripheralImages = [];
			let peripherals = [];

			let pciScale = 0.02;

			let globalMask;
			let APPLIED_COUNT = 0;

			const mobo_json_path = `img/motherboard/${mobo_name}/${mobo_name}.json`;

			m.createComponentMasks = function (a) {
				const img_path = `img/motherboard/${String(mobo_name)}/${mobo_json[a]["filename"]}`;
				MASK_ARR.push(m.loadImage(img_path));
			};

			class component {
				constructor(x0, y0, width, height, id, type, popup) {
					this.x0 = x0;
					this.y0 = y0;
					this.width = width;
					this.height = height;
					this.id = id;
					this.type = type;
					this.popup = popup;
				}
			}

			class popup_window {
				constructor(
					x0,
					y0,
					width,
					height,
					content,
					border = "#000000",
					fill = "#FFFFFF"
				) {
					this.height = height;
					this.width = width;
					this.content = content;
					this.border = border;
					this.fill = fill;
					this.x0 = x0;
					this.y0 = y0;
				}
				show() {
					m.push();
					m.fill(this.fill);
					m.stroke(this.border);
					m.strokeWeight(2);
					m.rect(this.x0, this.y0, this.width, this.height, 10, 10);
					m.noStroke();
					try {
						m.textSize(14);
					} catch (err) { }
					m.fill(0);
					try {
						try {
							m.textFont("Courier New");
						} catch (err) { }
					} catch (err) { }
					try {
						m.text(this.content, this.x0 + 9, this.y0 + 20);
					} catch (err) { }
					m.pop();
				}
			}

			m.verifyAssetsLoaded = function () {
				let ret_val = true;
				if (!background_img) {
					ret_val = false;
				}
				return ret_val;
			};

			m.setup = function () {
				let cnv = m.createCanvas(1024, 1024);
				m.canvas_id = cnv.id();
				cnv.mouseMoved(m.mouseActivity);
				m.frameRate(20);
			};

			m.draw = function () {
				if (READY) {
					m.background(bg_color.value);
					m.image(background_img, 0, 0);
					for (let i = 0; i < peripherals.length; i++) {
						peripherals[i].show();
					}
					if (POPUP_ACTIVE) {
						m.push();
						m.image(MASK_ARR[POPUP_IDX], 0, 0);
						m.pop();
						components[POPUP_IDX].popup.show();
					}
				} else if (STATE == 0) {
					m.background(bg_color.value);
					try {
						m.textFont("Courier New");
					} catch (err) { }
					try {
						m.push();
						m.noStroke();
						m.fill(text_color.value);
						m.text("Loading Motherboard Info ... Please Wait.", 40, 40);
						m.pop();
					} catch (err) { }
					m.loadAssets();
					STATE = 1;
				} else if (STATE == 1) {
					m.background(bg_color.value);
					try {
						m.textFont("Courier New");
					} catch (err) { }
					try {
						m.push();
						m.noStroke();
						m.fill(text_color.value);
						m.text("Loading Motherboard Assets ... Please Wait.", 40, 40);
						m.pop();
					} catch (err) { }
					if (m.verifyAssetsLoaded()) {
						STATE = 2;
					}
				} else if (STATE == 2) {
					m.background(bg_color.value);
					try {
						m.textFont("Courier New");
					} catch (err) { }
					try {
						m.push();
						m.noStroke();
						m.fill(text_color.value);
						m.text("Generating Masks ... Please Wait.", 40, 40);
						m.pop();
					} catch (err) { }
					if (components.length > 0) {
						m.createComponentMasks(MASK_COUNT);
						MASK_COUNT++;
						let myStr =
							"Mask: " +
							String(MASK_COUNT) +
							" of " +
							String(components.length);
						try {
							m.textFont("Courier New");
						} catch (err) { }
						try {
							m.push();
							m.noStroke();
							m.fill(text_color.value);
							m.text(myStr, 40, 70);
							m.pop();
						} catch (err) { }
					}
					if (MASK_ARR.length == components.length && MASK_ARR.length != 0) {
						STATE = 3;
						m.background(bg_color.value);
						try {
							m.textFont("Courier New");
						} catch (err) { }
						try {
							m.push();
							m.noStroke();
							m.fill(text_color.value);
							m.text(
								"Creating graphics for supported PCI cards ... Please Wait.",
								40,
								40
							);
							m.pop();
						} catch (err) { }
					}
				} else if (STATE == 3) {
					m.populateSlots();
					m.setGlobalMask();
					STATE = 4;
				} else if (STATE == 4) {
					if (APPLIED_COUNT < components.length) {
						MASK_ARR[APPLIED_COUNT].mask(globalMask);
						APPLIED_COUNT++;
					} else {
						READY = true;
					}
				}
			};

			m.setGlobalMask = function () {
				let inset = 30;
				let yTrim = 30;
				globalMask = m.generateMask(
					background_img.width,
					background_img.height,
					inset,
					inset + yTrim,
					background_img.width - 2 * inset,
					background_img.height - (2 * inset + yTrim),
					true
				);
			};

			class peripheral {
				constructor(pType, x0, y0, width, height, fill, img_idx, wScale = 1.0) {
					this.pType = pType;
					this.x0 = x0;
					this.y0 = y0;
					this.width = width;
					this.height = height;
					this.fill = fill;
					this.img_idx = img_idx;
					this.wScale = wScale;
				}
				show() {
					m.push();
					if (this.img_idx != -1) {
						if (this.pType == "RAM") {
							m.image(
								peripheralImages[this.img_idx],
								this.x0,
								this.y0,
								this.width * this.wScale,
								this.height
							);
						} else {
							let aspectRatio =
								peripheralImages[this.img_idx].width /
								peripheralImages[this.img_idx].height;
							let newWidth = peripheralImages[this.img_idx].width * this.wScale;
							let newHeight = newWidth / aspectRatio;
							m.image(
								peripheralImages[this.img_idx],
								this.x0,
								this.y0,
								newWidth,
								newHeight
							);
						}
					} else {
						m.fill(this.fill);
						m.noStroke();
						m.rect(this.x0, this.y0, this.width, this.height);
					}
					m.pop();
				}
			}

			m.populateSlots = function () {
				m.getRam();
				m.getPCI();
				m.getCPU();
				m.getSATA();
				m.resizePopups();
			};

			m.generateMask = function (w, h, x0, y0, x1, y1, invert = false) {
				let mask = m.createImage(w, h);
				let padding = 50;
				mask.loadPixels();
				for (let i = 0; i < w; i++) {
					for (let j = 0; j < h; j++) {
						if (i > x0 && i < x0 + x1 && j > y0 && j < y0 + y1) {
							// inside footprint of component.
							if (invert) {
								mask.set(i, j, m.color(0, 0, 0, 255));
							} else {
								mask.set(i, j, m.color(0, 0, 0, 0));
							}
						} else if (
							i > x0 - padding &&
							i < x0 - padding + x1 + 2 * padding &&
							j > y0 - padding &&
							j < y0 - padding + y1 + 2 * padding
						) {
							//inside transition between box and background.
							let falloff_x;
							let falloff_y;
							let x_map;
							let y_map;
							let r_map;
							let corner = false;
							let y;
							let x;
							let r;
							if (i < x0 && j < y0) {
								//top left
								x = x0 - i;
								y = y0 - j;
								r = m.sqrt(x * x + y * y);
								r_map = m.map(r, 0, padding, 0, 128, true);
								if (invert) {
									r_map = m.map(r, 0, padding, 0, 255, true);
									mask.set(i, j, m.color(0, 0, 0, 127 + (128 - r_map)));
								} else {
									mask.set(i, j, m.color(0, 0, 0, r_map));
								}
								corner = true;
							} else if (i > x0 + x1 && j < y0) {
								//top right
								x = x0 + x1 - i;
								y = y0 - j;
								r = m.int(m.sqrt(x * x + y * y));
								r_map = m.map(r, 0, padding, 0, 128, true);
								if (invert) {
									r_map = m.map(r, 0, padding, 0, 255, true);
									mask.set(i, j, m.color(0, 0, 0, 127 + (128 - r_map)));
								} else {
									mask.set(i, j, m.color(0, 0, 0, r_map));
								}

								corner = true;
							} else if (i < x0 && j > y0 + y1) {
								//bottom left
								x = x0 - i;
								y = y0 + y1 - j;
								r = m.int(m.sqrt(x * x + y * y));
								r_map = m.map(r, 0, padding, 0, 128, true);
								if (invert) {
									r_map = m.map(r, 0, padding, 0, 255, true);
									mask.set(i, j, m.color(0, 0, 0, 127 + (128 - r_map)));
								} else {
									mask.set(i, j, m.color(0, 0, 0, r_map));
								}

								corner = true;
							} else if (i > x0 + x1 && j > y0 + y1) {
								//bottom right
								x = x0 + x1 - i;
								y = y0 + y1 - j;
								r = m.int(m.sqrt(x * x + y * y));
								r_map = m.map(r, 0, padding, 0, 128, true);
								if (invert) {
									r_map = m.map(r, 0, padding, 0, 255, true);
									mask.set(i, j, m.color(0, 0, 0, 127 + (128 - r_map)));
								} else {
									mask.set(i, j, m.color(0, 0, 0, r_map));
								}

								corner = true;
							}
							if (!corner) {
								if (i < x0) {
									falloff_x = x0 - i;
								} else {
									falloff_x = i - (x0 + x1);
								}
								if (j < y0) {
									falloff_y = y0 - j;
								} else {
									falloff_y = j - (y0 + y1);
								}
								x_map = m.map(falloff_x, 0, padding, 0, 128);
								y_map = m.map(falloff_y, 0, padding, 0, 128);
								if (x_map > y_map) {
									if (invert) {
										x_map = m.map(falloff_x, 0, padding, 0, 255);
										mask.set(i, j, m.color(0, 0, 0, 127 + (128 - x_map)));
									} else {
										mask.set(i, j, m.color(0, 0, 0, x_map));
									}
								} else {
									if (invert) {
										y_map = m.map(falloff_y, 0, padding, 0, 255);
										mask.set(i, j, m.color(0, 0, 0, 127 + (128 - y_map)));
									} else {
										mask.set(i, j, m.color(0, 0, 0, y_map));
									}
								}
							}
						} else {
							//outside box
							if (invert) {
								mask.set(i, j, m.color(0, 0, 0, 0));
							} else {
								mask.set(i, j, m.color(0, 0, 0, 128));
							}
						}
					}
				}
				mask.updatePixels();
				return mask;
			};

			// m.resizePopups = function () {
			// 	for (let i = 0; i < components.length; i++) {
			// 		var lines = components[i].popup.content.split(/\r\n|\r|\n/);
			// 		var linecount =
			// 			components[i].popup.content.split(/\r\n|\r|\n/).length;
			// 		components[i].popup.height = 18 * linecount + 10;

			// 		var max_chars = 0;
			// 		for (let j = 0; j < lines.length; j++) {
			// 			if (lines[j].length > max_chars) {
			// 				max_chars = lines[j].length;
			// 			}
			// 		}
			// 		components[i].popup.width = 9 * max_chars + 10;
			// 	}
			// };

			m.resizePopups = function () {
				const wrap_threshold = 60; // Only wrap lines that exceed 60 characters

				for (let i = 0; i < components.length; i++) {
					var lines = components[i].popup.content.split(/\r\n|\r|\n/);
					var processedLines = [];

					// Process each line to add wrapping for long lines
					lines.forEach(line => {
						if (line.length > wrap_threshold) {
							// Split long lines into chunks of `wrap_threshold` characters
							let wrapped_line = line.match(new RegExp(`.{1,${wrap_threshold}}`, 'g')).join('\n');
							processedLines.push(...wrapped_line.split('\n'));
						} else {
							processedLines.push(line);
						}
					});

					// Update the height based on the number of lines after wrapping
					var linecount = processedLines.length;
					components[i].popup.height = 18 * linecount + 10;

					// Calculate the maximum line length for setting popup width
					var max_chars = 0;
					for (let j = 0; j < processedLines.length; j++) {
						if (processedLines[j].length > max_chars) {
							max_chars = processedLines[j].length;
						}
					}
					components[i].popup.width = 9 * max_chars + 10;

					// Update the content with processed lines
					components[i].popup.content = processedLines.join('\n');
				}
			};


			m.getRam = function () {
				if (ram_info) {
					for (let i = 0; i < ram_info["Ram Info"].length; i++) {
						for (let c = 0; c < components.length; c++) {
							if (ram_info["Ram Info"][i]["Locator"] == components[c]["type"]) {
								var content_str = "";
								content_str +=
									"Connector: " + ram_info["Ram Info"][i]["Locator"] + "\n";
								content_str +=
									"Capacity: " + ram_info["Ram Info"][i]["Size"] + "\n";
								content_str +=
									"Form Factor: " +
									ram_info["Ram Info"][i]["Form Factor"] +
									"\n";
								content_str +=
									"Type: " + ram_info["Ram Info"][i]["Type"] + "\n";
								content_str +=
									"Manufacturer: " +
									ram_info["Ram Info"][i]["Manufacturer"] +
									"\n";
								content_str +=
									"Temperature: " + ram_info["Ram Info"][i]["Temperature"];

								components[c].popup.content = content_str;

								if (ram_info["Ram Info"][i]["Size"] != "No Module Installed") {
									peripherals.push(
										new peripheral(
											"RAM",
											components[c]["x0"],
											components[c]["y0"],
											components[c]["width"],
											components[c]["height"],
											"#8080FF80",
											peripheralImages.length
										)
									);
									peripheralImages.push(m.loadImage("img/motherboard/ram.png"));
								}
							}
						}
					}
				}
			};

			m.getPCI = function () {
				let VERTOFFSET = 5.37;
				let VERTSCALE = 19.0;
				let WIDTHOFFSET = 1.24;
				if (pci_info) {
					for (let i = 0; i < pci_info["PCI Info"].length; i++) {
						if (pci_info["PCI Info"][i].hasOwnProperty("ID")) {
							for (let c = 0; c < components.length; c++) {
								if (
									components[c]["id"] == pci_info["PCI Info"][i]["ID"] &&
									(components[c]["type"].search("pci") != -1 || components[c]["type"].search("PCI") != -1)
								) {

									components[c].popup.content = JSON.stringify(
										pci_info["PCI Info"][i],
										null,
										" "
									)
										.replaceAll("{\n", "")
										.replaceAll('"', "")
										.replaceAll("[", "")
										.replaceAll("]\n", "")
										.replaceAll("}", "")
										.replaceAll(",", "")
										.replaceAll("    ", "  ")
										.slice(0, -1);

									// Apply the mask regardless of usage status
									let newMask = m.generateMask(
										background_img.width,
										background_img.height,
										components[c]["x0"],
										components[c]["y0"],
										components[c]["width"],
										components[c]["height"]
									);
									MASK_ARR[c] = newMask;

									// Only add the PCI card if the slot is in use
									if (pci_info["PCI Info"][i]["Current Usage"] === "In Use") {

										if (
											pci_info["PCI Info"][i].hasOwnProperty("Card Type") &&
											pci_info["PCI Info"][i].hasOwnProperty("Card Model")
										) {
											if (
												pci_info["PCI Info"][i]["Card Type"] == "HBA" &&
												pci_info["PCI Info"][i]["Card Model"] == "SAS9305-24i"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage("img/motherboard/24i.png")
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													108.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (108.0 / 884.0);
												components[c].popup.content = components[c].popup.content;

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "HBA" &&
												pci_info["PCI Info"][i]["Card Model"] == "SAS9305-16i"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage("img/motherboard/16i.png")
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													108.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (108.0 / 884.0);
												components[c].popup.content = components[c].popup.content;

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "HBA" &&
												pci_info["PCI Info"][i]["Card Model"] == "9361-24i"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage("img/motherboard/9361-24i.png")
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													101.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (101.0 / 890.0);
												components[c].popup.content = components[c].popup.content;

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "HBA" &&
												pci_info["PCI Info"][i]["Card Model"] == "9361-16i"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage("img/motherboard/9361-16i.png")
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													101.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (101.0 / 890.0);
												components[c].popup.content = components[c].popup.content;

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "HBA" &&
												pci_info["PCI Info"][i]["Card Model"] == "HBA 9400-16i"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage("img/motherboard/9400-16i.png")
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													101.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (101.0 / 891.0);
												components[c].popup.content = components[c].popup.content;

											}
											else if (
												pci_info["PCI Info"][i]["Card Type"] == "HBA" &&
												pci_info["PCI Info"][i]["Card Model"] == "9660-16i"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage("img/motherboard/9660-16i.png")
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													100.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (100.0 / 890.0);
												components[c].popup.content = components[c].popup.content;

											}
											else if (
												pci_info["PCI Info"][i]["Card Type"] == "HBA" &&
												pci_info["PCI Info"][i]["Card Model"] == "9600-16i"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage("img/motherboard/9600-16i.png")
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													108.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (108.0 / 967.0);
												components[c].popup.content = components[c].popup.content;

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "HBA" &&
												pci_info["PCI Info"][i]["Card Model"] == "9600-24i"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage("img/motherboard/9600-24i.png")
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													108.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (108.0 / 967.0);
												components[c].popup.content = components[c].popup.content;

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "Network Card" &&
												pci_info["PCI Info"][i]["Card Model"] == "82599ES"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage(
														"img/motherboard/" +
														pci_info["PCI Info"][i]["Card Model"] +
														".png"
													)
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													99.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (99.0 / 593.0);
												components[c].popup.content = components[
													c
												].popup.content.slice(0, -4);

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "Network Card" &&
												pci_info["PCI Info"][i]["Card Model"] == "X540-AT2"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage(
														"img/motherboard/" +
														pci_info["PCI Info"][i]["Card Model"] +
														".png"
													)
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													98.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (98.0 / 813.0);
												components[c].popup.content = components[
													c
												].popup.content.slice(0, -4);

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "Network Card" &&
												pci_info["PCI Info"][i]["Card Model"] == "XL710"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage(
														"img/motherboard/" +
														pci_info["PCI Info"][i]["Card Model"] +
														".png"
													)
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													99.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (99.0 / 886.0);
												components[c].popup.content = components[
													c
												].popup.content.slice(0, -4);

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "Network Card" &&
												pci_info["PCI Info"][i]["Card Model"] == "MT27800"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage(
														"img/motherboard/" +
														pci_info["PCI Info"][i]["Card Model"] +
														".png"
													)
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													103.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (103.0 / 808.0);
												components[c].popup.content = components[
													c
												].popup.content.slice(0, -4);

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "Network Card" &&
												pci_info["PCI Info"][i]["Card Model"] == "BCM57412"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage(
														"img/motherboard/" +
														pci_info["PCI Info"][i]["Card Model"] +
														".png"
													)
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													102.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (102.0 / 971.0);
												components[c].popup.content = components[
													c
												].popup.content.slice(0, -4);

											} else if (
												pci_info["PCI Info"][i]["Card Type"] == "Network Card" &&
												pci_info["PCI Info"][i]["Card Model"] == "XXV710"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage(
														"img/motherboard/" +
														pci_info["PCI Info"][i]["Card Model"] +
														".png"
													)
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													98.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (98.0 / 886.0);
												components[c].popup.content = components[
													c
												].popup.content.slice(0, -5);

											} else if (
												pci_info["PCI Info"][i]["Card Type"] ==
												"Serial ATA Controller" &&
												pci_info["PCI Info"][i]["Card Model"] == "ASM1062"
											) {
												peripherals.push(
													new peripheral(
														"PCI",
														components[c]["x0"] -
														components[c]["width"] * WIDTHOFFSET,
														0,
														components[c]["width"],
														components[c]["height"],
														"#FF800080",
														peripheralImages.length,
														components[c]["width"] * pciScale
													)
												);
												peripheralImages.push(
													m.loadImage(
														"img/motherboard/" +
														pci_info["PCI Info"][i]["Card Model"] +
														".png"
													)
												);
												components[c]["x0"] =
													components[c]["x0"] -
													components[c]["width"] * WIDTHOFFSET;
												components[c]["y0"] = 0;
												components[c]["width"] =
													97.0 * components[c]["width"] * pciScale;
												components[c]["height"] =
													components[c]["width"] / (97.0 / 365.0);
												let contentStr = "";
												contentStr +=
													"Designation: " +
													pci_info["PCI Info"][i]["Designation"] +
													"\n";
												contentStr +=
													"Type: " + pci_info["PCI Info"][i]["Type"] + "\n";
												contentStr +=
													"Current Usage: " +
													pci_info["PCI Info"][i]["Current Usage"] +
													"\n";
												contentStr +=
													"ID: " + pci_info["PCI Info"][i]["ID"] + "\n";
												contentStr +=
													"Bus Address: " +
													pci_info["PCI Info"][i]["Bus Address"] +
													"\n";
												contentStr +=
													"Card Type: " +
													pci_info["PCI Info"][i]["Card Type"] +
													"\n";
												contentStr +=
													"Card Model: " +
													pci_info["PCI Info"][i]["Card Model"] +
													"\n";
												if (
													pci_info["PCI Info"][i].hasOwnProperty("Connections")
												) {
													let padding = 11;
													contentStr += "Connections: \n";
													for (
														let con = 0;
														con < pci_info["PCI Info"][i]["Connections"].length;
														con++
													) {
														contentStr +=
															"\tDevice: " +
															pci_info["PCI Info"][i]["Connections"][con][
															"Device"
															] +
															"\n";
														contentStr +=
															"\tPath: " +
															pci_info["PCI Info"][i]["Connections"][con][
															"Path"
															] +
															"\n";
														contentStr += "\tPartition Information:\n";
														contentStr +=
															"\t\t| " +
															"Name".padEnd(padding, " ") +
															"Size".padEnd(padding, " ") +
															"Type".padEnd(padding, " ") +
															"Mount Point".padEnd(padding, " ") +
															" |\n";
														for (
															let p = 0;
															p <
															pci_info["PCI Info"][i]["Connections"][con][
																"Partitions"
															].length;
															p++
														) {
															contentStr +=
																"\t\t| " +
																pci_info["PCI Info"][i]["Connections"][con][
																	"Partitions"
																][p]["Name"].padEnd(padding, " ");
															contentStr += pci_info["PCI Info"][i][
																"Connections"
															][con]["Partitions"][p]["Size"].padEnd(
																padding,
																" "
															);
															contentStr += pci_info["PCI Info"][i][
																"Connections"
															][con]["Partitions"][p]["Type"].padEnd(
																padding,
																" "
															);
															contentStr +=
																pci_info["PCI Info"][i]["Connections"][con][
																	"Partitions"
																][p]["Mount Point"].padEnd(padding, " ") + " |\n";
														}
													}
												}
											} 
										} else {
											// Generic card fallback if no specific card model found
											peripherals.push(
												new peripheral(
													"PCI",
													components[c]["x0"] -
													components[c]["width"],
													0,
													components[c]["width"],
													components[c]["height"],
													"#FF800080",
													peripheralImages.length,
													components[c]["width"] * pciScale
												)
											);
											peripheralImages.push(
												m.loadImage("img/motherboard/generic_pci_card.png") // Path to your generic card image
											);
											components[c]["x0"] =
												components[c]["x0"] -
												components[c]["width"] * WIDTHOFFSET;
											components[c]["y0"] = 0;
											components[c]["width"] =
												100.0 * components[c]["width"] * pciScale;
											components[c]["height"] =
												components[c]["width"] / (100.0 / 890.0);
											components[c].popup.content = components[c].popup.content; // Keep the popup content
										}


									}

								}
							}
						}
					}
				}
			};

			m.getCPU = function () {
				// console.log(mobo_info);
				// console.log(components);
				let contentStr;
				for (let i = 0; i < components.length; i++) {
					if (components[i].type == "cpu" && components[i].id == 1) {
						contentStr = "";
						contentStr +=
							"Socket Designation: " +
							mobo_info["Motherboard Info"][1]["CPU"][0]["Socket Designation"] +
							"\n";
						contentStr +=
							"Version: " +
							mobo_info["Motherboard Info"][1]["CPU"][0]["Version"] +
							"\n";
						contentStr +=
							"Max Speed: " +
							mobo_info["Motherboard Info"][1]["CPU"][0]["Max Speed"] +
							"\n";

						// Access the first element of the Sensor Readings array
						const sensorReadings = mobo_info["Motherboard Info"][2]["Sensor Readings"][0];

						// Try both old and new key names
						let cpu0Temp =
							sensorReadings["CPU0_TEMP"] || // New format
							sensorReadings["CPU Temp"] ||
							sensorReadings["CPU1 Temp"] || // Original format
							"N/A";

						contentStr += "Temperature: " + cpu0Temp + "\n";
						components[i].popup.content = contentStr;
					} else if (components[i].type == "cpu" && components[i].id == 2) {
						contentStr = "";
						contentStr +=
							"Socket Designation: " +
							mobo_info["Motherboard Info"][1]["CPU"][1]["Socket Designation"] +
							"\n";
						contentStr +=
							"Version: " +
							mobo_info["Motherboard Info"][1]["CPU"][1]["Version"] +
							"\n";
						contentStr +=
							"Max Speed: " +
							mobo_info["Motherboard Info"][1]["CPU"][1]["Max Speed"] +
							"\n";

						// Access the first element of the Sensor Readings array
						const sensorReadings = mobo_info["Motherboard Info"][2]["Sensor Readings"][0];

						// Try both old and new key names
						let cpu1Temp =
							sensorReadings["CPU1_TEMP"] || // New format
							sensorReadings["CPU2 Temp"] || // Original format
							"N/A";

						contentStr += "Temperature: " + cpu1Temp + "\n";
						components[i].popup.content = contentStr;
					}
				}
			};



			m.getSATA = function () {
				console.log(sata_info);
				if (sata_info) {
					// Group devices by connector
					let connectorMap = {};
					for (let i = 0; i < sata_info["SATA Info"].length; i++) {
						let connector = sata_info["SATA Info"][i]["Connector"];
						if (!connectorMap[connector]) {
							connectorMap[connector] = [];
						}
						connectorMap[connector].push(sata_info["SATA Info"][i]);
					}

					for (let c = 0; c < components.length; c++) {
						let connectorType = components[c].type;
						if (connectorMap[connectorType]) {
							let popup_str = "Connector: " + connectorType + "\n";

							// Loop through each device connected to this connector
							for (let i = 0; i < connectorMap[connectorType].length; i++) {
								let deviceInfo = connectorMap[connectorType][i];
								popup_str += "Device: " + deviceInfo["Device"] + "\n";
								popup_str += "Partition Information: \n";
								let padding = 11;
								popup_str +=
									"| " +
									"Name".padEnd(padding, " ") +
									"Size".padEnd(padding, " ") +
									"Type".padEnd(padding, " ") +
									"Mount Point".padEnd(padding, " ") +
									" |\n";

								for (let p = 0; p < deviceInfo["Partitions"].length; p++) {
									popup_str +=
										"| " +
										deviceInfo["Partitions"][p]["Name"].padEnd(
											padding,
											" "
										);
									popup_str += deviceInfo["Partitions"][p]["Size"].padEnd(
										padding,
										" "
									);
									popup_str += deviceInfo["Partitions"][p]["Type"].padEnd(
										padding,
										" "
									);
									popup_str +=
										deviceInfo["Partitions"][p]["Mount Point"].padEnd(
											padding,
											" "
										) + " |\n";
								}
								popup_str += "\n";  // Add a separator between devices
							}

							// Assign the complete popup string to the component's popup content
							components[c].popup.content = popup_str.trim();
							peripherals.push(
								new peripheral(
									"SATA",
									components[c]["x0"],
									components[c]["y0"],
									components[c]["width"],
									components[c]["height"],
									"#FFFFFF00",
									-1,
									1.0
								)
							);
						}
					}
				}
			};


			m.loadAssets = function () {
				background_img = m.loadImage(bgImgPath, (im) => {
					m.setNewCanvasDimensions(im);
				});
				m.jsonLoadMotherboard(mobo_json_path);
			};

			m.setNewCanvasDimensions = function (im) {
				m.resizeCanvas(im.width, im.height);
				resizeHook(m, m.canvas_id, im.width, im.height);
			};

			m.jsonLoadMotherboard = function (fname) {
				var proc = cockpit.spawn(
					[
						"/usr/share/cockpit/45drives-motherboard/helper_scripts/dump_json",
						fname,
					],
					{ err: "out", superuser: "require" }
				);
				proc.stream(function (data) {
					mobo_json = JSON.parse(data);
					for (let i = 0; i < mobo_json.length; i++) {
						if (mobo_json[i]["shape"] == "rect") {
							components.push(
								new component(
									mobo_json[i]["x0"],
									mobo_json[i]["y0"],
									mobo_json[i]["width"],
									mobo_json[i]["height"],
									mobo_json[i]["id"],
									mobo_json[i]["type"],
									new popup_window(
										mobo_json[i]["x0"],
										mobo_json[i]["y0"],
										550,
										200,
										mobo_json[i]["type"]
									)
								)
							);
						}
					}
				});
			};

			m.mouseActivity = function () {
				if (READY) {
					POPUP_ACTIVE = false;
					for (let i = 0; i < components.length; i++) {
						if (
							m.mouseX > components[i].x0 &&
							m.mouseX < components[i].x0 + components[i].width &&
							m.mouseY > components[i].y0 &&
							m.mouseY < components[i].y0 + components[i].height
						) {
							//cursor is within the boundaries of a component.
							POPUP_ACTIVE = true;
							POPUP_IDX = i;
							if (
								components[i].x0 +
								components[i].width +
								20 +
								components[i].popup.width <
								m.width
							) {
								//popup window can fit if placed near the top right of the component and
								//still fit on screen.
								components[i].popup.x0 =
									components[i].x0 + components[i].width + 20;
							} else if (
								components[i].x0 - 20 - components[i].popup.width >
								20
							) {
								//popup window can be placed near the upper left region of the component footprint
								components[i].popup.x0 =
									components[i].x0 - 20 - components[i].popup.width;
							} else {
								//popup window is very wide, set its x position to ensure that the right most
								//edge will fit on the canvas. assume that the left-most edge will be visible.
								components[i].popup.x0 =
									background_img.width - components[i].popup.width - 20;
							}
							if (components[i].y0 - 20 > 0) {
								if (
									components[i].y0 + components[i].popup.height <
									background_img.height
								) {
									//popup window isn't at risk of overflowing the board footprint.
									components[i].popup.y0 = components[i].y0 - 20;
								} else {
									// popupwindow is going off the footprint of the board, move it up.
									components[i].popup.y0 =
										background_img.height - components[i].popup.height;
								}
							} else {
								components[i].popup.y0 = 0;
							}
							break;
						}
					}
				}
			};
		};

		onMounted(() => {
			new P5(mobo_app, "motherboard_app");
		});

		return {
			mobo_info,
			pci_info,
			ram_info,
			sata_info,
			network_info,
		};
	},
};
</script>
