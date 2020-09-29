
var hardware_info = null;
var mobo_info = null;
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
			mobo_img.setAttribute("style","display:none;");
			

  			mobo_json_path = "img/motherboard/" + String(mobo_info["Motherboard Info"][0]["Motherboard"][0]["Product Name"]) + ".json"
			launchP5JS();
  			dfd.resolve();
		}
	);
}

function launchP5JS(){
	var p5js = document.createElement('script');
	p5js.onload = function() {
	};
	p5js.src = "p5.js";
	document.getElementsByTagName('head')[0].appendChild(p5js);

	var sketch = document.createElement('script');
	sketch.onload = function() {	
	};
	sketch.src = "sketch.js";
	document.getElementsByTagName('head')[0].appendChild(sketch);
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
