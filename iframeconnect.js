/*
 * iframeConnect 用于跨域iframe通信
 * Copyright (c) 2014, Zythum | zythum02@gmail.com
 *
 * how it work:
 * iframeConnectWith(parent).on('alert', function (msg) { alert(msg) })
 * iframeConnectWith(iframeTag).on('alert', function (msg) { alert(msg) })
 * iframeConnectWith(iframeTag).off('alert', function (msg) { alert(msg) })
 * iframeConnectWith(iframeTag).trigger('alert', '123' })
 * 
 * 注: 父页面中的 iframeConnectWith(iframeTag) 与子页面中的 iframeConnectWith(parent) 通信
 */
~function(window, ns, factory) {
	"use strict"

	if (typeof(module) !== 'undefined' && module.exports) { // CommonJS
		module.exports = factory(ns, window)
	} else if (typeof(define) === 'function' && define.amd) { // AMD
		define(function() {
			return factory(window)
		})
	} else { // <script>
		window[ns] = factory(window)
	}
}(window, 'iframeConnect', function (window) {
"use strict"

function isWindow (obj) {
	try{ 
		obj && obj.window
		return !!obj &&  obj === obj.window;
	}catch (e) {
		//ie6 下跨域下的 window.window 是报错的。 所以这边使用self方式
		return !!obj && !!obj.parent && obj === obj.self;
	}
}

function isIframe (element) {
	return !!element && !isWindow(element) && typeof element.tagName === 'string' && element.tagName.toLowerCase() === 'iframe'
}

function each (array, fn, context) {
	var i, len = array.length
	if (len === +len) {
		for (i=0; i<len; i++) if (fn.call(context, array[i], i, array) === false) break
	} else {
		for (i in array) if (fn.call(context, array[i], i, array) === false) break
	}
}

//将类数组转换成数组
function toArray (arrayLike) {
	var array = []
	each(arrayLike, function (item) { array.push(item) })
	return array
}

//Array.prototype.indexOf
function indexOfArray (item, array) {
	indexOfArray = [].indexOf ?
		function (item, array) { return array.indexOf(item) } :
		function (item, array) {
			var len = array.length
			while(--len >= 0) if (array[len] === item) break
			return len
		}
	return indexOfArray(item, array)
}
//是否包含在数组中
function inArray (item, array) {
	return indexOfArray(item, array) > -1
}

//从数组中删除
function removeFromArray (item, array) {
	var index = indexOfArray(item, array)
	return index > -1 ? array.splice(index, 1) : []
}

function addEventListener (element, type, fn) {
	addEventListener = window.addEventListener ?
		function () { element.addEventListener(type, fn, false) } :
		function () { element.attchEvent('on' + type, fn) }
	return addEventListener(element, type, fn)
}

//自定义事件生成器
function notice () {
	var prefix = 'NOTICE_', //用于避免与js原生方法属性冲突
		fnCache = {}
	return {
		//notice.on('alert', function);
		on: function (name, fn) {
			name = prefix + name
			var fnArray = fnCache[name] = fnCache[name] || []
			if ( !inArray(fn, fnArray) ) fnArray.push(fn)
		},
		//notice.off('alert', function); //删除该方法
		//notice.off('alert');           //删除某个事件
		//notice.off();                  //删除所有事件
		off: function (name, fn) {
			name = prefix + name
			var fnArray = fnCache[name]
			switch (arguments.length) {
				case 0: fnCache = {}; break
				case 1: delete fnCache[name]; break
				default:
					fnArray && removeFromArray(fn, fnArray)
					fnArray.length === 0 && delete fnCache[name]
			}
		},
		trigger: function (name, msg, context) {
			name = prefix + name
			var fnArray = fnCache[name]
			fnArray && setTimeout(function () {
				each(fnArray, function (fn, i) {fn.call(context, msg)})
			});
		}
	}
}

//JSON.stringify
function json_stringify (value, replacer, space) {
	json_stringify = window.JSON && window.JSON.stringify ?
		function() { return window.JSON.stringify(value, replacer, space) } :
		//copy form json2
		(function () {function f(n) {return n < 10 ? '0' + n : n; } if (typeof Date.prototype.toJSON !== 'function') {Date.prototype.toJSON = function(key) {return isFinite(this.valueOf()) ? this.getUTCFullYear() + '-' + f(this.getUTCMonth() + 1) + '-' + f(this.getUTCDate()) + 'T' + f(this.getUTCHours()) + ':' + f(this.getUTCMinutes()) + ':' + f(this.getUTCSeconds()) + 'Z' : null; }; String.prototype.toJSON = Number.prototype.toJSON = Boolean.prototype.toJSON = function(key) {return this.valueOf(); }; } var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\'}, rep; function quote(string) {escapable.lastIndex = 0; return escapable.test(string) ? '"' + string.replace(escapable, function(a) {var c = meta[a]; return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4); }) + '"' : '"' + string + '"'; } function str(key, holder) {var i, k, v, length, mind = gap, partial, value = holder[key]; if (value && typeof value === 'object' && typeof value.toJSON === 'function') {value = value.toJSON(key); } if (typeof rep === 'function') {value = rep.call(holder, key, value); } switch (typeof value) {case 'string': return quote(value); case 'number': return isFinite(value) ? String(value) : 'null'; case 'boolean': case 'null': return String(value); case 'object': if (!value) {return 'null'; } gap += indent; partial = []; if (Object.prototype.toString.apply(value) === '[object Array]') {length = value.length; for (i = 0; i < length; i += 1) {partial[i] = str(i, value) || 'null'; } v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' : '[' + partial.join(',') + ']'; gap = mind; return v; } if (rep && typeof rep === 'object') {length = rep.length; for (i = 0; i < length; i += 1) {k = rep[i]; if (typeof k === 'string') {v = str(k, value); if (v) {partial.push(quote(k) + (gap ? ': ' : ':') + v); } } } } else {for (k in value) {if (Object.hasOwnProperty.call(value, k)) {v = str(k, value); if (v) {partial.push(quote(k) + (gap ? ': ' : ':') + v); } } } } v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' : '{' + partial.join(',') + '}'; gap = mind; return v; } } return function(value, replacer, space) {if (window.JSON && window.JSON.stringify) {return window.JSON.stringify(value, replacer, space); } var i; gap = ''; indent = ''; if (typeof space === 'number') {for (i = 0; i < space; i += 1) {indent += ' '; } } else if (typeof space === 'string') {indent = space; } rep = replacer; if (replacer && typeof replacer !== 'function' && (typeof replacer !== 'object' || typeof replacer.length !== 'number')) {throw new Error('JSON.stringify'); } return str('', {'': value }); }; })() 
	return json_stringify(value, replacer, space)
}

//JSON.parse
function json_parse (string, reviver) {
	json_parse = window.JSON && window.JSON.parse ? 
		function (string, reviver) { return window.JSON.parse(string, reviver) } : 
		//copy form json2
		(function () {var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g; return function(text, reviver) {var j; function walk(holder, key) {var k, v, value = holder[key]; if (value && typeof value === 'object') {for (k in value) {if (Object.prototype.hasOwnProperty.call(value, k)) {v = walk(value, k); if (v !== undefined) {value[k] = v; } else {delete value[k]; } } } } return reviver.call(holder, key, value); } text = String(text); cx.lastIndex = 0; if (cx.test(text)) {text = text.replace(cx, function(a) {return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4); }); } if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {j = eval('(' + text + ')'); return typeof reviver === 'function' ? walk({'' : j }, '') : j; } throw new SyntaxError('JSON.parse'); }; })()
	return json_parse(string, reviver)
}

/*上面是通用方法。下面是实现代码*/

var self               = window.self
var parent             = window.parent

var signKey            = 'IFRAMECONNECT'    // 用于校对其他使用postmessage的方法。是否是符合iframeConnect来的。
var suportPostMessage  = 'postMessage' in window
var navigatorNotice

var notices            = {}
var noticeParentKey    = '__PARENT__'       // 与父页面通信的key
var noticeSelfKey      = '__SELF__'         // 与自己通信的key（我感觉这个用不到）
var noticeIframeKey    = '__IFRAME__'       // 与字页面的key是字页面iframe的name
var noticeMyIframeKey  = noticeIframeKey + window.name

var kMessage           = 'message'
var kNavigator         = 'navigator'

//因为跨域的情况下无法直接获得window.name 只能去间接获得 iframe.name
function getIframeNameByWindow (aWindow) {
	var name
	each(window.document.getElementsByTagName('iframe'), function (_iframe) {
		if (_iframe.contentWindow === aWindow) return name = _iframe.name, false
	});
	return name || '';
}

function postMessageListener (evt) {
	var data = evt && json_parse(evt.data)
	if (data) {
		var sign   = data.sign === signKey, // 用于校对其他使用postmessage的方法。是否是符合iframeConnect来的。
			type   = data.type,             // 自定义事件的type类型
			param  = data.param,            // 自定义事件的传递参数
			notice = notices[data.from]     // 查找目标事件是注册在哪个notice中的
		if (sign && type && notice) notice.trigger(type, param)
	}
}

if ( suportPostMessage ) {
	//支持postMessage
	addEventListener(window, kMessage, postMessageListener)
} else {
	//使用navigator并且创建一个notice自己hack一个postMessage。
	//因为大部分情况肯定父页面先load 所以 notice 应该是一个父页面对象
	//如果父页面关闭或者跳转也没有子页面的事情了
	//所以这么处理应该没问题。
	navigatorNotice = window[kNavigator][signKey] = window[kNavigator][signKey] || notice()
	navigatorNotice.on(kMessage, function (param) {
		//这边不能使用 this === window 实测在ie6 下都是fase, 用 == 就可以了
		if (this == window && param) postMessageListener({data: param})
	})
}

function Iframeconnect (aWindow) {
	switch (aWindow) {
		case self: //这个功能基本不会用。但是需要在这里做排重, 所以就做着把。类似于一个全局的自定义事件
			this.noticeKey = noticeSelfKey
			this.fromNoticeKey = noticeSelfKey
			break
		case parent:
			this.noticeKey = noticeParentKey
			this.fromNoticeKey = noticeMyIframeKey
			break
		default:
			this.noticeKey = noticeIframeKey + getIframeNameByWindow(aWindow)
			this.fromNoticeKey = noticeParentKey
	}
	this.win    = aWindow
	this.notice = notices[this.noticeKey] = notices[this.noticeKey] || notice()
}

Iframeconnect.init = function (aWindow) {
	if ( isIframe(aWindow) ) aWindow = aWindow.contentWindow

	//如果不是Window对象 抛错
	if ( !isWindow(aWindow) ) throw "param must be a iframe Elemnet or a window"

	var isThisPageIframe = inArray(aWindow, toArray(window.frames))
	var isParentOrSelf   = inArray(aWindow, [parent, self])

	//如果不是本页的iframe,不是self,不是parent 抛错
	if (!isThisPageIframe && !isParentOrSelf) throw "param must be the parentWindow or iframe"

	//如果是本页的iframe,但是没有window.name 抛错
	if (isThisPageIframe && getIframeNameByWindow(aWindow) === '') throw "iframe window need a name attribute"
	
	return new Iframeconnect(aWindow);
}

Iframeconnect.prototype = {
	on: function (type, fn) {
		this.notice.on(type, fn)
	},
	off: function () {
		this.notice.off.apply(this.notice, arguments)
	},
	trigger: suportPostMessage ?
		function (type, param) {
			this.notice.trigger(type, param)
			this.win != self && this.win.postMessage(json_stringify( {from: this.fromNoticeKey, type: type, param: param, sign: signKey} ), '*')
		} :
		function (type, param) {
			this.notice.trigger(type, param)
			this.win != self && navigatorNotice.trigger(kMessage, json_stringify( {from: this.fromNoticeKey, type: type, param: param, sign: signKey} ), this.win)
		}
}
//exports
return {
	connectWith: Iframeconnect.init,
	connectWithParent: function () {
		return Iframeconnect.init(parent)
	},
	connectWithIframeByName: function (name) {
		var iframe
		each(window.frames, function (_iframe) {
			if (_iframe.name === name) return iframe = _iframe, false
		});
		return iframe && Iframeconnect.init(iframe)
	},
	connectWithIframeBy$: function (selector) {
		if ( !window.jQuery ) throw " iframeConnectWithIframeBy$ need jQuery exist"
		selector = window.jQuery(selector)[0]
		return selector && Iframeconnect.init(selector)
	}
}
})