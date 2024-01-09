// 천단위 콤마 (소수점포함)
function numberWithCommas(num) {
	var parts = num.toString().split(".");
	return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
}

	/**
 * 쿠키 저장하기
 * @param cookie_name
 * @param value
 * @param days
 */
function setCookie(cookie_name, value, days) {
	var exdate = new Date();
	exdate.setDate(exdate.getDate() + days);
	// 설정 일수만큼 현재시간에 만료값으로 지정

	var cookie_value = escape(value) + ((days == null) ? '' : '; expires=' + exdate.toUTCString());
	document.cookie = cookie_name + '=' + cookie_value;
}

/**
 * 쿠키 불러오기
 * @param cookie_name
 * @returns {string}
 */
function getCookie(cookie_name) {
	var x, y;
	var val = document.cookie.split(';');

	for (var i = 0; i < val.length; i++) {
		x = val[i].substr(0, val[i].indexOf('='));
		y = val[i].substr(val[i].indexOf('=') + 1);
		x = x.replace(/^\s+|\s+$/g, ''); // 앞과 뒤의 공백 제거하기
		if (x == cookie_name) {
			return unescape(y); // unescape로 디코딩 후 값 리턴
		}
	}
}

/**
 * 연도 SelectBox 만들기
 * @param target
 * @param arrYear
 */
function yearSelectMake( target, arrYear ){
	var obj = document.getElementById( target );
	for( var idx = 0; idx < arrYear.length ; idx++ ){
		obj.options[ obj.options.length ]= new Option ( arrYear[idx], arrYear[idx] );
	}
}

/**
 * URL 파라미터 받기
 * @param name
 * @returns {string}
 */
function getParameterByName(name) {
	const url = new URL(window.location.href);
	const urlParams = url.searchParams;
	return urlParams.get(name);
}

/**
 * URL 파라미터 존재 여부
 * @param name
 * @returns {boolean}
 */
function hasParameterByName(name) {
	const url = new URL(window.location.href);
	const urlParams = url.searchParams;
	return urlParams.has(name);
}

/**
 * 좌측문자열채우기
 * @params
 *  - padLen : 최대 채우고자 하는 길이
 *  - padStr : 채우고자하는 문자(char)
 */
String.prototype.lpad = function(padLen, padStr) {
	var str = this;
	if (padStr.length > padLen) {
		console.log("오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다");
		return str + "";
	}
	while (str.length < padLen)
		str = padStr + str;
	str = str.length >= padLen ? str.substring(0, padLen) : str;
	return str;
};

/**
 * 우측문자열채우기
 * @params
 *  - padLen : 최대 채우고자 하는 길이
 *  - padStr : 채우고자하는 문자(char)
 */
String.prototype.rpad = function(padLen, padStr) {
	var str = this;
	if (padStr.length > padLen) {
		console.log("오류 : 채우고자 하는 문자열이 요청 길이보다 큽니다");
		return str + "";
	}
	while (str.length < padLen)
		str += padStr;
	str = str.length >= padLen ? str.substring(0, padLen) : str;
	return str;
};

// DataTable Refresh Table
function refreshTable(tableId, urlData) {
	$.getJSON(urlData, function(json) {
		var table = $(tableId).dataTable();
		var oSettings = table.fnSettings();
		
		table.fnClearTable(this);
		
		for(var i = 0; i < json[Object.keys(json)[0]].length; i++) {
			table.oApi._fnAddData(oSettings, json[Object.keys(json)[0]][i]);
		}
		
		oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
		table.fnDraw();
	});
}

//Automatically cancel unfinished ajax requests
//when the user navigates elsewhere.
(function(window, $) {
	$.xhrPool = [];
	$.xhrAbort = function() {
		$.each($.xhrPool, function(idx, jqXHR) {
			jqXHR.abort();
		});
	};

	var oldbeforeunload = window.onbeforeunload;
	window.onbeforeunload = function() {
		var r = oldbeforeunload ? oldbeforeunload() : undefined;
		if (r == undefined) {
			$.xhrAbort();
		}
		return r;
	}

	$(document).ajaxSend(function(e, jqXHR, options) {
		$.xhrPool.push(jqXHR);
	});
	$(document).ajaxComplete(function(e, jqXHR, options) {
		$.xhrPool = $.grep($.xhrPool, function(x) {
			return x != jqXHR
		});
	});


	$.xhrCheckData = function(data) {
		if (typeof data == "undefined") return false;

		if (data.hasOwnProperty("error")) {
			var errorCode = data["error"];

			switch (errorCode) {
				case "401":
					$.xhrAbort();
					alert("로그인후 다시 시도하세요. / Ajax 요청 실패");
					top.location.href = G.baseUrl + "user/auth/login.do";
				break;
				default:
					alert("Ajax 요청 실패 / [" + errorCode + "] " + data["message"]);

				break;
			}

			return false;

		} else {
			return true;

		}
	}

})(window, jQuery);

(function(window, $) {
	var PageSetup = function(options) {
		this.options = options;
		this.init();
	};

	PageSetup.prototype = {
		config: null,
		defaults : {},
		init : function() {
			this.config = $.extend({}, this.defaults, this.options);
			var pageTitle = this.config.pageTitle;
			if (pageTitle) {
				$("#pageTitle").html(pageTitle);

				var iframes = $('iframe', top.document);
				var contents = iframes.contents();
				var thisIframe = null;
				contents.each(function(idx) {
					if (this == document || iframes[idx] == self) {
						thisIframe = iframes[idx];
					}
				});

				var panel = $(thisIframe).parent();
				var tabKey = $(panel).attr("data-tab-key");

				var label = $("ul.tabs>li[data-tab-key='" + tabKey + "']>a>span.tab-label", top.document);
				if (label.html() == "") label.html(pageTitle);
			}

			var pageLocation = this.config.pageLocation;
			if (pageLocation) {
				var parent = $("#pageLocation");
				parent.empty();

				var idx = 0;
				var li;

				li = $("<li><i class='fas fa-home'></i></li>");
				li.appendTo(parent);

				$(pageLocation).each( function() {
					var pageName = pageLocation[idx];
					// var active = (idx >= pageLocation.length-1) ? " class='active'" : "";
					// li = $("<li" + active + ">" + pageName + "</li>");
					li = $("<li>" + pageName + "</li>");
					li.appendTo(parent)
					idx++;
				});

				li = $("<li>" + this.config.pageTitle + "</li>");
				li.appendTo(parent);
			}

			return this;
		}
	}

	PageSetup.defaults = PageSetup.prototype.defaults;
	window.PageSetup = PageSetup;

	/* Combobox 실행대기 후 실행 */
	$.waitForLazyRunners = function(callback) {
		var run = function() {
			if (!$.runner || $.runner <= 0) {
				clearInterval(interval);
				if(typeof callback === 'function') {
					callback();
				}
			} else {
				//console.log("wait...");
			}
		};
		var interval = setInterval(run, 30);
	}

})(window, jQuery);