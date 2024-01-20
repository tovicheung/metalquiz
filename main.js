// --- Data ---

class Metal {
    constructor(symbol, name, data) {
        this.symbol = symbol;
        this.name = name;
        this.data = data;
    }
}

const metals = [];

// --- Utils ---


function random(min, max) {
    return parseInt(Math.random() * (max - min) + min);
}

function choice(array) {
    return array[random(0, array.length - 1)];
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function specialize(s) {
    return s.replace("+", "⁺").replace("-", "⁻").replace("2", "²").replace("3", "³");
}

function normalize(s) {
    return s.replace("⁺", "+").replace("⁻", "-").replace("²", "2").replace("³", "3");
}

function show(e) {
    e.classList.remove("hidden");
}

function hide(e) {
    e.classList.add("hidden");
}

function check_input(sender) {
    let min = sender.min;
    let max = sender.max;
    // here we perform the parsing instead of calling another function
    let value = parseInt(sender.value);
    if (value > max) {
        sender.value = max;
    } else if (value<min) {
        sender.value = min;
    }
}

function settings_uniques_default() {
    settings_uniques.value = uniques_default;
}


// --- State ---

const uniques_default = 4;

const State = {
    Q: 0,
    A: 1,

    Question: 0,
    Answer: 1,
}

var state = State.Q;

let Settings = {
    reverse: false,
    color: true,
    color_only: false,
    uniques: 4,
    timer: false,
    timer_duration: 10,
}

var is_running = true;
var is_settings = false;
var is_session = false;

var current;

const record = [];

function info_gotit() {
    localStorage.setItem("showninfo", "true")
    hide(info);
}

let session = [];

var timer = 0;


// --- Page ---


const title = document.getElementById("title");
const answer = document.getElementById("answer");
const info = document.getElementById("info");
const main = document.getElementById("main");

const settings = document.getElementById("settings");
// const settings_reverse = document.getElementById("settings_reverse");
const settings_uniques = document.getElementById("settings_uniques");
const session_finished = document.getElementById("session_finished");

const corner1 = document.getElementById("corner1");
const corner2 = document.getElementById("corner2");

// XXX: move to window.onload?
if (localStorage.getItem("showninfo") === "true") {
    hide(info)
}


// --- Machinery ---


function generate_question() {
    if (is_session) {
        return session.pop();
    }
    return choice(metals.filter(x => !record.includes(x)));
}

function new_question() {
    state = State.Q;
    // hide(Settings.reverse ? ion_symbol : ion_name);
    // show(Settings.reverse ? ion_name : ion_symbol);
    // hide(ion_color);

    current = generate_question();

    title.innerText = current.name + " " + current.symbol;

    while (answer.hasChildNodes()) {
        answer.removeChild(answer.firstChild);
    }

    for (usage of current.data) {
        p = document.createElement("div");
        e = document.createElement("h3");
        e.innerText = usage[0];
        p.appendChild(e);
        ee = document.createElement("p")
        ee.innerText = usage[1];
        p.appendChild(ee);
        answer.appendChild(p);
        p.classList.add("black");
    }
    
    console.log(current)

    // if (Settings.reverse) {
    //     ion_name.innerText = current.name;
    // } else {
    //     ion_symbol.innerText = specialize(current.symbol);
    // }
    if (is_session) {
        corner1.innerText = `${metals.length - session.length}/${metals.length}`;
    } else {
        record.push(current);
        if (record.length > Settings.uniques) {
            record.shift();
        }
    }
}


// --- Event handlers ---

function clicked() {
    if (state == State.Q) {
        // if (Settings.reverse) {
        //     ion_symbol.innerText = specialize(current.symbol);
        // } else {
        //     ion_name.innerText = current.name;
        // }

        for (child of answer.children) {
            child.classList.add("fade");
        }

        state = State.A;

        if (Settings.timer) {
            clearInterval(timer);
        }
    } else {
        state = State.Q;
        if (is_session && session.length == 0) {
            open_session_finished();
            return;
        }
        new_question();
    }
}

addEventListener("click", event => {
    if (!is_running) {
        return;
    }
    if (event.target.tagName !== "BUTTON") {
        clicked();
    }
});

addEventListener("touchstart", event => {
    if (!is_running) {
        return;
    }
    if (event.touches.length == 2) {
        open_settings();
    }
});

addEventListener("keyup", event => {
    // console.log(event); // Log keys
    if (is_settings && event.code === "KeyS") {
        close_settings();
        return;
    }
    if (!is_running) {
        return;
    }
    if (event.code === "Space") {
        clicked();
    } else if (event.code === "KeyS") {
        open_settings();
    } else if (event.code === "KeyC") {
        localStorage.clear();
    } else if (event.code === "Period" && is_session) {
        session.length = 0;
        state = State.A;
        clicked();
    }
})


// --- Session ---


function start_session() {
    is_session = true;
    session = [...metals];
    shuffle(session);
    show(corner1);
    close_settings();
    new_question();
}

function open_session_finished() {
    show(session_finished);
    hide(main)
    document.body.style.backgroundColor = "white";
    is_running = false;
    is_session = false;
}

function close_session_finished() {
    hide(session_finished);
    show(main);
    is_running = true;
    hide(corner1);
    new_question();
}


// --- Settings ---


function open_settings() {
    show(settings);
    hide(main);
    is_running = false;
    is_settings = true;
}

function close_settings() {
    hide(settings);
    show(main);
    is_running = true;
    is_settings = false;
}

function update_settings() {
    // page -> state
    // Settings.reverse = settings_reverse.checked;
    Settings.uniques = parseInt(settings_uniques.value);
    localStorage.setItem("settings", JSON.stringify(Settings));
    if (!is_session) {
        new_question();
        record.length = 0;
    }
}

function load_settings() {
    // state -> page
    // settings_reverse.checked = Settings.reverse;
    settings_uniques.value = Settings.uniques.toString();
}

{ // Prevent polluting global namespace
    let set = localStorage.getItem("settings");
    if (set != null) {
        Settings = { ...Settings, ...JSON.parse(set)};
    }
    load_settings();
}


// --- Onload ---



fetch("./data.json")
    .then((resp) => resp.json())
    .then((json) => {
        for ([rr, inner] of Object.entries(json)) {
            [n, symbol] = rr.split(" ");
            metals.push(new Metal(symbol, n, inner));
        }
        close_settings();
        close_session_finished(); // new question is generated here!
        // new_question();
        settings_uniques.max = metals.length.toString();
    })
