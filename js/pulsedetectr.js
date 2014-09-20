/**
*pulse detector library (<insert link to githug repository>)
*
*Copyright (c) 2014, Ruben Michael Bloom
*
*<insert Copyright statements, including those for used pacakages>
*
*
*/

/*

Headtrackr library has this at the beginning - I do not yet understand why . . . 

(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define([],factory);
    } else {
        root.headtrackr = factory();
    }
}(this, function () {
/**
*/


/*TODO*/

//Need to fix hardcoding of video size (one variable in index file + argument checking in libraries?)
//At least change so that forehead capture rotates with head.
//Likely need to move to solely face recognition, no object tracking.



 (function(){


pulsedetectr = {};

/**
 * @construtor
 */
 pulsedetectr.Detector = function(params) {

	if (!params) params = {}; /* never know when you're going to need params */

	var iCanvasContext, oCanvasContext, oCanvas2Context,oChartCanvasCtx; //uneeded variable here . . .

//Okay, R eally gotta tidy these variables!!!!

	var start = Date.now(); //used to get timing info
	var fft = {};
	var Values = {};
	var myChart = {};
	var Head_Image = {};
	var FH_image = {};
	var HeadPos = {};
	var ppg_data = {};
	
	this.initialised = false;	
	this.GrnAverage = {};

			
	
	
	this.init = function(iCanvas,oCanvas,oCanvas2,oChart,params){
		if (!params) params = {};

		if(params.bufferSize === undefined) params.bufferSize = 256;
		if(params.sampleRate === undefined) params.sampleRate = 25;

		

		iCanvasContext = iCanvas.getContext('2d');
		oCanvasContext = oCanvas.getContext('2d');
		oCanvas2Context = oCanvas2.getContext('2d');
		//oChartCanvasCtx = oChart.getContext('2d');

		timer1 = new this.timer;
		timer1.init();
		fft = new FFT(params.bufferSize,params.sampleRate);
		Values.t = new CBuffer(params.bufferSize);
		Values.Y = new CBuffer(params.bufferSize);

		myChart = new SmoothieChart({millisPerPixel:38,interpolation:'bezier',scaleSmoothing:1,timestampFormatter:SmoothieChart.timeFormatter});
		myChart.streamTo(oChart,500);

		ppg_data = new TimeSeries();
		myChart.addTimeSeries(ppg_data, {lineWidth:2,strokeStyle:'#00ff00'})

		this.initialised = true;
	}


	this.run = function(event){

		var processed = {};
		var buffer_full = false;
		
		timer1.printnreset();
		HeadPos = forhead_extract();
		green_process();
		draw(HeadPos);

		var timenow = new Date().getTime();
		ppg_data.append(timenow, GrnAverage);
		Values.t.push(timenow);
		Values.Y.push(GrnAverage);


/*	this.plotSpectrum = function(canvas){

	//canvas.linechart(0,0,640,480,Values.)

	}*/
	


	}

	this.getpulse = function(){

		if(this.initialised==true){
		var bufferSize = Values.Y.length;


		//Linear interpolate values.
		if(ppg_data.data.length < bufferSize){
			buffer_full = false;
			return;
		}
		else{
			buffer_full = true;
		//Linear interpolate values.
			var tmp = lerp(Values.t.data,Values.Y.data);
			Values.even_t = tmp.X;
			Values.even_Y = tmp.Y;
			Values.mean = tmp.mean;

		

			fft.SAMPLERATE = (Values.t.data[bufferSize-1]-Values.t.data[0])/bufferSize;

			Values.Ylessmean = [];

			for(var i=0;i<bufferSize;i++){
			Values.Ylessmean[i] = Values.even_Y[i] - Values.mean; 
			}
			
			//Run FFT
			Values.Spectrum = fft.forward(Values.Ylessmean);

			//Now need to plot spectum!!!
		}

	}
}	




	// this.updatePlot = function(){


	// 	myChart.datasets[0].data = cbuffer.data;
	// 	myChart.update();
	// }
	

	forhead_extract = function(){

		head_pos = {};

		// x,y for centre; X,Y for top corner

		//Isolate Sub-Image
		head_pos.subimgw = event.width;
		head_pos.subimgh = event.height;
		head_pos.subimgX = (event.x - event.width/2) >> 0;
		head_pos.subimgY = (event.y - event.height/2) >> 0;

		//Offsets and multiplacative scalings for forehead

		//var fh_x = 1
		var fh_y = 0.18, //location multiplacative offset thingo
		fh_w = 0.25, //size of forehead relative to face - 25% width
		fh_h = 0.20; // 15% height
		fh_u = 0.25; //proportion of face up from cetre to forehead
		head_pos.ForeHead_h = event.width*fh_h;
		head_pos.ForeHead_w = event.height*fh_w;

		head_pos.ForeHead_x = event.x; //same x location
		head_pos.ForeHead_y = event.y - event.height*fh_u;
		head_pos.ForeHead_X = (head_pos.ForeHead_x - head_pos.ForeHead_w/2) >> 0;
		head_pos.ForeHead_Y = (head_pos.ForeHead_y - head_pos.ForeHead_h/2) >> 0;

		
		Head_Image = iCanvasContext.getImageData(head_pos.subimgX,head_pos.subimgY,head_pos.subimgw,head_pos.subimgh);
		FH_image = iCanvasContext.getImageData(head_pos.ForeHead_X,head_pos.ForeHead_Y,head_pos.ForeHead_w,head_pos.ForeHead_h);

		return head_pos;

	}


	var green_process = function(){

		//Now get green channel
		var dst = FH_image.data;
		var GreenChannelFH = [];
		var GrnSum = 0;
		/* Image Processing goes here */
		for (var i=0; i < dst.length; i += 4) {
			dst[i+0] = 0;
			dst[i+2] = 0;

			GreenChannelFH[(i/4)>>0] = dst[i+1];
			GrnSum += dst[i+1];						
		}
		
		GrnAverage = Math.round(GrnSum/GreenChannelFH.length);
		FH_image.data = dst;
	}

	var draw = function(hp){
		oCanvasContext.clearRect(0,0,640,480);

		oCanvasContext.putImageData(Head_Image,hp.subimgX,hp.subimgY); /*Place sub image of head on canvas*/
		oCanvasContext.putImageData(FH_image,10,10); /*Place sub image of forehead in corner of the canvas*/

				//Draw Rectangle around forehead.
		oCanvas2Context.strokeStyle = "#00CC00";
		oCanvas2Context.strokeRect(hp.ForeHead_X,hp.ForeHead_Y,hp.ForeHead_w,hp.ForeHead_h);

		oCanvasContext.strokeStyle = "#00CC00";
		oCanvasContext.strokeRect(hp.ForeHead_X,hp.ForeHead_Y,hp.ForeHead_w,hp.ForeHead_h);

	}


	this.timer = function(){
			
			var start, end, deltaT;
		
			this.init = function(){
				start = Date.now();	
			}

			this.printnreset = function(){
				end = Date.now();
				deltaT = end - start;
				console.log("deltaT = %d",deltaT);
				start = end;
			}

			return this;
		}

}



}());







// function range(start, count) {
//     if(arguments.length == 1) {
//         count = start;
//         start = 0;
//     }

//     var foo = [];
//     for (var i = 0; i < count; i++) {
//         foo.push(start + i);
//     }
//     return foo;
// }

// //linspace.js Generate linearly spaced vectors
// //Helena F. Deus (helenadeus@gmail.com)
// //200809



function lerp(x,y){
 	/*x and y must be arrays.

	x is input time, y is input values;
	Interp
	
	Interp.X are linearly spaced times.
	Interp.Y are interpolated values at linearly spaced times.

	Also returns mean of Y.

 	*/
 	
 	if (x.length != y.length){
 		console.error("lerp vectors are not of same size!")
 	}
 	
 	var Interp = {};
 	var sum = 0;
 	var N = x.length;
	

 	Interp.X = linspace(x[0],x[N-1],N);
 	Interp.Y = [];

 	for (var i = 0; i < N-1; i++){
 		Interp.Y[i] = y[i] + (y[i+1]-y[i])*((Interp.X[i]-x[i])/(x[i+1]-x[i]));
 		sum += Interp.Y[i];
  	}

  	Interp.mean = Math.round(sum/N);

  	return Interp;

	function linspace(d1,d2,n) {
	                
	        j=0;
	        var L = new Array();
	        
	        while (j<=(n-1)) {
	        
	                var tmp1 = j*(d2-d1)/(Math.floor(n)-1);
	                var tmp2 = Math.ceil((d1+tmp1)*10000)/10000;
	                L.push(tmp2);
	                j=j+1;
	        }
	        
	        return L;
	 }

}






 
