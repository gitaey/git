(function (window, $) {
    'use strict'

    window.SisTree = function (map, props) {
        if (!map) {
            alert("Tree map를 설정해 주세요");
            return false;
        }

        this.map = map;
        this._init(props);
    };

    SisTree.prototype = {
        lstTree: [],
        props: {
            target: "tree"
        },

        _init: function (props) {
            this.extendProps(props);

            this.$target = $("#" + this.props.target);
            this.$target.addClass("layerTree");
            this.$target.html("");
            this.$target.append("<div id='root' tree='true'></div>");
            var $root = this.$target.find("#root");

            $root.attr("node", "root");
            $root.attr("parentNode", "");
        },

        extendProps: function (props) {
            this.props = $.extend({}, this.props, props);
        },

        createTree: function (lyrList) {
            var self = this;

            $.each(lyrList, function (key, value) {
                if (value.type == "group") {
                    self.appendNode(value);
                } else {
                    if (value.load) {
                        self.appendNode(value);
                        sisLyr.addWmsLayer(value.id, value);
                    }
                }
            });

            var node = $($("div.node:last-child")[$("div.node:last-child").length - 1]);
            $("span").removeClass("tree-expander-off-end");
            $("span").removeClass("tree-expander-on-end");

            while (self.findNode(node.attr("node")).attr("node") != "root") {
                if (node.children("div.wrap").children(".tree-expander").hasClass("tree-expander-off")) {
                    node.children("div.wrap").children(".tree-expander").addClass("tree-expander-off-end");
                } else {
                    node.children("div.wrap").children(".tree-expander").addClass("tree-expander-on-end");
                }

                node = self.findNode(node.attr("parent"));
            }
        },

        appendNode: function (node) {
            if (!node.id)
                return;

            var self = this;
            var $target = this.$target;
            var $appendNode;
            var str = "";
            var className = "";
            var lastAddNode = "";
            var expandClass = "";
            var style = "";

            if (node.type == "group") {
                if (node.root) {
                    className = "tree-root tree-node-last";
                } else {
                    className = "";
                }

                if (!node.expand)
                    expandClass = "tree-expander-on";
                else
                    expandClass = "tree-expander-off";

                if (this.findNode(node.parentNode).children("div.wrap").children(".tree-expander").hasClass("tree-expander-on"))
                    str += "<div class='tree-group hidden " + className + "' node='" + node.id + "' parent='" + node.parentNode + "'>";
                else
                    str += "<div class='tree-group " + className + "' node='" + node.id + "' parent='" + node.parentNode + "'>";

                if (node.root) {
                    if (node.expand)
                        str += "<div class='wrap root expand-on'><i class='arrow'>펼치기</i>";
                    else
                        str += "<div class='wrap root expand-off'><i class='arrow'>펼치기</i>";
                } else {
                    str += "<div class='wrap'>";
                }
                str += "<span id='" + node.id + "' name='" + node.id + "' class='tree-expander " + expandClass + "'></span>";
                str += "<input id='" + node.id + "' name='" + node.id + "' type='checkbox' class='hidden'>";
                str += "<span id='" + node.id + "' name='" + node.id + "' class='tree-checkbox'></span>";
                str += "</div>";
                str += "</div>";
                $appendNode = $(str);
            } else {
                var base = node.base;
                var name = base ? "base" : "";

                if (this.findNode(node.parentNode).children("div.wrap").children(".tree-expander").hasClass("tree-expander-on"))
                    str += "<div class='hidden ' node='" + node.id + "' parent='" + node.parentNode + "'>";
                else
                    str += "<div node='" + node.id + "' parent='" + node.parentNode + "'>";

                str += "<div class='wrap'>";
                str += "<span id='" + node.id + "' name='" + node.id + "' class='tree-connector'></span>";
                str += "<input id='" + node.id + "' name='" + node.id + "' base='" + base + "' type='checkbox' class='hidden' for=''>";
                str += "<span id='" + node.id + "' name='" + node.id + "' class='tree-checkbox'></span>";
                str += "</div>";
                str += "</div>";
                $appendNode = $(str);
            }

            if (!node.parentNode)
                node.parentNode = "root";
            var $pNode = $(this.findNode(node.parentNode));

            if (!$pNode)
                return;

            $appendNode.addClass("node");
            $appendNode.attr("node", node.id);
            $appendNode.attr("parent", node.parentNode);

            var $checkbox = $($appendNode.find("[type=checkbox]"));
            var $checkboxSpan = $($appendNode.find(".tree-checkbox"));
            $checkbox.attr("name", node.id);
            $checkbox.attr("id", node.id);
            $checkbox.attr("map", this.map.getTarget());
            $checkbox.attr("checked", node.visiblity);
            if (node.visibility)
                $checkboxSpan.addClass("tree-checkbox-on");
            else
                $checkboxSpan.addClass("tree-checkbox-off");

            $checkboxSpan.on("click", function (evt) {
                var isChecked = "";

                if ($checkboxSpan.hasClass("tree-checkbox-on")) {
                    $checkboxSpan.removeClass("tree-checkbox-on");
                    $checkboxSpan.addClass("tree-checkbox-off");
                    isChecked = false;
                } else {
                    $checkboxSpan.removeClass("tree-checkbox-off");
                    $checkboxSpan.addClass("tree-checkbox-on");
                    isChecked = true;
                }

                if ($checkbox.attr("base") == "1") {
                    $.each($("input[base=1]"), function (idx, item) {
                        if ($checkbox.prop("id") != $(item).prop("id") && isChecked) {
                            var span = item.nextSibling;
                            if ($(span).hasClass("tree-checkbox-on")) {
                                $(span).click();
                            }
                        }
                    })
                }

                $checkbox.prop("checked", isChecked);
                $checkbox.click();

                // 하위 항목 모두 체크변경
                $.each($appendNode.find(".tree-checkbox"), function (idx, target) {
                    if (idx > 0) {
                        if ($(target).hasClass("tree-checkbox-on") != isChecked)
                            $(target).click();
                    }
                })

                // 상위 항목 모두 체크 변경
                // this._parentNodeCheck($pNode);
                self._parentNodeCheck($pNode);
            });

            // expander
            var $label = $($appendNode.children("div.wrap").find("span.tree-expander"));
            $label.addClass(node.id);
            $label.on("click", function (evt) {
                if (self.sliding)
                    return false;
                self.sliding = true;

                var t = $label.parent().parent().children("div:not('.wrap')");

                if ($(t).is(":hidden")) {
                    // $label.parent().parent().find(".tree-slider").slideDown();
                    $(t).slideDown();
                } else {
                    // $label.parent().parent().find(".tree-slider").hide();
                    $(t).slideUp();
                }

                $label.toggleClass("tree-expander-on");
                $label.toggleClass("tree-expander-off");

                var node = $($("div.node:last-child")[$("div.node:last-child").length - 1]);
                $("span").removeClass("tree-expander-off-end");
                $("span").removeClass("tree-expander-on-end");

                while (self.findNode(node.attr("node")).attr("node") != "root") {
                    if (node.children("div.wrap").children(".tree-expander").hasClass("tree-expander-off")) {
                        node.children("div.wrap").children(".tree-expander").addClass("tree-expander-off-end");
                    } else {
                        node.children("div.wrap").children(".tree-expander").addClass("tree-expander-on-end");
                    }

                    node = self.findNode(node.attr("parent"));
                }

                setTimeout(function () {
                    self.sliding = false
                }, 500);

                return false;
            });

            $appendNode.children("div.wrap.root").on("click", function (e) {
                if (self.sliding)
                    return false;
                self.sliding = true;

                if ($(e.target).hasClass("arrow") || $(e.target).hasClass("tree-group-title")) {
                    self.sliding = false;
                    $(e.target).parent().click();

                    return false;
                }

                $(e.target).toggleClass("expand-on").toggleClass("expand-off");
                if ($(e.target).hasClass("expand-on")) {
                    $(e.target).parent().css("padding", "0 0 10px 0");
                } else {
                    $(e.target).parent().css("padding", "0");
                }

                self.sliding = false
                $appendNode.children("div.wrap").children("span.tree-expander").click();

                // setTimeout(() this.sliding = false, 500);
            });

            $("#" + this.props.target + " [parent=" + node.parentNode + "]").children("div.wrap").children(".tree-connector").removeClass("tree-connector-last");
            $("#" + this.props.target + " [parent=" + node.parentNode + "]").children("div.wrap").children(".tree-legend").removeClass("tree-legend-last");

            if (node.type == "group") {
                $appendNode.children("div.wrap").append("<span class='tree-group-title' for='" + node.id + "'>" + node.korName + "</span>");
            } else {
                $appendNode.children("div.wrap").append("<span class='tree-layer-title' for='" + node.id + "'>" + node.korName + "</span>");
                $appendNode.children("div.wrap").children(".tree-connector").addClass("tree-connector-last");
                // $appendNode.children("div.wrap").append("<div id='" + node.id
                // +
                // "' name='" + node.id + "' class='tree-slider'><span
                // class='slider-circle'></span></div>");
                $appendNode.children("div.wrap").append("<div id='" + node.id + this.map.getTarget() + "' name='" + node.id + "' class='tree-slider'></div>");

                if (node.legend != null)
                    $appendNode.children("div.wrap").append("<div id='" + node.id + "' name='" + node.id + "' class='tree-legend tree-legend-last tree-legend-null'><img src='" + PATH + "/images/map/null.png'/></div>");
                else
                    $appendNode.children("div.wrap").append("<div id='" + node.id + "' name='" + node.id + "' class='tree-legend tree-legend-last tree-legend-null'><img src='" + PATH + "/images/map/null.png'/></div>");
            }
            $pNode.append($appendNode[0]);

            var $legend = $appendNode.find(".tree-legend");

            $checkbox.on("change", function (evt) {
                var isChecked = !evt.target.checked;
                var mapId = $(evt.target).attr("map");
                var className = "";

                var lyr = null;
                self.map.getLayers().forEach(function (item, idx) {
                    if (item.get("id") == evt.target.id)
                        lyr = item;
                });

                if (lyr) {
                    lyr.setVisible(isChecked);

                    if (isChecked)
                        $("label[for=" + evt.target.id + "]").closest("span").addClass("checked");
                    else
                        $("label[for=" + evt.target.id + "]").closest("span").removeClass("checked");
                    $("input#" + evt.target.id).attr("checked", isChecked)
                }
            });

            $appendNode.find("[type='checkbox']").attr("checked", node.visiblity);
            this._parentNodeCheck($pNode);

            lastAddNode = $appendNode;

            $(".node").removeClass("tree-node-last");
            $(".node[parent=root]").addClass("tree-node-last");
            $("#root").children(".node:last-child").children(".node").addClass("tree-node-last");
            $("#root").children(".node:last-child").children(".node:last-child").children(".node").addClass("tree-node-last");

            var node = $($("div.node:last-child")[$("div.node:last-child").length - 1]);
            $("span").removeClass("tree-expander-off-end");
            $("span").removeClass("tree-expander-on-end");

            while (this.findNode(node.attr("node")).attr("node") != "root") {
                if (node.children(".tree-expander").hasClass("tree-expander-off")) {
                    node.children(".tree-expander").addClass("tree-expander-off-end");
                } else {
                    node.children(".tree-expander").addClass("tree-expander-on-end");
                }

                node = this.findNode(node.attr("parent"));
                if (!node)
                    break;
            }

            // $.each($(".tree-connector-last"), function(idx, target){
            // if($(target).parent().next().length > 0){
            // $(target).addClass("tree-connector-last");
            // }
            // });

            $appendNode.children(".tree-connector").addClass("tree-connector-last");
            $legend.addClass("tree-legend-last");

            var $slider = $appendNode.children("div.wrap").children(".tree-slider");
            $slider.slider({
                value: 100,
                slide: function (evt, ui) {
                    var opacity = ui.value / 100;
                    var id = evt.target.id.substring(0, evt.target.id.length - self.map.getTarget().length);

                    var lyr = null;
                    self.map.getLayers().forEach(function (item, idx) {
                        if (item.get("id") == id)
                            lyr = item;
                    });

                    if (lyr)
                        lyr.setOpacity(opacity);
                }
            });
        },

        findNode: function (id) {
            return this.$target.find("[node='" + id + "']");
        },

        _parentNodeCheck: function ($node) {
            var checkedAllLength = $node.children("div:not(.wrap)").find(".tree-checkbox").length;
            var checkedLegnth = $node.children().next().find(".tree-checkbox-on").length;

            $node.children("div.wrap").children(".tree-checkbox").removeClass("tree-checkbox-on");
            $node.children("div.wrap").children(".tree-checkbox").removeClass("tree-checkbox-off");
            $node.children("div.wrap").children(".tree-checkbox").removeClass("tree-checkbox-half");

            if (checkedLegnth > 0) {
                if (checkedAllLength == checkedLegnth) {
                    $node.children("div.wrap").children(".tree-checkbox").addClass("tree-checkbox-on");
                } else if (checkedAllLength < checkedLegnth) {
                    $node.children("div.wrap").children(".tree-checkbox").addClass("tree-checkbox-on");
                } else {
                    $node.children("div.wrap").children(".tree-checkbox").addClass("tree-checkbox-half");
                }
            } else {
                $node.children("div.wrap").children(".tree-checkbox").addClass("tree-checkbox-off");
            }

            if ($node.attr("parent")) {
                var $pNode = this.findNode($node.attr("parent"));
                if ($pNode.attr("node") == "root")
                    return;
                else
                    this._parentNodeCheck(this.findNode($node.attr("parent")));
            }
        }
    };
})(window, jQuery);