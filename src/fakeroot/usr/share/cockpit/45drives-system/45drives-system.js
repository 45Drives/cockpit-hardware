let sys_info = null;
let mobo_info = null;
let cpu_info = null;
let pci_info = null;
let ram_info = null;
let network_info = null;

function sys(){
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
		product_img_lut["Storinator-AV15-Generic"] = "img/products/storinatorAV15.jpg";
		product_img_lut["Storinator-Q30-Generic"] = "img/products/storinatorQ30.jpg";
		product_img_lut["Storinator-S45-Generic"] = "img/products/storinatorS45.jpg";
		product_img_lut["Storinator-XL60-Generic"] = "img/products/storinatorXL60.jpg";

	if(!sys_info){
		//var dfd = cockpit.defer();
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
				document.getElementById("sys_img").appendChild(sys_img);

				document.getElementById("sys_model").innerHTML = sys_info["System"][product_idx]["Product"][0]["System Model"];
				document.getElementById("sys_chassis_size").innerHTML = sys_info["System"][product_idx]["Product"][0]["Chassis Size"];
				document.getElementById("sys_serial").innerHTML = sys_info["System"][ipmi_idx]["IPMI Information"][0]["Product Serial"];
				//dfd.resolve();
			}
		);
	}
}

function main()
{
	root_check = cockpit.permission({ admin: true });
	root_check.addEventListener(
		"changed", 
		function() {
			if(root_check.allowed){
				//user is an administrator, start the module as normal
				if(!sys_info){sys();}
				//if(!mobo_info){mobo();}
				//if(!cpu_info){cpu();}
				//if(!pci_info){pci();}
				//if(!ram_info){ram();}
				//if(!network_info){network();}
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