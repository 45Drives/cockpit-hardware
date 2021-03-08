let sys_info = null;
let mobo_info = null;
let cpu_info = null;
let pci_info = null;
let ram_info = null;
let network_info = null;

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
	product_img_lut["Stornado-AV15-Turbo"] = "img/products/stornadoAV15.jpg";
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
	product_img_lut["Stornado-AV15-Enhanced"] = "img/products/stornadoAV15.jpg";
	product_img_lut["Storinator-AV15-Enhanced-AMD"] = "img/products/storinatorAV15.jpg";
	product_img_lut["Storinator-Q30-Enhanced-AMD"] = "img/products/storinatorQ30.jpg";
	product_img_lut["Storinator-S45-Enhanced-AMD"] = "img/products/storinatorS45.jpg";
	product_img_lut["Storinator-XL60-Enhanced-AMD"] = "img/products/storinatorXL60.jpg";
	product_img_lut["Stornado-AV15-Enhanced-AMD"] = "img/products/stornadoAV15.jpg";
	product_img_lut["Storinator-H16-Q30-Enhanced"] = "img/products/storinatorQ30.jpg";
	product_img_lut["Storinator-H16-S45-Enhanced"] = "img/products/storinatorS45.jpg";
	product_img_lut["Storinator-H16-XL60-Enhanced"] = "img/products/storinatorXL60.jpg";
	product_img_lut["Storinator-H32-Q30-Enhanced"] = "img/products/storinatorQ30.jpg";
	product_img_lut["Storinator-H32-S45-Enhanced"] = "img/products/storinatorS45.jpg";
	product_img_lut["Storinator-H32-XL60-Enhanced"] = "img/products/storinatorXL60.jpg";
	product_img_lut["Storinator-AV15-Base"] = "img/products/storinatorAV15.jpg";
	product_img_lut["Storinator-Q30-Base"] = "img/products/storinatorQ30.jpg";
	product_img_lut["Storinator-S45-Base"] = "img/products/storinatorS45.jpg";
	product_img_lut["Storinator-C8-Base"] = "img/products/storinatorC8.jpg";
	product_img_lut["Storinator-C8-Enhanced"] = "img/products/storinatorC8.jpg";
	product_img_lut["Storinator-C8-Enhanced-AMD"] = "img/products/storinatorC8.jpg";
	product_img_lut["Storinator-C8-Turbo"] = "img/products/storinatorC8.jpg";
	product_img_lut["Storinator-MI4-Base"] = "img/products/storinatorMI4.jpg";
	product_img_lut["Storinator-MI4-Enhanced"] = "img/products/storinatorMI4.jpg";
	product_img_lut["Storinator-MI4-Enhanced-AMD"] = "img/products/storinatorMI4.jpg";
	product_img_lut["Storinator-MI4-Turbo"] = "img/products/storinatorMI4.jpg";
	//Placeholder for failed autodetect. 
	product_img_lut["Storinator-AV15-Generic"] = "img/products/storinatorAV15.jpg";
	product_img_lut["Storinator-Q30-Generic"] = "img/products/storinatorQ30.jpg";
	product_img_lut["Storinator-S45-Generic"] = "img/products/storinatorS45.jpg";
	product_img_lut["Storinator-XL60-Generic"] = "img/products/storinatorXL60.jpg";


function sys_manual_scan(){
	if(!sys_info){
		var sys_promise = cockpit.defer();
		var proc = cockpit.spawn(
				[
					"/usr/bin/pkexec",
					"/usr/share/cockpit/45drives-system/helper_scripts/system"
				],
				{err: "out"}
		);

		proc.stream(
			function(data)
			{
				var product_idx = 0; 
				var ipmi_idx = 4;
				sys_info = JSON.parse(data);
				let sys_img = document.createElement("IMG");
				sys_img.src = product_img_lut[String(sys_info["System"][product_idx]["Product"][0]["ProductID"])];
				document.getElementById("sys_img_div").appendChild(sys_img);
				document.getElementById("sys_model").innerHTML = sys_info["System"][product_idx]["Product"][0]["System Model"];
				document.getElementById("sys_chassis_size").innerHTML = sys_info["System"][product_idx]["Product"][0]["Chassis Size"];
				document.getElementById("sys_serial").innerHTML = sys_info["System"][ipmi_idx]["IPMI Information"][0]["Product Serial"];
				sys_promise.resolve();
			}
		);
	}
}

function mobo()
{
	if(!mobo_info){
		var mobo_promise = cockpit.defer();
		var motherboard_proc = cockpit.spawn(
				[
					"/usr/bin/pkexec",
					"/usr/share/cockpit/45drives-system/helper_scripts/motherboard"
				], 
				{err: "out"}
		);
		motherboard_proc.stream(
			function(data)
			{
				mobo_info = JSON.parse(data);
				document.getElementById("mobo_manufacturer").innerHTML = mobo_info["Motherboard Info"][0]["Motherboard"][0]["Manufacturer"];
				document.getElementById("mobo_model").innerHTML = mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"];
				document.getElementById("mobo_serial").innerHTML = mobo_info["Motherboard Info"][0]["Motherboard"][0]["Serial Number"];
				let cpu_content = document.getElementById("cpu_content");
				cpu_content.innerHTML = "";
				let cpu_table = buildCPUTable();
				cpu_content.appendChild(cpu_table);

				mobo_promise.resolve();
			}
		);
	}
}

function pci(){
	if(!pci_info){
		var pci_promise = cockpit.defer();
			// load the pci information
		var pci_proc = cockpit.spawn(
		[
			"/usr/bin/pkexec",
			"/usr/share/cockpit/45drives-system/helper_scripts/pci"
		], 
		{err: "out"}
		);

		pci_proc.stream(
			function(data){
				pci_info = JSON.parse(data);
				let pci_content = document.getElementById("pci_content");
				pci_content.innerHTML = "";
				let pci_table = buildPCITable();
				pci_content.appendChild(pci_table);
				pci_promise.resolve();
			}
		);
	}
}

function ram(){
	if(!ram_info){
		var ram_promise = cockpit.defer();
		//load the ram information
		var ram_proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/usr/share/cockpit/45drives-system/helper_scripts/ram"
			], 
			{err: "out"}
		);
		ram_proc.stream(
			function(data){
				ram_info = JSON.parse(data);
				let ram_content = document.getElementById("ram_content");
				ram_content.innerHTML = "";
				let ram_table = buildRAMTable();
				ram_content.appendChild(ram_table);
				ram_promise.resolve();
			}
		);
	}
}

function network(){
	var network_promise = cockpit.defer();

	// load the pci information
	var network_proc = cockpit.spawn(
		[
			"/usr/bin/pkexec",
			"/usr/share/cockpit/45drives-system/helper_scripts/network"
		], 
		{err: "out"}
	);

	network_proc.stream(
		function(data){
			network_info = JSON.parse(data);
			let network_content = document.getElementById("network_content");
			network_content.innerHTML = "";
			let network_table = buildNetworkTable();
			network_content.appendChild(network_table);
			network_promise.resolve();
		}
	);
}

function buildNetworkTable(){
	let networkTable = document.createElement("table");
	networkTable.className = "info_box_table";
	let tr = networkTable.insertRow(0);
	tr.className = "info_box_table_element";
	let headers = ["Connection Name","Connection State","Type","MAC","IPv4","IPv6","PCI Slot","Bus Address"];
	for(let i = 0; i < headers.length; i++){
		th = document.createElement("th");
		th.className = "info_box_table_element";
		th.innerHTML = headers[i];
		tr.appendChild(th);
	}
	for(let i = 0; i < network_info["Network Info"].length; i++){
		tr = networkTable.insertRow(-1);
		tr.className = "info_box_table_element";
		for(let j = 0; j < headers.length; j++){
			let cell = tr.insertCell(-1);
			cell.className = "info_box_table_element";
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
	ramTable.className = "info_box_table";
	let tr = ramTable.insertRow(0);
	tr.className = "info_box_table_element";
	let headers = ["Locator","Type","Size","Manufacturer","Serial Number","Temperature"];
	for(let i = 0; i < headers.length; i++){
		th = document.createElement("th");
		th.className = "info_box_table_element";
		th.innerHTML = headers[i];
		tr.appendChild(th);
	}
	for(let i = 0; i < ram_info["Ram Info"].length; i++){
		tr = ramTable.insertRow(-1);
		tr.className = "info_box_table_element";
		for(let j = 0; j < headers.length; j++){
			let cell = tr.insertCell(-1);
			cell.className = "info_box_table_element";
			cell.innerHTML = ram_info["Ram Info"][i][headers[j]];
		}
	}
	return ramTable;
}

function buildCPUTable(){
	let cpuTable = document.createElement("table");
	cpuTable.className = "info_box_table"
	let colCount = 2;
	let headers = ["Socket","Model","Temperature"];
	let tr = cpuTable.insertRow(-1);
	tr.className = "info_box_table_element";
	for(let i = 0; i < headers.length; i++){
		th = document.createElement("th");
		th.className = "info_box_table_element";
		th.innerHTML = headers[i];
		tr.appendChild(th);
	}

	for(let i = 0; i < mobo_info["Motherboard Info"][1]["CPU"].length; i++){
		tr = cpuTable.insertRow(-1);
		tr.className = "info_box_table_element";
		let cell = tr.insertCell(-1);
		cell.className = "info_box_table_element";
		cell.innerHTML = mobo_info["Motherboard Info"][1]["CPU"][i]["Socket Designation"];
		cell = tr.insertCell(-1);
		cell.className = "info_box_table_element";
		cell.innerHTML = mobo_info["Motherboard Info"][1]["CPU"][i]["Version"];
		cell = tr.insertCell(-1);
		cell.className = "info_box_table_element";
		cell.innerHTML = (
			mobo_info["Motherboard Info"][2]["Sensor Readings"][0][
			mobo_info["Motherboard Info"][1]["CPU"][i]["Socket Designation"] + " Temp"
			]);
	}

	return cpuTable;
}

function buildPCITable(){
	let pciTable = document.createElement("table");
	pciTable.className = "info_box_table"
	let th = document.createElement("th");
	th.className = "info_box_table_element";
	let colCount = 5;
	let tr = pciTable.insertRow(-1);
	tr.className = "info_box_table_element";
	let headers = ["Slot","Type","Availability","Bus Address","Card Type","Card Model"];
	for(let i = 0; i < headers.length; i++){
		th = document.createElement("th");
		th.className = "info_box_table_element";
		th.innerHTML = headers[i];
		tr.appendChild(th);
	}

	for(let i = 0; i < pci_info["PCI Info"].length; i++){
		tr = pciTable.insertRow(-1);
		tr.className = "info_box_table_element";
		let cell = tr.insertCell(-1);
		cell.className = "info_box_table_element";
		if(pci_info["PCI Info"][i].hasOwnProperty("ID")){
			cell.innerHTML = "PCI Slot " + pci_info["PCI Info"][i]["ID"];
		}else{
			cell.innerHTML = pci_info["PCI Info"][i]["Designation"];
		}
		
		cell = tr.insertCell(-1);
		cell.className = "info_box_table_element";
		cell.innerHTML = pci_info["PCI Info"][i]["Type"];
		cell = tr.insertCell(-1);
		cell.className = "info_box_table_element";
		cell.innerHTML = pci_info["PCI Info"][i]["Current Usage"];
		cell = tr.insertCell(-1);
		cell.className = "info_box_table_element";
		cell.innerHTML = pci_info["PCI Info"][i]["Bus Address"];
		if(pci_info["PCI Info"][i].hasOwnProperty("Card Type") && pci_info["PCI Info"][i].hasOwnProperty("Card Model")){
				cell = tr.insertCell(-1);
				cell.className = "info_box_table_element";
				cell.innerHTML = pci_info["PCI Info"][i]["Card Type"];
				cell = tr.insertCell(-1);
				cell.className = "info_box_table_element";
				cell.innerHTML = pci_info["PCI Info"][i]["Card Model"];
		}else{
			//No card type
			cell = tr.insertCell(-1);
			cell.className = "info_box_table_element";
			cell.innerHTML = "-";
			cell = tr.insertCell(-1);
			cell.className = "info_box_table_element";
			cell.innerHTML = "-";
		}
	}
	return pciTable;
}

function cpu_refresh(){
	document.getElementById("cpu_content").innerHTML = "<div class=\"loader\"></div></div>"
	mobo_info = null;
	mobo();
}

function pci_refresh(){
	document.getElementById("pci_content").innerHTML = "<div class=\"loader\"></div></div>"
	pci_info = null;
	pci();
}

function ram_refresh(){
	document.getElementById("ram_content").innerHTML = "<div class=\"loader\"></div></div>"
	ram_info = null;
	ram();
}

function network_refresh(){
	document.getElementById("network_content").innerHTML = "<div class=\"loader\"></div></div>"
	network_info = null;
	network();
}

function get_server_info(){
	var server_info_promise = cockpit.defer();
	// get the server_info.json file
	var server_info_proc = cockpit.spawn(
		[
			"/usr/bin/pkexec",
			"/usr/share/cockpit/45drives-system/helper_scripts/server_info"
		], 
		{err: "out"}
	);
	server_info_proc.done(
			function(data){
				sys_info = JSON.parse(data);
				if(sys_info.hasOwnProperty("error_msg")){
					//we were unable to get the server_info.json file
					//inform the user that they need to run dmap. 
					server_info_promise.resolve();
					sys_info = null;
					if (confirm("/etc/45drives/server_info/server_info.json not found.\nThis file can be created by dmap.\n Would you like to run dmap?")) {
						var dmap_proc = cockpit.spawn(
							[
								"/usr/bin/pkexec",
								"/opt/45drives/tools/dmap"
							], 
							{err: "out"}
						);
						dmap_proc.done(
							function(data){
								server_info_promise.resolve();
								get_server_info();
							}
						);
						dmap_proc.fail(
							function(ex,data){
								alert("ERROR: dmap failed!\n" + data);
								server_info_promise.resolve();
								sys_manual_scan();
							}
						);
					}
					else{
						server_info_promise.resolve(); 
						sys_manual_scan();
					}
				}
				else{
					//we got the information successfully. 
					sys_info = JSON.parse(data);
					let sys_img = document.createElement("IMG");
					sys_img.src = product_img_lut[String(sys_info["Model"])];
					document.getElementById("sys_img_div").appendChild(sys_img);
					document.getElementById("sys_model").innerHTML = sys_info["Model"];
					document.getElementById("sys_chassis_size").innerHTML = sys_info["Chassis Size"];
					document.getElementById("sys_serial").innerHTML = sys_info["Serial"];
					document.getElementById("mobo_manufacturer").innerHTML = sys_info["Motherboard"]["Manufacturer"];
					document.getElementById("mobo_model").innerHTML = sys_info["Motherboard"]["Product Name"];
					document.getElementById("mobo_serial").innerHTML = sys_info["Motherboard"]["Serial Number"];
				}
				server_info_promise.resolve();
			}
		);
}

function main()
{
	root_check = cockpit.permission({ admin: true });
	root_check.addEventListener(
		"changed", 
		function() {
			if(root_check.allowed){
				//user is an administrator, start the module as normal
				if(!sys_info){get_server_info();}
				if(!mobo_info){mobo();}
				if(!pci_info){pci();}
				if(!ram_info){ram();}
				if(!network_info){network();}
				document.getElementById("cpu_refresh").addEventListener("click",cpu_refresh);
				document.getElementById("pci_refresh").addEventListener("click",pci_refresh);
				document.getElementById("ram_refresh").addEventListener("click",ram_refresh);
				document.getElementById("network_refresh").addEventListener("click",network_refresh);
			}else{
				//user is not an administrator, inform them of this by
				//displaying a message on each tab page. 
				let user_msg = document.getElementById("45drives_system_content");
				user_msg.innerHTML = "You must be an administrator to use this feature.";
			}
	 	}
	)
}

main();

cockpit.transport.wait(function() { });