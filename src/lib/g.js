function getOffset(el) {
    el = el && el.getBoundingClientRect();
    var scrollX = Number(window.scrollX || window.pageXOffset || 0);
    var scrollY = Number(window.scrollY || window.pageYOffset || 0);
    return el && {
            left: (el.left + scrollX),
            top: (el.top + scrollY)
        };
}


function n() {
    var e = document.getElementById("git-gragh");
    e || (e = document.createElementNS(svgNS, "svg"), 
    e.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink"),
    e.setAttribute("width", 25), e.setAttribute("height", 20),
    e.setAttribute("text-rendering", "optimizeLegibility"),
    e.setAttributeNS("http://www.w3.org/1999/xhtml", "style", "border: 0px; margin: 0px; padding: 0 30px 0 0;"),
    e.id = "git-gragh"), svgHolder.svg = e;
    var o = document.getElementById("git-gragh-tbl");
    if (o) svgHolder.tdL || (svgHolder.tdL = o.getElementsByTagName("td").item(0)), svgHolder.tdL.appendChild(e);
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
        svgHolder.tdL = n;
        svgHolder.style = style;
    }
}

function GitGragh() {
    function storeElbow(x, y, commit) {
        if (!elbows[x]) {
            elbows[x] = [];
        }
        elbows[x][y] = commit;
    }

    function readElbow(x, y) {
        return elbows[x] && elbows[x][y];
    }

    function isMerge(my) {
        return my.parents && my.parents.length > 1;
    }

    function addGraphFunctions(n) {
        var b = svgHolder.svg,
            g = getOffset(b),
            l = svgHolder.commitsList,
            i = n;
        var my = n;
        var me = my;
        var commitsList = svgHolder.commitsList;
        my.pathsDrawn = Object.create(null);

        if (my.drawPathTo) {
            return;
        }

        my.drawPathTo = function (commit) {
            if (my.pathsDrawn[commit.sha1]) {
                return;
            }
            my.pathsDrawn[commit.sha1] = true;

            var offset = commit.col - my.col;
            var targetCol = my.col;
            if (offset > 0) {
                targetCol += offset;
            }

            var distance = commit.row - my.row;

            // Collision avoidance:
            var hasCollision = false;
            var collisionFree = false;
            while (!collisionFree) {
                var foundCollision = false;
                for (var j = 1; j < distance; j++) {
                    var c = commitsList[my.row + j];
                    if (targetCol === c.col) {
                        hasCollision = true;
                        foundCollision = true;
                        targetCol++;
                        break;
                    }
                    var elbow = readElbow(my.row + j, targetCol);
                    if (elbow && elbow !== commit) {
                        hasCollision = true;
                        foundCollision = true;
                        targetCol++;
                        break;
                    }
                }
                if (!foundCollision) {
                    collisionFree = true;
                }
            }

            var pos = my.pos(commit);
            if (hasCollision) {
                maxCol = Math.max(maxCol, targetCol);

                // Two ways to avoid collision:
                // 1.) curve-around
                // 2.) move myself over!
                elbow = readElbow(my.row, targetCol);
                if (isMerge(me) || (elbow && elbow !== me)) {
                    pos.setColor(targetCol);
                    my.curveRight(pos, targetCol - my.col, commit);
                } else {
                    my.col = targetCol;
                    my.x = farLeftPosition + (laneWidth * my.col);
                    offset = commit.col - my.col;
                    pos = my.pos(commit);
                }
                pos.setColor(targetCol);

                my.path(pos, commit.row - 1, targetCol, commit);
                my.curveLeft(pos, commit.col - targetCol, commit);
                commit.colorOverride = targetCol;
            } else {
                if (offset > 0) {
                    my.curveRight(pos, offset, commit);
                    my.path(pos, commit.row, targetCol, commit);
                } else if (offset < 0) {
                    my.path(pos, commit.row - 1, targetCol, commit);
                    my.curveLeft(pos, offset, commit);
                } else {
                    my.path(pos, commit.row, targetCol, commit);
                }
            }
        };

        my.plumb = function () {
            var commitsList = svgHolder.commitsList;
            if (my.isPlumbed) {
                return;
            }
            var m = getOffset(my.htmlElement);
            my.y = 17 + m.top - g.top;
            var result = undefined;
            if (my.parents && my.parents.length > 0) {
                for (var i = 0; i < my.parents.length; i++) {
                    var parent = commitsTable[my.parents[i]];
                    if (parent && !parent.isPlumbed) {

                        if (i == 0) {
                            result = parent.plumb();
                        } else {
                            parent.plumb();
                        }

                        var offset = parent.col - my.col;
                        var distance = parent.row - my.row;

                        if (offset === 0) {
                            offset = i;
                        }
                        if (offset >= 0) {
                            var col = my.col + offset;
                        } else {
                            col = my.col;
                        }


                        for (var j = 1; j < distance; j++) {
                            var c = commitsList[my.row + j];
                            if (c && !c.isPlumbed) {
                                c.col = col + 1;
                                c.x = farLeftPosition + (laneWidth * c.col);
                                maxCol = Math.max(c.col, maxCol);
                            }
                        }
                    } else {
                        if (i == 0) {
                            result = me;
                        }
                    }
                }
            } else {
                result = me;
            }
            my.isPlumbed = true;
            return result;
        };

        my.draw = function () {
            if (my.isDone) {
                return;
            }
            my.isDone = true;
            for (var i = 0; my.parents && i < my.parents.length; i++) {
                var parent = commitsTable[my.parents[i]];
                if (parent) {
                    my.drawPathTo(parent);
                    parent.draw();
                } else {
                    // Merge-out..
                    my.path(my.pos(), my.row + 1, my.col, undefined, true);
                }
            }
        };

        my.pos = function (targetCommit) {
            var commitsList = svgHolder.commitsList;
            var v = [my.x, my.y];
            v.setColor = function (col) {
                if (Number(col) === col) {
                    v.color = COLORS[col % COLORS.length];
                    v.srcColor = v.color;
                }
            };
            v.setColor(targetCommit && targetCommit.col);
            v.srcColor = COLORS[my.col % COLORS.length];
            if (!v.color) {
                v.color = v.srcColor;
            }
            if (my.colorOverride) {
                if (my.col !== 0) {
                    v.setColor(my.colorOverride);
                }
            }

            v.below = function (targetRow) {
                var c = commitsList[targetRow];
                var y = c && c.y;
                if (!y) {
                    y = commitsList[commitsList.length - 1].y + laneLength;
                }
                return [v[0], y];
            };
            v.right = function (amount) {
                var w = [v[0] + (laneWidth * amount), v[1] + laneLength];      // destination
                if (targetCommit && commitsList.length > my.row + 1) {
                    w[1] = commitsList[my.row + 1].y;
                }
                return [
                    v[0] - 1, v[1] + (laneLength * 0.75),                         // bezier point 1
                    v[0] + (laneWidth * amount) + 1, v[1] + (laneLength * 0.25),  // bezier point 2
                    w[0], w[1]
                ];
            };
            v.left = function (amount) {
                return [
                    v[0] + 1, v[1] + (laneLength * 0.75),                         // bezier point 1
                    v[0] + (laneWidth * amount) - 1, v[1] + (laneLength * 0.25),  // bezier point 2
                    v[0] + (laneWidth * amount), targetCommit.y
                ];
            };
            return v;
        };

        my.curveRight = function (pos, distanceAcross, targetCommit) {
            if (targetCommit) {
                storeElbow(my.row + 1, my.col + distanceAcross, targetCommit);
            }
            var endPos = pos.right(distanceAcross);
            var path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", "M" + pos.join(",") + "C" + endPos.join(","));
            path.setAttribute("stroke-width", 2);
            path.setAttribute("stroke-opacity", 1);
            path.setAttribute("opacity", 1);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", pos.color);
            my.drawEarlier(path);
            pos[0] = endPos[endPos.length - 2];
            pos[1] = endPos[endPos.length - 1];

            if(my.isRemote){
                path.setAttribute("stroke-dasharray", "3,3,3,3,3,3,3,3,3,3,3");
                path.setAttribute("stroke", "#AAAAAA");
            }
            if(my.isLocal && targetCommit.isLocal){
                path.setAttribute("stroke-dasharray", "3,3,3,3,3,3,3,3,3,3,3");
            }
        };

        my.curveLeft = function (pos, distanceAcross) {
            var endPos = pos.left(distanceAcross);
            var path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", "M" + pos.join(",") + "C" + endPos.join(","));
            path.setAttribute("stroke-width", 2);
            path.setAttribute("stroke-opacity", 1);
            path.setAttribute("opacity", 1);
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", pos.srcColor);
            my.drawEarlier(path);
            pos[0] = endPos[endPos.length - 2];
            pos[1] = endPos[endPos.length - 1];
            if(my.isRemote){
                path.setAttribute("stroke-dasharray", "3,3,3,3,3,3,3,3,3,3,3");
                path.setAttribute("stroke", "#AAAAAA");
            }
            if(my.isLocal){
                path.setAttribute("stroke-dasharray", "3,3,3,3,3,3,3,3,3,3,3");
            }
        };

        my.path = function (pos, targetRow, targetCol, targetCommit, dashed) {
            var svg = svgHolder.svg;
            var commitsList = svgHolder.commitsList;

            // Every moment of collision-avoidance must be marked as an "elbow":
            if (!dashed && targetCommit) {
                for (var i = my.row + 1; i < targetRow; i++) {
                    storeElbow(i, targetCol, targetCommit);
                }
            }

            var path = document.createElementNS(svgNS, "path");
            var endPos = pos.below(targetRow);

            if (dashed && my.row !== commitsList.length - 1) {
                // dashed should trail off after 70% of distance..
                endPos[0] = pos[0] + laneWidth * 1.5;
                endPos[1] = pos[1] + 0.7 * (endPos[1] - pos[1]);
            }

            path.setAttribute("d", "M" + pos.join(",") + "L" + endPos.join(","));
            path.setAttribute("stroke-width", 2);
            path.setAttribute("stroke-opacity", 1);
            if (dashed) {
                path.setAttribute("stroke-dasharray", "15,3,3,3,3,3,3,3,3,3,3");
            }
            if(targetCommit && targetCommit.isLocal){
                path.setAttribute("stroke-dasharray", "2,2");
                path.setAttribute("stroke", "#E9C341");
            }
            if(targetCommit && my.isRemote){
                path.setAttribute("stroke-dasharray", "2,2");
                path.setAttribute("stroke", "#AAAAAA");
            }
            path.setAttribute("opacity", 1);
            if (targetCommit && targetCommit.col && my.col < targetCommit.col) {
                path.setAttribute("stroke", pos.color);
            } else {
                path.setAttribute("stroke", pos.srcColor);
            }
            svg.appendChild(path);
            pos[1] = endPos[1];

            var width = svg.getAttribute("width");
            if (width < pos[0]) {
                svg.setAttribute("width", pos[0] + 10);
            }
        };

        my.drawEarlier = function (element) {
            var svg = svgHolder.svg;
            if (svg.firstChild) {
                svg.insertBefore(element, svg.firstChild);
            } else {
                svg.appendChild(element);
            }
        };

        my.circle = function () {
            var pos = my.pos();
            var svg = svgHolder.svg;
            var width = svg.getAttribute("width");
            var height = svg.getAttribute("height");
            var target = "";

            var rect = document.createElementNS(svgNS, "rect");
            rect.id = "R_" + my.sha1;
            rect.setAttribute("x", 0);
            rect.setAttribute("y", Number(pos[1] - 14));
            rect.setAttribute("width", "100%");
            rect.setAttribute("height", 28);
            rect.setAttribute("stroke", "none");
            rect.setAttribute("stroke-width", 0);
            rect.setAttribute("fill", "transparent");
            svg.appendChild(rect);

            var circle = document.createElementNS(svgNS, "circle");
            circle.id = "C_" + my.sha1;
            circle.setAttribute("cx", pos[0]);
            circle.setAttribute("cy", pos[1]);
            circle.setAttribute("r", dotSize);
            circle.setAttribute("fill", pos.color);
            circle.setAttribute("stroke", "none");
            circle.setAttribute("stroke-width", 2);

            if(my.isRemote){
                circle.setAttribute("fill", unPushFill);
                circle.setAttribute("stroke-dasharray", "1,1");
                circle.setAttribute('class', 'remoteCommit');
            }
            
            if(my.isLocal && !my.isSameNode){
                circle.setAttribute("fill", unPushFill);
                circle.setAttribute("stroke-dasharray", "1,1");
                circle.setAttribute("stroke", pos.color);
            }

            svg.appendChild(circle);

            // jqueryEnterAndLeave(rect);
            // jqueryEnterAndLeave(circle);

            if (my.revert) {
                var c1 = [pos[0] - 6, pos[1] - 6];
                var c2 = [pos[0] + 6, pos[1] - 6];
                var c3 = [pos[0] - 6, pos[1] + 6];
                var c4 = [pos[0] + 6, pos[1] + 6];
                var xL = document.createElementNS(svgNS, "path");
                xL.setAttribute("d", "M" + c1.join(",") + "L" + c4.join(","));
                xL.setAttribute("stroke-width", 3);
                xL.setAttribute("stroke-opacity", 1);
                xL.setAttribute("opacity", 1);
                xL.setAttribute("stroke", my.revert === 1 ? "red" : "orange");
                svg.appendChild(xL);

                var xR = document.createElementNS(svgNS, "path");
                xR.setAttribute("d", "M" + c2.join(",") + "L" + c3.join(","));
                xR.setAttribute("stroke-width", 3);
                xR.setAttribute("stroke-opacity", 1);
                xR.setAttribute("opacity", 1);
                xR.setAttribute("stroke", my.revert === 1 ? "red" : "orange");
                svg.appendChild(xR);
            }

            var hasTags = my.tags && my.tags.length > 0;
            var hasBranches = my.branches && my.branches.length > 0;
            if (hasBranches && my.branches.length == 1 && my.branches[0] === 'HEAD') {
                hasBranches = false;
            }

            var hasBoth = hasTags && hasBranches;
            var insertBefore = undefined;
            if (hasBranches) {
                insertBefore = my.insertTag(pos, false, hasBoth, target);
            }
            if (hasTags) {
                my.insertTag(pos, true, hasBoth, target, insertBefore);
            }

            if (width < pos[0]) {
                svg.setAttribute("width", pos[0] + 10);
            }
            if (height < pos[1]) {
                svg.setAttribute("height", pos[1] + 10);
            }
        };

        // function jqueryEnterAndLeave(svgObj) {
        //     $(svgObj).mouseenter(function () {
        //         let sha = this.id.substring(2);
        //         $("#T_" + sha).addClass("commitHover");
        //     }).mouseleave(function () {
        //         let sha = this.id.substring(2);
        //         $("#T_" + sha).removeClass("commitHover");
        //     });
        // }
        let startWith = function(source, str){
            var reg=new RegExp("^"+str);
            return reg.test(source);
        }
        my.insertTag = function (pos, isTag, hasBoth, target, insertBefore) {

            var objs = isTag ? my.tags : my.branches;
            var objsLen = objs && objs.length ? objs.length : 0;
            if (objsLen <= 0) {
                return; // Removing "HEAD" removed all branches, so no point going on.
            }

            var svg = svgHolder.svg;
            var posCopy = pos;
            pos = [posCopy[0] - dotSize, posCopy[1]];

            var path = document.createElementNS(svgNS, "path");
            var start = [15, pos[1]];
            path.setAttribute("d", "M" + start.join(",") + "L" + pos.join(","));
            path.setAttribute("stroke-width", 1);
            path.setAttribute("stroke-opacity", 1);
            path.setAttribute("transform", 'translate(0.3 0.3)');
            path.setAttribute("stroke", posCopy.color);

            svg.appendChild(path);

            const div = $('<div></div>');
            div.css({
                position: 'absolute',
                left: '15px',
                top: `${pos[1]}px`,
                'background-color': posCopy.color
            });
            div.addClass('c-tag');
            var type = isTag ? 'tag' : 'branch';
            div.addClass(`c-tag-${type}`);
            if (my.isRemote) {
                div.addClass('c-tag-remote');
            }
            div.attr('id', my.sha1);
            div.attr('name', my.sha1);
            let names = objs.map(obj => {
                if(startWith(obj, 'L_')){
                    return obj.substr(2);
                } else if (startWith(obj, 'R_')) {
                    return obj.split('_')[2];
                } else {
                    return obj;
                }
            });
            div.html(names.join(','));

            if(!isTag){
                objs.forEach(obj => {
                    let i = $('<i/>');
                    i.addClass('c-branch-icon');
                    let isLocal = startWith(obj, 'L_');
                    let tip = '';
                    if(isLocal){
                        tip = 'head/'+obj.substr(2);
                    } else {
                        tip = obj.substr(2).replace('_', '/');
                    }
                    i.attr('title', tip);
                    i.addClass(isLocal ? 'c-branch-local-icon' : 'c-branch-remote-icon');
                    div.append(i);
                });
            }

            if(insertBefore){
                insertBefore.append(div);
                div.css({
                    position: 'relative',
                    top: 0,
                    left: 0
                });
            } else {
                $('.commits-content').append(div);
            }

            return div;
        }
    }

    function uniq(a) {
        return a.sort().filter(function (item, pos, ary) {
            return !pos || item != ary[pos - 1];
        })
    }

    function isHead(c) {
        if (c.branches && c.branches.length > 0) {
            for (var i = 0; i < c.branches.length; i++) {
                var b = c.branches[i];
                if (b === "HEAD" || b.indexOf("HEAD ") === 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    function start(y, ops) {
        let tags = ops.tags;
        let branches = ops.branches;
        let remotes = ops.remotes;

        const tagMap = {};
        const branchMap = {};
        const remoteMap = {};
        tags && tags.forEach(tag => {
            if (!tagMap[tag.id]) {
                tagMap[tag.id] = [];
            }
            tagMap[tag.id].push(tag.name);
        });

        if (branches) {
            branches.forEach(branch => {
                if (!branchMap[branch.target]) {
                    branchMap[branch.target] = [];
                }
                branchMap[branch.target].push('L_'+branch.name);
                // if (branch.head) {
                //     branchMap[branch.target].push('HEAD');
                // }
            });
        }

        if (remotes) {
            for(let remoteName in remotes){
                let remote = remotes[remoteName];
                remote.forEach(item => {
                    if (!remoteMap[item.target]) {
                        remoteMap[item.target] = [];
                    }
                    remoteMap[item.target].push('R_'+remoteName+'_'+item.name);
                });
            }
        }

        var commitsList = svgHolder.commitsList;
        var commits = y.commits;
        n();
        var lastDate = '';
        var r;
        for (var j = 0; j < commits.length; j++) {
            var line = commits[j];
            if (line) {
                var sha1 = line.sha1,
                    hasParents = line.parents && line.parents.length,
                    author = line.author.name,
                    date = new Date(line.date).toLocaleString(),
                    msg = line.summary,
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
                    x: farLeftPosition,
                    isLocal: line.isLocal,
                    isRemote: line.isRemote,
                    isSameNode: line.isSameNode,
                    row: commitsList.length,
                    htmlElement: cell,
                    author: author,
                    date: date,
                    msg: msg,
                    message: line.message,
                    col: 0
                };

                var item = o;
                delete item['tags'];
                delete item['branches'];
                commitsList.push(item);
                commitsTable[item.sha1] = item;
                hasParents ? item.parents = line.parents : null;
                if(tagMap[sha1] || branchMap[sha1] || remoteMap[sha1]){
                    item.tags = tagMap[sha1];
                    if(branchMap[sha1] || remoteMap[sha1]){
                        item.branches = [];
                        if(branchMap[sha1]){
                            item.branches = item.branches.concat(branchMap[sha1]);
                        }
                        if(remoteMap[sha1]){
                            item.branches = item.branches.concat(remoteMap[sha1]);
                        }
                    }
                }
                // if (line.tags || line.branches) {
                //     item.tags = line.tags;
                //     item.branches = line.branches;
                // }
            }
        }
        for (let r = 0; r < commitsList.length; r++){
            addGraphFunctions(commitsList[r]);
        }
        let headCommit = void 0;
        for (let r = 0; r < commitsList.length; r++){
            let commit = commitsList[r]
            if (commit && isHead(commit)) {
                headCommit = commit;
                break;
            }
        }
        for (headCommit || (headCommit = commitsList[0]), r = 0; r < (headCommit ? headCommit.row : commitsList.length); r++){
            o = commitsList[r], o.col++, o.x = farLeftPosition + e * o.col, storeElbow(r, 0, headCommit);
        }
        if (headCommit) {
            var plumb = headCommit.plumb();
            if (plumb){
                for (r = plumb.row + 1; r < commitsList.length; r++){
                    let commit = commitsList[r];
                    if(0 === commit.col){
                        commit.col++;
                        commit.x = farLeftPosition + e * commit.col;
                    }
                }
            }
        }
        for (let r = 0; r < commitsList.length; r++) commitsList[r].plumb();
        for (let r = commitsList.length - 1; r >= 0; r--) commitsList[r].draw();
        for (let r = commitsList.length - 1; r >= 0; r--) commitsList[r].circle()
    }
    var COLORS = ['#80729F', '#D78DBF', '#F7A64A', '#ADBD36', '#CC4C46', '#96C55E', "#79c753", '#8ECEE5', "#f7786b", "#fae03c", "#98ddde", "#9896a4", "#b08e6a", "#91a8d0", "#f7cac9"],
        e = 15,
        elbows = [],
        commitsTable = Object.create(null),
        farLeftPosition = 150,
        laneWidth = 15,
        dotSize = 7,
        unPushFill = '#1e1e1e',
        b = function () {
            elbows = [];
        };
        var laneLength = 35;
        var maxCol = 0;
    return b.start = start, b.commitsTable = commitsTable, b;
}

function render(l, ops) {
    destroy();
    var b = GitGragh();
    window.gragh = b;
    b(), b.start(l, ops);
    var f = svgHolder.svg;
    var sha;
    jQuery("#git-gragh-tbl").on('mouseenter', 'tr', function(){
        var sha1 = this.getAttribute("data-commitid");
        if (jQuery("#T_" + sha1).addClass("commitHover"), sha1) {
            var r = f.getElementById("C_" + sha1);
            if(r.getAttribute('class') && r.getAttribute('class').indexOf('remoteCommit') > -1){
                r.setAttribute("class", "remoteCommit commitHover")
            } else {
                r.setAttribute("class", "commitHover")
            }
        }
    }).on('mouseleave', 'tr', function(){
        var sha1 = this.getAttribute("data-commitid");
        if (jQuery("#T_" + sha1).removeClass("commitHover"), sha1) {
            var r = f.getElementById("C_" + sha1);
            if(r.getAttribute('class') && r.getAttribute('class').indexOf('remoteCommit') > -1){
                r.setAttribute("class", "remoteCommit")
            } else {
                r.setAttribute("class", "")
            }
        }
    }).on('click', 'tr', function(){
        if(!$(this).hasClass('selected')){
            jQuery("#git-gragh-tbl tr.selected").removeClass('selected');
            $(this).addClass('selected');
        }
        var sha1 = this.getAttribute("data-commitid");
        if(ops.onClick){
            let obj = b.commitsTable[sha1];
            ops.onClick(obj);
        }
    });
    var g = svgHolder.style.outerHTML.toString(),
        r = document.getElementById("git-gragh-tbl");
    r = r.cloneNode(!0);
    jQuery('rect').remove();
    if(ops.finished){
        ops.finished();
    }
}

function destroy() {
    if (svgHolder.svg && svgHolder.svg.parentNode) {
        var s = svgHolder.svg;
        $(s).remove();
        svgHolder.svg = void 0;
        var l = GitGragh();
        svgHolder.commitsList.length = 0;
        for (var c in l.commitsTable) delete l.commitsTable[c]
    }
    
    jQuery("#git-gragh").remove();
    jQuery("#git-gragh-tbl").remove();
    jQuery('.c-tag').remove();
    n();
}

var svgNS = "http://www.w3.org/2000/svg";
var xlinkNS = "http://www.w3.org/1999/xlink";

var svgHolder = Object.create(null);
svgHolder.commitsList = [];

export default render;
export const adestroy = destroy;
