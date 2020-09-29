/*  
	Written By: Mark Hooper
	Date:				Feb 9, 2019
	Description:
		This was a way for me to get more practice identifying resistors
		using the 4 band color code. It was also a way for me to get some
		practice with p5.js..
		
		Thoughts for improvement:
		- Improve the shape of the resistor
		- Make the answer show up as if it was on a multi-meter
		- Add a 5-band color code version
		- Implement a mode where the inverse can be done (select the bands and get an answer)
		- Add a legend (with the ability to turn off)
		- Display the name of the color above each band
		- Add a gradient for the silver and gold bands
		- Color code the answer to indicate which band corresponds to a given digit.


*/

let band3 = [1,10,100,1000,10000,100000, 1000000,10000000, 100000000,1000000000, 0.1, 0.01];
let band4 = [" \u00b11%", " \u00b12%"," \u00b15%"," \u00b110%"]

let digitColor = [];
let tolColor = [];

let RevealAnswer = 0;		//Off by default

let bThickness = 20;		//Thickness of the bands
let bHeight = 80;				//Height of the bands
let bSpacing = 40;			//space between adjacent bands

let rX;						//starting position
let rY;						//starting position

//band starting positions
let band1x;
let band1y;
let band2x;
let band2y;
let mulx;
let muly;
let tolx;
let toly;

//These correspond to the indicies into the different color arrays
//The index is also used to calculate the answer
let b1;			//band 2 index
let b2;			//band 2 index
let m;			//multiplier index
let tol;		//tolerance index


function setup() {
  createCanvas(800, 400);
	let tolerance = [1,2,5,10];
	let colChart = [
		color(0),						//black = 0
		color(102,68,0),				//brown = 1
		color(255,42,0),				//red = 2
		color(255,170,0),				//orange = 3
		color(255,255,0),				//yellow = 4
		color(21,128,0),				//green = 5
		color(0,85,255),				//blue = 6
		color(170,0,255),				//purple = 7
		color(100,100,100),			    //grey = 8
		color(255,255,255),			    //white = 9
		color(255,215,55),	  	        //gold = 0.1
		color(201,192,187)			    //silver = 0.01
];
	
	rX = width/2 - 90;
	rY = 100;
	band1x = rX;
	band1y = rY;
	band2x = rX+bSpacing;
	band2y = rY;
	mulx = rX+(2*bSpacing);
	muly = rY;
	tolx = rX+(4*bSpacing);
	toly = rY;
	
	//digits and multipliers
	digitColor = colChart;
	
	//Tolerances can only be red, brown, silver or gold
	tolColor = [colChart[1],colChart[2],colChart[10],colChart[11]];
	
	//configure the starting color for each band
	b1 = int(random(0,10));		//band1 - most significant digit (0-9)
	b2 = int(random(0,10));		//band 2 (0-9)
	while( (b1 == 0) && (b2 == 0) ){
		//Make sure that we don't have a 0 Ohm Resistor
		b1 = int(random(0,10));		
		b2 = int(random(0,10));		
	}
	m = int(random(0,12));		//multiplier (0-12) (same as digits but with gold and silver)
	tol = int(random(0,4));		//tolerance band
	
}


function draw() {
	background(255);
	//Resistor Leads
	fill(120);
	rect(0,band1y+(bHeight-10)/2,width,10);
	
	//Resistor Body
	fill(255,255,230);
	rect(band1x-40,band1y,bThickness*13,bHeight,35);
	
	//BAND 1
	fill(digitColor[b1]);
	rect(band1x,band1y,bThickness,bHeight);
	
	//BAND 2
	fill(digitColor[b2]);
  rect(band2x,band2y,bThickness,bHeight);
	
	//MULTIPIER
	fill(digitColor[m]);
	rect(mulx,muly,bThickness,bHeight);
	
	//Tolerance
	fill(tolColor[tol]);
	rect(tolx,toly,bThickness,bHeight);
	
	var Resistance = float(((b1*10)+b2)*band3[m]);
	
	textSize(20);
	fill(0);	
	textAlign(CENTER);
	text("Flash Cards: Identify the Resistor",width/2, 40);
	text("Type 'a' to reveal answer",width/2, 290);
	text("Type 'r' to reset",width/2, 330);
	
	if(RevealAnswer){
		//User has typed 'a'
		textSize(32);
		fill(0);	
		textAlign(CENTER);
		
		if(Resistance >= 1000000000){
			//Giga Ohms
			Resistance = Resistance/1000000000;
			text(Resistance + " G\u03A9"+band4[tol],width/2, 250);
		}
		else if(Resistance >= 1000000){
			//Mega Ohms
			Resistance = Resistance/1000000;
			text(Resistance + " M\u03A9"+band4[tol],width/2, 250);
			
		}else if(Resistance >= 1000){
			//Kio Ohms
			Resistance = Resistance/1000;
			text(Resistance + " k\u03A9"+band4[tol],width/2, 250);
			
		}else{
			//Ohms, but limit the precision
			text(nf(Resistance,1,2) + " \u03A9"+band4[tol],width/2, 250);
		}
	}
	
	noLoop();
}

function keyPressed(){
	if(key == 'a'){
		//Reveal the answer to the user
		RevealAnswer = 1;
		redraw();
	
	}else if(key = 'r'){
		//Hide answer, and get new band values
		RevealAnswer = 0;
		b1 = int(random(0,10));
		b2 = int(random(0,10));
		while( (b1 == 0) && (b2 == 0) ){
			//Make sure that we don't have a 0 Ohm Resistor
			b1 = int(random(0,10));		
			b2 = int(random(0,10));		
		}
		m = int(random(0,12));
		tol = int(random(0,4));
		redraw();
	}
}


cockpit.transport.wait(function() { });