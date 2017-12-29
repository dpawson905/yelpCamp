/* global jQuery */
/* global $ */
/* global location */
$( document ).ready(function() {

	jQuery(document).ready(function($) {

		$('.smoothscroll').on('click',function (e) {
			e.preventDefault();

			var target = this.hash,
			$target = $(target);

			$('html, body').stop().animate({
    		'scrollTop': $target.offset().top
			}, 800, 'swing', function () {
    		window.location.hash = target;
			});
		});

	});

	$('#check').change(function () {
		$('#btncheck').prop("disabled", !this.checked);
	}).change();

});