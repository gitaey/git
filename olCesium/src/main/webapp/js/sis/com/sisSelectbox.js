(function (window, $) {
    "use strict";

    window.SisSelectbox = function (element, props) {
        if (!props) props = {};

        this.element = $(element);

        this.extendProps(props);
        return this._init();
    };

    SisSelectbox.prototype = {
        element: null,
        arrSelectbox: [], // selectbox array
        values: [],

        props: {
            url: "", // json url
            params: {}, // json url params
            allField: false,
            fields: {
                remoteValues: "data", // json로 넘어오는 변수명
                text: "text", // option 텍스트
                value: "value", // option 값
            }
        },


        /**
         * props 합치기
         * */
        extendProps: function (props) {
            this.props.fields = $.extend({}, this.props.fields, props.fields);
            props.fields = this.props.fields;

            this.props = $.extend({}, this.props, props);
        },

        /**
         * 초기화
         * */
        _init: function () {
            if (!this.element) return;

            var _this = this;

            // element가 여러개일 때 모두 처리
            $.each($(this.element), function (idx, ele) {
                var id = ele.id;
                var isWrap = $(ele).closest(".sisSelectbox");

                // 이미 sisSelectbox를 적용했을 때 초기화
                if (isWrap.length > 0) {
                    $(ele).closest(".sisSelectbox").before($(ele));
                    isWrap.remove();
                }

                var eleWrap = $("<div class='sisSelectbox'></div>");
                var eleText = $("<div class='text'>-</div>");
                var eleItems = $("<div class='items hidden'></div>");

                // 스타일용 element 추가
                $(ele).before(eleWrap);

                $(eleWrap).append(ele);
                $(eleWrap).append(eleText);
                $(eleWrap).append(eleItems);

                _this.arrSelectbox.push(eleWrap);

                // selectbox change 이벤트
                $(ele).on("change", function () {
                    var text = $(this).find("option:selected").text();

                    $(eleText).text(text);
                });

                // selectbox 클릭 이벤트
                $(eleWrap).on("click", function (evt) {
                    evt.preventDefault();

                    // if(evt.target.className == "item") return;

                    $(eleItems).toggleClass("hidden").toggleClass("active");
                    $(eleWrap).toggleClass("active");

                    var item = $(eleItems).find(".item[data-value=" + $(ele).val() + "]");
                    var idx = item.index();
                    var height = item.innerHeight();
                    $(eleItems).scrollTop(height * idx);

                    setTimeout(function () {
                        $(document).on("click", function (e) {
                            var $target = $(e.target).closest(".sisSelectbox");
                            if ($target.length == 0) _this._hidden(eleWrap);
                            else {
                                var tId = $target.find("select").attr("id");
                                var id = $(eleWrap).find("select").attr("id");

                                if (tId != id) _this._hidden(eleWrap);
                            }
                            $(document).unbind("click")
                        });
                    });
                });

                // url 방식
                if (_this.props.url) {
                    _this.getDataByUrl(eleWrap);
                } else {
                    if (_this.props.allField) {
                        $(ele).prepend("<option value='-'>==== 전체 ====</option>");
                    } else {
                        $(ele).prepend("<option value='-'>==== 선택 ====</option>");
                    }

                    var options = $(ele).find("option");

                    $.each(options, function (idx, opt) {
                        var value = $(opt).val();
                        var text = $(opt).text();

                        eleItems.append("<div class='item' data-value='" + value + "'>" + text + "</div>");

                        if (_this.props.defaultValue) {
                            if (_this.props.defaultValue == value) {
                                $(ele).val(value);
                                $(eleText).text(text);
                            }
                        } else {
                            if (idx == 0) {
                                $(ele).val(value);
                                $(eleText).text(text);
                            }
                        }
                    });

                    if (_this.initLoad) {
                        $(ele).change();
                    }

                    // option 선택 이벤트
                    $(eleItems).find(".item").on("click", function () {
                        var val = $(this).attr("data-value");
                        var text = $(this).text();

                        $(ele).val(val);
                        // $(eleText).text(text);

                        if (_this.props.onChange) {
                            _this.props.onChange(val, text);
                        }

                        $(ele).change();
                    });
                }

            });

            this.initLoad = true;
        },

        /**
         * Url로부터 JSON 데이터 받아오기
         * */
        getDataByUrl: function (eleWrap, reload) {
            var _this = this;
            var element = $(eleWrap).find("select");

            if (_this.values.length > 0 && !reload) {
                _this._setOptions(element, eleWrap, true);
            } else {
                $.ajax({
                    url: this.props.url,
                    type: this.props.type ? this.props.type : "post",
                    data: this.props.params ? this.props.params : {},
                    async: false,
                    success: function (res) {
                        _this.values = res[_this.props.fields.remoteValues];
                        _this._setOptions(element, eleWrap);
                    }
                });
            }
        },

        setUrlParams: function (params) {
            if (!params) params = {};

            this.props.params = $.extend({}, this.props.params, params);
        },

        /**
         * JSON 데이터로 option 생성
         * */
        _setOptions: function (element, eleWrap, isLoaded) {
            var _this = this;

            var eleItems = $(eleWrap).find(".items");
            var eleText = $(eleWrap).find(".text");

            $(element).html("");
            $(eleItems).html("");

            if (!isLoaded) {
                if (this.props.allField) {
                    var field = {};
                    field[this.props.fields.value] = "-";
                    field[this.props.fields.text] = "==== 전체 ====";
                    this.values.unshift(field);
                } else {
                    var field = {};

                    if(!this.props.defaultField) {
                        field[this.props.fields.value] = "-";
                        field[this.props.fields.text] = "==== 선택 ====";

                        _this.values.unshift(field);
                    } else {
                        field[this.props.fields.value] = this.props.defaultField.value;
                        field[this.props.fields.text] = this.props.defaultField.text;

                        _this.values.unshift(field);
                    }
                }
            }

            $.each(this.values, function (idx, val) {
                var value = val[_this.props.fields.value];
                var text = val[_this.props.fields.text];

                eleItems.append("<div class='item' data-value='" + value + "'>" + text + "</div>");
                $(element).append("<option value='" + value + "'>" + text + "</option>")

                if (_this.props.defaultValue) {
                    if (_this.props.defaultValue == value) {
                        $(element).val(value);
                        $(eleText).text(text);
                    }
                } else {
                    if (idx == 0) {
                        $(element).val(value);
                        $(eleText).text(text);
                    }
                }
            });

            if (_this.initLoad) {
                $(element).change();
            }

            // option 선택 이벤트
            $(eleItems).find(".item").on("click", function () {
                var val = $(this).attr("data-value");
                var text = $(this).text();

                $(element).val(val);
                // $(eleText).text(text);

                if (_this.props.onChange) {
                    _this.props.onChange(val, text);
                }

                $(element).change();
            });
        },

        /**
         * selectbox option element 숨기기
         * @param eleWrap : selectbox를 감싸고있는 element
         * */
        _hidden: function (eleWrap) {
            var eleItems = $(eleWrap).find(".items");

            $(eleItems).scrollTop(0);
            $(eleItems).addClass("hidden").removeClass("active");
            $(eleWrap).removeClass("active");
        },

        getElementById: function (id) {
            var rtn;

            $.each(this.arrSelectbox, function (idx, item) {
                var selectboxId = $(item).find("select").attr("id");

                if (id == selectboxId) {
                    rtn = item;
                }
                ;
            });

            return rtn;
        },

        setConn: function (props) {
            if (!props) props = {};

            var element = this.getElementById(props.id);
            var selectbox = $(element).find("select");

            $(selectbox).unbind("change", props.onChange);
            $(selectbox).on("change", props.onChange);
        }
    }
})(window, jQuery)