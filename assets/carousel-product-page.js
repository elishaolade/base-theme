$(document).ready(function(){
    $('.product-template__carousel').slick({
        slidesToShow: 1,
        slide:'.single-media-item',
        infinite: false,
        dots: false,
        arrows: false
    });
    $('.product-template__thumbnail-list').slick({
        slidesToShow: 3,
        slide: '.product-template__thumbnail-item',
        dots: false,
        arrows: false,
        prevArrow: $('.thumbnails__prev'),
        nextArrow: $('.thumbnails__next')
    })
    $('.product-template__thumbnail-button').click(function(){
        var index = $(this).attr('data-thumbnail-index');
        $('.product-template__carousel').slick('slickGoTo',index);
    });
    $('.thumbnails__prev').click(function(){
        $('.product-template__thumbnail-list').slick('slickPrev');
    })
    $('.thumbnails__next').click(function(){
        $('.product-template__thumbnail-list').slick('slickNext');
    })
});