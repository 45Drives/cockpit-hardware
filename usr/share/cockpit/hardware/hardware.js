
var hardware_info = null;

//listener for clicking on the motherboard tab
function motherboard()
{
	var dfd = cockpit.defer();
	var m_output = document.getElementById("motherboard_output");
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
			m_output.innerHTML = data;
			dfd.resolve();
		}
	);
}

//listener for clicking on the system tab
function system()
{
	var test = document.getElementById("system_output");
	test.innerHTML = "System";
	var dfd = cockpit.defer();
	var sys_output = document.getElementById("system_output");
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
			//TODO: fix the way that this is loaded in
			hardware_info = JSON.parse(data);
			var img = document.createElement("img");
			img.src = "img/products/" + hardware_info.System[0]["Product Image"];
			sys_output.innerHTML = 	hardware_info.System[0]["Product Info"];
			sys_output.appendChild(img);

			dfd.resolve();
		}
	);

	if(hardware_info)
	{

	}
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
	if(!hardware_info){ system(); }
	document.getElementById("system_tab_link").addEventListener("click", system);
	document.getElementById("motherboard_tab_link").addEventListener("click", motherboard);
	document.getElementById("rear_tab_link").addEventListener("click", rear);
	document.getElementById("disks_tab_link").addEventListener("click", disks);
	document.getElementById("power_tab_link").addEventListener("click", power);
}

main();

cockpit.transport.wait(function() { });
