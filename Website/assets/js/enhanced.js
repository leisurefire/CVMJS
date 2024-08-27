//script.js 包含基础的 css() 函数，welcome 框架函数，以及播报栏使用的 child 系列函数
var child = 1;
var change = 0;
var website = "https://www.baidu.com";
var child1_1 = "归来开放";
var child2_1 = "了解学业 | 学习编程 | 读懂设计";
var child1_2 = "好好学习";
var child2_2 = "这里是第二个友链的内容";
var child1_3 = "天天向上";
var child2_3 = "这里是第三个友链的内容";
var website_1 = "https://www.baidu.com";
var website_2 = "https://www.zhihu.com";
var website_3 = "https://tieba.baidu.com";
var timer;
var css = function(t, s) {
	s = document.createElement('style');
	s.innerText = t;
	document.body.appendChild(s);
}
var disappear = function() {
	$('.window').css('display', 'none');
	$('#about').css('position', 'relative');
	$('.follow').css('postion', 'relative');
	$('.friends').css('position', 'relative');
	$('.blog').css('position', 'relative');
	$('.footer').css('position', 'relative');
};
var appear = function() {
	$('.window').css('display', 'inline');
	$('#about').css('position', 'fixed');
	$('.follow').css('postion', 'fixed');
	$('.friends').css('position', 'fixed');
	$('.blog').css('position', 'fixed');
	$('.footer').css('position', 'fixed');
};

var jump = function() {
	window.open('' + website + '');
};

var menuchange = function() {
	if (change) {
		$('.menubutton_child1').css({
			"transform": "rotate(0)",
			"top": "36px",
			"right": "27px"
		});
		$('.menubutton_child2').css({
			"transform": "rotate(0)",
			"top": "45px",
			"right": "27px"
		});
		if (document.body.clientWidth < 1000) {
			$('header .main-menu ul').css('display', 'none');
			$('header .main-menu').css('top', '-20.1px');
			change = 0;
			return;
		}	
	}
	else{
		$('.menubutton_child1').css({
			"transform": "rotate(225deg)",
			"top": "40px",
			"right": "27px"
		});
		$('.menubutton_child2').css({
			"transform": "rotate(-225deg)",
			"top": "40px",
			"right": "27px"
		});
		$('header .main-menu ul').css('display', 'block');
		if (document.body.clientWidth < 1000) {
			$('header .main-menu').css('top', '-92px');
		}
		change = 1;
	}
}

var child_1 = function() {
	css('.friends .pagination .child_1:before, .friends .pagination .child_2:before,.friends .pagination .child_3:before{display:none}');
	if (document.body.clientWidth < 1000) {
		$('.childlogo').css('display', 'none');
	}
	$("#item_image").addClass("play1");
	$("#item_image").removeClass("play2");
	$("#item_image").removeClass("play3");
	$('#loading').css('display', 'none');
	clearTimeout(timer);
	setTimeout(function() {
		css('.friends .pagination .child_1:before{display:block}');
		if (document.body.clientWidth >= 1000) {
			$('#loading').css({
				"display": "inline",
				"opacity": "1",
				"left": "44px"
			});
		} else {
			$('#loading').css({
				"display": "inline",
				"opacity": "1",
				"left": "-4px"
			});
		}
		background_change();
	},
	1);

	if (child != 1) {
		$('#child1').css({
			"top": "140px",
			"opacity": "0"
		});
		$('#child2').css({
			"top": "240px",
			"opacity": "0"
		});
		$('.friends .friends-item .svgbackground').css({
			"margin-top": "-400px",
			"opacity": "0"
		});
		setTimeout(function() {
			$('.friends .friends-item .svgbackground').css({
				"margin-top": "600px",
				"opacity": "0"
			});
			background_change();
		},
		600);
		setTimeout(function() {
			document.getElementById("child1").innerHTML = child1_1;
			document.getElementById("child2").innerHTML = child2_1;
			$('#child1').css({
				"top": "80px",
				"opacity": "1"
			});
			$('#child2').css({
				"top": "170px",
				"opacity": "1"
			});
			document.getElementById("childlogo").setAttribute("d", "M249.740,5.694 L249.740,11.3 L258.853,11.3 L258.853,16.386 L249.740,16.386 L249.740,21.806 L261.594,21.806 L261.594,27.263 L243.348,27.263 L243.348,0.274 L261.665,0.274 L261.665,5.694 L249.740,5.694 ZM231.204,27.160 L225.148,18.822 L224.961,18.822 L221.571,18.869 L221.571,13.578 L224.326,13.550 C227.215,13.550 229.831,12.580 229.831,9.131 C229.831,6.722 228.90,5.517 224.326,5.517 L221.571,5.557 L221.571,0.95 L225.74,0.208 C227.341,0.208 229.316,0.576 230.998,1.314 C232.680,2.51 233.970,3.96 234.867,4.448 C235.764,5.800 236.213,7.361 236.213,9.131 C236.213,10.827 235.802,12.326 234.979,13.629 C234.157,14.932 232.809,16.571 231.264,17.333 L238.273,27.197 L231.204,27.160 ZM210.349,0.274 L216.741,0.274 L216.741,27.263 L210.349,27.263 L210.349,0.274 ZM191.136,10.902 L200.748,10.902 L200.748,16.358 L191.136,16.358 L191.136,27.263 L184.744,27.263 L184.744,0.274 L203.60,0.274 L203.60,5.1000 L191.136,5.1000 L191.136,10.902 ZM164.446,11.3 L173.559,11.3 L173.559,16.386 L164.446,16.386 L164.446,21.806 L176.300,21.806 L176.300,27.263 L158.54,27.263 L158.54,0.274 L176.371,0.274 L176.371,5.694 L164.446,5.694 L164.446,11.3 ZM144.318,27.160 L138.263,18.822 L138.76,18.822 L134.637,18.822 L134.637,27.197 L128.245,27.197 L128.245,0.208 L138.188,0.208 C140.455,0.208 142.430,0.576 144.113,1.314 C145.795,2.51 147.84,3.96 147.981,4.448 C148.879,5.800 149.327,7.361 149.327,9.131 C149.327,10.827 148.916,12.326 148.94,13.629 C147.271,14.932 145.923,16.571 144.378,17.333 L151.387,27.197 L144.318,27.160 ZM137.440,5.517 L134.637,5.517 L134.637,13.550 L137.440,13.550 C140.330,13.550 142.945,12.580 142.945,9.131 C142.945,6.722 141.204,5.517 137.440,5.517 ZM113.648,26.615 C111.841,27.537 109.691,27.998 107.200,27.998 C104.707,27.998 102.558,27.537 100.751,26.615 C98.944,25.693 97.561,24.372 96.602,22.652 C95.643,20.931 95.163,18.915 95.163,16.605 L95.163,0.529 L101.555,0.529 L101.555,14.263 C101.555,16.770 102.53,18.613 103.50,19.793 C103.415,20.225 104.582,21.864 107.200,21.864 C108.969,21.864 110.525,20.803 111.522,19.623 C112.518,18.443 112.844,16.770 112.844,14.263 L112.844,0.529 L119.236,0.529 L119.236,16.605 C119.236,18.915 118.756,20.931 117.797,22.652 C116.837,24.372 115.454,25.693 113.648,26.615 ZM78.497,11.395 C80.341,11.936 81.836,12.471 82.982,12.999 C84.128,13.528 84.952,14.150 85.800,15.207 C86.647,16.264 87.71,17.640 87.71,19.336 C86.620,26.556 79.142,27.743 76.777,27.743 C72.330,27.743 68.534,26.228 65.675,21.69 L70.488,18.156 C71.35,19.410 72.185,20.552 73.245,21.240 C74.304,21.928 75.425,22.161 77.2,22.272 C78.578,22.383 80.590,21.50 80.590,19.705 C80.590,19.66 80.366,18.538 79.917,18.119 C79.18,17.282 77.838,16.855 75.394,16.165 C73.600,15.649 72.136,15.133 71.2,14.617 C69.868,14.100 68.890,13.320 68.68,12.275 C67.245,11.231 66.834,9.860 66.834,8.164 C66.834,6.296 67.326,4.735 68.311,3.482 C69.295,2.228 70.578,1.294 72.161,0.679 C73.743,0.65 75.444,0.16 77.263,0.16 C81.265,0.245 86.2,2.117 87.19,5.989 L82.652,8.560 C82.652,8.560 81.526,5.399 76.889,5.399 C75.867,5.399 75.39,5.633 74.404,6.99 C73.1000,6.567 73.450,7.169 73.450,7.906 C73.450,8.472 73.668,8.951 74.105,9.344 C74.975,10.130 76.106,10.658 78.497,11.395 ZM52.667,0.274 L59.59,0.274 L59.59,27.263 L52.667,27.263 L52.667,0.274 ZM35.576,13.578 C35.576,11.844 37.2,10.438 38.761,10.438 C40.519,10.438 41.945,11.844 41.945,13.578 C41.945,15.312 40.519,16.718 38.761,16.718 C37.2,16.718 35.576,15.312 35.576,13.578 ZM32.370,11.3 L32.370,16.386 L32.370,21.806 L44.224,21.806 L44.224,27.263 L25.978,27.263 L25.978,0.274 L44.294,0.274 L44.294,5.694 L32.370,5.694 L32.370,11.3 ZM0.335,0.274 L6.727,0.274 L6.727,21.659 L18.726,21.659 L18.726,27.263 L0.335,27.263 L0.335,0.274 Z");
			$('.friends .friends-item .svgbackground').css({
				"margin-top": "-420px",
				"margin-left": "600px",
				"opacity": "1"
			});
		},
		601);
	};
	timer = setTimeout(function() {
		child_2();
		background_change();
	},
	6001);
	child = 1;
	website = website_1;
};
var child_2 = function() {
	css('.friends .pagination .child_1:before, .friends .pagination .child_2:before,.friends .pagination .child_3:before{display:none}');
	if (document.body.clientWidth < 1000) {
		$('.childlogo').css('display', 'none');
	}
	$("#item_image").addClass("play2");
	$("#item_image").removeClass("play1");
	$("#item_image").removeClass("play3");
	$('#loading').css('display', 'none');
	clearTimeout(timer);
	setTimeout(function() {
		css('.friends .pagination .child_2:before{display:block}');
		if (document.body.clientWidth >= 1000) {
			$('#loading').css({
				"display": "inline",
				"opacity": "1",
				"left": "92px"
			});
		} else {
			$('#loading').css({
				"display": "inline",
				"opacity": "1",
				"left": "-4px"
			});
		}
		background_change();
	},
	1);

	if (child != 2) {
		$('#child1').css({
			"top": "140px",
			"opacity": "0"
		});
		$('#child2').css({
			"top": "240px",
			"opacity": "0"
		});
		$('.friends .friends-item .svgbackground').css({
			"margin-top": "-400px",
			"opacity": "0"
		});
		setTimeout(function() {
			$('.friends .friends-item .svgbackground').css({
				"margin-top": "600px",
				"opacity": "0"
			});
			background_change();
		},
		600);
		setTimeout(function() {
			document.getElementById("child1").innerHTML = child1_2;
			document.getElementById("child2").innerHTML = child2_2;
			$('#child1').css({
				"top": "80px",
				"opacity": "1"
			});
			$('#child2').css({
				"top": "170px",
				"opacity": "1"
			});
			document.getElementById("childlogo").setAttribute("d", "M249.740,5.694 L249.740,11.3 L258.853,11.3 L258.853,16.386 L249.740,16.386 L249.740,21.806 L261.594,21.806 L261.594,27.263 L243.348,27.263 L243.348,0.274 L261.665,0.274 L261.665,5.694 L249.740,5.694 ZM231.204,27.160 L225.148,18.822 L224.961,18.822 L221.571,18.869 L221.571,13.578 L224.326,13.550 C227.215,13.550 229.831,12.580 229.831,9.131 C229.831,6.722 228.90,5.517 224.326,5.517 L221.571,5.557 L221.571,0.95 L225.74,0.208 C227.341,0.208 229.316,0.576 230.998,1.314 C232.680,2.51 233.970,3.96 234.867,4.448 C235.764,5.800 236.213,7.361 236.213,9.131 C236.213,10.827 235.802,12.326 234.979,13.629 C234.157,14.932 232.809,16.571 231.264,17.333 L238.273,27.197 L231.204,27.160 ZM210.349,0.274 L216.741,0.274 L216.741,27.263 L210.349,27.263 L210.349,0.274 ZM191.136,10.902 L200.748,10.902 L200.748,16.358 L191.136,16.358 L191.136,27.263 L184.744,27.263 L184.744,0.274 L203.60,0.274 L203.60,5.1000 L191.136,5.1000 L191.136,10.902 ZM164.446,11.3 L173.559,11.3 L173.559,16.386 L164.446,16.386 L164.446,21.806 L176.300,21.806 L176.300,27.263 L158.54,27.263 L158.54,0.274 L176.371,0.274 L176.371,5.694 L164.446,5.694 L164.446,11.3 ZM144.318,27.160 L138.263,18.822 L138.76,18.822 L134.637,18.822 L134.637,27.197 L128.245,27.197 L128.245,0.208 L138.188,0.208 C140.455,0.208 142.430,0.576 144.113,1.314 C145.795,2.51 147.84,3.96 147.981,4.448 C148.879,5.800 149.327,7.361 149.327,9.131 C149.327,10.827 148.916,12.326 148.94,13.629 C147.271,14.932 145.923,16.571 144.378,17.333 L151.387,27.197 L144.318,27.160 ZM137.440,5.517 L134.637,5.517 L134.637,13.550 L137.440,13.550 C140.330,13.550 142.945,12.580 142.945,9.131 C142.945,6.722 141.204,5.517 137.440,5.517 ZM113.648,26.615 C111.841,27.537 109.691,27.998 107.200,27.998 C104.707,27.998 102.558,27.537 100.751,26.615 C98.944,25.693 97.561,24.372 96.602,22.652 C95.643,20.931 95.163,18.915 95.163,16.605 L95.163,0.529 L101.555,0.529 L101.555,14.263 C101.555,16.770 102.53,18.613 103.50,19.793 C103.415,20.225 104.582,21.864 107.200,21.864 C108.969,21.864 110.525,20.803 111.522,19.623 C112.518,18.443 112.844,16.770 112.844,14.263 L112.844,0.529 L119.236,0.529 L119.236,16.605 C119.236,18.915 118.756,20.931 117.797,22.652 C116.837,24.372 115.454,25.693 113.648,26.615 ZM78.497,11.395 C80.341,11.936 81.836,12.471 82.982,12.999 C84.128,13.528 84.952,14.150 85.800,15.207 C86.647,16.264 87.71,17.640 87.71,19.336 C86.620,26.556 79.142,27.743 76.777,27.743 C72.330,27.743 68.534,26.228 65.675,21.69 L70.488,18.156 C71.35,19.410 72.185,20.552 73.245,21.240 C74.304,21.928 75.425,22.161 77.2,22.272 C78.578,22.383 80.590,21.50 80.590,19.705 C80.590,19.66 80.366,18.538 79.917,18.119 C79.18,17.282 77.838,16.855 75.394,16.165 C73.600,15.649 72.136,15.133 71.2,14.617 C69.868,14.100 68.890,13.320 68.68,12.275 C67.245,11.231 66.834,9.860 66.834,8.164 C66.834,6.296 67.326,4.735 68.311,3.482 C69.295,2.228 70.578,1.294 72.161,0.679 C73.743,0.65 75.444,0.16 77.263,0.16 C81.265,0.245 86.2,2.117 87.19,5.989 L82.652,8.560 C82.652,8.560 81.526,5.399 76.889,5.399 C75.867,5.399 75.39,5.633 74.404,6.99 C73.1000,6.567 73.450,7.169 73.450,7.906 C73.450,8.472 73.668,8.951 74.105,9.344 C74.975,10.130 76.106,10.658 78.497,11.395 ZM52.667,0.274 L59.59,0.274 L59.59,27.263 L52.667,27.263 L52.667,0.274 ZM35.576,13.578 C35.576,11.844 37.2,10.438 38.761,10.438 C40.519,10.438 41.945,11.844 41.945,13.578 C41.945,15.312 40.519,16.718 38.761,16.718 C37.2,16.718 35.576,15.312 35.576,13.578 ZM32.370,11.3 L32.370,16.386 L32.370,21.806 L44.224,21.806 L44.224,27.263 L25.978,27.263 L25.978,0.274 L44.294,0.274 L44.294,5.694 L32.370,5.694 L32.370,11.3 ZM0.335,0.274 L6.727,0.274 L6.727,21.659 L18.726,21.659 L18.726,27.263 L0.335,27.263 L0.335,0.274 Z");
			$('.friends .friends-item .svgbackground').css({
				"margin-top": "-420px",
				"margin-left": "600px",
				"opacity": "1"
			});
		},
		601);
	};
	timer = setTimeout(function() {
		child_3();
		background_change();
	},
	6001);
	child = 2;
	website = website_2;
};
var child_3 = function() {
	css('.friends .pagination .child_1:before, .friends .pagination .child_2:before,.friends .pagination .child_3:before{display:none}');
	if (document.body.clientWidth < 1000) {
		$('.childlogo').css('display', 'none');
	}
	$("#item_image").addClass("play3");
	$("#item_image").removeClass("play1");
	$("#item_image").removeClass("play2");
	$('#loading').css('display', 'none');
	clearTimeout(timer);
	setTimeout(function() {
		css('.friends .pagination .child_3:before{display:block}');
		if (document.body.clientWidth >= 1000) {
			$('#loading').css({
				"display": "inline",
				"opacity": "1",
				"left": "140px"
			});
		} else {
			$('#loading').css({
				"display": "inline",
				"opacity": "1",
				"left": "-4px"
			});
		}
		background_change();
	},
	1);

	if (child != 3) {
		$('#child1').css({
			"top": "140px",
			"opacity": "0"
		});
		$('#child2').css({
			"top": "240px",
			"opacity": "0"
		});
		$('.friends .friends-item .svgbackground').css({
			"margin-top": "-400px",
			"opacity": "0"
		});
		setTimeout(function() {
			$('.friends .friends-item .svgbackground').css({
				"margin-top": "600px",
				"opacity": "0"
			});
			background_change();
		},
		600);
		setTimeout(function() {
			document.getElementById("child1").innerHTML = child1_3;
			document.getElementById("child2").innerHTML = child2_3;
			$('#child1').css({
				"top": "80px",
				"opacity": "1"
			});
			$('#child2').css({
				"top": "170px",
				"opacity": "1"
			});
			document.getElementById("childlogo").setAttribute("d", "M249.740,5.694 L249.740,11.3 L258.853,11.3 L258.853,16.386 L249.740,16.386 L249.740,21.806 L261.594,21.806 L261.594,27.263 L243.348,27.263 L243.348,0.274 L261.665,0.274 L261.665,5.694 L249.740,5.694 ZM231.204,27.160 L225.148,18.822 L224.961,18.822 L221.571,18.869 L221.571,13.578 L224.326,13.550 C227.215,13.550 229.831,12.580 229.831,9.131 C229.831,6.722 228.90,5.517 224.326,5.517 L221.571,5.557 L221.571,0.95 L225.74,0.208 C227.341,0.208 229.316,0.576 230.998,1.314 C232.680,2.51 233.970,3.96 234.867,4.448 C235.764,5.800 236.213,7.361 236.213,9.131 C236.213,10.827 235.802,12.326 234.979,13.629 C234.157,14.932 232.809,16.571 231.264,17.333 L238.273,27.197 L231.204,27.160 ZM210.349,0.274 L216.741,0.274 L216.741,27.263 L210.349,27.263 L210.349,0.274 ZM191.136,10.902 L200.748,10.902 L200.748,16.358 L191.136,16.358 L191.136,27.263 L184.744,27.263 L184.744,0.274 L203.60,0.274 L203.60,5.1000 L191.136,5.1000 L191.136,10.902 ZM164.446,11.3 L173.559,11.3 L173.559,16.386 L164.446,16.386 L164.446,21.806 L176.300,21.806 L176.300,27.263 L158.54,27.263 L158.54,0.274 L176.371,0.274 L176.371,5.694 L164.446,5.694 L164.446,11.3 ZM144.318,27.160 L138.263,18.822 L138.76,18.822 L134.637,18.822 L134.637,27.197 L128.245,27.197 L128.245,0.208 L138.188,0.208 C140.455,0.208 142.430,0.576 144.113,1.314 C145.795,2.51 147.84,3.96 147.981,4.448 C148.879,5.800 149.327,7.361 149.327,9.131 C149.327,10.827 148.916,12.326 148.94,13.629 C147.271,14.932 145.923,16.571 144.378,17.333 L151.387,27.197 L144.318,27.160 ZM137.440,5.517 L134.637,5.517 L134.637,13.550 L137.440,13.550 C140.330,13.550 142.945,12.580 142.945,9.131 C142.945,6.722 141.204,5.517 137.440,5.517 ZM113.648,26.615 C111.841,27.537 109.691,27.998 107.200,27.998 C104.707,27.998 102.558,27.537 100.751,26.615 C98.944,25.693 97.561,24.372 96.602,22.652 C95.643,20.931 95.163,18.915 95.163,16.605 L95.163,0.529 L101.555,0.529 L101.555,14.263 C101.555,16.770 102.53,18.613 103.50,19.793 C103.415,20.225 104.582,21.864 107.200,21.864 C108.969,21.864 110.525,20.803 111.522,19.623 C112.518,18.443 112.844,16.770 112.844,14.263 L112.844,0.529 L119.236,0.529 L119.236,16.605 C119.236,18.915 118.756,20.931 117.797,22.652 C116.837,24.372 115.454,25.693 113.648,26.615 ZM78.497,11.395 C80.341,11.936 81.836,12.471 82.982,12.999 C84.128,13.528 84.952,14.150 85.800,15.207 C86.647,16.264 87.71,17.640 87.71,19.336 C86.620,26.556 79.142,27.743 76.777,27.743 C72.330,27.743 68.534,26.228 65.675,21.69 L70.488,18.156 C71.35,19.410 72.185,20.552 73.245,21.240 C74.304,21.928 75.425,22.161 77.2,22.272 C78.578,22.383 80.590,21.50 80.590,19.705 C80.590,19.66 80.366,18.538 79.917,18.119 C79.18,17.282 77.838,16.855 75.394,16.165 C73.600,15.649 72.136,15.133 71.2,14.617 C69.868,14.100 68.890,13.320 68.68,12.275 C67.245,11.231 66.834,9.860 66.834,8.164 C66.834,6.296 67.326,4.735 68.311,3.482 C69.295,2.228 70.578,1.294 72.161,0.679 C73.743,0.65 75.444,0.16 77.263,0.16 C81.265,0.245 86.2,2.117 87.19,5.989 L82.652,8.560 C82.652,8.560 81.526,5.399 76.889,5.399 C75.867,5.399 75.39,5.633 74.404,6.99 C73.1000,6.567 73.450,7.169 73.450,7.906 C73.450,8.472 73.668,8.951 74.105,9.344 C74.975,10.130 76.106,10.658 78.497,11.395 ZM52.667,0.274 L59.59,0.274 L59.59,27.263 L52.667,27.263 L52.667,0.274 ZM35.576,13.578 C35.576,11.844 37.2,10.438 38.761,10.438 C40.519,10.438 41.945,11.844 41.945,13.578 C41.945,15.312 40.519,16.718 38.761,16.718 C37.2,16.718 35.576,15.312 35.576,13.578 ZM32.370,11.3 L32.370,16.386 L32.370,21.806 L44.224,21.806 L44.224,27.263 L25.978,27.263 L25.978,0.274 L44.294,0.274 L44.294,5.694 L32.370,5.694 L32.370,11.3 ZM0.335,0.274 L6.727,0.274 L6.727,21.659 L18.726,21.659 L18.726,27.263 L0.335,27.263 L0.335,0.274 Z");
			$('.friends .friends-item .svgbackground').css({
				"margin-top": "-420px",
				"margin-left": "600px",
				"opacity": "1"
			});
		},
		601);
	};
	timer = setTimeout(function() {
		child_1();
		background_change();
	},
	6001);
	child = 3;
	website = website_3;
};

var timerpause = function() {
	clearTimeout(timer);
	$(".friends .pagination .loadingchild").css({
		"animation-play-state": "paused"
	});
	css('.friends .pagination .child_' + child + ':before{animation-play-state:paused;}');
};

var timerrunning = function() {
	switch (child) {
	case 1:
		child_1();
		break;
	case 2:
		child_2();
		break;
	case 3:
		child_3();
		break;
	};
	$(".friends .pagination .loadingchild").css({
		"animation-play-state":
		"running"
	});
	css('.friends .pagination .child_' + child + ':before{animation-play-state:running;}');
};

var background_change = function() {
	if (document.body.clientWidth >= 945) {
		css('#child_1{background:transparent;}');
		css('#child_2{background:transparent;}');
		css('#child_3{background:transparent;}');
		css('#child_' + child + '{background:#000;}');
	} else {
		css('#child_1{background:#f5f5f5;}');
		css('#child_2{background:#f5f5f5;}');
		css('#child_3{background:#f5f5f5;}');
	}
};

var background_on1 = function() {
	css('#child_1{background:#000;}');
};

var background_out1 = function() {
	if (child != 1) {
		if (document.body.clientWidth >= 945) {
			css('#child_1{background:transparent;}');
		} else {
			css('#child_1{background:#f5f5f5;}');
		}
	};
};

var background_on2 = function() {
	css('#child_2{background:#000;}');
};

var background_out2 = function() {
	if (child != 2) {
		if (document.body.clientWidth >= 945) {
			css('#child_2{background:transparent;}');
		} else {
			css('#child_2{background:#f5f5f5;}');
		}
	};
};

var background_on3 = function() {
	css('#child_3{background:#000;}');
};

var background_out3 = function() {
	if (child != 3) {
		if (document.body.clientWidth >= 945) {
			css('#child_3{background:transparent;}');
		} else {
			css('#child_3{background:#f5f5f5;}');
		}
	};
};

var child_next = function() {
	switch (child) {
	case 1:
		child_2();
		break;
	case 2:
		child_3();
		break;
	case 3:
		child_1();
		break;
	}
};
var child_prev = function() {
	switch (child) {
	case 1:
		child_3();
		break;
	case 2:
		child_1();
		break;
	case 3:
		child_2();
		break;
	}
}