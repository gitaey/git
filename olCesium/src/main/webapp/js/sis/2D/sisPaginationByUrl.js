(function (window, $) {
    "use strict";

    window.SisPagination2 = function (props) {
        this._init(props);
    }

    SisPagination2.prototype = {
        props: {
            url: "",
            id: "",
            data: {},
            viewCount: 5,
            pageCount: 5,
            firstPage: 1,
            endPage: 1,
            minPage: 1,
            maxPage: 1,
            colName: "data",
            colList: [],
            target: "",
            tblHeight: "100%"
        },

        tbl: "",
        rtnData: "",
        ascColumn: "",
        descColumn: "",

        _extendProps: function (props) {
            this.props = $.extend({}, this.props, props);
        },

        _init: function (props) {
            this._extendProps(props);
            this.pageClick(1);
        },

        setData: function (data) {
            this.rtnData.data = data;
            this.rtnData.total = data.length;
            this.pageClick(1);
        },

        pageClickHandler: function (evt) {
            $(evt.target.parentElement).find("div").removeClass("active")
            $(evt.target).addClass("active");

            var page = $(evt.target).text();

            this.pageClick(page);
        },

        setPage: function (data, page, tbl) {
            if (data == "")
                return;
            if (data[this.props.colName].length == 0)
                return;

            var min, max, cur, allCnt, endPage;
            var self = this;

            allCnt = data["total"];
            endPage = Math.ceil(allCnt / this.props.viewCount);

            if (endPage <= this.props.pageCount) {
                $("#" + this.props.id + " .firstPage").hide();
                $("#" + this.props.id + " .prePage").hide();
                $("#" + this.props.id + " .nextPage").hide();
                $("#" + this.props.id + " .lastPage").hide();
            } else {
                $("#" + this.props.id + " .firstPage").show();
                $("#" + this.props.id + " .prePage").show();
                $("#" + this.props.id + " .nextPage").show();
                $("#" + this.props.id + " .lastPage").show();
            }

            if (page <= 5) {
                min = 1;
                max = 5;
            } else {
                min = this.props.pageCount * Math.floor((page - 0.1) / this.props.pageCount) + 1;
                max = min + this.props.pageCount - 1;
            }

            this._extendProps({
                endPage: endPage,
                minPage: min,
                maxPage: max
            });

            var target = $(this.props.target).find("section");
            target.html("");

            for (var i = min; i <= max; i++) {
                if (i == page)
                    $(target).append("<div class='active'>" + i + "</div>");
                else
                    $(target).append("<div>" + i + "</div>");

                if (i == endPage)
                    break;
            }
        },

        getData: function (page) {
            var self = this;
            if (this.rtnData) {
                self._pageClick(this.rtnData, page);
                return this.rtnData;
            }

            var data = $.extend(this.props.data, {
                page: page,
                viewCount: this.props.viewCount
            }, this.props.params);

            if (!this.props.url) return;

            $.ajax({
                url: this.props.url,
                type: "POST",
                // async: false,
                data: data,
                success: function (data) {
                    self.rtnData = data;
                    self.rtnData.total = data.data.length;

                    self._pageClick(data, page);
                    $("#loading").hide();

                    self.props.closeEvent(data.data);
                    $("#searchResultWrap").show();
                },
                error: function() {
                    alert("사격장 소음도가 존재하지 않습니다.")
                    $("#loading").hide();
                }
            });

            return this.rtnData;
        },

        setTable: function (data) {
            if (!data)
                return;
            if (data[this.props.colName].length == 0)
                return;

            var str = "<div class='tblWrap'>" + "<div class='tblHeightFixed' style='height:" + this.props.tblHeight + "'>" + "<table id='tbl_" + this.props.id + "' class='boardResultTable'></table>" + "</div>" + "<div class='sisPagination'>" + "<div class='firstPage'>&lt;&lt;</div>" + "<div class='prePage'>&lt;</div>" + "<section onClick={this.pageClickHandler}> </section>" + "<div class='nextPage'>&gt;</div>" + "<div class='lastPage'>&gt;&gt;</div>" + "</div>" + "</div>";

            return $(str);
        },


        pageClick: function (page) {
            this.getData(page);
        },

        _pageClick: function (data, page) {
            var self = this;
            $(this.props.target).html("");
            $(this.props.target).show();

            if (!data) return;

            var tblWrap = this.setTable(data);
            var tbl = $(tblWrap).find("table");

            var tblWidth = $(this.props.target).width();
            var colCnt = 0;
            var colList = [];

            var headStr = "<thead><tr>";
            var bodyStr = "";

            bodyStr = "<tbody>" + bodyStr + "</tbody>";
            headStr += "</tr></thead>";

            $(tbl).append(headStr + bodyStr);
            $(tbl).find("th").width(tblWidth / colCnt);

            $.each(data[this.props.colName], function (idx, item) {
                if (idx == 0) {
                    headStr =
                        "   <th style='width:80px'>용도</th>" +
                        "   <th>구분</th>" +
                        "   <th style='min-width: 324px'>주소</th>" +
                        "   <th>구역</th>" +
                        "   <th>세부정보</th>";

                    $(tbl).find("thead tr").append(headStr);
                }

                if (((page - 1) * self.props.viewCount) < idx + 1 && (page * self.props.viewCount) >= idx + 1) {
                    bodyStr = "<tr id='tbl_row_" + idx + "'>" +
                        "   <td>" + item["bdtypCd"] + "</td>" +
                        "   <td>" + item["contain"] + "</td>";

                    /* 210730. kyy. 검색기준 지적도로 했을 때 에러남. 분기 걸어놈*/
                    if (item["roadAddr"] === undefined) {
                        bodyStr += "   <td>" + item["addr"] + "<br/>" + "-" + "</td>";
                    } else {
                        bodyStr += "   <td>" + item["addr"] + "<br/>" + item["roadAddr"].replace("-0", "") + "</td>";
                    }

                    var className = "";
                    if(item["isotype"] == "제1종구역") className = "sect1";
                    if(item["isotype"] == "제2종구역") className = "sect2";
                    if(item["isotype"] == "제3종구역") className = "sect3";
                    if(item["isotype"] == "제4종구역") className = "sect4";
                    if(item["isotype"] == "제5종구역") className = "sect5";

                    bodyStr += "   <td class='" + className + "'>" + item["isotype"] + "</td>" +
                        "   <td><button>정보보기</button></td>" +
                        "</tr>";

                    $(tbl).find("tbody").append(bodyStr);


                    $(tbl).find("tbody").on("click", '#tbl_row_' + idx, function (evt) {
                        self.props.clickEvent(item, evt);
                    })
                }
            });

            //ROW 클릭 이벤트
            // $(tbl).find("tbody tr").on("click", eval(this.props.clickEvent));

            // 메뉴 추가
            // $(tbl).append("<div class='boardMenu'>" + "<div><i class='asc fas fa-long-arrow-alt-up'></i>오름차순 정렬</div>" + "<div><i class='desc fas fa-long-arrow-alt-down'></i>내림차순 정렬</div>" + "<div class='showColumns'><i class='fas fa-columns'></i>컬럼<i class='fas fa-caret-right'></i></div>" + "</div>");

            // 컬럼 Hover 이벤트 추가
            $(tbl).find(".showColumns").on("mouseover", function (evt) {
                $(tbl).find(".colList").show();
            });
            $(tbl).find(".showColumns").on("mouseout", function (evt) {
                $(tbl).find(".colList").hide();
            });

            // 컬럼 리스트 추가
            $(tbl).find(".showColumns").append("<div class='colList'></div>");
            colList.map(function (item, i) {
                $(tbl).find(".colList").append("<label for=" + self.props.id + item + "><input id=" + self.props.id + item + " type='checkbox' checked />" + item + "</label>");
            });

            // 테이블 추가
            $(this.props.target).append(tblWrap);
            this.setPage(data, page);

            /*
             * 페이지 관련 이벤트 시작
             */

            // 처음 페이지 이동
            $(self.props.target).find(".firstPage").on("click", function () {
                self.pageClick(1);
            });

            // 이전 페이지 이동
            $(self.props.target).find(".prePage").on("click", function () {
                var page = self.props.minPage - self.props.pageCount;

                if (page <= 1)
                    page = 1;
                self.pageClick(page);
            });

            // 다음 페이지 이동
            $(self.props.target).find(".nextPage").on("click", function () {
                var page = self.props.maxPage + 1;

                if (page >= self.props.endPage)
                    page = self.props.endPage;
                self.pageClick(page);
            });

            // 마지막 페이지 이동
            $(self.props.target).find(".lastPage").on("click", function () {
                self.pageClick(self.props.endPage);
            });

            $(self.props.target).find("section div").on("click", function (evt) {
                self.pageClickHandler(evt);
            });

            /*
             * 페이지 관련 이벤트 종료
             */

            /*
             * 테이블 설정 관련 이벤트 시작
             */

            // 컬럼 체크박스 이벤트
            $(self.props.target).find("input").on("change", function (evt) {
                $("th." + evt.target.id + ", td." + evt.target.id).toggle();
            });

            // 오름차순 이벤트
            $(self.props.target).find(".asc").on("click", function () {

            });

            // 내림차순 이벤트
            $(self.props.target).find(".desc").on("click", function (evt) {

            });

            $(self.props.target).find("i.fa-caret-down").on("click", function (evt) {
                var menu = $(evt.target).closest(".board").find(".boardMenu");
                var left = $(evt.target).offset().left;
                var top = $(evt.target).offset().top + $(evt.target).height();

                menu.css({
                    left: left,
                    top: top,
                });

                menu.attr("tabindex", -1);

                menu.show();
                menu.focus();

                menu.unbind("focusout");
                menu.focusout(function (evt) {
                    // evt.preventDefault();
                    // if($(evt.target).closest(".boardMenu").length) return;
                    if (!$(evt.target).closest(".boardMenu").is(":hover"))
                        $(evt.target).closest(".boardMenu").hide();
                });
            });
            /*
             * 테이블 설정 관련 이벤트 종료
             */

            this.tableResizable();
        },

        tableResizable: function () {
            var pressed = false;
            var start;
            var startX, startWidth;
            var clickPosX;
            var interval;
            var table = $(this.props.target).find("table");
            var tblWidth;

            $(this.props.target).find(".spliter").mousedown(function (e) {
                e.preventDefault();
                var th = $(this).closest("th");

                if (th.offset().left + th.width() - $(this).width() < e.pageX) {
                    pressed = true;
                    start = th;
                    clickPosX = e.pageX;

                    tblWidth = table.width();
                    startWidth = th.width() + 2.5;
                    startX = startWidth + th.offset().left;
                }
            });

            $(document).mousemove(function (e) {
                if (pressed) {
                    interval = e.pageX - clickPosX;
                    if (interval != 0) {
                        if (startWidth + interval > 80) {
                            table.width(tblWidth + interval);
                            $(start).width(startWidth + interval);
                        }
                    }
                }
            });

            $(document).mouseup(function (e) {
                e.preventDefault();
                if (pressed) {
                    pressed = false;
                }
            });
        }
    }
})(window, jQuery);