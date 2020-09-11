function motherboard()
{
	var dfd = cockpit.defer();
	var m_output = document.getElementById("motherboard_output");
	//m_output.innerHTML = "Motherboard";
	var proc = cockpit.spawn(
			[
				"/usr/bin/pkexec",
				"/usr/share/cockpit/hardware/helper_scripts/python_stdout_test"
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
