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


 (function(){


pulsedetectr = {};

/**
 * @construtor
 */
 pulsedetectr.Detector = function(params) {

	if (!params) params = {}; /* never know when you're going to need params */

	var iCanvasContext, oCanvasContext, oCanvas2Context,oChartCanvasCtx;


	var fft = {};
	var cbuffer = {};
	var myChart = {};
	var Head_Image = {};
	var FH_image = {};
	var HeadPos = {};
	var PlotData = {};
	
				var start = Date.now();

	this.GrnAverage = {};

	
	this.init = function(iCanvas,oCanvas,oCanvas2,oChartCanvas,params){
		if (!params) params = {};

		if(params.bufferSize === undefined) params.bufferSize = 256;
		if(params.sampleRate === undefined) params.sampleRate = 25;


		iCanvasContext = iCanvas.getContext('2d');
		oCanvasContext = oCanvas.getContext('2d');
		oCanvas2Context = oCanvas2.getContext('2d');
		oChartCanvasCtx = oChartCanvas.getContext('2d');

		fft = new FFT(params.bufferSize,params.sampleRate);
		cbuffer = new CBuffer(params.bufferSize);

		
		PlotData.labels = range(0,params.bufferSize);
		PlotData.datasets = [];
		PlotData.datasets[0] = {	
									label: "test label",
									fillColor: "rgba(0,0,0,0)",
									data: cbuffer.data //data: PlotData.labels //
								};

		myChart = new Chart(oChartCanvasCtx).Line(PlotData);


	}


	this.run = function(event){

		HeadPos = forhead_extract();
		green_process();
		draw(HeadPos);

		cbuffer.push(GrnAverage);

	}


	this.updatePlot = function(){
		myChart.datasets[0].data = cbuffer.data;
		myChart.update();
	}
	

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
		oCanvasContext.clearRect(0,0,320,240);

		oCanvasContext.putImageData(Head_Image,hp.subimgX,hp.subimgY); /*Place sub image of head on canvas*/
		oCanvasContext.putImageData(FH_image,10,10); /*Place sub image of forehead in corner of the canvas*/

				//Draw Rectangle around forehead.
		oCanvas2Context.strokeStyle = "#00CC00";
		oCanvas2Context.strokeRect(hp.ForeHead_X,hp.ForeHead_Y,hp.ForeHead_w,hp.ForeHead_h);

		oCanvasContext.strokeStyle = "#00CC00";
		oCanvasContext.strokeRect(hp.ForeHead_X,hp.ForeHead_Y,hp.ForeHead_w,hp.ForeHead_h);

	}

}

}());



/*var plot = function(context,data){








}*/


function range(start, count) {
    if(arguments.length == 1) {
        count = start;
        start = 0;
    }

    var foo = [];
    for (var i = 0; i < count; i++) {
        foo.push(start + i);
    }
    return foo;
}