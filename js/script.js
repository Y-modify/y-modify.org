$(document).ready(function () {
  var imswiper = new Swiper ('#swiper-images', {
    speed: 600,
    initialSlide: 0,
    effect: 'fade',
    loop: true
  });
  var leswiper = new Swiper ('#swiper-letters', {
    pagination: '.swiper-pagination',
    speed: 600,
    initialSlide: 0,
    autoplay: 4000,
    autoplayDisableOnInteraction: false,
    loop: true
  });
  leswiper.on('slideNextStart', function(){
    imswiper.slideNext();
  });
  leswiper.on('slidePrevStart', function(){
    imswiper.slidePrev();
  });

  $('.description').flowtype({maxFont: 18});
  $('.swiper-letters-box').flowtype({minFont: 20});
});
