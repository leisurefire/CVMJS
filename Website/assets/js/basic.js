//basic.js 是网站的主函数，包含了滚动条监听，和平滑滚动

  $(document).on('ready', function() {
	'use strict';

  	//Pre-loader
	$(window).on('load', function() {
	//适用于触屏的滑动切换 carousel
		const carousel = document.getElementById("friends"); //目标
		let startTime = '';
		let startDistanceX = '';
		let startDistanceY = '';
		let endTime = '';
		let endDistanceX = '';
		let endDistanceY = '';
		let moveTime = '';
		let moveDistanceX = '';
		let moveDistanceY = '';

		carousel.addEventListener("touchstart", (a) => {
			startTime = new Date().getTime();
			startDistanceX = a.touches[0].screenX;
			startDistanceY = a.touches[0].screenY;
		});

		carousel.addEventListener("touchend", (a) => {
			endTime = new Date().getTime();
			endDistanceX = a.changedTouches[0].screenX;
			endDistanceY = a.changedTouches[0].screenY;
			moveTime = endTime - startTime;
			moveDistanceX = startDistanceX - endDistanceX;
			moveDistanceY = startDistanceY - endDistanceY;
			if (Math.abs(moveDistanceX) > 42 && moveTime < 600) {
				moveDistanceX > 0 ? child_next() : child_prev();
			}
		});

	$('.loader').fadeOut();
	$('.preloader').delay(250).fadeOut('slow');
	$('body').delay(250).css({'overflow':'visible'});
	fixed_top.addClass("menu-bg");
	fixed_top.removeClass("menu-bg1");
	if( $(this).scrollTop() > x  ){
		fixed_top.addClass("menu-bg1");
		fixed_top.removeClass("menu-bg");
	}
	child_1();
	if(document.body.clientWidth <= 1000){
		$('.zhihu').css('margin-top','0');
		$('.bilibili').css('margin-top','5%');
		}
	 });
  	document.getElementsByTagName('img')[0].onmousedown = function(e){
		e.preventDefault();
	};

$(document).bind("keydown", "esc", function (ev) { disappear();return false; });

	//滚动条监听
	let BasicWidth = document.body.clientWidth; 
	let a = document.getElementById('banner').clientHeight;
	let b = document.getElementById('about').clientHeight;
	let c = document.getElementById('follow').clientHeight;
	let e = document.getElementById('friends').clientHeight;
	let f = 10;
	let h = a+b+c;
	let g = a+b;
	let x = h+e;
  	let fixed_top = $(".main-menu");

	$(window).on('scroll', function(){
		if( $(this).scrollTop() === 0 ){
			css('.welcome {top:calc( 2.8% + 32px);}');
			css('.menubutton{display:inline;}');
			}
		if( $(this).scrollTop() !==0  && $(this).scrollTop() <= a ){
				if(document.body.clientWidth >= 1000){
				$('.zhihu').css('margin-top','240px');
				$('.bilibili').css('margin-top','480px');
	 			}else{
				$('header .main-menu ul').css('display','none');
				$('header .main-menu').css('top','-20.1px');
				$('.welcome').css('top','-120px');
				$('.welcome').css('display','none');
				change = 0;
				$('.menubutton_child1').css({
					"transform":"rotate(0)",
					"top":"36px",
					"right":"27px"
				});
				$('.menubutton_child2').css({
					"transform":"rotate(0)",
					"top":"45px",
					"right":"27px"
				});
			}
			if (document.body.clientWidth >= 1000){
			if( ($(this).scrollTop() /a) <= 0.1) {
				document.getElementById("rbanner").style.opacity = "0.9";
				$('#about .container').css('opacity','0');
				$('.rbanner').css('transform','scale(0.9)');
			}
			if( ($(this).scrollTop() /a) > 0.1 && ($(this).scrollTop() /a) <= 0.2) {
				document.getElementById("rbanner").style.opacity = "0.8";
				$('#about .container').css('opacity','0.08');
				$('.rbanner').css('transform','scale(0.92)');
			}
			if( ($(this).scrollTop() /a) > 0.2 && ($(this).scrollTop() /a) <= 0.3) {
				document.getElementById("rbanner").style.opacity = "0.7";
				$('#about .container').css('opacity','0.14');
				$('.rbanner').css('transform','scale(0.95)');
			}
			if( ($(this).scrollTop() /a) > 0.3 && ($(this).scrollTop() /a) <= 0.4) {
				document.getElementById("rbanner").style.opacity = "0.6";
				$('#about .container').css('opacity','0.28');
				$('.rbanner').css('transform','scale(1)');
			}
			if( ($(this).scrollTop() /a) > 0.4 && ($(this).scrollTop() /a) <= 0.5) {
				document.getElementById("rbanner").style.opacity = "0.5";
				$('#about .container').css('opacity','0.41');
				$('.rbanner').css('transform','scale(1.07)');
			}
			if( ($(this).scrollTop() /a) > 0.5 && ($(this).scrollTop() /a) <= 0.6) {
				document.getElementById("rbanner").style.opacity = "0.4";
				$('#about .container').css('opacity','0.54');
				$('.rbanner').css('transform','scale(1.16)');
			}
			if( ($(this).scrollTop() /a) > 0.6 && ($(this).scrollTop() /a) <= 0.7) {
				document.getElementById("rbanner").style.opacity = "0.3";
				$('#about .container').css('opacity','0.68');
				$('.rbanner').css('transform','scale(1.2)');
			}
			if( ($(this).scrollTop() /a) > 0.7 && ($(this).scrollTop() /a) <= 0.8) {
				document.getElementById("rbanner").style.opacity = "0.2";
				$('#about .container').css('opacity','0.82');
				$('.rbanner').css('transform','scale(1.2)');
			}
			if( ($(this).scrollTop() /a) > 0.8 && ($(this).scrollTop() /a) <= 0.9) {
				document.getElementById("rbanner").style.opacity = "0.1";
				$('#about .container').css('opacity','0.90');
				$('.rbanner').css('transform','scale(1.2)');
			}
			if( ($(this).scrollTop() /a) >= 0.9) {
				document.getElementById("rbanner").style.opacity = "0";
				$('#about .container').css('opacity','1');
				$('.rbanner').css('transform','scale(1.2)');
			}}
			fixed_top.removeClass("menu-bg");
			fixed_top.removeClass("menu-bg1");
			$('header .main-menu').css('transition','all 0s');
		}
		if( $(this).scrollTop() > a && $(this).scrollTop() <=g ){
			let scroll_follow = (($(this).scrollTop() - a) /  (g - a));
			fixed_top.addClass("menu-bg");
			fixed_top.removeClass("menu-bg1");
			$('.bundle').css('opacity','1');
			if (document.body.clientWidth >= 1000){
				$('header .main-menu').css('transition','all 0s');
			}
			$('.menubutton').css('display','inline');
			if (document.body.clientWidth >= 1000){
			if(scroll_follow <= 0.4){
				$('.zhihu').css('margin-top','200px');
				$('.bilibili').css('margin-top','400px');
			}
			if( scroll_follow > 0.4 && scroll_follow <= 0.5){
				$('.zhihu').css('margin-top','160px');
				$('.bilibili').css('margin-top','320px');
			}
			if( scroll_follow > 0.5 && scroll_follow <= 0.6){
				$('.zhihu').css('margin-top','120px');
				$('.bilibili').css('margin-top','240px');
			}
			if( scroll_follow > 0.6 && scroll_follow <= 0.7){
				$('.zhihu').css('margin-top','80px');
				$('.bilibili').css('margin-top','160px');
			}
			if( scroll_follow > 0.7 && scroll_follow <= 0.8){
				$('.zhihu').css('margin-top','40px');
				$('.bilibili').css('margin-top','80px');
			}
			if( scroll_follow > 0.8 && scroll_follow <= 1){
				$('.zhihu').css('margin-top','0');
				$('.bilibili').css('margin-top','0');
			}}
		}
		if( $(this).scrollTop() >g && $(this).scrollTop() <h -10 ){
			fixed_top.addClass("menu-bg");
			fixed_top.removeClass("menu-bg1");
			$('.bundle').css('opacity','1');
			if (document.body.clientWidth >= 1000){
			$('header .main-menu').css('transition','all 0s');
			$('.zhihu').css('margin-top','0');
			$('.bilibili').css('margin-top','0');
		};}
    if( $(this).scrollTop() > h -10 && $(this).scrollTop() <x ){
			fixed_top.addClass("menu-bg");
			fixed_top.removeClass("menu-bg1");
			if (document.body.clientWidth >= 1000){
				$('header .main-menu').css('transition','all .6s');
			};
		}
		if( $(this).scrollTop() > x  ){
			fixed_top.addClass("menu-bg1");
			fixed_top.removeClass("menu-bg");
			if (document.body.clientWidth >= 1000){
				$('header .main-menu').css('transition','all .6s');
			}
		}	
	}); 

/*banner实时模糊。占用内存过大   
	$(window).on('scroll', function(){
      if( $(this).scrollTop() < a ){
        	css('.rbanner:after{content: "";width:100%;height:100%;position: absolute;left:0;top:0;background: inherit;z-index: 2;filter: blur('+ $(this).scrollTop() /20 +'px)}');
      }
	}); 
*/	
if (document.body.clientWidth >= 1000){
	$(window).on('scroll', function(){
      if( $(this).scrollTop() < a-254 ){
      	$('.maintitle').css('transform','scale('+ ( 1 - ((($(this).scrollTop()) /a)*1) ) +')');
      	$('.maintitle').css('top',''+ ( 264 + $(this).scrollTop()*1.1) +'px');
		}
	});
}
	else{
		$(window).on('scroll', function(){
		  if( $(this).scrollTop() < a){
		  	$('.maintitle').css('top',''+ ( 0 + $(this).scrollTop()*0.8) +'px');
			}
		});
      	$('.maintitle').css({
		"width":"1065px",
		"left":"-532.5px",
		"right":"-532.5px"});
      };

	$(window).on('scroll', function(){
      if( $(this).scrollTop() > a ){
			$("header .main-menu .navbar-brand").css("border-radius","0");
			$("header .main-menu ul").css("background-color","transparent");
			$(".menubutton").css("display","block");
      }else {
			$("header .main-menu .navbar-brand").css("border-radius","0 0 18px 18px");
			$("header .main-menu ul").css("background-color","#fff");
			$(".menubutton").css("display","none");
          if( $(this).scrollTop() <=10){
			$(".menubutton").css("display","block");
			$("header .main-menu .navbar-brand").css("border-radius","0");
      		fixed_top.addClass("menu-bg");
			fixed_top.removeClass("menu-bg1");
		}
     } 
	}); 

	window.addEventListener('resize', ()=>{
		let CurrentWidth = document.body.clientWidth;
		if (BasicWidth !== CurrentWidth){
			location.reload();
			BasicWidth = document.body.clientWidth;
		}
	})

	//平滑跳转组件
	$('a.page-scroll').on('click', function(event) {
		let $anchor = $(this);
		$('html, body').stop().animate({
			scrollTop: $($anchor.attr('href')).offset().top
		}, 1500, 'easeInOutExpo');
		event.preventDefault();
	});
});
