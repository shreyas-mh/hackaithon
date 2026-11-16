"use strict";

const categories = ["Environment", "Food", "Education", "Community"];
const volunteer = { name: "Alex Rivera", age: 15 };
const localRadius = 15;
const distanceLimits = [1, 3, 5, 10, localRadius];
const seedDate = days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
};

const extraExamples = [
  { id: "sample-park", title: "Creekside Park Cleanup", org: "Creekside Park Friends", category: "Environment", location: "Creekside Park", distance: 1.4, durationHours: 3.5, date: seedDate(3), time: "09:30", age: 12, capacity: 14, description: "Collect litter along the walking paths. Gloves, bags, and grabbers are provided." },
  { id: "sample-books", title: "Sort Books for the School Book Swap", org: "Maple School PTA", category: "Education", location: "Maple School Library", distance: 3.1, durationHours: 2.5, date: seedDate(5), time: "16:00", age: 13, capacity: 6, description: "Sort donated books by reading level and set up tables for the school book swap." },
  { id: "sample-market", title: "Pack Produce at the Community Market", org: "Fresh Table Collective", category: "Food", location: "Elm Street Market Hall", distance: 7.8, durationHours: 6, date: seedDate(8), time: "11:00", age: 15, capacity: 10, description: "Weigh and bag donated produce for families, then help clean the packing stations." },
  { id: "sample-kits", title: "Assemble Welcome Kits", org: "Neighborhood Resource Center", category: "Community", location: "Juniper Community Center", distance: 4.3, durationHours: 4.5, date: seedDate(10), time: "14:00", age: 13, capacity: 8, description: "Pack toiletries and school supplies into welcome kits for families moving into temporary housing." },
  { id: "sample-trees", title: "Plant Trees Along the Greenway", org: "Greenway Stewards", category: "Environment", location: "West Greenway Trailhead", distance: 12.4, durationHours: 10, date: seedDate(14), time: "08:30", age: 16, capacity: 12, description: "Work in pairs to plant young trees and spread mulch along the trail. Tools are provided." }
];

const previousSampleHours = {"sample-park": 1.5, "sample-books": 1.25, "sample-market": 2.5, "sample-kits": 1, "sample-trees": 3, "garden": 2, "pantry": 1.5, "reading": 1};

const seed = {
  samplePackAdded: true,
  sampleHoursUpdated: true,
  events: [
    { id: "garden", title: "Community Garden Workday", org: "Oak Street Garden", category: "Environment", location: "Oak Street Community Garden", distance: 0.8, durationHours: 2, date: seedDate(7), time: "09:00", age: 13, capacity: 8, description: "Help plant seasonal vegetables and refresh the garden beds. Gloves and tools are provided." },
    { id: "pantry", title: "Pack Weekend Meal Kits", org: "Neighbors Food Pantry", category: "Food", location: "Maple Avenue Food Pantry", distance: 2.6, durationHours: 4, date: seedDate(9), time: "10:00", age: 14, capacity: 6, description: "Work with a team to sort donations and pack take-home meal kits for local families." },
    { id: "reading", title: "Library Reading Buddies", org: "Friends of the Library", category: "Education", location: "Cedar Branch Library", distance: 6.4, durationHours: 3, date: seedDate(12), time: "15:30", age: 16, capacity: 4, description: "Read with younger learners and help them choose a book to take home." },
    ...extraExamples
  ],
  matches: [
    { id: "sample", eventId: "garden", name: "Sam Lee", age: 16, note: "I can help with planting or setup.", status: "pending" }
  ]
};
const key = "volunteermatch-local-v1";
const main = document.querySelector("#main");
const nav = document.querySelector("#nav");
const account = document.querySelector("#account");
const dialog = document.querySelector("#dialog");
const dialogBody = document.querySelector("#dialog-body");
const toast = document.querySelector("#toast");
const filters = { search: "", category: "", eligible: false, maxDistance: localRadius };
const sessionKey = "volunteermatch-role";
const demoAccounts = {
  volunteer: { ...volunteer, label: "Volunteer", bio: "" },
  sam: { name: "Sam Lee", age: 16, label: "Volunteer", bio: "Community gardens and cleanups" },
  maya: { name: "Maya Patel", age: 15, label: "Volunteer", bio: "Food drives and meal packing" },
  jules: { name: "Jules Chen", age: 16, label: "Volunteer", bio: "Reading and tutoring" },
  admin: { name: "Jordan Morgan", label: "Admin", bio: "" },
  priya: { name: "Priya Shah", label: "Admin", bio: "" },
  mateo: { name: "Mateo Cruz", label: "Admin", bio: "" }
};
const attendanceExamples = [
  {
    event: {
      id: "attendance-park", title: "Riverside Trail Cleanup", org: "Riverside Trail Stewards",
      category: "Environment", location: "Riverside Trailhead", distance: 2.2, durationHours: 3.5,
      date: seedDate(-2), time: "09:00", age: 13, capacity: 12,
      description: "A sample ended shift for testing attendance after a trail cleanup."
    },
    volunteers: ["volunteer", "sam", "maya"]
  },
  {
    event: {
      id: "attendance-pantry", title: "Pantry Sorting Shift", org: "Neighbors Food Pantry",
      category: "Food", location: "Maple Avenue Food Pantry", distance: 2.6, durationHours: 2.5,
      date: seedDate(-1), time: "10:00", age: 14, capacity: 8,
      description: "A sample ended shift for testing attendance after sorting pantry donations."
    },
    volunteers: ["volunteer", "jules"]
  }
];
const isAdminAccount = id => Object.hasOwn(demoAccounts, id) && demoAccounts[id].label === "Admin";
const volunteerIds = Object.keys(demoAccounts).filter(id => !isAdminAccount(id));
const demoOpportunityOwners = {
  "sample-books": "priya", reading: "priya", "sample-kits": "priya",
  "sample-market": "mateo", "sample-trees": "mateo", "attendance-pantry": "mateo"
};
const previousAccount = sessionStorage.getItem(sessionKey);
let accountId = Object.hasOwn(demoAccounts, previousAccount) ? previousAccount : null;
let role = isAdminAccount(accountId) ? "admin" : accountId ? "volunteer" : null;
let loginRole = "volunteer";
let month = seedDate(0).slice(0, 7);
let selectedDay = "";
let friendSearch = "";
let toastTimer;

function readData() {
  const stored = JSON.parse(localStorage.getItem(key)) ?? seed;

  // Restore schedule defaults for sample opportunities in older saved demos.
  const events = stored.events.map(event => {
    const sample = seed.events.find(item => item.id === event.id && item.location === event.location);
    const { durationMinutes, ...saved } = event;
    const durationHours = durationMinutes == null ? sample?.durationHours ?? null : durationMinutes / 60;
    const updated = { distance: sample?.distance ?? null, durationHours, ...saved };
    // Preserve custom durations and hours already credited from attendance.
    if (!stored.sampleHoursUpdated && sample && updated.title === sample.title &&
        updated.durationHours === previousSampleHours[event.id] &&
        !stored.matches.some(match => match.eventId === event.id && match.attendance === "present")) {
      updated.durationHours = sample.durationHours;
    }
    return updated;
  });
  if (!stored.samplePackAdded) {
    events.push(...extraExamples.filter(sample => !events.some(event => event.id === sample.id)));
  }
  const matches = [...stored.matches];
  if (!stored.attendanceExamplesAdded) {
    for (const { event, volunteers } of attendanceExamples) {
      if (events.some(item => item.id === event.id)) continue;
      events.push(event);
      for (const volunteerId of volunteers) {
        const { name, age } = demoAccounts[volunteerId];
        matches.push({
          id: `${event.id}-${volunteerId}`, eventId: event.id, volunteerId, name, age,
          status: "approved", note: ""
        });
      }
    }
  }
  return { ...stored, events, matches, samplePackAdded: true, sampleHoursUpdated: true, attendanceExamplesAdded: true };
}

let data = readData();
if (!JSON.parse(localStorage.getItem(key))?.attendanceExamplesAdded) {
  localStorage.setItem(key, JSON.stringify(data));
}

function newId() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte =>
    byte.toString(16).padStart(2, "0")).join("");
}

function save(next) {
  localStorage.setItem(key, JSON.stringify(next));
  data = next;
}

const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const action = (label, name, id = "", style = "", disabled = false) =>
  `<button type="button" class="button ${style}" data-action="${name}" data-id="${escape(id)}"${disabled ? " disabled" : ""}>${label}</button>`;
const tag = label => `<span class="tag ${label.toLowerCase()}">${label}</span>`;
const statusTag = status => tag(status[0].toUpperCase() + status.slice(1));
const eventById = id => data.events.find(event => event.id === id);
const eventOwner = event => event.adminId ?? demoOpportunityOwners[event.id] ?? "admin";
const canManage = event => role === "admin" && Boolean(event) && eventOwner(event) === accountId;
const managedMatches = () => data.matches.filter(match => canManage(eventById(match.eventId)));
const profile = id => ({ shareApproved: true, acceptRequests: true, acceptFriendMessages: true, discoverable: true, ...demoAccounts[id], ...data.profiles?.[id] });
const currentVolunteer = () => profile(accountId ?? "volunteer");
const matchOwner = match => Object.hasOwn(match, "volunteerId") ? match.volunteerId
  : volunteerIds.find(id => demoAccounts[id].name === match.name);
const ownsMatch = match => matchOwner(match) === accountId;
const matchName = match => matchOwner(match) ? profile(matchOwner(match)).name : match.name;
const matchAge = match => matchOwner(match) ? profile(matchOwner(match)).age : match.age;
const myMatch = eventId => data.matches.find(match => match.eventId === eventId && ownsMatch(match));
const approvedCount = eventId => data.matches.filter(match => match.eventId === eventId && match.status === "approved").length;
const isPast = event => event.date < seedDate(0);
const available = event => event.capacity - approvedCount(event.id);
const withinDistance = (event, limit = localRadius) =>
  Number.isFinite(event.distance) && event.distance >= 0 && event.distance <= limit;
const distanceText = event => event.distance == null ? "Distance unavailable" : `${event.distance} mi away`;
const when = event => new Intl.DateTimeFormat("en-US", {
  weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
}).format(new Date(`${event.date}T${event.time}`));

function showMessage(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toastTimer = setTimeout(() => { toast.textContent = ""; }, 4200);
}

function empty(message) {
  return `<div class="empty"><p>${message}</p></div>`;
}

function intro(title, description, button = "") {
  return `<div class="heading-row page-intro"><div><h1>${title}</h1><p>${description}</p></div>${button}</div>`;
}

function stats(values) {
  return `<div class="stats">${values.map(([label, value]) =>
    `<div class="stat"><strong>${value}</strong>${label}</div>`).join("")}</div>`;
}

function eventCard(event) {
  const match = myMatch(event.id);
  const seats = available(event);
  const approvedFriends = role === "volunteer" ? volunteerIds.filter(id =>
    connection(id)?.status === "accepted" && profile(id).shareApproved && hasUpcomingApproval(event, id)
  ).map(id => profile(id).name) : [];
  const friendNames = new Intl.ListFormat("en-US").format(approvedFriends);
  let button = action("View opportunity", "request", event.id, "secondary");
  if (match) button = action("View match", "view-match", match.id, "secondary");
  if (role === "admin") {
    button = action("Edit Opportunity", "event", event.id, "secondary") +
      action("Delete Opportunity", "delete-event", event.id, "danger");
  }
  const availability = isPast(event) ? "Past event" : seats > 0 ? `${seats} ${seats === 1 ? "spot" : "spots"} open` : "Full";
  return `<article class="card">
    <div class="card-top">${tag(event.category)}<span class="slots">${availability}</span></div>
    <h3>${escape(event.title)}</h3>
    <p class="org">${escape(event.org)}${role === "volunteer" ? ` · Admin: ${escape(profile(eventOwner(event)).name)}` : ""}</p>
    <p class="description">${escape(event.description)}</p>
    <ul class="metadata">
      <li><span aria-hidden="true">◷</span>${when(event)}${event.durationHours ? ` · ${formatDuration(event.durationHours)}` : ""}</li>
      <li><span aria-hidden="true">⌖</span>${escape(event.location)} · ${distanceText(event)}</li>
      <li><span aria-hidden="true">♙</span>Ages ${event.age}+</li>
    </ul>
    ${approvedFriends.length ? `<p class="approved-friends"><strong>${escape(friendNames)}</strong>
      ${approvedFriends.length === 1 ? "is" : "are"} approved for this event.</p>` : ""}
    <div class="card-actions">${match && role === "volunteer" ? statusTag(match.status) : ""}${button}
      ${role === "volunteer" ? action("Invite a Friend", "invite-message", event.id, "secondary") : ""}
    </div>
  </article>`;
}

function sortedEvents(includeDeleted = false) {
  return data.events.filter(event => includeDeleted || !event.deletedAt).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

function volunteerEvents() {
  const query = filters.search.trim().toLowerCase();
  return sortedEvents().filter(event =>
    !isPast(event) && (!filters.category || event.category === filters.category) &&
    (!filters.eligible || currentVolunteer().age >= event.age) &&
    withinDistance(event, Math.min(filters.maxDistance, localRadius)) &&
    `${event.title} ${event.org} ${event.location} ${event.description}`.toLowerCase().includes(query)
  );
}

function results() {
  const events = volunteerEvents();
  document.querySelector("#result-count").textContent = `${events.length} ${events.length === 1 ? "opportunity" : "opportunities"}`;
  document.querySelector("#event-results").innerHTML = events.length
    ? `<div class="cards">${events.map(eventCard).join("")}</div>`
    : empty("No opportunities match these filters. Try adjusting your search or filters.");
}

function discover() {
  main.innerHTML = `
    <section class="hero">
      <div class="hero-copy">
        <h1>Find Your Next Volunteer Shift</h1>
        <p>Plant something, pack a meal, or lend a hand. Find a project nearby and bring a friend.</p>
        <button type="button" class="button" data-action="browse">Find a Shift <span aria-hidden="true">↓</span></button>
      </div>
      <div class="hero-photo" role="img" aria-label="Volunteers working together in a community garden"></div>
    </section>
    <div id="public-search"></div>
    <section aria-labelledby="opportunities-heading">
      <div class="heading-row">
        <div><h2 id="opportunities-heading">Explore Opportunities</h2><p>Browse projects within ${localRadius} miles of the demo location.</p></div>
      </div>
      <div class="filters">
        <input id="search" type="search" aria-label="Search opportunities" placeholder="Search by name or location" value="${escape(filters.search)}">
        <select id="category" aria-label="Filter by category"><option value="">All categories</option>${categories.map(name =>
          `<option${filters.category === name ? " selected" : ""}>${name}</option>`).join("")}</select>
        <select id="distance" aria-label="Maximum distance from the demo location">
          ${distanceLimits.map(limit =>
            `<option value="${limit}"${filters.maxDistance === limit ? " selected" : ""}>Within ${limit} ${limit === 1 ? "mile" : "miles"}</option>`).join("")}
        </select>
        <label class="check"><input id="eligible" type="checkbox"${filters.eligible ? " checked" : ""}> Eligible for my age (${currentVolunteer().age})</label>
      </div>
      <p id="result-count" class="muted result-count" aria-live="polite"></p>
      <div id="event-results"></div>
    </section>`;
  main.querySelector("#search").addEventListener("input", event => {
    filters.search = event.target.value;
    results();
  });
  main.querySelector("#category").addEventListener("change", event => {
    filters.category = event.target.value;
    results();
  });
  main.querySelector("#distance").addEventListener("change", event => {
    filters.maxDistance = Number(event.target.value);
    results();
  });
  main.querySelector("#eligible").addEventListener("change", event => {
    filters.eligible = event.target.checked;
    results();
  });
  results();
  mountFeature("public-search", "PublicSearch", {}, pageRoots);
}

function matchRecord(match) {
  const event = eventById(match.eventId);
  const admin = role === "admin";
  const local = withinDistance(event);
  const canApprove = match.status === "pending" && local && !isPast(event) && matchAge(match) >= event.age && available(event) > 0;
  const approveButton = action("Approve", "approve", match.id, "", !canApprove);
  const hours = creditedHours(match);
  const attendanceBlock = admin ? attendanceUnavailable(match, event) : "";
  const buttons = event.deletedAt ? "" : admin
    ? action("Add Note", "add-note", match.id, "secondary") +
      action(match.attendance ? "Edit Attendance" : "Record Attendance", "attendance", match.id, "secondary", Boolean(attendanceBlock)) +
      (match.status === "pending" ? approveButton + action("Decline", "decline", match.id, "danger") : "")
    : (match.status === "pending" ? action("Edit request", "match", match.id, "secondary") : "") +
      (match.status !== "declined" && !match.attendance && !completedMatch(match) ? action("Withdraw", "withdraw", match.id, "danger") : "");
  const blocked = admin && match.status === "pending" && !canApprove
    ? `<p class="muted">${!local ? "This opportunity needs a recorded distance within the local limit." : isPast(event) ? "This event has passed." : matchAge(match) < event.age ? "Volunteer is below the minimum age." : "No open spots."}</p>` : "";
  return `<article class="record">
    <div class="record-copy">
      <h3>${escape(admin ? matchName(match) : event.title)}</h3>
      <p class="muted">${admin ? `Age ${matchAge(match)} · ${escape(event.title)}` : `${when(event)} · ${escape(event.location)}`}</p>
      ${match.note ? `<p class="note"><strong>Request note:</strong> ${escape(match.note)}</p>` : ""}
      ${(match.organizerNotes ?? []).map(note =>
        `<p class="note"><strong>Organizer note:</strong> ${escape(note)}</p>`).join("")}
      ${hours == null ? "" : `<p>${match.attendance === "absent" ? "Did not attend · " : ""}${hoursFormat.format(hours)} verified hours</p>`}
      ${event.deletedAt ? '<p class="muted">The organizer deleted this opportunity.</p>' : blocked}
      ${!event.deletedAt && attendanceBlock ? `<p class="muted">${attendanceBlock}</p>` : ""}
    </div>
    <div class="actions">${statusTag(event.deletedAt && !completedMatch(match) ? "cancelled" : match.status)}${buttons}</div>
  </article>`;
}

function matches(admin) {
  const list = admin ? managedMatches() : data.matches.filter(match => ownsMatch(match));
  const ordered = [...list].sort((a, b) => Number(b.status === "pending" && !eventById(b.eventId).deletedAt) - Number(a.status === "pending" && !eventById(a.eventId).deletedAt));
  main.innerHTML = intro(admin ? "Match Requests" : "My Matches",
    admin ? "Review volunteer requests and confirm open spots." : `Track your requests and confirmed spots, ${escape(currentVolunteer().name.split(" ")[0])}.`,
    admin ? `<div class="actions">${action("Bulk Attendance", "bulk-attendance", "", "secondary")}${action("+ Add Match", "match")}</div>` : '<a class="button secondary" href="#discover">Browse opportunities</a>') +
    stats(["Pending", "Approved", "Declined"].map(label =>
      [label, list.filter(match => !eventById(match.eventId).deletedAt && match.status === label.toLowerCase()).length])) +
    (ordered.length ? `<div class="stack">${ordered.map(matchRecord).join("")}</div>` :
      empty(admin ? "No match requests yet." : "You haven’t requested a match yet. Browse opportunities to get started."));
}

function opportunities() {
  const events = sortedEvents().filter(canManage);
  const active = managedMatches().filter(match => !eventById(match.eventId).deletedAt);
  main.innerHTML = intro("Manage Opportunities", `Opportunities managed by ${escape(profile(accountId).name)}.`,
    action("+ Add Opportunity", "event")) +
    stats([["Opportunities", events.length], ["Pending requests", active.filter(match => match.status === "pending").length],
      ["Confirmed spots", active.filter(match => match.status === "approved").length]]) +
    `<div class="cards">${events.map(eventCard).join("")}</div>`;
}

const themes = { forest: "Forest", ocean: "Ocean", plum: "Plum", midnight: "Midnight" };

function selectedTheme(id) {
  const theme = profile(id).theme;
  return Object.hasOwn(themes, theme) ? theme : "forest";
}

function privacyOption(name, label, current) {
  return `<label class="check"><input type="checkbox" name="${name}"${current[name] ? " checked" : ""}>${label}</label>`;
}

function settings() {
  const current = profile(accountId);
  const volunteerSettings = role === "volunteer";
  openDialog("Account Settings", `<form>
    ${textField("Name", "name", current.name, 80)}
    ${volunteerSettings ? numberField("Age", "age", current.age, 10, 120) : ""}
    <label>Bio<textarea name="bio" rows="3" maxlength="280">${escape(current.bio)}</textarea></label>
    ${volunteerSettings ? `<fieldset class="privacy-settings"><legend>Privacy</legend>
      <label class="check"><input type="checkbox" name="shareApproved"${current.shareApproved ? " checked" : ""}>
        Allow accepted friends to see my approved events</label>
      ${privacyOption("acceptRequests", "Allow new friend requests", current)}
      ${privacyOption("acceptFriendMessages", "Allow messages and invites from accepted friends", current)}
      ${privacyOption("discoverable", "Show my profile in friend search", current)}</fieldset>` : ""}
    <label>Color theme<select name="theme">${Object.entries(themes).map(([id, label]) =>
      `<option value="${id}"${id === selectedTheme(accountId) ? " selected" : ""}>${label}</option>`).join("")}</select></label>
    ${formActions("Save settings")}
  </form>`);
  handleForm(fields => {
    const name = fields.name.trim();
    if (!name || name.length > 80) throw new Error("Enter a name of 1 to 80 characters.");
    const theme = fields.theme ?? selectedTheme(accountId);
    if (!Object.hasOwn(themes, theme)) throw new Error("Choose an available color theme.");
    const updated = { name, bio: fields.bio.trim(), theme };
    if (volunteerSettings) {
      updated.age = Number(fields.age);
      if (!Number.isInteger(updated.age) || updated.age < 10 || updated.age > 120) throw new Error("Enter a valid age.");
      for (const permission of ["shareApproved", "acceptRequests", "acceptFriendMessages", "discoverable"]) {
        updated[permission] = fields[permission] === "on";
      }
    }
    save({ ...data, profiles: { ...data.profiles, [accountId]: updated } });
    return "Settings saved.";
  });
}

function login() {
  main.innerHTML = `<section class="panel login-panel">
    <div class="login-photo" aria-hidden="true"></div>
    <div class="login-copy">
    <h1>Come Lend a Hand</h1>
    <p class="muted">Pick a demo account to get started. The passcode is <strong>demo</strong>.</p>
    <form id="login-form">
      <label>Account<select name="role">${Object.entries(demoAccounts).map(([id, item]) =>
        `<option value="${id}"${id === loginRole ? " selected" : ""}>${item.label} · ${escape(profile(id).name)}</option>`).join("")}</select></label>
      <label>Demo passcode<input type="password" name="passcode" required autocomplete="off"></label>
      <p class="error" id="login-error" role="alert" hidden></p>
      <button class="button" type="submit">Sign In</button>
    </form>
    </div>
  </section>`;
  main.querySelector("#login-form").addEventListener("submit", event => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    if (!Object.hasOwn(demoAccounts, fields.get("role")) || fields.get("passcode") !== "demo") {
      const error = main.querySelector("#login-error");
      error.textContent = "Enter the demo passcode shown above.";
      error.hidden = false;
      return;
    }
    accountId = fields.get("role");
    role = isAdminAccount(accountId) ? "admin" : "volunteer";
    sessionStorage.setItem(sessionKey, accountId);
    friendSearch = "";
    Object.assign(filters, { search: "", category: "", eligible: false, maxDistance: localRadius });
    go(Object.keys(pages[role])[0]);
  });
}

function calendar() {
  const first = new Date(`${month}-01T12:00:00`);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const title = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const events = (role === "admin" ? sortedEvents().filter(canManage) : volunteerEvents()).filter(event =>
    event.date.startsWith(`${month}-`));
  const shown = selectedDay ? events.filter(event => event.date === selectedDay) : events;
  const dayButtons = Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const count = events.filter(event => event.date === date).length;
    return `<button type="button" class="calendar-day" data-action="calendar-day" data-id="${date}"
      aria-pressed="${date === selectedDay}" aria-label="${title.split(" ")[0]} ${day}, ${count} opportunities"${count ? "" : " disabled"}>
      ${day}${count ? `<span class="calendar-count" aria-hidden="true">${count}</span>` : ""}
    </button>`;
  }).join("");
  main.innerHTML = intro("Opportunity Calendar", role === "admin"
    ? "View and manage opportunities by date." : "See upcoming local opportunities by date. Your Discover filters also apply here.") +
    `<section class="panel calendar-panel" aria-labelledby="calendar-month">
      <div class="calendar-toolbar">
        ${action("‹ Previous", "calendar-month", "-1", "secondary")}
        <h2 id="calendar-month" aria-live="polite">${title}</h2>
        ${action("Next ›", "calendar-month", "1", "secondary")}
      </div>
      <div class="calendar-grid">
        ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => `<span class="calendar-weekday">${day}</span>`).join("")}
        ${'<span aria-hidden="true"></span>'.repeat(first.getDay())}${dayButtons}
      </div>
    </section>
    <div class="heading-row calendar-results">
      <h2>${selectedDay ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" }) : title + " Opportunities"}</h2>
      ${selectedDay ? action("Show whole month", "calendar-day", "", "secondary") : ""}
    </div>
    ${shown.length ? `<div class="cards">${shown.map(eventCard).join("")}</div>` : empty("No opportunities this month.")}`;
}

function moveMonth(amount) {
  const date = new Date(`${month}-01T12:00:00`);
  date.setMonth(date.getMonth() + amount);
  month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  selectedDay = "";
  calendar();
  main.querySelector(`[data-action="calendar-month"][data-id="${amount}"]`).focus();
}

function connection(id) {
  return (data.friendRequests ?? []).find(request =>
    (request.from === accountId && request.to === id) || (request.from === id && request.to === accountId));
}

function hasUpcomingApproval(event, volunteerId) {
  return !hasStarted(event) && data.matches.some(match =>
    match.eventId === event.id && matchOwner(match) === volunteerId &&
    match.status === "approved" && match.attendance !== "absent");
}

function friendRecord(id) {
  const person = profile(id);
  const request = connection(id);
  let buttons = person.discoverable && person.acceptRequests
    ? action("Send friend request", "friend-request", id)
    : '<span class="muted">Friend requests are closed.</span>';
  let events = "";
  if (request?.status === "accepted") {
    buttons = action("Remove friend", "friend-remove", id, "secondary");
    if (person.shareApproved) {
      const approved = sortedEvents().filter(event => hasUpcomingApproval(event, id));
      events = `<p class="note"><strong>Approved Events</strong></p>${approved.length
        ? `<ul class="friend-events">${approved.map(event => `<li>${escape(event.title)} · ${when(event)}</li>`).join("")}</ul>`
        : '<p class="muted">No upcoming approved events.</p>'}`;
    } else {
      events = '<p class="muted note">Approved events are private.</p>';
    }
  } else if (request?.to === accountId) {
    buttons = action("Accept request", "friend-accept", id) + action("Decline", "friend-decline", id, "secondary");
  } else if (request) {
    buttons = '<span class="tag pending">Request sent</span>' + action("Cancel request", "friend-cancel", id, "secondary");
  }
  return `<article class="record"><div class="record-copy"><h3>${escape(person.name)}</h3>
    ${person.bio ? `<p class="muted">${escape(person.bio)}</p>` : ""}${events}</div><div class="actions">${buttons}</div></article>`;
}

function friends() {
  main.innerHTML = intro("Friends", "Send a friend request or respond to an incoming request. Accepted friends can share their upcoming approved events.") +
    `<div class="filters"><input id="friend-search" type="search" aria-label="Search friends"
      placeholder="Search by name or interest" value="${escape(friendSearch)}"></div>
    <div class="stack" id="friend-results"></div>`;
  const update = () => {
    const query = friendSearch.trim().toLowerCase();
    const found = volunteerIds.filter(id => {
      const person = profile(id);
      return id !== accountId && (person.discoverable || connection(id)) && `${person.name} ${person.bio}`.toLowerCase().includes(query);
    });
    main.querySelector("#friend-results").innerHTML = found.length
      ? found.map(friendRecord).join("") : empty("No friends match your search.");
  };
  main.querySelector("#friend-search").addEventListener("input", event => {
    friendSearch = event.target.value;
    update();
  });
  update();
}

function updateFriend(id, operation) {
  if (id === accountId || !volunteerIds.includes(id)) return;
  const request = connection(id);
  const requests = data.friendRequests ?? [];
  const name = currentVolunteer().name;
  if (operation === "friend-request" && !request && profile(id).discoverable && profile(id).acceptRequests) {
    save(notify({ ...data, friendRequests: [...requests, { from: accountId, to: id, status: "pending" }] },
      id, "New friend request", `${name} sent you a friend request.`));
    showMessage("Friend request sent.");
  } else if (operation === "friend-accept" && request?.to === accountId && request.status === "pending") {
    const next = requests.map(item => item === request ? { ...item, status: "accepted" } : item);
    save(notify({ ...data, friendRequests: next }, id, "Friend request accepted", `${name} accepted your friend request.`));
    showMessage("Friend request accepted.");
  } else {
    const mayRemove = (operation === "friend-remove" && request?.status === "accepted") ||
      (operation === "friend-cancel" && request?.status === "pending" && request.from === accountId) ||
      (operation === "friend-decline" && request?.status === "pending" && request.to === accountId);
    if (!mayRemove) return;
    save({ ...data, friendRequests: requests.filter(item => item !== request) });
    showMessage(operation === "friend-remove" ? "Friend removed." : "Request removed.");
  }
  friends();
}

function invite(id) {
  const event = eventById(id);
  if (!event || event.deletedAt || isPast(event) || !withinDistance(event)) return;
  const savedPeople = volunteerIds.filter(id => connection(id)?.status === "accepted")
    .map(id => ({ id, name: profile(id).name }));
  const date = new Date(`${event.date}T${event.time}`).toLocaleString("en-US", {
    dateStyle: "full", timeStyle: "short"
  });
  openDialog("Invite a Friend", `<p class="muted">Share this invitation using your device or copy it into a message.</p>
    <div class="invite-fields">
      ${savedPeople.length ? `<label>Personalize for a friend<select id="invite-friend"><option value="">Anyone</option>
        ${savedPeople.map(person => `<option value="${person.id}">${escape(person.name)}</option>`).join("")}</select></label>` : ""}
      <label>Invitation<textarea id="invite-text" rows="5" readonly></textarea></label>
    </div>
    <div class="actions">${action("Close", "close", "", "secondary")}
      ${action("Copy invite", "copy-invite", "", "secondary")}
      ${typeof navigator.share === "function" ? action("Share invite", "share-invite") : ""}</div>
    <p id="invite-status" class="muted" role="status"></p>`);
  const friend = dialog.querySelector("#invite-friend");
  const update = () => {
    const person = savedPeople.find(item => item.id === friend?.value);
    const greeting = person ? `Hi ${person.name.split(" ")[0]}!` : "Hi!";
    dialog.querySelector("#invite-text").value = `${greeting} Want to volunteer with me?\n\n${event.title}\n${date}\n${event.location}\nAges ${event.age}+\n\nVolunteerMatch Local · Fictional hackathon demo`;
  };
  friend?.addEventListener("change", update);
  update();
}

async function shareInvite(native) {
  const field = dialog.querySelector("#invite-text");
  const status = dialog.querySelector("#invite-status");
  try {
    if (native) {
      await navigator.share({ text: field.value });
    } else {
      await navigator.clipboard.writeText(field.value);
      status.textContent = "Invitation copied.";
    }
  } catch (error) {
    if (error.name === "AbortError") return;
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    status.textContent = "Invitation selected. Use your device’s Copy command.";
  }
}

const reminderWindow = 24 * 60 * 60 * 1000;

function notify(next, recipient, title, detail, organizerNote) {
  const notice = { id: newId(), recipient, title, detail, organizerNote, at: Date.now() };
  return { ...next, notifications: [...(next.notifications ?? []), notice] };
}

function inbox(now = Date.now()) {
  const items = (data.notifications ?? []).filter(item => item.recipient === accountId);
  for (const event of data.events) {
    if (event.deletedAt) continue;
    const starts = new Date(`${event.date}T${event.time}`).getTime();
    if (starts <= now || starts > now + reminderWindow) continue;
    const approved = approvedCount(event.id);
    const confirmed = role === "admin" ? canManage(event) && approved > 0 : myMatch(event.id)?.status === "approved";
    if (!confirmed) continue;
    const detail = `${event.title} · ${when(event)} · ${event.location}`;
    items.push({
      id: `reminder:${accountId}:${event.id}:${starts}`,
      title: "Starts within 24 hours",
      detail: role === "admin" ? `${detail} · ${approved} confirmed` : detail,
      at: starts - reminderWindow
    });
  }
  const dismissed = new Set(data.dismissedNotifications ?? []);
  return items.filter(item => !dismissed.has(item.id)).sort((a, b) => b.at - a.at);
}

function isRead(item) {
  return data.readNotifications?.includes(item.id) ?? false;
}

function updateNotificationBadge(items) {
  const link = nav.querySelector('a[href="#notifications"]');
  if (!link) return;
  const unread = items.filter(item => !isRead(item)).length;
  link.innerHTML = unread ? `Notifications <span class="notice-count" aria-hidden="true">${unread}</span>` : "Notifications";
  link.setAttribute("aria-label", unread ? `Notifications, ${unread} unread` : "Notifications");
}

function notificationTitle(title) {
  return title.replace(/\b[a-z]+/gi, (word, offset) =>
    offset && word.toLowerCase() === "within" ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1));
}

function notifications(items) {
  main.innerHTML = intro("Notifications", "Match updates and reminders appear here. Confirmed opportunities get a reminder within 24 hours of the start.",
    items.length ? `<div class="actions">
      ${items.some(item => !isRead(item)) ? action("Mark all as read", "read-all", "", "secondary") : ""}
      ${action("Clear all", "clear-notices", "", "secondary")}
    </div>` : "") +
    (items.length ? `<div class="stack">${items.map(item => `<article class="record">
      <div class="record-copy">
        <h3>${escape(notificationTitle(item.title))} ${isRead(item) ? "" : '<span class="tag">Unread</span>'}</h3>
        <p>${escape(item.detail)}</p>
        ${item.organizerNote ? `<p class="note">${escape(item.organizerNote)}</p>` : ""}
      </div>
      <div class="actions">
        ${item.organizerNote ? '<a class="button secondary" href="#my-matches">View my matches</a>' : ""}
        ${["New message", "Volunteer invitation"].includes(item.title) ? '<a class="button secondary" href="#messages">Open messages</a>' : ""}
        ${isRead(item) ? "" : action("Mark as read", "read-notice", item.id, "secondary")}
      </div>
    </article>`).join("")}</div>` : empty("You’re all caught up."));
}

function markRead(id) {
  const ids = inbox().filter(item => !id || item.id === id).map(item => item.id);
  save({ ...data, readNotifications: [...new Set([...(data.readNotifications ?? []), ...ids])] });
  render();
  showMessage(id ? "Notification marked as read." : "All notifications marked as read.");
}

function clearNotifications() {
  const ids = inbox().map(item => item.id);
  if (!ids.length) return;
  save({ ...data, dismissedNotifications: [...(data.dismissedNotifications ?? []), ...ids] });
  render();
  showMessage("Notifications cleared.");
}

let lastReminderCheck = "";

function refreshNotifications() {
  if (!role) return;
  const items = inbox();
  const signature = JSON.stringify(items.map(item => [item.id, item.detail]));
  if (signature === lastReminderCheck) return;
  lastReminderCheck = signature;
  updateNotificationBadge(items);
  if (location.hash === "#notifications") notifications(items);
}

const hoursFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const hasStarted = event => new Date(`${event.date}T${event.time}`).getTime() <= Date.now();
function formatDuration(hours) {
  return `${hoursFormat.format(hours)} ${hours === 1 ? "hour" : "hours"}`;
}

function creditedHours(match) {
  if (match.attendance === "present") return eventById(match.eventId).durationHours;
  if (match.attendance === "absent") return 0;
  return match.hours;
}

const completedMatch = match => match.status === "approved" && creditedHours(match) > 0;

function impact() {
  const admin = role === "admin";
  const scope = admin ? managedMatches() : data.matches.filter(ownsMatch);
  const completed = scope.filter(completedMatch);
  const contributed = new Set(completed.map(match => match.eventId));
  const programs = sortedEvents(true).filter(event => {
    if (admin && !canManage(event)) return false;
    return contributed.has(event.id) || (admin && (!event.deletedAt || event.outcome)) ||
      (!event.deletedAt && scope.some(match => match.eventId === event.id && match.status === "approved"));
  });
  const totalHours = matches => hoursFormat.format(matches.reduce((sum, match) => sum + creditedHours(match), 0));
  const reported = programs.filter(event => event.outcome);
  main.innerHTML = intro("Impact", admin
    ? "Track verified volunteer hours and report what each program accomplished."
    : "See your verified volunteer hours and the outcomes of programs you supported.") +
    stats([[admin ? "Total volunteer hours" : "My volunteer hours", totalHours(completed)],
      ["Completed shifts", completed.length], ["Programs supported", contributed.size],
      ["Programs with outcomes", admin ? reported.length : reported.filter(event => contributed.has(event.id)).length]]) +
    `<h2>Impact by Program</h2>` +
    (programs.length ? `<div class="cards">${programs.map(event => {
      const shifts = completed.filter(match => match.eventId === event.id);
      const outcome = event.outcome;
      const showOutcome = outcome && (admin || contributed.has(event.id));
      return `<article class="card">
        <h3>${escape(event.title)}</h3><p class="org">${when(event)}</p>
        <dl class="impact-metrics">
          <div><dt>${admin ? "Volunteer hours" : "My hours"}</dt><dd>${totalHours(shifts)}</dd></div>
          <div><dt>Completed shifts</dt><dd>${shifts.length}</dd></div>
        </dl>
        ${showOutcome ? `<p class="impact-outcome"><strong>${hoursFormat.format(outcome.quantity)} ${escape(outcome.unit)}</strong></p>
          <p class="description">${escape(outcome.accomplishment)}</p>` : '<p class="muted description">No outcome to show yet.</p>'}
        ${admin && !event.deletedAt ? `<div class="card-actions">${action(outcome ? "Edit outcome" : "Record outcome", "impact-outcome", event.id, "secondary", !hasStarted(event))}
          <a class="button secondary" href="#requests">Record attendance in Match requests</a></div>` : ""}
      </article>`;
    }).join("")}</div>` : empty("Your programs will appear here when a match is approved."));
}

function attendanceUnavailable(match, event) {
  if (event.deletedAt) return "This opportunity was deleted.";
  if (match.status === "pending") return "Approve the match before recording attendance.";
  if (match.status !== "approved") return "Attendance is available for approved matches.";
  if (!event.durationHours) return "Set the scheduled duration in Opportunities to record attendance.";
  const ends = new Date(`${event.date}T${event.time}`).getTime() + event.durationHours * 3_600_000;
  return Date.now() < ends ? "Attendance opens after the scheduled shift ends." : "";
}

function recordAttendance(id) {
  const match = data.matches.find(item => item.id === id);
  if (!match) return;
  const event = eventById(match.eventId);
  if (!canManage(event)) return;
  const unavailable = attendanceUnavailable(match, event);
  if (unavailable) {
    showMessage(unavailable);
    return;
  }
  openDialog("Record Attendance", `<p class="muted">${escape(matchName(match))} · ${escape(event.title)} · ${formatDuration(event.durationHours)}</p>
    <form><label>Attendance<select name="attendance" required>
      <option value="">Choose attendance</option>
      <option value="present"${match.attendance === "present" ? " selected" : ""}>Completed shift</option>
      <option value="absent"${match.attendance === "absent" ? " selected" : ""}>Did not attend</option>
    </select></label>
    <p class="muted">A completed shift earns the opportunity’s scheduled hours.</p>
    ${formActions("Save attendance")}</form>`);
  handleForm(fields => {
    const current = data.matches.find(item => item.id === id && item.status === "approved");
    if (!current) throw new Error("This match is no longer approved.");
    const scheduled = eventById(current.eventId);
    if (!canManage(scheduled)) throw new Error("This opportunity belongs to another admin.");
    const unavailable = attendanceUnavailable(current, scheduled);
    if (unavailable) throw new Error(unavailable);
    const attendance = fields.attendance;
    if (!["present", "absent"].includes(attendance)) throw new Error("Choose an attendance status.");
    save(withAttendance(data, new Set([id]), attendance));
    return "Attendance saved.";
  });
}

function recordOutcome(id) {
  const event = eventById(id);
  if (!canManage(event) || event.deletedAt || !hasStarted(event)) return;
  const outcome = event.outcome ?? {};
  openDialog("Record Program Outcome", `<p class="muted">${escape(event.title)}</p>
    <form><div class="form-row">
      <label>Quantity<input name="quantity" type="number" min="0" step="1" value="${escape(outcome.quantity)}" required></label>
      ${textField("What was counted?", "unit", outcome.unit, 60)}
    </div><label>Accomplishment<textarea name="accomplishment" rows="3" maxlength="400" required>${escape(outcome.accomplishment)}</textarea></label>
    <p class="muted">For example, 42 meal kits packed for neighborhood families.</p>${formActions("Save outcome")}</form>`);
  handleForm(fields => {
    const current = eventById(id);
    if (!canManage(current) || current.deletedAt || !hasStarted(current)) throw new Error("Record the outcome once the opportunity has started.");
    const quantity = Number(fields.quantity);
    const unit = fields.unit.trim();
    const accomplishment = fields.accomplishment.trim();
    if (!fields.quantity || !Number.isSafeInteger(quantity) || quantity < 0 || !unit || !accomplishment) {
      throw new Error("Enter a whole-number quantity, what it counts, and an accomplishment.");
    }
    save({ ...data, events: data.events.map(item =>
      item.id === id ? { ...item, outcome: { quantity, unit, accomplishment } } : item) });
    return "Program outcome saved.";
  });
}

const pages = {
  volunteer: { discover: "Discover", calendar: "Calendar", "my-matches": "My Matches", friends: "Friends", impact: "Impact", messages: "Messages", notifications: "Notifications" },
  admin: { opportunities: "Discover", calendar: "Calendar", requests: "Match Requests", impact: "Impact", messages: "Messages", notifications: "Notifications" }
};

function render() {
  unmountFeatures(pageRoots);
  document.documentElement.dataset.theme = selectedTheme(accountId);
  if (!role) {
    nav.innerHTML = "";
    account.innerHTML = "";
    login();
    return;
  }
  account.innerHTML = `<button class="button secondary settings-button" type="button" data-action="settings" aria-label="Settings" title="Settings">⚙</button>
    ${action("Sign out", "sign-out", "", "secondary")}`;
  const routes = pages[role];
  const requested = location.hash.slice(1);
  const page = Object.hasOwn(routes, requested) ? requested : Object.keys(routes)[0];
  nav.innerHTML = Object.entries(routes).map(([key, label]) =>
    `<a href="#${key}"${page === key ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const items = inbox();
  updateNotificationBadge(items);
  lastReminderCheck = JSON.stringify(items.map(item => [item.id, item.detail]));
  if (page === "messages") renderMessages();
  else if (page === "notifications") notifications(items);
  else if (page === "discover") discover();
  else if (page === "opportunities") opportunities();
  else if (page === "calendar") calendar();
  else if (page === "friends") friends();
  else if (page === "impact") impact();
  else matches(role === "admin");
}

function go(page) {
  history.replaceState(null, "", `#${page}`);
  render();
  window.scrollTo(0, 0);
}

function openDialog(title, body) {
  unmountFeatures(dialogRoots);
  dialogBody.innerHTML = `<h2 id="dialog-title">${title}</h2>${body}`;
  if (!dialog.open) dialog.showModal();
}

function formActions(label) {
  return `<p class="error" role="alert" hidden></p><div class="actions">${action("Cancel", "close", "", "secondary")}
    <button class="button" type="submit">${label}</button></div>`;
}

function handleForm(handler) {
  const form = dialog.querySelector("form");
  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      data = readData();
      const message = handler(Object.fromEntries(new FormData(form)));
      dialog.close();
      render();
      showMessage(message);
    } catch (error) {
      const message = form.querySelector(".error");
      message.hidden = false;
      message.textContent = error.message;
    }
  });
}

function textField(label, name, value, limit = 80) {
  return `<label>${label}<input name="${name}" value="${escape(value)}" maxlength="${limit}" required></label>`;
}

function numberField(label, name, value, min, max) {
  return `<label>${label}<input type="number" name="${name}" value="${escape(value)}" min="${min}" max="${max}" required></label>`;
}

function deleteEvent(id) {
  const event = eventById(id);
  if (!canManage(event) || event.deletedAt) return;
  openDialog("Delete Opportunity?", `<p><strong>${escape(event.title)}</strong></p>
    <p>Volunteers with pending or approved requests will get a notification.</p>
    <form><div class="actions">${action("Cancel", "close", "", "secondary")}
      <button class="button danger" type="submit">Delete Opportunity</button></div>
      <p class="error" role="alert" hidden></p></form>`);
  handleForm(() => {
    const current = eventById(id);
    if (!canManage(current) || current.deletedAt) throw new Error("This opportunity has already been deleted.");
    const deletedAt = Date.now();
    let next = { ...data, events: data.events.map(item => item.id === id ? { ...item, deletedAt } : item) };
    const recipients = new Set(data.matches.filter(match =>
      match.eventId === id && ["pending", "approved"].includes(match.status)).map(matchOwner));
    for (const recipient of recipients) {
      if (recipient) next = notify(next, recipient, "Opportunity cancelled", `${current.title} · ${when(current)}`);
    }
    save(next);
    return "Opportunity deleted.";
  });
}

function saveEvent(id) {
  if (role !== "admin" || (id && (!canManage(eventById(id)) || eventById(id).deletedAt))) return;
  const event = eventById(id) ?? { category: categories[0], age: 13, capacity: 6, durationHours: 1, date: seedDate(7), time: "09:00" };
  openDialog(id ? "Edit Opportunity" : "Add Opportunity", `<form>
    ${textField("Opportunity name", "title", event.title)}
    ${textField("Organization", "org", event.org)}
    <div class="form-row">
      ${textField("Location", "location", event.location, 110)}
      <label>Distance from demo location (mi)
        <input type="number" name="distance" value="${escape(event.distance)}" min="0" step="0.1" placeholder="Optional">
      </label>
    </div>
    <label>Category<select name="category">${categories.map(category =>
      `<option${event.category === category ? " selected" : ""}>${category}</option>`).join("")}</select></label>
    <div class="form-row">
      <label>Date<input type="date" name="date" value="${event.date}" required></label>
      <label>Start time<input type="time" name="time" value="${event.time}" required></label>
    </div>
    <label>Scheduled duration (hours)
      <input name="durationHours" type="number" min="0" max="24" step="any" inputmode="decimal"
        value="${escape(event.durationHours)}" placeholder="1.5" required>
    </label>
    <div class="form-row">${numberField("Minimum age", "age", event.age, 10, 100)}${numberField("Volunteer spots", "capacity", event.capacity, 1, 500)}</div>
    <label>Description<textarea name="description" rows="3" maxlength="450" required>${escape(event.description)}</textarea></label>
    ${formActions("Save opportunity")}
  </form>`);
  handleForm(fields => {
    if (id && (!canManage(eventById(id)) || eventById(id).deletedAt)) throw new Error("This opportunity is no longer available to edit.");
    for (const key of ["title", "org", "location", "description"]) {
      fields[key] = fields[key].trim();
      if (!fields[key]) throw new Error("Complete all opportunity fields.");
    }
    const distance = fields.distance === "" ? null : Number(fields.distance);
    if (distance !== null && (!Number.isFinite(distance) || distance < 0)) {
      throw new Error("Enter a distance of zero miles or more.");
    }
    const durationHours = Number(fields.durationHours);
    if (!Number.isFinite(durationHours) || durationHours <= 0 || durationHours > 24) {
      throw new Error("Enter a scheduled duration greater than 0 and up to 24 hours.");
    }
    const capacity = Number(fields.capacity);
    const age = Number(fields.age);
    const approved = data.matches.filter(match => match.eventId === id && match.status === "approved");
    if (capacity < approved.length) throw new Error("Capacity must cover the already approved matches.");
    if (approved.some(match => match.age < age)) throw new Error("The new minimum age would make an approved volunteer ineligible.");
    const updated = { ...eventById(id), ...fields, capacity, age, distance, durationHours, adminId: accountId, id: id || newId() };
    const events = id ? data.events.map(item => item.id === id ? updated : item) : [...data.events, updated];
    const next = { ...data, events };
    const previous = eventById(id);
    const changed = previous && ["date", "time", "location", "durationHours"].some(field => previous[field] !== updated[field]);
    const recipients = new Set(data.matches.filter(match => match.eventId === id && match.status !== "declined").map(matchOwner));
    let result = next;
    if (changed) {
      for (const recipient of recipients) {
        if (recipient) result = notify(result, recipient, "Opportunity details changed",
          `${updated.title} · ${when(updated)} · ${updated.location} · ${formatDuration(updated.durationHours)}`);
      }
    }
    save(result);
    return id ? "Opportunity updated." : "Opportunity added.";
  });
}

function saveMatch(id, eventId) {
  const existing = data.matches.find(match => match.id === id);
  const admin = role === "admin";
  const event = eventById(existing?.eventId ?? eventId);
  if (event?.deletedAt || (id && (!existing || admin))) return;
  if (!admin && existing && (!ownsMatch(existing) || existing.status !== "pending")) return;
  const note = existing?.note ?? "";
  const minAge = event ? `Ages ${event.age}+` : "";
  const info = event ? `<p class="muted">${escape(event.title)} · ${when(event)} · ${escape(event.location)} · ${minAge}</p>` : "";
  const issue = !id && !admin && (!withinDistance(event) ? "This opportunity is outside the local results." :
    isPast(event) ? "This event has passed." :
    currentVolunteer().age < event.age ? `You must be at least ${event.age} to volunteer at this event.` :
      available(event) < 1 ? "All spots are filled." : myMatch(event.id) ? "You already have a request for this event." : "");
  if (issue) {
    openDialog("Opportunity Details", `${info}<p>${escape(event.description)}</p><p>${issue}</p><div class="actions">${action("Close", "close")}</div>`);
    return;
  }
  const eventField = admin && !existing ? `<label>Opportunity<select name="eventId" required>
    <option value="">Choose an opportunity</option>${sortedEvents().filter(item => canManage(item) && !isPast(item) && withinDistance(item)).map(item =>
      `<option value="${escape(item.id)}">${escape(item.title)} · Ages ${item.age}+</option>`).join("")}</select></label>` : "";
  openDialog(id ? "Edit Note" : admin ? "Add Match" : "Request a Match", `${info}
    ${!id && !admin ? `<p>${escape(event.description)}</p><p class="muted">An organizer will review your request before your spot is confirmed.</p>` : ""}
    <form>${eventField}
      ${admin && !existing ? `<div class="form-row">${textField("Volunteer name", "name", "")}${numberField("Volunteer age", "age", 15, 10, 120)}</div>` : ""}
      <label>Note ${admin ? "(organizer instructions, optional)" : "to the organizer (optional)"}<textarea name="note" rows="3" maxlength="280">${escape(note)}</textarea></label>
      ${formActions(id ? "Save note" : admin ? "Add to review queue" : "Send request")}
    </form>`);
  handleForm(fields => {
    const current = data.matches.find(match => match.id === id);
    if (id && (!current || eventById(current.eventId).deletedAt)) throw new Error("This match is no longer available.");
    if (!admin && current?.status && current.status !== "pending") throw new Error("This match has already been reviewed.");
    const note = fields.note.trim();
    if (current) {
      if (!admin && !ownsMatch(current)) throw new Error("This request is no longer yours to edit.");
      const next = { ...data, matches: data.matches.map(match => match.id === id ? { ...match, note } : match) };
      save(notify(next, eventOwner(eventById(current.eventId)), "Match request updated",
        `${current.name} · ${eventById(current.eventId).title}`));
      return "Note saved.";
    }
    const selected = eventById(eventId ?? fields.eventId);
    if (!selected || selected.deletedAt || (admin && !canManage(selected))) throw new Error("Select an available opportunity.");
    const name = admin ? fields.name.trim() : currentVolunteer().name;
    const age = admin ? Number(fields.age) : currentVolunteer().age;
    if (!name) throw new Error("Enter the volunteer’s name.");
    if (!withinDistance(selected)) {
      throw new Error("Select an opportunity with a recorded distance within the local limit.");
    }
    if (isPast(selected)) throw new Error("This event has passed.");
    if (age < selected.age) {
      throw new Error(`This opportunity requires volunteers to be at least ${selected.age}.`);
    }
    if (!admin && available(selected) < 1) throw new Error("All spots are filled.");
    const matchingAccounts = volunteerIds.filter(id => profile(id).name.toLowerCase() === name.toLowerCase());
    const volunteerId = admin ? (matchingAccounts.length === 1 ? matchingAccounts[0] : null) : accountId;
    if (data.matches.some(match => match.eventId === selected.id &&
        (volunteerId && matchOwner(match) ? matchOwner(match) === volunteerId : matchName(match).toLowerCase() === name.toLowerCase()))) {
      throw new Error("This volunteer already has a match for this opportunity.");
    }
    const match = { id: newId(), eventId: selected.id, volunteerId, name, age, status: "pending",
      note: admin ? "" : note, organizerNotes: admin && note ? [note] : [] };
    let next = { ...data, matches: [...data.matches, match] };
    if (!admin) {
      next = notify(next, eventOwner(selected), "New match request", `${name} · ${selected.title}`);
    } else if (volunteerId) {
      next = notify(next, volunteerId, "Match request added", selected.title);
    }
    save(next);
    return admin ? "Match added to the review queue." : "Request sent. Track it in My matches.";
  });
}

function addOrganizerNote(id) {
  const match = data.matches.find(item => item.id === id);
  if (!match || !canManage(eventById(match.eventId)) || eventById(match.eventId).deletedAt) return;
  openDialog("Add Note", `<p class="muted">${escape(matchName(match))} · ${escape(eventById(match.eventId).title)}</p>
    <form><label>Instructions for the volunteer<textarea name="note" rows="4" maxlength="280" required></textarea></label>
      ${formActions("Add Note")}
    </form>`);
  handleForm(fields => {
    const current = data.matches.find(item => item.id === id);
    if (!current || !canManage(eventById(current.eventId)) || eventById(current.eventId).deletedAt) throw new Error("This match is no longer available.");
    const note = fields.note.trim();
    if (!note || note.length > 280) throw new Error("Enter a note of 1 to 280 characters.");
    const matches = data.matches.map(item => item.id === id
      ? { ...item, organizerNotes: [...(item.organizerNotes ?? []), note] } : item);
    const next = { ...data, matches };
    save(matchOwner(current)
      ? notify(next, matchOwner(current), "New organizer note", eventById(current.eventId).title, note) : next);
    return "Organizer note added.";
  });
}

function review(id, status) {
  const match = data.matches.find(item => item.id === id);
  if (!match || match.status !== "pending") throw new Error("This request was already reviewed.");
  const event = eventById(match.eventId);
  if (!canManage(event)) throw new Error("This opportunity belongs to another admin.");
  if (event.deletedAt) throw new Error("This opportunity has been deleted.");
  if (status === "approved" && !withinDistance(event)) {
    throw new Error("Approval requires a recorded distance within the local limit.");
  }
  if (status === "approved" && (isPast(event) || matchAge(match) < event.age || available(event) < 1)) {
    throw new Error("This request cannot be approved. Check the event date, age requirement and capacity.");
  }
  const next = { ...data, matches: data.matches.map(item => item.id === id ? { ...item, status } : item) };
  save(matchOwner(match)
    ? notify(next, matchOwner(match), status === "approved" ? "Match approved" : "Match declined", event.title)
    : next);
  render();
  showMessage(status === "approved" ? "Match approved. A spot is confirmed." : "Match declined.");
}

function withdraw(id) {
  const match = data.matches.find(item => item.id === id && ownsMatch(item));
  if (!match || eventById(match.eventId).deletedAt || match.status === "declined" || match.attendance || completedMatch(match)) return;
  openDialog("Withdraw This Match?", `<p>${escape(eventById(match.eventId).title)}</p><form>
    ${formActions("Withdraw match")}
  </form>`);
  handleForm(() => {
    const current = data.matches.find(item => item.id === id && ownsMatch(item));
    if (!current || eventById(current.eventId).deletedAt || current.status === "declined" || current.attendance || completedMatch(current)) throw new Error("This match is no longer available to withdraw.");
    const next = { ...data, matches: data.matches.filter(item => item.id !== id) };
    save(notify(next, eventOwner(eventById(current.eventId)), "Match withdrawn", `${currentVolunteer().name} · ${eventById(current.eventId).title}`));
    return "Match withdrawn.";
  });
}

dialog.addEventListener("close", () => {
  if (!dialog.open) unmountFeatures(dialogRoots);
});
window.addEventListener("hashchange", render);
document.addEventListener("visibilitychange", refreshNotifications);
setInterval(refreshNotifications, 60_000);
window.addEventListener("storage", event => {
  if (event.key === key || event.key === null) {
    data = readData();
    render();
  }
});
document.addEventListener("click", event => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action: name, id } = button.dataset;
  try {
    data = readData();
    if (!role) return;
    switch (name) {
      case "sign-out":
        loginRole = role === "volunteer" ? "admin" : "volunteer";
        role = null;
        accountId = null;
        sessionStorage.removeItem(sessionKey);
        go("login");
        main.querySelector("select").focus();
        break;
      case "settings": settings(); break;
      case "read-notice": markRead(id); break;
      case "read-all": markRead(); break;
      case "clear-notices": clearNotifications(); break;
      case "calendar-month": moveMonth(Number(id)); break;
      case "calendar-day":
        selectedDay = selectedDay === id ? "" : id;
        calendar();
        if (id) main.querySelector(`[data-action="calendar-day"][data-id="${id}"]`).focus();
        else main.querySelector("#calendar-month").scrollIntoView({ block: "nearest" });
        break;
      case "friend-request":
      case "friend-accept":
      case "friend-decline":
      case "friend-cancel":
      case "friend-remove": if (role === "volunteer") updateFriend(id, name); break;
      case "bulk-attendance": if (role === "admin") bulkAttendance(); break;
      case "invite-message": if (role === "volunteer") inviteByMessage(id); break;
      case "invite": if (role === "volunteer") invite(id); break;
      case "copy-invite": if (role === "volunteer") shareInvite(false); break;
      case "share-invite": if (role === "volunteer") shareInvite(true); break;
      case "browse": {
        const search = document.querySelector("#search");
        search.focus({ preventScroll: true });
        document.querySelector("#opportunities-heading").scrollIntoView({ block: "start" });
        break;
      }
      case "close": dialog.close(); break;
      case "request": if (role === "volunteer") saveMatch("", id); break;
      case "view-match": go("my-matches"); break;
      case "event": if (role === "admin") saveEvent(id); break;
      case "delete-event": if (role === "admin") deleteEvent(id); break;
      case "match": saveMatch(id); break;
      case "add-note": if (role === "admin") addOrganizerNote(id); break;
      case "attendance": if (role === "admin") recordAttendance(id); break;
      case "impact-outcome": if (role === "admin") recordOutcome(id); break;
      case "approve": if (role === "admin") review(id, "approved"); break;
      case "decline": if (role === "admin") review(id, "declined"); break;
      case "withdraw": if (role === "volunteer") withdraw(id); break;
    }
  } catch (error) {
    showMessage(error.message);
  }
});

const pageRoots = [];
const dialogRoots = [];

function unmountFeatures(roots) {
  while (roots.length) roots.pop().unmount();
}

function mountFeature(id, name, props, roots) {
  const host = document.querySelector(`#${id}`);
  if (!host) return;
  const component = globalThis.VolunteerFeatures?.[name];
  if (!component) {
    host.textContent = "This panel could not load. Reload the app to try again.";
    return;
  }
  const root = ReactDOM.createRoot(host);
  roots.push(root);
  root.render(React.createElement(component, props));
}

function withAttendance(snapshot, ids, attendance) {
  let next = snapshot;
  const matches = snapshot.matches.map(match => {
    if (!ids.has(match.id) || match.attendance === attendance) return match;
    const updated = { ...match, attendance };
    const recipient = matchOwner(match);
    if (recipient) next = notify(next, recipient, "Attendance recorded",
      `${eventById(match.eventId).title} · ${formatDuration(creditedHours(updated))}`);
    return updated;
  });
  return { ...next, matches };
}

function bulkAttendance() {
  const groups = sortedEvents().filter(canManage).map(event => ({
    id: event.id, title: event.title, date: when(event),
    people: data.matches.filter(match => match.eventId === event.id && !attendanceUnavailable(match, event))
      .map(match => ({ id: match.id, name: matchName(match), attendance: match.attendance }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })).filter(group => group.people.length);
  openDialog("Bulk Attendance", '<div id="bulk-attendance-panel"></div>');
  mountFeature("bulk-attendance-panel", "BulkAttendance", { groups, onSave: saveBulkAttendance }, dialogRoots);
}

function saveBulkAttendance(eventId, ids, attendance) {
  data = readData();
  const event = eventById(eventId);
  const selected = new Set(ids);
  const matches = data.matches.filter(match => match.eventId === eventId && selected.has(match.id));
  if (!canManage(event) || !selected.size || matches.length !== selected.size ||
      !["present", "absent"].includes(attendance) || matches.some(match => attendanceUnavailable(match, event))) {
    throw new Error("The selection is no longer available. Reopen Bulk attendance and try again.");
  }
  save(withAttendance(data, selected, attendance));
  dialog.close();
  render();
  showMessage(`Attendance saved for ${selected.size} ${selected.size === 1 ? "volunteer" : "volunteers"}.`);
}

const messageLimit = 600;
const invitationText = "Would you like to volunteer with me?";

function canMessage(to) {
  if (!Object.hasOwn(demoAccounts, to) || to === accountId) return false;
  if (role === "admin") return !isAdminAccount(to);
  if (isAdminAccount(to)) return true;
  return connection(to)?.status === "accepted" && profile(to).acceptFriendMessages;
}

function sendOpportunityMessage(to, eventId, draft, topic = "message") {
  data = readData();
  const event = eventById(eventId);
  if (!role || !canMessage(to)) throw new Error("This account is not accepting messages from you.");
  if (!event || event.deletedAt || (role === "volunteer" && !withinDistance(event))) {
    throw new Error("This opportunity is no longer available for messaging.");
  }
  if (role === "admin" ? !canManage(event) : isAdminAccount(to) && to !== eventOwner(event)) {
    throw new Error("Choose the admin responsible for this opportunity.");
  }
  if (topic === "invite" && (role !== "volunteer" || isAdminAccount(to) || hasStarted(event) || !withinDistance(event))) {
    throw new Error("Invites are for accepted friends and upcoming local opportunities.");
  }
  const text = draft?.trim() ?? "";
  if (!text || text.length > messageLimit) {
    throw new Error(`Write a message between 1 and ${messageLimit} characters.`);
  }
  if (/\b(?:send (?:me )?(?:your )?(?:password|verification code)|buy now|click here to claim|(?:add|follow|dm) me on (?:snapchat|instagram|tiktok))\b/i.test(text)) {
    throw new Error("Keep your message about this opportunity and communicate here in the app.");
  }
  const message = {
    id: newId(), from: accountId, to, eventId, topic, text,
    opportunity: event.title, schedule: `${when(event)} · ${event.location}`, at: Date.now()
  };
  save(notify({ ...data, messages: [...(data.messages ?? []), message] }, to,
    topic === "invite" ? "Volunteer invitation" : "New message", `${profile(accountId).name} · ${event.title}`));
}

function messageProps() {
  return {
    recipients: Object.keys(demoAccounts).filter(canMessage).map(id => ({ id, name: profile(id).name, admin: isAdminAccount(id) })),
    events: sortedEvents().filter(event => role === "admin" ? canManage(event) : withinDistance(event))
      .map(event => ({ id: event.id, title: event.title, adminId: eventOwner(event) })),
    messageLimit
  };
}

function messageHistory() {
  return (data.messages ?? []).filter(item => item.from === accountId || item.to === accountId)
    .slice().reverse().map(item => ({ ...item, outgoing: item.from === accountId,
      person: profile(item.from === accountId ? item.to : item.from).name }));
}

function renderMessages() {
  main.innerHTML = intro("Messages", "Use these conversations to coordinate volunteering, ask questions, or follow up about an opportunity.") +
    '<div id="messages-panel"></div>';
  mountFeature("messages-panel", "Messages", {
    ...messageProps(), messages: messageHistory(),
    onSend(to, eventId, text) {
      sendOpportunityMessage(to, eventId, text);
      showMessage("Message sent.");
      return messageHistory();
    }
  }, pageRoots);
}

function inviteByMessage(eventId) {
  const event = eventById(eventId);
  if (!event || event.deletedAt || !withinDistance(event) || hasStarted(event)) return;
  const props = messageProps();
  openDialog("Invite a Friend", `<p>${escape(event.title)} · ${when(event)}</p><div id="invite-message-panel"></div>`);
  mountFeature("invite-message-panel", "Invite", {
    messageLimit, invitationText, recipients: props.recipients.filter(item => !item.admin),
    onExternalShare: () => invite(eventId),
    onSend(to, text) {
      sendOpportunityMessage(to, eventId, text, "invite");
      dialog.close();
      render();
      showMessage("Invitation sent.");
    }
  }, dialogRoots);
}

render();
