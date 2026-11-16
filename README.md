# VolunteerMatch Local

A hackathon demo that helps students find age-appropriate volunteer opportunities and gives organizers a way to review requests and confirm spots.

## Run Locally

1. Install [Python 3](https://www.python.org/downloads/) and have a web browser available. Download or clone the repository and open a terminal in the project folder (the folder containing `dist/`).
2. Start the Python web server.

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
   ```

   On Windows, replace `python3` with `py -3` if needed.
3. Open [http://localhost:8000/](http://localhost:8000/), choose a demo account, and enter the passcode `demo`. Press **Ctrl+C** in the terminal to stop the server.

The app includes all JavaScript dependencies. Python serves the files directly, with no packages to install and no build step. Live ZIP and address lookup require internet access.

## A two-minute walkthrough

1. Sign in as **Volunteer** using the demo passcode `demo`. Alex Rivera is 15. Turn on **Eligible for my age (15)** and watch the 16+ library opportunity disappear.
   Select **Within 1 mile** to see just the garden, then return to **Within 15 miles**.
2. Open **Community Garden Workday**, add a short note, and send the request. Open **My Matches** and use **Edit request** to update the note.
3. Sign out, then sign in as **Admin · Jordan Morgan** with the same demo passcode. Open **Match Requests**, find Alex’s updated note, and approve the request. Sam is a seeded example you can also review.
4. Sign out, then sign back in as **Volunteer**. In **My Matches**, Alex’s spot is now approved. The garden card shows one fewer open spot. Withdrawing the approved match releases that spot.

Open **Calendar** in either role. Use the month controls and select a date to see its events. The volunteer calendar follows Discover filters. The admin calendar includes all managed events and lets you edit them.

As a volunteer, open **Friends**, search the sample directory, and send a friend request. Sign in as the recipient in the same browser to accept it. Accepted friends can see upcoming approved events on Discover cards and in Friends. Sharing is on by default. Volunteers can turn it off under Settings → Privacy. On an opportunity card, open **Invite a Friend** to personalize the invitation. Use the device share option when available, or copy the text into a message.

To show the organizer tools, use **Add Opportunity** on the admin Discover page, then **Edit Opportunity** to change its details. On **Match Requests**, admins can also add a volunteer to the review queue, add instructions without changing the volunteer’s request note, or decline a pending request.

## How it works

- `dist/index.html` contains the page shell, `dist/style.css` controls layout and styling, and `dist/app.js` contains the seed data, rendering, and match rules.
- Discover and new matches are limited to opportunities with recorded mileage of 15 miles or less from Alex’s demo location. Organizers can manage opportunities at any distance and update their sample mileage. Pending matches must meet the local limit to be approved.
- Requests start as pending. Approval checks the minimum age, event date, and open capacity. Only approved matches use capacity.
- Sign-in simulates volunteer and admin accounts with a public passcode and a session in the current tab. It provides no production authentication. The friend directory is fictional. Saved friends, events, and matches live in this browser’s local storage. Invitations are text you share through your chosen app.
- Use a fresh browser profile, or remove the `volunteermatch-local-v1` key in Chrome DevTools under **Application → Local Storage** and reload, to start a fresh demo.
- The hero photo was AI-generated for this project.
## Notifications and reminders

Open **Notifications** to see unread match updates. To demo a reminder, edit an opportunity with an approved match so it starts tomorrow morning or later today, within the next 24 hours. The volunteer and admin inboxes then show a reminder. Updates and read status are stored in this browser. Reminders are evaluated when the app is open and again when you return.

## Impact

Each scheduled opportunity is a program in the demo. Set the scheduled duration in decimal hours when creating or editing an opportunity. For example, 1.5 hours is a 90-minute shift. After a shift ends, use **Record Attendance** in **Match Requests**. A completed shift earns the opportunity’s scheduled hours. A no-show earns zero. Previously verified hours retain their saved value until attendance is recorded for that match. Use **Impact** to record a measurable outcome and describe what the team accomplished. Volunteers see their own verified hours and the outcomes for programs where they earned hours. Admins see totals for all volunteers. Outcomes keep their own units, such as meal kits or trees planted.

Admins can delete opportunities from **Discover**. Deleting removes the listing and calendar entry, notifies volunteer accounts with pending or approved requests, and preserves previously earned hours and reported outcomes.


## Bulk attendance, privacy, and messages

In the admin **Match Requests** tab, choose **Bulk Attendance** after a shift ends. Select the opportunity, select individual volunteers or **Select all**, and save either **Completed shift** or **Did not attend** for the selected group.

Sign in as Jordan Morgan for **Riverside Trail Cleanup** with three approved volunteers, or Mateo Cruz for **Pantry Sorting Shift** with two. Both sample shifts have ended, and their attendance starts unrecorded.

Under **Settings → Privacy**, volunteers can disable new friend requests, disable messages and invites from friends, hide their account from friend search, or stop sharing upcoming approved events.

**Messages** supports volunteer-to-admin and accepted-friend conversations. Admins can message demo volunteer accounts. Choose an opportunity and recipient to start a conversation, then open it to read and reply with your own words. Each conversation stays with that opportunity and person. Keep messages about volunteering, such as check-in, supplies, or service hours. The demo checks for a few common spam and off-platform requests. Use **Invite a Friend** on a card to write an in-app invitation. Conversations and settings are stored in the current browser, so switch demo accounts in the same browser to see both sides.

In **Discover**, open **Find Public Volunteer Opportunities** and enter a U.S. ZIP code or address. Esri resolves the query and the app ranks the included Bay Area programs within 15 straight-line miles. Organizer links lead to the published listings and signup details. Try ZIP **95112** or **94129**.

Either participant can open a conversation and select **End conversation** to close it to replies. Each participant can then select **Delete conversation** to remove it from their own Messages. The browser removes the message history once both participants delete it.

The bulk attendance, messaging, and public search panels use React with plain JavaScript. React 18 is bundled locally under the MIT license. Location lookup uses the internet, with approximate offline results for the ZIP codes in the included catalog.

There are three demo admins. Jordan Morgan owns four sample opportunities, Priya Shah owns three, and Mateo Cruz owns three. Admins use the same demo passcode and manage their own listings, match requests, attendance, and impact. New opportunities belong to the admin who creates them.

## Photo Credit

The sign-in and Discover photo is [*Planting and watering* by the U.S. Forest Service, Pacific Southwest Region](https://commons.wikimedia.org/wiki/File:Planting_and_watering_(4704281189).jpg), via Wikimedia Commons. The photo is available under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/) and was resized for this app.
