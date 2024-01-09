(function (window, $) {
    "use strict";

    window.SisPagination = function (props) {
        this.id = props.id;
        this.totalCount = props.totalCount ? props.totalCount : 0;

        this.setDataCount(this.totalCount);
        this._activeEvent();

        this._init(props);
    }

    SisPagination.prototype = {
        curPage: 1,
        viewCount: 15,
        pageCount: 5,
        firstPage: 1,
        lastPage: 1,
        endPage: 1,
        minPage: 1,
        maxPage: 1,
        totalCount: 0,

        _extendProps: function (props) {
            this.props = $.extend({}, this.props, props);
        },

        _init: function (props) {
            this._extendProps(props);
        },

        _activeEvent: function() {
            var id = this.id;
            var self = this;

            $("#" + id).on("click", ".firstPage", function() {
                self.first();
            });

            $("#" + id).on("click", ".prevPage", function() {
                self.prev();
            });

            $("#" + id).on("click", ".nextPage", function() {
                self.next();
            });

            $("#" + id).on("click", ".lastPage", function() {
                self.last();
            });

            $("#" + id).on("click", "section > div", function(evt) {
                $("#" + id + " section > div").removeClass("active");
                $(evt.target).addClass("active");
                
                self.pageClick(evt);
            });
        },

        // Element 생성
        createElement: function() {
            var id = this.id;
            var pages = "";
            var self = this;

            if(this.totalCount > 0) {
                for(var i = this.startPage; i <= this.endPage; i++) {
                    if(i > this.lastPage) break;
                    if(i == this.curPage)
                        pages += "<div class='active'>" + i + "</div>";
                    else
                        pages += "<div>" + i + "</div>";
                }
            } else {
                pages += "<div class='active'>1</div>";
            }

            var str = "<div class='sisPagination'>";
            str += "<div class='firstPage'><<</div>";
            str += "<div class='prevPage'><</div>";
            str += "<section>" + pages + "</section>"
            str += "<div class='nextPage'>></div>";
            str += "<div class='lastPage'>>></div>";
            str += "</div>";

            $("#" + id).html(str);
        },

        // 데이터 개수 설정
        setDataCount: function (cnt) {
            this.totalCount = cnt;
            this.lastPage = Math.ceil(cnt / this.viewCount);

            this.startPage = this.curPage % this.pageCount == 0 ? this.curPage - this.pageCount + 1 : this.curPage - (this.curPage % this.pageCount) + 1;
            this.endPage = this.startPage + this.pageCount - 1;
            this.createElement();
        },

        // 처음페이지
        first: function () {
            this.curPage = 1;
            this._onClick(this.curPage);
        },

        //이전페이지
        prev: function () {
            if (this.curPage > 1) {
                this.curPage -= 1;
                this._onClick(this.curPage);
            }
        },

        // 다음페이지
        next: function () {
            if (this.curPage < this.lastPage) {
                this.curPage += 1;
                this._onClick(this.curPage);
            }
        },

        // 마지막페이지
        last: function () {
            this.curPage = this.lastPage;
            this._onClick(this.curPage);
        },

        // 페이지클릭 이벤트
        pageClick: function (evt) {
            this.curPage = parseInt(evt.target.innerText);
            this._onClick(this.curPage);
        },

        _onClick: function (page) {
            if (this.props.onClick) {
                this.props.onClick(page);
            }
        }
    }
})(window, jQuery);