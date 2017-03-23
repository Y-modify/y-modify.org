$(window).resize(function() {
  let more = document.getElementById("js-navigation-more");
  if ($(more).length > 0) {
    let windowWidth = $(window).width();
    let moreLeftSideToPageLeftSide = $(more).offset().left;
    let moreLeftSideToPageRightSide = windowWidth - moreLeftSideToPageLeftSide;

    if (moreLeftSideToPageRightSide < 330) {
      $("#js-navigation-more .navigation--menu__submenu .navigation--menu__submenu").removeClass("js-fly-out-right");
      $("#js-navigation-more .navigation--menu__submenu .navigation--menu__submenu").addClass("js-fly-out-left");
    }

    if (moreLeftSideToPageRightSide > 330) {
      $("#js-navigation-more .navigation--menu__submenu .navigation--menu__submenu").removeClass("js-fly-out-left");
      $("#js-navigation-more .navigation--menu__submenu .navigation--menu__submenu").addClass("js-fly-out-right");
    }
  }
});

$(document).ready(function() {
  let menuToggle = $("#js-mobile-menu").unbind();
  $("#js-navigation-menu").removeClass("navigation--menu__show");

  menuToggle.on("click", function(e) {
    e.preventDefault();
    $("#js-navigation-menu").slideToggle(function(){
      if($("#js-navigation-menu").is(":hidden")) {
        $("#js-navigation-menu").removeAttr("style");
      }
    });
  });
});

$(document).ready(function() {
  $(".dropdown-button").click(function() {
    var $button, $menu;
    $button = $(this);
    $menu = $button.siblings(".dropdown-menu");
    $menu.toggleClass("show-menu");
    $menu.children("li").click(function() {
      $menu.removeClass("show-menu");
      $button.html($(this).html());
    });
  });
});
