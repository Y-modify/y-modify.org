'use strict';

window.$ = window.jQuery = require('jquery');
require('flexibility');
require('Flowtype.js');
require('jquery-colorbox');
require('Swiper');

require('./navigation.js');

$(function(){
  $('.herounit--description').flowtype({maxFont: 16});
  $('.herounit--about').flowtype({maxFont: 20});

  let imswiper = new Swiper ('#slider--images', {
    speed: 600,
    initialSlide: 0,
    effect: 'fade',
    loop: true
  });
  let leswiper = new Swiper ('#slider--letters', {
    pagination: '.swiper-pagination',
    speed: 600,
    initialSlide: 0,
    autoplay: 4000,
    autoplayDisableOnInteraction: false,
    loop: true
  });
  if(leswiper.on){
    leswiper.on('slideNextStart', function(){
      imswiper.slideNext();
    });
    leswiper.on('slidePrevStart', function(){
      imswiper.slidePrev();
    });
  }

  $('a[data-scroll]').click(function() {//smooth scroll
      const speed = 400;
      let scroll = $($(this).attr("data-scroll"));
      if(scroll.length <= 0)
        return true;
      let position = scroll.offset().top;
      $('body,html').animate({scrollTop:position}, speed, 'swing');
      return false;
   });

  $(".js-scroll-animation").addClass('js-fade-element-hide');

  $('.js-retbutton').click(function(){
    parent.$.fn.colorbox.close(); return false;
  });

  showScroll(".js-scroll-animation");

  $(window).scroll(function() {
    showScroll(".js-scroll-animation");
  });

  setCBoxSize(".youtube", window.innerWidth * 0.7, window.innerWidth * 0.7 * (720/1280), false, true);
  if(window.innerWidth < 500)
    setCBoxSize(".membercard", window.innerWidth, window.innerHeight, true);
  else if(window.innerWidth < 800)
    setCBoxSize(".membercard", window.innerWidth * 0.8, window.innerWidth * 0.8, true);
  else
    setCBoxSize(".membercard", window.innerWidth * 0.6, window.innerHeight * 0.6, true);

  $(window).on('resize', function(){
    setCBoxSize(".youtube", window.innerWidth * 0.7, window.innerWidth * 0.7 * (720/1280), false, true);
    if(window.innerWidth < 500)
      setCBoxSize(".membercard", window.innerWidth, window.innerHeight, true);
    else if(window.innerWidth < 800)
      setCBoxSize(".membercard", window.innerWidth * 0.8, window.innerWidth * 0.8, true);
    else
      setCBoxSize(".membercard", window.innerWidth * 0.6, window.innerHeight * 0.6, true);
  });
});

function showScroll(elm){
  $(elm).each(function(index, element){
    if( $(element).length > 0 ) {
      const elementTopToPageTop = $(element).offset().top;
      const windowTopToPageTop = $(window).scrollTop();
      const windowInnerHeight = window.innerHeight;
      const elementTopToWindowTop = elementTopToPageTop - windowTopToPageTop;
      const elementTopToWindowBottom = windowInnerHeight - elementTopToWindowTop;
      const distanceFromBottomToAppear = 300;

      if(elementTopToWindowBottom > distanceFromBottomToAppear) {
        $(element).addClass('js-fade-element-show');
      }
    }
  });
}

function setCBoxSize(element, w, h, inl, frame){
  inl === undefined ? false : inl;
  frame === undefined ? false : frame;
  $(element).colorbox({
    inline: inl,
    iframe: frame,
    innerWidth: w,
    innerHeight: h
  });
  $(element).colorbox.resize({
    inline: inl,
    iframe: frame,
    innerWidth: w,
    innerHeight: h
  });
}
