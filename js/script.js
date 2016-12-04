$(function(){
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

  var elements = $(".scroll-animation");
  elements.addClass('js-fade-element-hide');

  $(window).scroll(function() {
    elements.each(function(index, element){
      if( $(element).length > 0 ) {
        var elementTopToPageTop = $(element).offset().top;
        var windowTopToPageTop = $(window).scrollTop();
        var windowInnerHeight = window.innerHeight;
        var elementTopToWindowTop = elementTopToPageTop - windowTopToPageTop;
        var elementTopToWindowBottom = windowInnerHeight - elementTopToWindowTop;
        var distanceFromBottomToAppear = 300;

        if(elementTopToWindowBottom > distanceFromBottomToAppear) {
          $(element).addClass('js-fade-element-show');
        }
      }
    });
  });

  $(".youtube").colorbox({
        iframe:true,
        innerWidth: '50%',
        innerHeight: '60%'
  });

  $('.description').flowtype({maxFont: 16});
  $('.swiper-letters-box').flowtype({minFont: 20});
});
