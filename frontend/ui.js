function $(x) { return document.getElementById(x) }
$("showblankcategories").checked = +localStorage.showblankcategories ? 1 : 0
$("showcategories").checked = +localStorage.showcategories ? 1 : 0

function goto(el) {
    const [newmess, newday, newitem] = el.innerText.split(" > ")
    dateset(newday)
    updateDOM(newmess, newitem)
}

function heart(icon, slot, add = true) {
    if (add) {
        if (!favorites.includes(slot))
            favorites.push(slot)
    }
    else
        favorites = favorites.filter(v => v != slot)
    // localStorage.favorites = favorites.join("\n")
    set_fav_string(favorites.join("\n")).then(() => {
        // console.log("fav", favorites);
        updateDOM()
    })
}

function updateDOM(specific = null, mark = null) {
    selectedmess = specific || localStorage.selected || "All"
    localStorage.selected = selectedmess

    todaysfavorites()
    updatebuttonactivestates()

    let html = ""

    let itemcount
    for (let mess in table)
        if (selectedmess == "All" || mess == selectedmess) {
            html += "<tr>"
            if (selectedmess == "All")
                html += `<th><h3>${mess}</h3></th>`
            for (let slot of slots) {
                itemcount = 0
                const slotstring = `${selectedday} > ${mess} > ${slot}`
                let tablehtml = `<table class="mx-2 mb-2">`
                if (favorites.includes(slotstring))
                    tablehtml += `<i data-toggle="button" class="col border-0 btn btn-outline-danger fa fa-heart active" onclick="heart(this,'${slotstring}',0)"></i>`
                else
                    tablehtml += `<i data-toggle="button" class="col border-0 btn btn-outline-danger fa fa-heart" onclick="heart(this,'${slotstring}')"></i>`
                // tablehtml += `<i data-toggle="modal" data-target="#picview" class="col border-0 btn btn-outline-primary fa fa-image" onclick="loadpic('${slotstring}')"></i></tr>`
                tablehtml += `<th>${slot}</th>`


                for (let item of table[mess][slot]) {
                    tablehtml += "<tr>"
                    if (item[1]) {
                        if (+localStorage.showcategories)
                            tablehtml += `<th>${clean(item[0])}</th>`
                        let itemname = item[1]
                        if (mark)
                            itemname = itemname.replace(new RegExp(mark, "ig"), `<mark>$&</mark>`)
                        itemname = itemname.replace(new RegExp("(.*)\\*$", "gm"), `$1 <button class="btn btn-sm btn-success" disabled>New</button>`)

                        tablehtml += `<td>${itemname}</td>`
                        itemcount++
                    } else if (+localStorage.showblankcategories) {
                        tablehtml += `<td><strike>${clean(item[0])}</strike></td>`
                        itemcount++
                    }
                    tablehtml += "</tr>"
                }
                tablehtml += "</table>"
                // tablehtml += `<div class="rating text-center" data-rating="${slotstring}">`
                // for (let i = 1; i <= 5; i++)
                //     tablehtml += `<i class="fa fa-star text-secondary" onclick="rate(this,${i})"></i>`
                // tablehtml += `</div>`
                if (itemcount) {
                    html += `<td class="${slot == upcoming ? "table-primary" : ""} ${favorites.includes(slotstring) ? "table-danger" : ""}">`
                    html += tablehtml + "</td>"
                } else
                    html += "<td></td>"
            }
            html += `</tr>`
        }
    if (html == "<tr><td></td><td></td><td></td><td></td></tr>")
        html = `<h2>No favorites in '${selectedmess}' :-(</h2>`
    else
        html = `<tbody class="slots">${html}</tbody>`
    $("table").innerHTML = html
}

function showfavorites() {
    let html = ""
    for (let item of favorites) {
        const parts = item.split(" > ")
        html += `<li><a href="#" onclick="goto(this)">${[parts[1], parts[0], parts[2]].join(" > ")}</a></li>`
    }
    $("favoriteslist").innerHTML = html ? html : `<div class="alert alert-info">Click on <i class="fa-regular fa-heart"></i> to favorite an item.</div>`
}

function populatemesses() {
    let html = `<li class="page-item"><a class="page-link" href="#" onclick="updateDOM('All')">All</a></li>`
    for (let mess in messes)
        html += `<li class="page-item"><a class="page-link" href="#" onclick="updateDOM('${mess}')">${mess}</a></li>`
    $("messes").innerHTML = html
}

function populatedays() {
    let html = ""
    for (let weekday of week)
        html += `<li class="page-item"><a class="page-link ${weekday.slice(0, 3) == selectedday.slice(0, 3) ? "rounded-circle" : ""}" href="#" onclick="dateset('${weekday}')" data-day="${weekday}">${weekday.slice(0, 3)}</a></li>`
    $("days").innerHTML = html
}

function populatesearchresults(found, query, querywords) {
    let html = ""
    for (let item of found)
        html += `<li><a href="#" onclick="goto(this)">${item.replace(new RegExp(querywords.join("|"), "ig"), `<mark>$&</mark>`)}</a></li>`

    $("table").innerHTML = found.length ?
        `<h2>${found.length} results found for '${query}'</h2><ul>${html}</ul>` : `<h2>'${query}' not found in menu :(</h2>`
}

function populatemeals(todaysslots) {
    let html = "", completed = true
    for (let slot in todaysslots) {
        let info = ""
        if (slot == upcoming) {
            completed = false
            if (slot == ongoing)
                info = `<i class="fa fa-lock-open text-success"></i>`
            else
                info = `<i class="fa fa-lock text-success"></i>`
        }
        else
            if (completed)
                info = `<i class="fa fa-check-double text-info"></i>`
        html += `<tr class="${slot == upcoming ? "table-primary" : ""}"><th>${slot}</th><td>${todaysslots[slot]} ${info}</td></tr>`
    }
    let msghtml = `<h2>${timemsg}</h2>`
    if (ongoing) msghtml += `<div class="progress"><div style="width:${(timeslot[2] - timeslot[0]) / (timeslot[1] - timeslot[0]) * 100}%;" id="progress" class="progress-bar progress-bar-striped progress-bar-animated"></div></div>`
    $("msg").innerHTML = msghtml
    let displayday = ""
    if (new Date().toLocaleDateString('en-us', { weekday: 'long' }) == selectedday)
        displayday = "Today"
    else
        displayday = selectedday
    $("meals").innerHTML = `<h5>${displayday}'s favorites</h5>
    <table id="meals" class="table table-bordered"><tbody>${html}</tbody></table>`
    populatewef()
}

function updatebuttonactivestates() {
    for (let weekday of $("days").children)
        if (weekday.children[0].getAttribute("data-day") == selectedday)
            weekday.classList.add("active")
        else
            weekday.classList.remove("active")
    for (let messbutton of $("messes").children)
        if (messbutton.children[0].innerText == selectedmess)
            messbutton.classList.add("active")
        else
            messbutton.classList.remove("active")
}

function populatewef() {
    let html = ""
    for (let mess in messes)
        if (mess == selectedmess)
            html += `<h5 class="text-success">Last updated on ${messes[mess].wef}</h5>`
    $("wef").innerHTML = html
}