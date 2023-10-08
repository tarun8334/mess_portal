const week = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    table = {}
let favorites = [],
    messes = {},
    date = new Date(),
    weekdayoffset = 1,
    selectedday = "",
    timemsg = "",
    ongoing = "",
    upcoming = "",
    timeslot = [],
    slots = [],
    selectedmess = "All"

fetch("data4.json").then(e => e.json()).then(data => {
    messes = data.messes
    weekdayoffset = data.weekdayoffset
    populatemesses()
    dateadd(0)
    populatedays()
    updateTimeleft(true)
})

// if (localStorage.favorites) {
    // favorites = localStorage.favorites.split("\n")
// }
// get_fav_string().then((fav) => {
//     favorites = fav.split("\n");
//     console.log(favorites);
// });

function clean(x) {
    return x.replace(/__\d+/, "")
}

function dateadd(add) {
    if (add)
        date.setDate(date.getDate() + add)
    else
        date = new Date()
    loadtable(date)
    updateDOM()
}

function dateset(newday) {
    date = new Date()
    for (let i = 0; i < 7 && date.toLocaleDateString('en-us', { weekday: 'long' }) != newday; i++)
        date.setDate(date.getDate() + 1)
    loadtable(date)
    updateDOM()
}

function setCheck(el) {
    localStorage[el.id] = el.checked ? 1 : 0
    updateDOM()
}

function loadtable(d) {
    const date = new Date(d)
    const weekday = date.getDay()
    selectedday = date.toLocaleDateString('en-us', { weekday: 'long' })

    for (let mess in messes) {
        table[mess] = {}
        const items = Object.entries(messes[mess].menu[(weekday - weekdayoffset + 7) % 7]).slice(1)
        let position = 0
        for (let section in messes[mess].sections) {
            if (!slots.includes(section))
                slots.push(section)
            table[mess][section] = items.slice(position, position += messes[mess].sections[section][0])
        }
    }
}

function hmin(time) {
    time = ((time % 24) + 24) % 24
    const h = Math.floor(time)
    const m = Math.round((time - h) * 60)
    return `${h ? `${h} h` : ""} ${m ? `${m} min` : ""}`
}

function updateTimeleft(repeat = false) {
    if (selectedmess == "All")
        selectedmess = Object.keys(messes)[0]
    timeslot = []
    const now = date//new Date()
    const currenthours = now.getHours() + now.getMinutes() / 60
    const sections = messes[selectedmess].sections
    let slotstart, slotend
    upcoming = ongoing = ""
    for (let section in sections) {
        slotstart = sections[section][1]
        slotend = sections[section][2]
        if (currenthours < slotstart) {
            timemsg = `${section} opening in ${hmin(sections[section][1] - currenthours)}`
            upcoming = section
            break
        } else if (currenthours <= slotend) {
            timemsg = `${section} closing in ${hmin(slotend - currenthours)}`
            ongoing = upcoming = section
            timeslot = [slotstart, slotend, currenthours]
            break
        }
    }
    if (upcoming == "") {
        let section = Object.keys(sections)[0]
        timemsg = `${section} opening in ${hmin(sections[section][1] - currenthours)}`
        upcoming = section
    }
    updateDOM()
    if (repeat) setTimeout(updateTimeleft, 60 * 1000, true)
}

function searchquery(query) {
    if (query.length < 3)
        updateDOM()
    else {
        let found = []
        const querywords = query.trim().split(" ")
        for (let mess in messes)
            for (let weekday in messes[mess].menu)
                for (let slot in messes[mess].menu[weekday])
                    if (querywords.every(word => messes[mess].menu[weekday][slot].match(new RegExp(word, "i"))))
                        found.push([mess, week[(+weekday + weekdayoffset + 7) % 7], messes[mess].menu[weekday][slot]].join(" > "))
        populatesearchresults(found, query, querywords)
    }
}


function todaysfavorites() {
    let todaysslots = {}
    for (let slot of slots)
        todaysslots[slot] = []

    for (let item of favorites) {
        const [today, todaysmess, todaysslot] = item.split(" > ")
        if (today == selectedday)
            todaysslots[todaysslot].push(todaysmess)
    }
    populatemeals(todaysslots)
}

function rate(el, rating) {
    console.log(el.parentElement.getAttribute("data-rating"), rating)
    const stars = el.parentElement.children
    let i
    for (i = 0; i < rating; i++) {
        stars[i].classList.remove("text-secondary")
        stars[i].classList.add("text-warning")
    }
    for (; i < stars.length; i++) {
        stars[i].classList.remove("text-warning")
        stars[i].classList.add("text-secondary")
    }
}