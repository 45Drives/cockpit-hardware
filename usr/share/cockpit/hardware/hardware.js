
var hardware_info = null;
var mobo_info = null;
var mobo_json = null;
var mobo_json_path = null;

//listener for clicking on the motherboard tab
function motherboard()
{
	var dfd = cockpit.defer();
	var m_output = document.getElementById("motherboard_output");
	var mobo_img = document.getElementById("mobo_image");
	var proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/usr/share/cockpit/hardware/helper_scripts/motherboard"
			], 
			{err: "out"}
	);

	proc.stream(
		function(data)
		{
			/**************************************************************************/
			/* Example Output: /usr/share/cockpit/hardware/helper_scripts/system      */
			/**************************************************************************/
			//{
			//  "Motherboard Info": [
			//    {
			//      "Motherboard": [
			//        {
			//          "Manufacturer": "Supermicro",
			//          "Product Name": "X11DPL-i",
			//          "Serial Number": "WM19AS004505"
			//        }
			//      ]
			//    },
			//    {
			//      "CPU": [
			//        {
			//          "Socket Designation": "CPU1",
			//          "Version": "Intel(R) Xeon(R) Silver 4110 CPU @ 2.10GHz",
			//          "Max Speed": "4500 MHz"
			//        },
			//        {
			//          "Socket Designation": "CPU2",
			//          "Version": "Intel(R) Xeon(R) Silver 4110 CPU @ 2.10GHz",
			//          "Max Speed": "4500 MHz"
			//        }
			//      ]
			//    },
			//    {
			//      "Sensor Readings": [
			//        {
			//          "CPU1 Temp": "28.000(C)",
			//          "CPU2 Temp": "30.000(C)",
			//          "FAN2": "2700.000(RPM)",
			//          "FAN3": "3800.000(RPM)",
			//          "FAN4": "2700.000(RPM)",
			//          "FAN6": "3700.000(RPM)",
			//          "PW Consumption": "262.000(W)"
			//        }
			//      ]
			//    }
			//  ]
			//}
			mobo_info = JSON.parse(data);
			mobo_img.src = "img/motherboard/" + String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".png";
			mobo_img.setAttribute("usemap","#mobo_map");
			
			//var mobo_map = document.createElement("MAP");
			//mobo_map.setAttribute("id","mobo_map");
			//mobo_map.setAttribute("name","mobo_map");
			//m_output.appendChild(mobo_map);

			//var testMap = document.createElement("AREA");
  			//testMap.setAttribute("shape", "rect");
  			//testMap.setAttribute("coords", "0,0,200,200");
  			//testMap.setAttribute("href","www.google.com");
  			//document.getElementById("mobo_map").appendChild(testMap);

  			mobo_json_path = "img/motherboard/" + String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".json"
  			if(!mobo_json){
  				jsonLoadMotherboard(mobo_json_path);
  			}
  			dfd.resolve();
		}
	);
}

function jsonLoadMotherboard(fname){
	var dfd = cockpit.defer();
	var mobo_img = document.getElementById("mobo_image");
	var m_output = document.getElementById("motherboard_output");
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
			mobo_img.setAttribute("usemap","#mobo_map");

			var mobo_map = document.createElement("MAP");
			mobo_map.setAttribute("id","mobo_map");
			mobo_map.setAttribute("name","mobo_map");
			m_output.appendChild(mobo_map);

			var map_area;
			var coord_str_rect;
			var coord_str_circle;
			for(let i = 0; i < mobo_json.length; i++){
				if(mobo_json[i]["shape"] == "rect"){
					map_area = document.createElement("AREA");
					map_area.setAttribute("shape", "rect");
					coord_str_rect = (
						String(mobo_json[i]["x0"]) + "," +
						String(mobo_json[i]["y0"]) + "," +
						String(mobo_json[i]["width"] + mobo_json[i]["x0"]) + "," +
						String(mobo_json[i]["height"]+ mobo_json[i]["y0"])
					);
					map_area.setAttribute("coords",coord_str_rect);
					if(mobo_json[i]["type"] == "cpu"){
						map_area.addEventListener("mouseover",function(){cpu_mouseover(i);});
						map_area.addEventListener("mouseout",function(){clear_menu();});
					}
					else if(mobo_json[i]["type"] == "pci_8x_black"){
						map_area.addEventListener("mouseover",function(){pci_mouseover(i);});
						map_area.addEventListener("mouseout",function(){clear_menu();});
					}
					else if(mobo_json[i]["type"] == "dimm_blue"){
						map_area.addEventListener("mouseover",function(){dimm_mouseover(i);});
						map_area.addEventListener("mouseout",function(){clear_menu();});
					}
					document.getElementById("mobo_map").appendChild(map_area);
				}
			}
			dfd.resolve();
		}
	);
}

function clear_menu(){
	var component_output = document.getElementById("component_output");
	component_output.innerHTML = "";
}

function dimm_mouseover(mobo_json_idx){
	var component_output = document.getElementById("component_output");
	var msg = "dimm: " + String(mobo_json[mobo_json_idx]["id"]);
	component_output.innerHTML = msg;
}

function pci_mouseover(mobo_json_idx){
	var component_output = document.getElementById("component_output");
	var msg = "pci: " + String(mobo_json[mobo_json_idx]["id"]);
	component_output.innerHTML = msg;
}

function cpu_mouseover(mobo_json_idx){
	var component_output = document.getElementById("component_output");
	var msg = "CPU: " + String(mobo_json[mobo_json_idx]["id"]);
	component_output.innerHTML = msg;
}

//listener for clicking on the system tab
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

	var proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/usr/share/cockpit/hardware/helper_scripts/system"
			], 
			{err: "out"}
	);

	proc.stream(
		/**************************************************************************/
		/* Example Output: /usr/share/cockpit/hardware/helper_scripts/system      */
		/**************************************************************************/
		//{
		//  "System": [
		//    {
		//      "Product": [
		//        {
		//          "System Model": "Storinator Hybrid 32 (Turbo)",
		//          "Chassis Size": "S45",
		//          "ProductID": "Storinator-H32-S45-Turbo"
		//        }
		//      ]
		//    },
		//    {
		//      "Motherboard": [
		//        {
		//          "Manufacturer": "Supermicro",
		//          "Product Name": "X11DPL-i",
		//          "Serial Number": "WM19AS004505"
		//        }
		//      ]
		//    },
		//    {
		//      "CPU": [
		//        {
		//          "Socket Designation": "CPU1",
		//          "Version": "Intel(R) Xeon(R) Silver 4110 CPU @ 2.10GHz",
		//          "Max Speed": "4500 MHz"
		//        },
		//        {
		//          "Socket Designation": "CPU2",
		//          "Version": "Intel(R) Xeon(R) Silver 4110 CPU @ 2.10GHz",
		//          "Max Speed": "4500 MHz"
		//        }
		//      ]
		//    },
		//    {
		//      "HBA Cards": [
		//        {
		//          "Model": "SAS9305-16i",
		//          "PCI Address": "00:19:00:00"
		//        },
		//        {
		//          "Model": "SAS9305-24i",
		//          "PCI Address": "00:3b:00:00"
		//        },
		//        {
		//          "Model": "SAS9305-24i",
		//          "PCI Address": "00:d8:00:00"
		//        }
		//      ]
		//    },
		//    {
		//      "IPMI Information": [
		//        {
		//          "Product Manufacturer": "45Drives",
		//          "Product Name": "Storinator",
		//          "Product Part Number": "S45",
		//          "Product Serial": "12345-1"
		//        }
		//      ]
		//    }
		//  ]
		//}

		function(data)
		{
			var product_idx = 0; 
			var ipmi_idx = 4;
			hardware_info = JSON.parse(data);
			sys_img.src = product_img_lut[String(hardware_info["System"][product_idx]["Product"][0]["ProductID"])];
			sys_model.innerHTML = hardware_info["System"][product_idx]["Product"][0]["System Model"];
			sys_chassis_size.innerHTML = hardware_info["System"][product_idx]["Product"][0]["Chassis Size"];
			sys_product_serial.innerHTML = hardware_info["System"][ipmi_idx]["IPMI Information"][0]["Product Serial"];
			dfd.resolve();
		}
	);
}

//listener for clicking on the rear tab
function rear()
{
	var test = document.getElementById("rear_output");
	test.innerHTML = "Rear";
}

//listener for clicking on the disks tab
function disks()
{
	var test = document.getElementById("disks_output");
	test.innerHTML = "Disks";
}

//listener for clicking on the power tab
function power()
{
	var test = document.getElementById("power_output");
	test.innerHTML = "Power";
}

function main()
{
	if(!hardware_info){ system();}
	document.getElementById("system_tab_link").addEventListener("click", system);
	document.getElementById("motherboard_tab_link").addEventListener("click", motherboard);
	document.getElementById("rear_tab_link").addEventListener("click", rear);
	document.getElementById("disks_tab_link").addEventListener("click", disks);
	document.getElementById("power_tab_link").addEventListener("click", power);
}

main();

cockpit.transport.wait(function() { });
