/*!
 * Static Website Starter Kit
 * https://github.com/kriasoft/static-site-starter
 */

(function () {
    'use strict';

    console.log('Welcome to the Gulp Starter Kit!');
    console.log('https://github.com/koycarraway/gulp-starter-kit');

    $('body').restive({
      breakpoints: ['10000'],
      classes: ['nb'],
      turbo_classes: 'is_mobile=mobi,is_phone=phone,is_tablet=tablet,is_portrait=portrait,is_landscape=landscape'
    });
})();
