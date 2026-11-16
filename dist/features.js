
"use strict";

(() => {
  const h = React.createElement;
  const { useState } = React;
  const option = (value, label) => h("option", { key: value, value }, label);
  const button = (text, props = {}) => h("button", { type: "button", className: "button secondary", ...props }, text);
  const errorText = error => error && h("p", { className: "error", role: "alert" }, error);

  function BulkAttendance({ groups, onSave }) {
    const [eventId, setEvent] = useState(groups[0]?.id ?? "");
    const [selected, setSelected] = useState([]);
    const [attendance, setAttendance] = useState("present");
    const [error, setError] = useState("");
    const people = groups.find(group => group.id === eventId)?.people ?? [];
    const allSelected = people.length > 0 && selected.length === people.length;
    if (!groups.length) return h("p", { className: "muted" },
      "Bulk attendance opens after a scheduled shift ends and appears for opportunities with approved volunteers.");
    return h("form", { onSubmit(event) {
      event.preventDefault();
      try { onSave(eventId, selected, attendance); } catch (failure) { setError(failure.message); }
    } },
    h("label", null, "Opportunity", h("select", { value: eventId, onChange(event) {
      setEvent(event.target.value);
      setSelected([]);
      setError("");
    } }, groups.map(group => option(group.id, `${group.title} · ${group.date}`)))),
    h("fieldset", { className: "privacy-settings selectable-people" },
      h("legend", null, "Volunteers"),
      h("label", { className: "check" }, h("input", { type: "checkbox", checked: allSelected,
        onChange: () => setSelected(allSelected ? [] : people.map(person => person.id)) }), "Select all"),
      people.map(person => h("label", { className: "check", key: person.id },
        h("input", { type: "checkbox", checked: selected.includes(person.id), onChange(event) {
          const checked = event.target.checked;
          setSelected(value => checked ? [...value, person.id] : value.filter(id => id !== person.id));
        } }), `${person.name}${person.attendance ? person.attendance === "present" ? " · Completed" : " · Did not attend" : ""}`))),
    h("label", null, "Attendance", h("select", { value: attendance, onChange: event => setAttendance(event.target.value) },
      option("present", "Completed shift"), option("absent", "Did not attend"))),
    errorText(error),
    h("div", { className: "actions" }, button("Cancel", { "data-action": "close" }),
      button(`Save attendance (${selected.length})`, { type: "submit", className: "button", disabled: !selected.length })));
  }

  function Messages({ recipients, events, topics, messages, onSend }) {
    const [person, setPerson] = useState("");
    const [opportunity, setOpportunity] = useState("");
    const [replyId, setReplyId] = useState("");
    const [replyError, setReplyError] = useState("");
    const organizer = events.find(item => item.id === opportunity)?.adminId;
    const availableRecipients = recipients.filter(item => !item.admin || item.id === organizer);
    const [error, setError] = useState("");
    const history = messages.filter(item => !person || item.from === person || item.to === person);
    return h("div", { className: "message-layout" },
      h("section", { className: "panel", "aria-labelledby": "compose-title" },
        h("h2", { id: "compose-title" }, "New Message"),
        h("form", { onSubmit(event) {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          try { onSend(fields.get("to"), fields.get("opportunity"), fields.get("topic")); }
          catch (failure) { setError(failure.message); }
        } },
        h("label", null, "Opportunity", h("select", { name: "opportunity", required: true, value: opportunity,
          onChange: event => setOpportunity(event.target.value) },
          option("", "Choose an opportunity"), events.map(item => option(item.id, item.title)))),
        h("label", null, "To", h("select", { name: "to", required: true, key: opportunity },
          option("", "Choose a recipient"), availableRecipients.map(item => option(item.id, item.name)))),
        h("label", null, "Message", h("select", { name: "topic", required: true },
          option("", "Choose a volunteering message"), topics.map(([id, label]) => option(id, label)))),
        errorText(error),
        button("Send message", { type: "submit", className: "button", disabled: !events.length || !recipients.length }))),
      h("section", { className: "stack", "aria-labelledby": "history-title" },
        h("h2", { id: "history-title" }, "Conversations"),
        h("label", { className: "message-filter" }, "Filter by person", h("select", { value: person,
          onChange: event => setPerson(event.target.value) }, option("", "Everyone"),
        Array.from(new Map(messages.map(item => [item.outgoing ? item.to : item.from, item.person])),
          ([id, name]) => option(id, name)))),
        history.length ? history.map(item => h("article", { key: item.id, className: "record" },
          h("div", { className: "record-copy" },
            h("h3", null, `${item.outgoing ? "To" : "From"} ${item.person}`),
            h("p", { className: "muted" }, `${item.opportunity} · ${item.schedule}`),
            h("p", { className: "note" }, item.text),
            h("p", { className: "muted" }, new Date(item.at).toLocaleString()),
            button(replyId === item.id ? "Cancel reply" : "Reply", {
              className: "button secondary message-reply-button",
              "aria-expanded": replyId === item.id,
              onClick() {
                setReplyId(replyId === item.id ? "" : item.id);
                setReplyError("");
              }
            }),
            replyId === item.id && h("form", { className: "message-reply", onSubmit(event) {
              event.preventDefault();
              const topic = new FormData(event.currentTarget).get("topic");
              const recipient = item.outgoing ? item.to : item.from;
              try { onSend(recipient, item.eventId, topic); }
              catch (failure) { setReplyError(failure.message); }
            } },
              h("label", null, `Reply to ${item.person} about ${item.opportunity}`,
                h("select", { name: "topic", required: true },
                  option("", "Choose a volunteering message"), topics.map(([id, label]) => option(id, label)))),
              errorText(replyError),
              button("Send reply", { type: "submit", className: "button" }))),
          h("span", { className: "tag" }, item.topic === "invite" ? "Invitation" : item.outgoing ? "Sent" : "Received")))
          : h("div", { className: "empty" }, "No messages yet.")));
  }

  function Invite({ recipients, onSend, onExternalShare }) {
    const [error, setError] = useState("");
    return h("form", { onSubmit(event) {
      event.preventDefault();
      try { onSend(new FormData(event.currentTarget).get("to")); }
      catch (failure) { setError(failure.message); }
    } },
    recipients.length ? h("label", null, "Send an in-app invitation", h("select", { name: "to", required: true },
      option("", "Choose an accepted friend"), recipients.map(item => option(item.id, item.name))))
      : h("p", { className: "muted" }, "In-app invitations are available for accepted friends who allow messages."),
    errorText(error),
    h("div", { className: "actions" }, button("Share outside the app", { onClick: onExternalShare }),
      recipients.length > 0 && button("Send invitation", { type: "submit", className: "button" })));
  }

  // Published programs with approximate organizer or program coordinates.
  const catalog = [
    { name: "Teens Reach", org: "San José Public Library", area: "King Library, San José", zip: "95112",
      lat: 37.3361, lon: -121.8827, details: "Support library programs and events. For ages 13–18.",
      url: "https://www.sjpl.org/teens/teensreach/" },
    { name: "Neighborhood Litter Program", org: "City of San José · BeautifySJ", area: "Kirk Community Center, San José", zip: "95118",
      lat: 37.2639, lon: -121.9038, details: "Help clean up your neighborhood. Supplies are available from the city. Ages 15+.",
      url: "https://www.sanjoseca.gov/your-government/departments-offices/parks-recreation-neighborhood-services/get-involved/neighborhood-litter-program" },
    { name: "Cypress Center Food Sorting", org: "Second Harvest of Silicon Valley", area: "North San José", zip: "95134",
      lat: 37.4186, lon: -121.9562, details: "Ask about recurring volunteer shifts sorting food at the Cypress Center warehouse.",
      url: "https://www.shfb.org/give-help/volunteer/recurring-roles/" },
    { name: "Presidio Habitat Stewards", org: "Golden Gate National Parks Conservancy", area: "Presidio, San Francisco", zip: "94129",
      lat: 37.799439, lon: -122.458457, details: "Help restore native habitat. Check the organizer’s calendar for dates and registration.",
      url: "https://www.nps.gov/planyourvisit/event-details.htm?id=55AB7892-BD6C-290A-A0178D6C39EEDE4E" },
    { name: "Park Volunteer Work Parties", org: "San Francisco Recreation and Parks", area: "Golden Gate Park area, San Francisco", zip: "94122",
      lat: 37.7694, lon: -122.4862, details: "Find work parties for planting, trail maintenance, and park cleanup across San Francisco.",
      url: "https://recpark.sf.gov/1665/Park-Volunteers" }
  ];

  async function locate(query) {
    const endpoint = new URL("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates");
    endpoint.search = new URLSearchParams({ SingleLine: query, sourceCountry: "USA", maxLocations: "1",
      outSR: "4326", f: "json", forStorage: "false" });
    try {
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error();
      const result = await response.json();
      if (result.error) throw new Error();
      const match = result.candidates?.[0];
      if (match?.score >= 85 && Number.isFinite(match.location?.x) && Number.isFinite(match.location?.y)) {
        return { lat: match.location.y, lon: match.location.x, label: match.address };
      }
      throw new Error("No location found. Try a five-digit U.S. ZIP code or a full street address with city and state.");
    } catch (failure) {
      const zip = query.match(/\b\d{5}(?:-\d{4})?$/)?.[0].slice(0, 5);
      const known = catalog.find(item => item.zip === zip);
      if (known) return { ...known, label: `ZIP ${zip} area (approximate)` };
      if (failure.message.startsWith("No location found")) throw failure;
      throw new Error("Location lookup is unavailable. Try again online or use a sample ZIP such as 95112 or 94129.");
    }
  }

  function distanceMiles(a, b) {
    const rad = Math.PI / 180;
    const square = Math.sin((b.lat - a.lat) * rad / 2) ** 2
      + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
    return 3958.76 * 2 * Math.asin(Math.sqrt(Math.min(1, square)));
  }

  function PublicSearch() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [place, setPlace] = useState(null);
    const matches = place ? catalog.map(item => ({ ...item, miles: distanceMiles(place, item) }))
      .filter(item => item.miles <= 15).sort((a, b) => a.miles - b.miles) : [];
    return h("details", { className: "panel public-search" },
      h("summary", null, "Find Public Volunteer Opportunities"),
      h("p", { className: "muted" }, "Search a Bay Area catalog of publicly listed programs within 15 miles. A ZIP code works without entering a street address. Esri resolves the location."),
      h("form", { onSubmit: async event => {
        event.preventDefault();
        const query = new FormData(event.currentTarget).get("location").trim();
        if (!query || busy) return;
        setPlace(null);
        setError("");
        setBusy(true);
        try { setPlace(await locate(query)); } catch (failure) { setError(failure.message); }
        finally { setBusy(false); }
      } },
      h("label", null, "U.S. ZIP code or street address",
        h("input", { name: "location", required: true, maxLength: 160, placeholder: "Example 95112", autoComplete: "off" })),
      button(busy ? "Searching…" : "Find nearby programs", { type: "submit", className: "button", disabled: busy })),
      errorText(error),
      place && h("div", { className: "stack public-results", "aria-live": "polite" },
        h("p", { className: "muted" }, `${matches.length} nearby ${matches.length === 1 ? "program" : "programs"} · ${place.label}`),
        matches.map(item => h("article", { key: item.name, className: "record" },
          h("div", { className: "record-copy" }, h("h3", null, item.name),
            h("p", { className: "muted" }, `${item.org} · ${item.area} · ${item.miles.toFixed(1)} mi`),
            h("p", null, item.details)),
          h("a", { className: "button secondary", href: item.url, target: "_blank", rel: "noopener noreferrer" }, "Organizer details"))),
        !matches.length && h("a", { href: "https://www.americorps.gov/join/find-volunteer-opportunity",
          target: "_blank", rel: "noopener noreferrer" }, "Search the national AmeriCorps directory")));
  }

  globalThis.VolunteerFeatures = { BulkAttendance, Messages, Invite, PublicSearch };
})();
