//custome.js 是网站的主函数，包含了滚动条监听，和平滑滚动

  $(document).on('ready', function() {
	'use strict';

  	//Pre-loader
	$(window).on('load', function() {
	 	$('.loader').fadeOut();
		$('.preloader').delay(250).fadeOut('slow');
		$('body').delay(250).css({'overflow':'visible'});
	 });
});
