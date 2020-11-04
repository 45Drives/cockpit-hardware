
var hardware_info = null;
var mobo_info = null;
var mobo_json_path = null;
var pci_info = null;
var ram_info = null;
var sata_info = null;
var p5_running = null;
var temp_output = document.getElementById("motherboard_app");
var detail_done = false;
var network_info = null;
var supported_motherboards = ["X11DPL-i","X11SPL-F","H11SSL-i","X11SSH-CTF"];
var mobo_supported = false;
//listener for clicking on the motherboard tab
function motherboard()
{
	var dfd = cockpit.defer();
	if(!mobo_info){
		temp_output = "Loading... Please Wait.";
		var m_output = document.getElementById("motherboard_output");
		var mobo_img = document.getElementById("mobo_image");
			
		var motherboard_proc = cockpit.spawn(
				[
					"/usr/bin/pkexec",
					"/usr/share/cockpit/hardware/helper_scripts/motherboard"
				], 
				{err: "out"}
		);
		motherboard_proc.stream(
			function(data)
			{
				mobo_info = JSON.parse(data);
				mobo_img.src = ("img/motherboard/" + 
					String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + "/" +
					String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".png");
				mobo_img.setAttribute("style","display:none;");
		 			mobo_json_path = ("img/motherboard/" + 
		 				String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + "/" +
		 				String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".json");
				launchP5JS();
		 		dfd.resolve();
			}
		);
	}
	if(!(pci_info && ram_info && sata_info)){
		gather_connector_data();
	}
	launchP5JS();
}

function get_network_info(){
	var network_promise = cockpit.defer();

	// load the pci information
	var pci_proc = cockpit.spawn(
		[
			"/usr/bin/pkexec",
			"/usr/share/cockpit/hardware/helper_scripts/network"
		], 
		{err: "out"}
	);

	pci_proc.stream(
		function(data){
			network_info = JSON.parse(data);
			network_promise.resolve();
		}
	);
}


function gather_connector_data(){
	var pci_promise = cockpit.defer();
	var ram_promise = cockpit.defer();
	var sata_promise = cockpit.defer();

	// load the pci information
	var pci_proc = cockpit.spawn(
		[
			"/usr/bin/pkexec",
			"/usr/share/cockpit/hardware/helper_scripts/pci"
		], 
		{err: "out"}
	);

	pci_proc.stream(
		function(data){
			pci_info = JSON.parse(data);
			launchP5JS();
			pci_promise.resolve();
		}
	);

	//load the ram information
	var ram_proc = cockpit.spawn(
		[
			"/usr/bin/pkexec",
			"/usr/share/cockpit/hardware/helper_scripts/ram"
		], 
		{err: "out"}
	);
	ram_proc.stream(
		function(data){
			ram_info = JSON.parse(data);
			launchP5JS();
			ram_promise.resolve();
		}
	);

	//load the sata information
	var sata_proc = cockpit.spawn(
		[
			"/usr/bin/pkexec",
			"/usr/share/cockpit/hardware/helper_scripts/sata"
		], 
		{err: "out"}
	);

	sata_proc.stream(
		function(data){
			sata_info = JSON.parse(data);
			launchP5JS();
			sata_promise.resolve();
		}
	);
}


function launchP5JS(){
	if(mobo_info){
		for(let i = 0; i < supported_motherboards.length; i++){
			if(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"] == supported_motherboards[i]){
				mobo_supported = true;
			}
		}
		if(!mobo_supported){
			let APP_OUTPUT = document.getElementById("motherboard_app");
			APP_OUTPUT.innerHTML = (
				"Interactive Motherboard Support for " +
				mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"] +
				" is not available at this time.");
		}
	}
	if(mobo_supported && mobo_info && mobo_json_path && pci_info && sata_info && !p5_running){
		p5_running = true;
		var p5js = document.createElement('script');
		p5js.onload = function() {};
		p5js.src = "p5.js";
		document.getElementsByTagName('head')[0].appendChild(p5js);
	
		var sketch = document.createElement('script');
		sketch.onload = function() {};
		sketch.src = "mobo.js";
		document.getElementsByTagName('head')[0].appendChild(sketch);
		temp_output.innerHTML = "";
	}
}


function system()
{
	var dfd = cockpit.defer();
	var sys_img = document.getElementById("system_image");
	var sys_model = document.getElementById("sys_model");
	var sys_chassis_size = document.getElementById("sys_chassis_size");
	var sys_product_serial = document.getElementById("sys_product_serial");
	var product_img_lut = {};
		product_img_lut["Storinator-H16-Q30-Enhanced-AMD"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-H16-S45-Enhanced-AMD"] = "img/products/storinatorS45.jpg";
		product_img_lut["Storinator-H16-XL60-Enhanced-AMD"] = "img/products/storinatorXL60.jpg";
		product_img_lut["Storinator-H32-Q30-Enhanced-AMD"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-H32-S45-Enhanced-AMD"] = "img/products/storinatorS45.jpg";
		product_img_lut["Storinator-H32-XL60-Enhanced-AMD"] = "img/products/storinatorXL60.jpg";
		product_img_lut["Storinator-AV15-Turbo"] = "img/products/storinatorAV15.jpg";
		product_img_lut["Storinator-Q30-Turbo"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-S45-Turbo"] = "img/products/storinatorS45.jpg";
		product_img_lut["Storinator-XL60-Turbo"] = "img/products/storinatorXL60.jpg";
		product_img_lut["Stornado-AV15-Turbo"] = "img/products/sornadoAV15.jpg";
		product_img_lut["Storinator-H16-Q30-Turbo"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-H16-S45-Turbo"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-H16-XL60-Turbo"] = "img/products/storinatorXL60.jpg";
		product_img_lut["Storinator-H32-Q30-Turbo"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-H32-S45-Turbo"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-H32-XL60-Turbo"] = "img/products/storinatorXL60.jpg";
		product_img_lut["Storinator-AV15-Enhanced"] = "img/products/storinatorAV15.jpg";
		product_img_lut["Storinator-Q30-Enhanced"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-S45-Enhanced"] = "img/products/storinatorS45.jpg";
		product_img_lut["Storinator-XL60-Enhanced"] = "img/products/storinatorXL60.jpg";
		product_img_lut["Stornado-AV15-Enhanced"] = "img/products/sornadoAV15.jpg";
		product_img_lut["Storinator-H16-Q30-Enhanced"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-H16-S45-Enhanced"] = "img/products/storinatorS45.jpg";
		product_img_lut["Storinator-H16-XL60-Enhanced"] = "img/products/storinatorXL60.jpg";
		product_img_lut["Storinator-H32-Q30-Enhanced"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-H32-S45-Enhanced"] = "img/products/storinatorS45.jpg";
		product_img_lut["Storinator-H32-XL60-Enhanced"] = "img/products/storinatorXL60.jpg";
		product_img_lut["Storinator-AV15-Base"] = "img/products/storinatorAV15.jpg";
		product_img_lut["Storinator-Q30-Base"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-S45-Base"] = "img/products/storinatorS45.jpg";
		//Placeholder for failed autodetect. 
		product_img_lut["Storinator-AV15-Legacy"] = "img/products/storinatorAV15.jpg";
		product_img_lut["Storinator-Q30-Legacy"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-S45-Legacy"] = "img/products/storinatorS45.jpg";
		product_img_lut["Storinator-XL60-Legacy"] = "img/products/storinatorXL60.jpg";

	var proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/usr/share/cockpit/hardware/helper_scripts/system"
			], 
			{err: "out"}
	);

	proc.stream(
		function(data)
		{
			var product_idx = 0; 
			var ipmi_idx = 4;
			hardware_info = JSON.parse(data);
			sys_img.src = product_img_lut[String(hardware_info["System"][product_idx]["Product"][0]["ProductID"])];
			sys_model.innerHTML = hardware_info["System"][product_idx]["Product"][0]["System Model"];
			sys_chassis_size.innerHTML = hardware_info["System"][product_idx]["Product"][0]["Chassis Size"];
			sys_product_serial.innerHTML = hardware_info["System"][ipmi_idx]["IPMI Information"][0]["Product Serial"];
			getMoboInfo();
			gather_connector_data();
			get_network_info();
			dfd.resolve();
		}
	);
}

async function getMoboInfo(){
	var m_output = document.getElementById("motherboard_output");
	var mobo_img = document.getElementById("mobo_image");
	var dfd = cockpit.defer();
		
	var motherboard_proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/usr/share/cockpit/hardware/helper_scripts/motherboard"
			], 
			{err: "out"}
	);
	motherboard_proc.stream(
		function(data)
		{
			mobo_info = JSON.parse(data);
			mobo_img.src = ("img/motherboard/" + 
				String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + "/" +
				String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".png");
			mobo_img.setAttribute("style","display:none;");
	 			mobo_json_path = ("img/motherboard/" + 
	 				String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + "/" +
	 				String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".json");
	 		dfd.resolve();
		}
	);	
}

//listener for clicking on the system detail tab
function detail()
{
	var detailOutput = document.getElementById("detail_output");
	var dfd = cockpit.defer();
	if(mobo_info && pci_info && ram_info && sata_info && network_info){
		detailOutput.innerHTML = "";
		detailOutput.appendChild(BuildDetailTable());
		detail_done = true;
	}else{
		setTimeout(detail,250);
	}
	dfd.resolve();
}


function BuildDetailTable(){
	let detailTable = document.createElement("div");
	
	let sysTableHeader = document.createElement("h3");
	sysTableHeader.className = "detail-table-header";
	sysTableHeader.innerHTML = "System";
	let sysTable = buildSystemTable();

	let moboTableHeader = document.createElement("h3");
	moboTableHeader.innerHTML = "Motherboard";
	moboTableHeader.className = "detail-table-header";
	let moboTable = buildMotherboardTable();

	let cpuTableHeader = document.createElement("h3");
	cpuTableHeader.innerHTML = "CPU";
	cpuTableHeader.className = "detail-table-header";
	let cpuTable = buildCPUTable();
	
	let pciTableHeader = document.createElement("h3");
	pciTableHeader.innerHTML = "PCI";
	pciTableHeader.className = "detail-table-header";
	let pciTable = buildPCITable();

	let ramTableHeader = document.createElement("h3");
	ramTableHeader.innerHTML = "RAM";
	ramTableHeader.className = "detail-table-header";
	let ramTable = buildRAMTable();

	let networkTableHeader = document.createElement("h3");
	networkTableHeader.innerHTML = "Network";
	networkTableHeader.className = "detail-table-header";
	let networkTable = buildNetworkTable();

	detailTable.appendChild(sysTableHeader);
	detailTable.appendChild(sysTable);
	detailTable.appendChild(moboTableHeader);
	detailTable.appendChild(moboTable);
	detailTable.appendChild(cpuTableHeader);
	detailTable.appendChild(cpuTable);
	detailTable.appendChild(pciTableHeader);
	detailTable.appendChild(pciTable);
	detailTable.appendChild(ramTableHeader);
	detailTable.appendChild(ramTable);
	detailTable.appendChild(networkTableHeader);
	detailTable.appendChild(networkTable);
	return detailTable;
}

function buildNetworkTable(){
	let networkTable = document.createElement("table");
	let tr = networkTable.insertRow(0);
	let headers = ["Connection Name","Connection State","Type","MAC","IPv4","IPv6","PCI Slot","Bus Address"];
	for(let i = 0; i < headers.length; i++){
		th = document.createElement("th");
		th.className = "detail-table-sub-header";
		th.innerHTML = headers[i];
		tr.appendChild(th);
	}
	for(let i = 0; i < network_info["Network Info"].length; i++){
		tr = networkTable.insertRow(-1);
		for(let j = 0; j < headers.length; j++){
			let cell = tr.insertCell(-1);
			if(network_info["Network Info"][i].hasOwnProperty(headers[j])){
				cell.innerHTML = network_info["Network Info"][i][headers[j]];
			}else{
				cell.innerHTML = "-";
			}
		}
	}
	return networkTable;
}

function buildRAMTable(){
	let ramTable = document.createElement("table");
	let tr = ramTable.insertRow(0);
	let headers = ["Locator","Type","Size","Manufacturer","Serial Number","Temperature"];
	for(let i = 0; i < headers.length; i++){
		th = document.createElement("th");
		th.className = "detail-table-sub-header";
		th.innerHTML = headers[i];
		tr.appendChild(th);
	}
	for(let i = 0; i < ram_info["Ram Info"].length; i++){
		tr = ramTable.insertRow(-1);
		for(let j = 0; j < headers.length; j++){
			let cell = tr.insertCell(-1);
			cell.innerHTML = ram_info["Ram Info"][i][headers[j]];
		}
	}
	return ramTable;
}

function buildPCITable(){
	let pciTable = document.createElement("table");
	let th = document.createElement("th");
	let colCount = 5;
	let tr = pciTable.insertRow(-1);
	let headers = ["Slot","Type","Availability","Bus Address","Card Type","Card Model"];
	for(let i = 0; i < headers.length; i++){
		th = document.createElement("th");
		th.className = "detail-table-sub-header";
		th.innerHTML = headers[i];
		tr.appendChild(th);
	}

	for(let i = 0; i < pci_info["PCI Info"].length; i++){
		tr = pciTable.insertRow(-1);
		let cell = tr.insertCell(-1);
		if(pci_info["PCI Info"][i].hasOwnProperty("ID")){
			cell.innerHTML = "PCI Slot " + pci_info["PCI Info"][i]["ID"];
		}else{
			cell.innerHTML = pci_info["PCI Info"][i]["Designation"];
		}
		
		cell = tr.insertCell(-1);
		cell.innerHTML = pci_info["PCI Info"][i]["Type"];
		cell = tr.insertCell(-1);
		cell.innerHTML = pci_info["PCI Info"][i]["Current Usage"];
		cell = tr.insertCell(-1);
		cell.innerHTML = pci_info["PCI Info"][i]["Bus Address"];
		if(pci_info["PCI Info"][i].hasOwnProperty("Card Type") && pci_info["PCI Info"][i].hasOwnProperty("Card Model")){
				cell = tr.insertCell(-1);
				cell.innerHTML = pci_info["PCI Info"][i]["Card Type"];
				cell = tr.insertCell(-1);
				cell.innerHTML = pci_info["PCI Info"][i]["Card Model"];
		}else{
			//No card type
			cell = tr.insertCell(-1);
			cell.innerHTML = "-";
			cell = tr.insertCell(-1);
			cell.innerHTML = "-";
		}
	}
	return pciTable;
}

function buildCPUTable(){
	let cpuTable = document.createElement("table");
	let th = document.createElement("th");
	let colCount = 2;
	let headers = ["Socket","Model","Temperature"];
	let tr = cpuTable.insertRow(-1);
	for(let i = 0; i < headers.length; i++){
		th = document.createElement("th");
		th.className = "detail-table-sub-header";
		th.innerHTML = headers[i];
		tr.appendChild(th);
	}

	for(let i = 0; i < mobo_info["Motherboard Info"][1]["CPU"].length; i++){
		tr = cpuTable.insertRow(-1);
		let cell = tr.insertCell(-1);
		cell.innerHTML = mobo_info["Motherboard Info"][1]["CPU"][i]["Socket Designation"];
		cell = tr.insertCell(-1);
		cell.innerHTML = mobo_info["Motherboard Info"][1]["CPU"][i]["Version"];
		cell = tr.insertCell(-1);
		cell.innerHTML = (
			mobo_info["Motherboard Info"][2]["Sensor Readings"][0][
			mobo_info["Motherboard Info"][1]["CPU"][i]["Socket Designation"] + " Temp"
			]);
	}

	return cpuTable;
}

function buildMotherboardTable(){
	let moboTable = document.createElement("table");
	let th = document.createElement("th");
	let tr;
	let fields = [
		["Manufacturer",hardware_info["System"][1]["Motherboard"][0]["Manufacturer"]],
		["Model",hardware_info["System"][1]["Motherboard"][0]["Product Name"]],
		["Serial",hardware_info["System"][1]["Motherboard"][0]["Serial Number"]]
	];
	for(let i = 0; i < fields.length; i++){
		tr = moboTable.insertRow(-1);
		for(let j = 0; j < fields[i].length; j++){
			let cell = tr.insertCell(-1);
			cell.innerHTML = fields[i][j];
		}
	}
	return moboTable;
}

function buildSystemTable(){
	let sysTable = document.createElement("table");
	let th;
	let tr;

	let fields = [
	["Model",hardware_info["System"][0]["Product"][0]["System Model"]],
	["Serial",hardware_info["System"][4]["IPMI Information"][0]["Product Serial"]],
	["Chassis Size",hardware_info["System"][0]["Product"][0]["Chassis Size"]]
	];

	for(let i = 0; i < fields.length; i++){
		tr = sysTable.insertRow(-1);
		for(let j = 0; j < fields[i].length; j++){
			let cell = tr.insertCell(-1);
			cell.innerHTML = fields[i][j];
		}
	}
	return sysTable;
}



function main()
{
	if(!hardware_info){ system();}
	document.getElementById("system_tab_link").addEventListener("click", system);
	document.getElementById("motherboard_tab_link").addEventListener("click", motherboard);
	document.getElementById("detail_tab_link").addEventListener("click",detail);
}

main();

cockpit.transport.wait(function() { });
