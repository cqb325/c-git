function o(t) {
    t = t && t.getBoundingClientRect();
    var e = Number(window.scrollX || window.pageXOffset || 0),
        r = Number(window.scrollY || window.pageYOffset || 0);
    return t && {
        left: t.left + e,
        top: t.top + r
    }
}

function i() {
    var e = document.getElementById("commits-table");
    if (e || (e = document.getElementById("compare-commits-table")), !e) return null;
    for (var r = e.getElementsByTagName("tr"), o = 0, t = r.item(o); t && !t.getAttribute("data-commitid");) t = r.item(++o);
    return t && [o, t, r, t.getAttribute("data-commitid")]
}

function n() {
    var e = document.getElementById("git-gragh");
    e || (e = document.createElementNS(r, "svg"), e.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink"), e.setAttribute("width", 25), e.setAttribute("height", 20), e.setAttribute("text-rendering", "optimizeLegibility"), e.setAttributeNS("http://www.w3.org/1999/xhtml", "style", "border: 0px; margin: 0px; padding: 0 30px 0 0;"), e.id = "git-gragh"), t.svg = e;
    var o = document.getElementById("git-gragh-tbl");
    if (o) t.tdL || (t.tdL = o.getElementsByTagName("td").item(0)), t.tdL.appendChild(e);
    else {
        var a = document.getElementsByClassName("commits-content").item(0);
        a || (a = document.getElementById("compare-content")), o = document.createElement("table"), o.id = "git-gragh-tbl", o.style.width = "1%";
        var i = o.insertRow(),
            n = i.insertCell(-1),
            s = i.insertCell(-1);
        n.style.verticalAlign = "top";
        s.style.width = "99%";
        s.style.verticalAlign = "top";
        a.appendChild(o);
        var style = document.createElement("style");
        style.setAttribute("type", "text/css");
        n.appendChild(e);
        n.setAttribute("rowspan", 99999);
        t.tdL = n;
        t.style = style;
    }
}

function GitGragh() {
    function f(t, e, r) {
        l[t] || (l[t] = []), l[t][e] = r
    }

    function u(t, e) {
        return l[t] && l[t][e]
    }

    function p(t) {
        return t.parents && t.parents.length > 1
    }

    function render(n) {
        var b = t.svg,
            g = o(b),
            l = t.commitsList,
            i = n;
        n.pathsDrawn = Object.create(null), n.drawPathTo = function (t) {
            if (!n.pathsDrawn[t.sha1]) {
                n.pathsDrawn[t.sha1] = !0;
                var s = t.col - n.col,
                    r = n.col;
                s > 0 && (r += s);
                for (var w = t.row - n.row, f = !1, g = !1; !g;) {
                    for (var b = !1, m = 1; w > m; m++) {
                        var v = l[n.row + m];
                        if (r === v.col) {
                            f = !0, b = !0, r++;
                            break
                        }
                        var c = u(n.row + m, r);
                        if (c && c !== t) {
                            f = !0, b = !0, r++;
                            break
                        }
                    }
                    b || (g = !0)
                }
                var o = n.pos(t);
                if (f) {
                    d = Math.max(d, r), c = u(n.row, r);
                    var h = n.prevParent(t),
                        y = t.col;
                    if (h) var y = h.col + 1;
                    t == u(n.row, y) ? (o = n.pos(l[n.row + 1]), r = t.col, o.setColor(t.col), n.curveLeft(o, t.col - n.col, t), n.path(o, t.row + 1, t.col, t)) : (p(i) || c && c !== i ? (o.setColor(r), n.curveRight(o, r - n.col, t)) : (n.col = r, n.x = a + e * n.col, s = t.col - n.col, o = n.pos(t)), o.setColor(r), n.path(o, t.row - 1, r, t), n.curveLeft(o, t.col - r, t)), t.colorOverride = r
                } else s > 0 ? (n.curveRight(o, s, t), n.path(o, t.row, r, t)) : 0 > s ? (n.path(o, t.row - 1, r, t), n.curveLeft(o, s, t)) : n.path(o, t.row, r, t)
            }
        }, n.prevParent = function (e) {
            if (e && e.sha1 && n.parents && n.parents.length > 1)
                for (var t = 1; t < n.parents.length; t++)
                    if (e.sha1 === n.parents[t]) return commitsTable[n.parents[t - 1]]
        }, n.plumb = function () {
            var h = t.commitsList;
            if (!n.isPlumbed) {
                var m = o(n.htmlElement);
                n.y = 17 + m.top - g.top;
                var u = void 0;
                if (n.parents && n.parents.length > 0)
                    for (var r = 0; r < n.parents.length; r++) {
                        var l = commitsTable[n.parents[r]];
                        if (l && !l.isPlumbed) {
                            0 == r ? u = l.plumb() : l.plumb();
                            var m = l.col - n.col,
                                v = l.row - n.row;
                            if (0 === m && (m = r), m >= 0) var b = n.col + m;
                            else b = n.col;
                            for (var f = 1; v > f; f++) {
                                var c = h[n.row + f];
                                c && !c.isPlumbed && (c.col = b + 1, c.x = a + e * c.col, d = Math.max(c.col, d))
                            }
                        } else 0 == r && (u = i)
                    } else u = i;
                return n.isPlumbed = !0, u
            }
        }, n.draw = function () {
            if (!n.isDone) {
                n.isDone = !0;
                for (var t = 0; n.parents && t < n.parents.length; t++) {
                    var e = commitsTable[n.parents[t]];
                    e ? (n.drawPathTo(e), e.draw()) : n.path(n.pos(), n.row + 1, n.col, void 0, !0)
                }
            }
        }, n.pos = function (a) {
            var o = t.commitsList,
                r = [n.x, n.y];
            return r.setColor = function (t) {
                Number(t) === t && (r.color = m[t % m.length], r.srcColor = r.color)
            }, r.setColor(a && a.col), r.srcColor = m[n.col % m.length], r.color || (r.color = r.srcColor), n.colorOverride && 0 !== n.col && r.setColor(n.colorOverride), r.below = function (n) {
                var e = o[n],
                    t = e && e.y;
                return t || (t = o[o.length - 1].y + c), [r[0], t]
            }, r.right = function (t) {
                var w
                return w = [r[0] + e * t, r[1] + c], a && o.length > n.row + 1 && (w[1] = o[n.row + 1].y), [r[0] - 1, r[1] + .75 * c, r[0] + e * t + 1, r[1] + .25 * c, w[0], w[1]]
            }, r.left = function (t) {
                return [r[0] + 1, r[1] + .75 * c, r[0] + e * t - 1, r[1] + .25 * c, r[0] + e * t, a.y]
            }, r
        }, n.curveRight = function (e, a, i) {
            i && f(n.row + 1, n.col + a, i);
            var o = e.right(a),
                t = document.createElementNS(r, "path");
            t.setAttribute("d", "M" + e.join(",") + "C" + o.join(",")), t.setAttribute("stroke-width", 2), t.setAttribute("stroke-opacity", 1), t.setAttribute("opacity", 1), t.setAttribute("fill", "none"), t.setAttribute("stroke", e.color), n.drawEarlier(t), e[0] = o[o.length - 2], e[1] = o[o.length - 1]
            n.isRemote && t.setAttribute("stroke-dasharray", "3,3,3,3,3,3,3,3,3,3,3");
            n.isRemote && t.setAttribute("stroke", "#AAAAAA");
        }, n.curveLeft = function (e, a) {
            var o = e.left(a),
                t = document.createElementNS(r, "path");
            t.setAttribute("d", "M" + e.join(",") + "C" + o.join(",")), t.setAttribute("stroke-width", 2), t.setAttribute("stroke-opacity", 1), t.setAttribute("opacity", 1), t.setAttribute("fill", "none"), t.setAttribute("stroke", e.srcColor), n.drawEarlier(t), e[0] = o[o.length - 2], e[1] = o[o.length - 1]
            n.isRemote && t.setAttribute("stroke-dasharray", "3,3,3,3,3,3,3,3,3,3,3");
            n.isRemote && t.setAttribute("stroke", "#AAAAAA");
        }, n.path = function (o, m, b, s, l) {
            var c = t.svg,
                u = t.commitsList;
            if (!l && s)
                for (var d = n.row + 1; m > d; d++) f(d, b, s);
            var a = document.createElementNS(r, "path"),
            i = o.below(m);
            l && n.row !== u.length - 1 && (i[0] = o[0] + 1.5 * e, i[1] = o[1] + .7 * (i[1] - o[1])), !l && a.setAttribute("d", "M" + o.join(",") + "L" + i.join(",")), a.setAttribute("stroke-width", 2), a.setAttribute("stroke-opacity", 1),
            l && a.setAttribute("stroke-dasharray", "15,3,3,3,3,3,3,3,3,3,3"),
            s && s.isLocal && a.setAttribute("stroke-dasharray", "15,3,3,3,3,3,3,3,3,3,15"),
            s && n.isRemote && a.setAttribute("stroke-dasharray", "3,3,3,3,3,3,3,3,3,3,3"),
            a.setAttribute("opacity", 1), s && s.col && n.col < s.col ? a.setAttribute("stroke", o.color) : a.setAttribute("stroke", o.srcColor), c.appendChild(a), o[1] = i[1];
            s && s.isLocal && a.setAttribute("stroke", "#E9C341");
            s && n.isRemote && a.setAttribute("stroke", "#AAAAAA");
            // console.log(n.isRemote);
            
            var g = c.getAttribute("width");
            g < o[0] + 15 && c.setAttribute("width", o[0] + 15)
        }, n.drawEarlier = function (r) {
            var e = t.svg;
            e.firstChild ? e.insertBefore(r, e.firstChild) : e.appendChild(r)
        }, n.circle = function () {
            var l = void 0,
                e = n.pos(),
                i = t.svg,
                h = i.getAttribute("width"),
                b = i.getAttribute("height"),
                o = document.createElementNS(r, "rect");
            o.id = "R_" + n.sha1, o.setAttribute("x", 0), o.setAttribute("y", Number(e[1] - 14)), o.setAttribute("width", "100%"), o.setAttribute("height", 28), o.setAttribute("stroke", "none"), o.setAttribute("stroke-width", 0), o.setAttribute("fill", "transparent"), i.appendChild(o);
            var a = document.createElementNS(r, "circle");
            a.id = "C_" + n.sha1, a.setAttribute("cx", e[0]), a.setAttribute("cy", e[1]), a.setAttribute("r", 6), a.setAttribute("fill", e.color), a.setAttribute("stroke", "none"), i.appendChild(a);
            if(n.isRemote){
                // a.setAttribute("stroke-dasharray", "3,3,3,3,3,3,3,3,3,3,3");
                // a.setAttribute("stroke", "#E9C341");
                // a.setAttribute("stroke-width", "3");
                // a.setAttribute("fill", "transparent");
                a.setAttribute('class', 'remoteCommit');
            }
            if(n.isLocal && !n.isSameNode){
                a.setAttribute("fill", "#E9C341");
            }
            var s = n.tags && n.tags.length > 0,
                m = n.branches && n.branches.length > 0,
                u = s && m,
                f = void 0;
            m && (f = n.insertTag(e, !1, u, l)), s && n.insertTag(e, !0, u, l, f);
            for (var d = document.getElementById("T_" + n.sha1), g = d.getElementsByTagName("td"), c = g.length - 1; 3 > c; c++) {
                var v = d.insertCell(-1);
                v.textContent = " "
            }
            h < e[0] && i.setAttribute("width", e[0] + 10), b < e[1] && i.setAttribute("height", e[1] + 10)
        }, n.insertTag = function (i, r, s, l, c) {
            var o = document.getElementById("T_" + n.sha1),
                a = r ? n.tags : n.branches,
                t = o.insertCell(-1);
            t.setAttribute("class", "d"), t.textContent = " " + a.join(", ");
            var e = document.createElement("span");
            return r ? e.setAttribute("class", "git icon-tag") : e.setAttribute("class", "git icon-branch"), t.appendChild(e), {}
        }
    }

    function h(t) {
        function o(t) {
            return t.sort().filter(function (e, t, r) {
                return !t || e != r[t - 1]
            })
        }
        t = t.trim(), "(" === t.charAt(0) && (t = t.substr(1)), ")" === t.charAt(t.length - 1) && (t = t.substr(0, t.length - 1)), t = t.trim();
        for (var n = [], a = [], i = t.split(", "), r = 0; r < i.length; r++) {
            var e = i[r];
            0 == e.indexOf("tag: ") ? n.push(e.substr(5)) : e.indexOf("refs/pull-requests/") >= 0 || a.push(e)
        }
        return [o(n), o(a)]
    }

    function start(y) {
        function isMasterBranch(commit) {
            if (commit.branches && commit.branches.length > 0)
                for (let r = 0; r < commit.branches.length; r++) {
                    var branch = commit.branches[r];
                    if ("origin/master" === branch || "master" === branch || "HEAD" === branch || branch.startsWith("HEAD ")) {
                        return true;
                    }
                }
            return false;
        }
        var commitsList = t.commitsList;
        // var lines = y;// y.trim().split("\n");
        
        var commits = y.commits;
        n();
        var lastDate = '';
        var r;
        for (var j = 0; j < commits.length; j++) {
            var line = commits[j];
            if (line) {
                var sha1 = line.sha(),
                    hasParents = typeof(line.parents) === 'function' ? line.parents() && line.parents().length : line.parents && line.parents.length,
                    author = line.author().name(),
                    date = new Date(line.date()).toLocaleString(),
                    msg = line.summary(),
                    table = jQuery("#git-gragh-tbl")[0],
                    row = table.insertRow(),
                    cell = row.insertCell(-1),
                    utd = row.insertCell(-1);
                    var div = document.createElement('div');
                    cell.appendChild(div);
                    row.id = "T_" + sha1;
                    row.setAttribute("data-commitid", sha1);
                    cell.setAttribute("class", "commit");
                    if(line.isLocal && !line.isSameNode){
                        cell.setAttribute("class", "commit unPushCommit");
                    }
                    div.textContent = msg;
                    div.setAttribute('title', author+'\n'+date);
                    utd.setAttribute('class', 'author');
                if(lastDate !== author){
                    utd.textContent = author;
                    lastDate = author;
                }
                var o = {
                    isDone: false,
                    isPlumbed: false,
                    sha1: sha1,
                    x: a,
                    isLocal: line.isLocal,
                    isRemote: line.isRemote,
                    isSameNode: line.isSameNode,
                    row: commitsList.length,
                    htmlElement: cell,
                    author: author,
                    date: date,
                    msg: msg,
                    message: line.message(),
                    col: 0
                };

                var item = o;
                commitsList.push(item);
                commitsTable[item.sha1] = item;
                hasParents ? item.parents = typeof(line.parents) === 'function' ? line.parents().map((p) => {
                    return p.tostrS();
                }) : line.parents : false;
                if (line.tags || line.branches) {
                    // var g = h(other.trim());
                    item.tags = line.tags;
                    item.branches = line.branches;
                }
            }
        }
        for (let r = 0; r < commitsList.length; r++){
            // console.log(i[r]);
            render(commitsList[r]);
        }
        let headCommit = void 0;
        for (let r = 0; r < commitsList.length; r++){
            let commit = commitsList[r]
            if (commit && isMasterBranch(commit)) {
                headCommit = commit;
                break;
            }
        }
        for (headCommit || (headCommit = commitsList[0]), r = 0; r < (headCommit ? headCommit.row : commitsList.length); r++){
            o = commitsList[r], o.col++, o.x = a + e * o.col, f(r, 0, headCommit);
        }
        if (headCommit) {
            var plumb = headCommit.plumb();
            if (plumb){
                for (r = plumb.row + 1; r < commitsList.length; r++){
                    let commit = commitsList[r];
                    if(0 === commit.col){
                        commit.col++;
                        commit.x = a + e * commit.col;
                    }
                }
            }
        }
        for (let r = 0; r < commitsList.length; r++) commitsList[r].plumb();
        for (let r = commitsList.length - 1; r >= 0; r--) commitsList[r].draw();
        for (let r = commitsList.length - 1; r >= 0; r--) commitsList[r].circle()
    }
    var m = ["#dc4132", "#79c753", "#f7786b", "#fae03c", "#98ddde", "#9896a4", "#b08e6a", "#91a8d0", "#f7cac9"],
        e = 15,
        c = 35,
        d = 0,
        l = [],
        commitsTable = Object.create(null),
        a = 39,
        b = function () {
            var n = t.commitsList;
            l = [];
            var e = i();
            if (e) {
                for (var m = e[2], f = e[0], u = 0, o = f; o < m.length; o++) {
                    e = m.item(o);
                    var c = e.getAttribute("data-commitid");
                    if (c) {
                        e.classList.remove("focused-commit");
                        var r = n[u];
                        if (!r || r.sha1 !== c) break;
                        var d = e.getElementsByClassName("commit").item(0);
                        d && (r.htmlElement = d.firstChild), r.isDone = !1, r.isPlumbed = !1, r.x = a, r.col = 0, delete r.colorOverride, u++
                    }
                }
                for (u < n.length && n.splice(u, n.length - o); o < m.length; o++) e = m.item(o), e.classList.remove("focused-commit"), c = e.getAttribute("data-commitid"), c && (d = e.getElementsByClassName("commit").item(0), d && (e.id = "T_" + c, r = {
                    isDone: !1,
                    isPlumbed: !1,
                    sha1: c,
                    x: a,
                    row: n.length,
                    col: 0,
                    htmlElement: d.firstChild
                }, n.push(r), commitsTable[r.sha1] = r))
            }
        };
    return b.start = start, b.commitsTable = commitsTable, b;
}

function render(l, ops) {
    destroy();
    var b = GitGragh();
    window.gragh = b;
    b(), b.start(l);
    var f = t.svg;
    var sha;
    jQuery("#git-gragh-tbl").find("tr").mouseenter(function () {
        var sha1 = this.getAttribute("data-commitid");
        if (jQuery("#T_" + sha1).addClass("commitHover"), sha1) {
            var r = f.getElementById("C_" + sha1);
            if(r.getAttribute('class') && r.getAttribute('class').indexOf('remoteCommit') > -1){
                r.setAttribute("class", "remoteCommit commitHover")
            } else {
                r.setAttribute("class", "commitHover")
            }
        }
    }).mouseleave(function () {
        var sha1 = this.getAttribute("data-commitid");
        if (jQuery("#T_" + sha1).removeClass("commitHover"), sha1) {
            var r = f.getElementById("C_" + sha1);
            if(r.getAttribute('class') && r.getAttribute('class').indexOf('remoteCommit') > -1){
                r.setAttribute("class", "remoteCommit")
            } else {
                r.setAttribute("class", "")
            }
        }
    }).click(function(){
        if(!$(this).hasClass('selected')){
            jQuery("#git-gragh-tbl tr.selected").removeClass('selected');
            $(this).addClass('selected');
        }
        var sha1 = this.getAttribute("data-commitid");
        if(ops.onClick){
            let obj = b.commitsTable[sha1];
            ops.onClick(obj);
        }
    }), jQuery("#git-gragh").find("rect, circle").mouseenter(function () {
        sha = this.id.substring(2), jQuery("#T_" + sha).addClass("commitHover")
    }).mouseleave(function () {
        sha = this.id.substring(2), jQuery("#T_" + sha).removeClass("commitHover")
    });
    var g = t.style.outerHTML.toString(),
        r = document.getElementById("git-gragh-tbl");
    r = r.cloneNode(!0);
    jQuery('rect').remove();
}

function destroy() {
    if (t.svg && t.svg.parentNode) {
        var s = t.svg;
        $(s).remove();
        t.svg = void 0;
        var l = GitGragh();
        t.commitsList.length = 0;
        for (var c in l.commitsTable) delete l.commitsTable[c]
    }
    
    jQuery("#git-gragh").remove();
    jQuery("#git-gragh-tbl").remove();
    n();
}

var e = jQuery,
    r = "http://www.w3.org/2000/svg",
    s = "http://www.w3.org/1999/xlink",
    t = Object.create(null);
t.commitsList = [];

export default render;
export const adestroy = destroy;
