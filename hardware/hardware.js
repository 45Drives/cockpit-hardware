function test()
{
	var test = document.getElementById("test_output");
	test.innerhtml = "BUTTON WAS CLICKED";
}

function reset_test()
{
	var test = document.getElementById("test_output");
	test.innerhtml = " ";
}


function main()
{
	document.getElementById("clickme").addEventListener("click", test);
	document.getElementById("reset").addEventListener("click", reset_test);
}

main();

cockpit.transport.wait(function() { });
