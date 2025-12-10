/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/trim-canvas";
exports.ids = ["vendor-chunks/trim-canvas"];
exports.modules = {

/***/ "(ssr)/../../node_modules/trim-canvas/build/index.js":
/*!*****************************************************!*\
  !*** ../../node_modules/trim-canvas/build/index.js ***!
  \*****************************************************/
/***/ (function(module) {

eval("!function(e,t){ true?module.exports=t():0}(this,function(){return function(e){function t(n){if(r[n])return r[n].exports;var o=r[n]={exports:{},id:n,loaded:!1};return e[n].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var r={};return t.m=e,t.c=r,t.p=\"\",t(0)}([function(e,t){\"use strict\";function r(e){var t=e.getContext(\"2d\"),r=e.width,n=e.height,o=t.getImageData(0,0,r,n).data,f=a(!0,r,n,o),i=a(!1,r,n,o),c=u(!0,r,n,o),d=u(!1,r,n,o),p=d-c+1,l=i-f+1,s=t.getImageData(c,f,p,l);return e.width=p,e.height=l,t.clearRect(0,0,p,l),t.putImageData(s,0,0),e}function n(e,t,r,n){return{red:n[4*(r*t+e)],green:n[4*(r*t+e)+1],blue:n[4*(r*t+e)+2],alpha:n[4*(r*t+e)+3]}}function o(e,t,r,o){return n(e,t,r,o).alpha}function a(e,t,r,n){for(var a=e?1:-1,u=e?0:r-1,f=u;e?f<r:f>-1;f+=a)for(var i=0;i<t;i++)if(o(i,f,t,n))return f;return null}function u(e,t,r,n){for(var a=e?1:-1,u=e?0:t-1,f=u;e?f<t:f>-1;f+=a)for(var i=0;i<r;i++)if(o(f,i,t,n))return f;return null}Object.defineProperty(t,\"__esModule\",{value:!0}),t.default=r}])});//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzL3RyaW0tY2FudmFzL2J1aWxkL2luZGV4LmpzIiwibWFwcGluZ3MiOiJBQUFBLGVBQWUsS0FBaUQsb0JBQW9CLENBQW1ILENBQUMsaUJBQWlCLG1CQUFtQixjQUFjLDRCQUE0QixZQUFZLFVBQVUsaUJBQWlCLGdFQUFnRSxTQUFTLCtCQUErQixnQkFBZ0IsYUFBYSxjQUFjLCtLQUErSyx5RUFBeUUsb0JBQW9CLE9BQU8sZ0ZBQWdGLG9CQUFvQix3QkFBd0Isb0JBQW9CLCtCQUErQixXQUFXLGlCQUFpQixJQUFJLDJCQUEyQixZQUFZLG9CQUFvQiwrQkFBK0IsV0FBVyxpQkFBaUIsSUFBSSwyQkFBMkIsWUFBWSxzQ0FBc0MsU0FBUyxjQUFjLEdBQUciLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcYW5kcmVcXE9uZURyaXZlXFxFc2NyaXRvcmlvXFx3b3JrXFxJbWFNb25vcmVwb1xcbm9kZV9tb2R1bGVzXFx0cmltLWNhbnZhc1xcYnVpbGRcXGluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIiFmdW5jdGlvbihlLHQpe1wib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzJiZcIm9iamVjdFwiPT10eXBlb2YgbW9kdWxlP21vZHVsZS5leHBvcnRzPXQoKTpcImZ1bmN0aW9uXCI9PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKFtdLHQpOlwib2JqZWN0XCI9PXR5cGVvZiBleHBvcnRzP2V4cG9ydHMudHJpbUNhbnZhcz10KCk6ZS50cmltQ2FudmFzPXQoKX0odGhpcyxmdW5jdGlvbigpe3JldHVybiBmdW5jdGlvbihlKXtmdW5jdGlvbiB0KG4pe2lmKHJbbl0pcmV0dXJuIHJbbl0uZXhwb3J0czt2YXIgbz1yW25dPXtleHBvcnRzOnt9LGlkOm4sbG9hZGVkOiExfTtyZXR1cm4gZVtuXS5jYWxsKG8uZXhwb3J0cyxvLG8uZXhwb3J0cyx0KSxvLmxvYWRlZD0hMCxvLmV4cG9ydHN9dmFyIHI9e307cmV0dXJuIHQubT1lLHQuYz1yLHQucD1cIlwiLHQoMCl9KFtmdW5jdGlvbihlLHQpe1widXNlIHN0cmljdFwiO2Z1bmN0aW9uIHIoZSl7dmFyIHQ9ZS5nZXRDb250ZXh0KFwiMmRcIikscj1lLndpZHRoLG49ZS5oZWlnaHQsbz10LmdldEltYWdlRGF0YSgwLDAscixuKS5kYXRhLGY9YSghMCxyLG4sbyksaT1hKCExLHIsbixvKSxjPXUoITAscixuLG8pLGQ9dSghMSxyLG4sbykscD1kLWMrMSxsPWktZisxLHM9dC5nZXRJbWFnZURhdGEoYyxmLHAsbCk7cmV0dXJuIGUud2lkdGg9cCxlLmhlaWdodD1sLHQuY2xlYXJSZWN0KDAsMCxwLGwpLHQucHV0SW1hZ2VEYXRhKHMsMCwwKSxlfWZ1bmN0aW9uIG4oZSx0LHIsbil7cmV0dXJue3JlZDpuWzQqKHIqdCtlKV0sZ3JlZW46bls0KihyKnQrZSkrMV0sYmx1ZTpuWzQqKHIqdCtlKSsyXSxhbHBoYTpuWzQqKHIqdCtlKSszXX19ZnVuY3Rpb24gbyhlLHQscixvKXtyZXR1cm4gbihlLHQscixvKS5hbHBoYX1mdW5jdGlvbiBhKGUsdCxyLG4pe2Zvcih2YXIgYT1lPzE6LTEsdT1lPzA6ci0xLGY9dTtlP2Y8cjpmPi0xO2YrPWEpZm9yKHZhciBpPTA7aTx0O2krKylpZihvKGksZix0LG4pKXJldHVybiBmO3JldHVybiBudWxsfWZ1bmN0aW9uIHUoZSx0LHIsbil7Zm9yKHZhciBhPWU/MTotMSx1PWU/MDp0LTEsZj11O2U/Zjx0OmY+LTE7Zis9YSlmb3IodmFyIGk9MDtpPHI7aSsrKWlmKG8oZixpLHQsbikpcmV0dXJuIGY7cmV0dXJuIG51bGx9T2JqZWN0LmRlZmluZVByb3BlcnR5KHQsXCJfX2VzTW9kdWxlXCIse3ZhbHVlOiEwfSksdC5kZWZhdWx0PXJ9XSl9KTsiXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/trim-canvas/build/index.js\n");

/***/ })

};
;