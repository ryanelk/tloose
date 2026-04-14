# Trip Planner

A personal travel planning system built around one idea: **trips should feel loose, not locked in.**

Most trip planners force you into rigid hour-by-hour schedules. This one doesn't. It's designed for the kind of traveler who does heavy research upfront — scoping out restaurants, activities, neighborhoods — then makes day-of decisions based on hunger, energy, proximity, and mood.

The hard deadlines (flights, reservations, check-ins) are always visible. Everything else is a suggestion you made to yourself.

## Philosophy

**Firm anchors, loose days.** Flights depart at specific times. Hotel check-in is at a specific time. A Michelin-star reservation is at a specific time. These are non-negotiable and should be visible at a glance to calm the mind. But "visit the Frida Museum" or "get tacos in Centro" can happen whenever it makes sense that day.

**Organize by area, not by hour.** When you're in Coyoacán, you want to know what's *in Coyoacán* — which restaurants, which museums, what's walkable from where. The system groups food and activities by location so you can see what's nearby and chain things together naturally.

**Prioritize ruthlessly.** A trip has finite days. Marking something as "Must Visit" vs "If Time" is the difference between a trip with direction and one where you're paralyzed by options. Everything in the food and activity lists carries a priority level.

**Track spending loosely.** Some days will cost more than others. You don't need to agonize over every peso, but you should know roughly where the money is going and whether you're on track. The budget view gives you that at a glance, and links directly to your transport and stay costs.

**One system, not five spreadsheets.** Transport costs flow into the budget. Restaurant reservations appear on the timeline. Activity locations group them by neighborhood. Everything connects.

## Structure

The app has five tabs. Data flows between them.

### Overview

The home base. Contains:

- **Trip dates** — start and end dates that auto-generate your timeline days. Changing these will warn you if days would be removed.
- **Locations** — your major destinations (cities/regions) and their sub-locations (neighborhoods/areas). These power the location dropdowns everywhere else.
  - *Example:* Location "Mexico City" with sub-locations "Roma Norte", "Coyoacán", "Centro", "Xochimilco"
- **Transport** — every leg of travel: flights, buses, trains, cars, ferries. Each entry has a type, route, date, departure/arrival times, carrier, and notes. The system auto-calculates duration and a recommended arrival time (2 hours before flights, 1 hour before everything else).
  - *Example:* Flight, LAX → MLM, Aug 12, 3:03 PM → 7:33 PM, Volaris — shows "4h 30m" and "Arrive by 1:03 PM"
- **Stays** — where you're sleeping, tied to a location, with check-in/check-out dates and computed nights.
- **Key Deadlines** — checkboxes for pre-trip tasks like booking tickets or buying travel insurance.

Transport and stay entries carry `budgeted` and `actual` cost fields that feed directly into the Budget tab.

### Timeline

Auto-generated from your trip date range — one day per date. Each day has:

- A **label** (auto-formatted like "Tue 8/12") and an editable **subtitle** for theming the day ("Museum Day", "South CDMX", "Chill with Fam")
- **Location chips** — tag multiple locations for the day
- **Derived events** (read-only) — auto-populated from other sections:
  - Transport departures and arrivals on that date
  - Food/activity reservations on that date
  - These show with fixed times and source badges (✈ transport, 🍽 food, 📍 activity)
- **Freeform events** (editable) — your loose plans for the day:
  - Ordered by position, not time. Reorder with ▲/▼ buttons.
  - Each event has a **searchable link** to any food or activity item. Type to search, select to link.
  - *Example:* Add an event "Lunch", search and link "Esquina Común" — now it shows the restaurant name and emoji.
  - Events have a status: Set / High / Maybe

The timeline is the most important view. It's your bird's-eye for each day — but it stays loose by design. Only confirmed reservations and transport have fixed times. Everything else is ordered by your gut feeling of how the day should flow.

### Food

Your restaurant shortlist, grouped by location. Each entry has:

- **Name** and **Reserved** badge (shown right after the name if the reservation checkbox is on)
- **Tags** — clickable 🍽 (food) and 🍹 (drinks) toggles. A mezcal bar might only have drinks. A restaurant with a good cocktail menu gets both.
- **Price slider** — click to set $ through $$$$
- **Priority** — Must / High / Maybe
- **Vibe** — a one-line description of what to expect ("Experimental Mexican, Bib Gourmand", "Suadero tacos, cash only")
- **Location** — dropdown tied to your locations/sub-locations
- **Reservation** — checkbox with date picker and time field. When set, this auto-appears on the matching timeline day.
- **Notes** — links, tips, whatever

*Example workflow:* You research Roma Norte restaurants. Add "Voraz" — set it to $$ , Must priority, tag it 🍽🍹, write "Experimental Mexican, Bib Gourmand" as the vibe, assign location Roma Norte. Later you make a reservation: check the box, set the date and time. It now auto-appears on that day's timeline.

### Activities

Same structure as Food (location, price slider, priority, reservation, notes) minus the food/drinks tags. Use it for museums, neighborhoods to explore, markets, workshops, day trips — anything that isn't eating.

*Example:* "Xochimilco" — $$ , Must priority, location Xochimilco, vibe "Floating gardens, Evan's fav part of his trip", notes "Consider the private ecotour".

### Budget

Three sections:

1. **Transport** (linked) — reads directly from Overview transports. Edit budgeted/actual here and it writes back to the source. Shows per-item and subtotal.
2. **Stays** (linked) — same, reads from Overview stays.
3. **Manual categories** — add your own (Food, Activities, Souvenirs, etc.) with line items. These are independent.

The summary bar at top shows total budget, allocated, spent, and remaining with a visual progress bar. The idea is loose tracking — you set a budget, fill in actuals as you go or after the trip, and get a sense of where the money went.

## Settings

- **Theme** — light / auto / dark, toggled with a slider in the header
- **Timezone** — dropdown in the header, shown alongside transport times
- **Font** — six typeface options in the ⚙ settings menu (serifs for a journal feel, sans for clean readability, monospace for the spreadsheet-minded)
- **Reset** — in the ⚙ menu, restores sample data

## Data

All data persists across sessions via browser storage. There's no account or server — everything lives locally. The reset button in settings restores the sample template (a Mexico trip) if you want to start fresh or see how the structure works.

## Future

Not yet built but on the radar:

- Stay & flight comparison tracker (shortlisting options before booking)
- Packing lists / outfit planning
- Friends & family recommendations section
- Cross-tab linking (costs from food/activities flowing into budget after the trip)
- Map view integration (area-based visual planning)
