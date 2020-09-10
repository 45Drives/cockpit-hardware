function motherboard()
{
	var test = document.getElementById("motherboard_output");
	test.innerHTML = "Motherboard";
}

function system()
{
	var test = document.getElementById("system_output");
	test.innerHTML = "System";
}

function rear()
{
	var test = document.getElementById("rear_output");
	test.innerHTML = "Rear";
}

function disks()
{
	var test = document.getElementById("disks_output");
	test.innerHTML = "Disks";
}

function power()
{
	var test = document.getElementById("power_output");
	test.innerHTML = "Power";
}

function main()
{
	document.getElementById("system_tab_link").addEventListener("click", system);
	document.getElementById("motherboard_tab_link").addEventListener("click", motherboard);
	document.getElementById("rear_tab_link").addEventListener("click", rear);
	document.getElementById("disks_tab_link").addEventListener("click", disks);
	document.getElementById("power_tab_link").addEventListener("click", power);
}

main();

cockpit.transport.wait(function() { });
