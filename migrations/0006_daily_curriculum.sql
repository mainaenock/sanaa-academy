-- Fifteen Monday/Wednesday/Friday lessons. Preserve prior learning records as unpublished history.
UPDATE courses SET timetable='Classes on Monday, Wednesday, and Friday. Class times will be announced.' WHERE id='ai-web-2026';
UPDATE lessons SET published=0 WHERE id IN ('lesson-1-1','lesson-1-2','lesson-2-1','lesson-2-2','lesson-3-1','lesson-3-2','lesson-4-1','lesson-4-2','lesson-5-1','lesson-5-2','lesson-6-1','lesson-6-2');
UPDATE weeks SET title='Create your first web page',description='Set up your tools, give your page a structure, and make it look like yours.' WHERE id='week-1' AND course_id='ai-web-2026';
INSERT INTO modules(id,week_id,title,description,position) VALUES('daily-module-1','week-1','Create your first web page','Set up your tools, give your page a structure, and make it look like yours.',1);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-1-1','daily-module-1','Monday · Set up your workspace','Install your tools, meet your AI assistant, and learn how to save and back up your work.','Open a project, explain the role of the editor and AI assistant, and save and back up a change with Git and GitHub.','WEEK 1 · MONDAY
Set up your workspace

Tools and concepts
VS Code, OpenAI Codex, Git, GitHub, a modern browser, Node.js and npm. Node.js/npm are installed now for the tooling used in week four; they are not a separate backend lesson today.

In class
Install the editor, coding assistant, Git, and Node.js from official sources. Create a GitHub account and repository. Explain local files versus a remote repository, the terminal, git status, a diff, a commit, and a push. Choose a small personal website idea and describe its audience, pages, and one useful action.

Direct the AI
Help me set up a project for this idea. Explain each tool and command before using it. Create only a small starting page, show me the changes, and help me save a checkpoint.

Check your work
Open the page locally, change its title, inspect the diff, commit it, and confirm the change appears on GitHub. Keep passwords, tokens, and .env files out of prompts and commits. Confirm every learner can open their project again.

Practice and deliverable
Submit your repository link and a short brief: who the website is for, what it offers, its pages, and one action a visitor should complete.',1,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-1-1','ai-web-2026','daily-lesson-1-1','Monday · Set up your workspace — practice','Submit your repository link and a short brief: who the website is for, what it offers, its pages, and one action a visitor should complete.',1);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-1-2','daily-module-1','Wednesday · Give your page a structure','Understand how headings, pictures, links, buttons, and forms fit together. Start a page for your own idea.','Explain how HTML describes the content and structure of a page and guide AI to create a readable page for your idea.','WEEK 1 · WEDNESDAY
Give your page a structure

Tools and concepts
HTML: document structure, semantic elements, headings, paragraphs, links, images and alt text, buttons, labels, inputs, and forms. Browser developer tools.

In class
Inspect a familiar page and identify its content blocks. Build a simple HTML page containing a header, main content, navigation, an image, and a labelled form. Explain the difference between a link and a button. Form submission will be connected later; today the form is a layout.

Direct the AI
Create a plain HTML page from my brief. Use meaningful headings, descriptive links, image descriptions, and labelled inputs. Explain what each section does. Keep styling and JavaScript out of this task.

Check your work
Read the page without styling. Follow its links, navigate with the keyboard, check image paths, and identify each visible element in the HTML. Save a Git checkpoint.

Practice and deliverable
Personalise the page with your own content. Explain the purpose of its main sections and submit the repository link.',2,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-1-2','ai-web-2026','daily-lesson-1-2','Wednesday · Give your page a structure — practice','Personalise the page with your own content. Explain the purpose of its main sections and submit the repository link.',2);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-1-3','daily-module-1','Friday · Make it look like yours','Choose colours, fonts, spacing, and layouts. Learn how your page adjusts to a phone or computer screen.','Explain how CSS changes appearance and guide AI to make your page readable on a phone and a computer.','WEEK 1 · FRIDAY
Make it look like yours

Tools and concepts
CSS: selectors, colours, typography, spacing, the box model, Flexbox/Grid basics, and one simple media query. Browser responsive preview.

In class
Style Wednesday’s page with a small colour palette and consistent spacing. Demonstrate how content flows on narrow screens and how a media query can change a layout. Introduce visible keyboard focus, readable contrast, and restrained transitions. Keep the lesson practical rather than covering every CSS property.

Direct the AI
Style my existing HTML with these colours and references. Make it readable at phone and desktop widths, keep keyboard focus visible, and explain your layout choices. Do not add JavaScript.

Check your work
Compare narrow and wide screens, increase text size, and check for horizontal scrolling. Check long headings, labels, and button sizes. Save and push the working version.

Practice and deliverable
Submit phone and desktop screenshots of your first styled page, with a short explanation of the design choices you directed.',3,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-1-3','ai-web-2026','daily-lesson-1-3','Friday · Make it look like yours — practice','Submit phone and desktop screenshots of your first styled page, with a short explanation of the design choices you directed.',3);
UPDATE weeks SET title='Make your website respond',description='Bring buttons and forms to life, work with information, and learn to solve problems.' WHERE id='week-2' AND course_id='ai-web-2026';
INSERT INTO modules(id,week_id,title,description,position) VALUES('daily-module-2','week-2','Make your website respond','Bring buttons and forms to life, work with information, and learn to solve problems.',1);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-2-1','daily-module-2','Monday · Understand how websites make decisions','Describe rules to AI, such as what should happen when someone clicks a button.','Describe simple rules for a website and explain the inputs, decision, and result of a small JavaScript function.','WEEK 2 · MONDAY
Understand how websites make decisions

Tools and concepts
JavaScript: values, variables, strings, numbers, booleans, conditions, and functions. Browser console.

In class
Use everyday rules before code: if a name is empty, ask for it; otherwise show a greeting. Compare HTML structure, CSS appearance, and JavaScript behaviour. Ask AI for small examples, predict the results, and run them in the console. No framework is introduced yet.

Direct the AI
Turn this rule into a small JavaScript example. Explain its inputs, condition, and output. Ask me to predict the result before showing it, then help me change the rule.

Check your work
Try an empty value, a normal value, and an unexpected value. Explain why each result occurs, rather than accepting an answer because the AI says it is correct.

Practice and deliverable
Describe three behaviours for your website in plain language. Use AI to demonstrate one with a small function and explain the result.',1,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-2-1','ai-web-2026','daily-lesson-2-1','Monday · Understand how websites make decisions — practice','Describe three behaviours for your website in plain language. Use AI to demonstrate one with a small function and explain the result.',4);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-2-2','daily-module-2','Wednesday · Bring your page to life','Make buttons work, show or hide information, and respond to what someone enters in a form.','Connect a user action to a visible change on the page and check that a form gives useful feedback.','WEEK 2 · WEDNESDAY
Bring your page to life

Tools and concepts
JavaScript DOM selection, click and submit events, input values, textContent, basic form validation, and browser debugging.

In class
Add a working button, a show/hide section, and a small form interaction to the existing HTML/CSS page. Trace the event from the click to the function and the updated page. Explain that browser validation helps visitors but server-side validation will still be needed later.

Direct the AI
Add this one interaction to my page using vanilla JavaScript. Explain which element is selected, which event starts the action, and what changes on screen. Show clear feedback when an input is missing.

Check your work
Test clicks, keyboard submission, blank inputs, and repeated actions. Inspect console errors and ask AI to explain evidence before proposing a fix. Display user text as text rather than injecting it as HTML.

Practice and deliverable
Submit one working interaction on your personal website and describe what starts it and what the visitor sees.',2,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-2-2','ai-web-2026','daily-lesson-2-2','Wednesday · Bring your page to life — practice','Submit one working interaction on your personal website and describe what starts it and what the visitor sees.',5);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-2-3','daily-module-2','Friday · Work with lists and information','Display and update things such as notes, products, or events. Spot problems and guide AI to fix them.','Describe a collection of items and direct AI to display, add, and remove them without confusing their identities.','WEEK 2 · FRIDAY
Work with lists and information

Tools and concepts
JavaScript arrays, objects, IDs, loops/list rendering, add/remove operations, and the console. Git branches and diffs.

In class
Represent a note with an ID, title, and body. Display a short list, add an item, and remove one by ID. Introduce a small branch for a change and inspect its diff. Plan the notes app screens and acceptance checks for week three.

Direct the AI
Help me model a list of notes and display it using HTML, CSS, and JavaScript. Explain why each note needs an ID. Add one operation at a time and help me reproduce errors before changing code.

Check your work
Try an empty list, several items, duplicate titles, and removing the middle item. Confirm the correct item changes. Save the working version before starting a new feature.

Practice and deliverable
Submit the small list exercise and a notes-app plan covering create, view, edit, delete, and your chosen visual design.',3,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-2-3','ai-web-2026','daily-lesson-2-3','Friday · Work with lists and information — practice','Submit the small list exercise and a notes-app plan covering create, view, edit, delete, and your chosen visual design.',6);
UPDATE weeks SET title='Build your own notes app',description='Create a useful app, use it on your phone, and improve it with feedback.' WHERE id='week-3' AND course_id='ai-web-2026';
INSERT INTO modules(id,week_id,title,description,position) VALUES('daily-module-3','week-3','Build your own notes app','Create a useful app, use it on your phone, and improve it with feedback.',1);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-3-1','daily-module-3','Monday · Create a working app','Guide AI to build an app where you can write, view, edit, and delete notes. Choose its appearance.','Direct AI to build a notes app and demonstrate creating, viewing, editing, and deleting a note.','WEEK 3 · MONDAY
Create a working app

Tools and concepts
Vanilla HTML, CSS, and JavaScript; DOM events; arrays and objects; stable note IDs; create/read/update/delete operations.

In class
Build from the shared notes-app plan. Create the layout, connect the form, render notes, and add editing and deletion in separate steps. Learners choose their own appearance. Keep data in memory today so the core behaviour is easy to inspect.

Direct the AI
Build the next small step of my notes app. Use vanilla HTML, CSS, and JavaScript. Preserve existing features, explain the change, and give me checks I can perform before the next step.

Check your work
Create two notes with the same title, edit one without changing the other, delete the intended note, and test blank fields and long content. Check keyboard use and phone layout.

Practice and deliverable
Submit the working notes app and a short walkthrough of all four operations. Record any bugs to address on Wednesday.',1,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-3-1','ai-web-2026','daily-lesson-3-1','Monday · Create a working app — practice','Submit the working notes app and a short walkthrough of all four operations. Record any bugs to address on Wednesday.',7);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-3-2','daily-module-3','Wednesday · Keep your notes and use the app on your phone','Make notes stay after closing the page and add the app to your phone’s home screen.','Keep notes after a page refresh and install the app on a supported phone browser while explaining where the notes are stored.','WEEK 3 · WEDNESDAY
Keep your notes and use the app on your phone

Tools and concepts
JSON, localStorage, a web app manifest, icons, HTTPS hosting, and a service worker for basic offline caching. This installable web approach is called a progressive web app (PWA).

In class
Save and restore notes with JSON and localStorage. Add a guided manifest and offline shell, publish the app with Cloudflare Workers Static Assets, and test installation on actual phones. Explain that installation steps depend on browser and device. Native Android/iOS packaging with Capacitor is an optional later workshop, not required today.

Direct the AI
Make my notes survive a refresh, handle missing or invalid saved data, and add an installable web app setup. Explain browser-only storage, the manifest, and which files are cached offline. Do not claim this adds account sync.

Check your work
Refresh and reopen the app, try an empty store, install it where supported, and test basic offline use after the first online load. Notes stay in that browser/device, can be lost if its storage is cleared, and do not sync to another phone. Keep this exercise free of sensitive data.

Practice and deliverable
Submit the hosted app link and evidence of use on a phone. Explain the difference between saving on the device and saving in an online database.',2,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-3-2','ai-web-2026','daily-lesson-3-2','Wednesday · Keep your notes and use the app on your phone — practice','Submit the hosted app link and evidence of use on a phone. Explain the difference between saving on the device and saving in an online database.',8);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-3-3','daily-module-3','Friday · Show, test, and improve','Share your app, try other learners’ apps, and make improvements. Choose the main feature for your personal website.','Demonstrate your app, improve it from evidence and feedback, and define an achievable main workflow for your personal website.','WEEK 3 · FRIDAY
Show, test, and improve

Tools and concepts
Browser developer tools, reproducible bug reports, acceptance checklists, GitHub branches/pull requests, and project briefs.

In class
Run learner demonstrations and peer testing. Describe a problem with steps, expected behaviour, and observed behaviour. Guide AI through a focused fix and review the diff. Choose a personal project such as a portfolio with enquiries, a tutor site with lesson requests, or an event site with registrations.

Direct the AI
Help me investigate this reproducible problem. Explain likely causes from the evidence, suggest one focused fix, and tell me how to check for regressions. Then help me reduce my website idea to one complete visitor journey.

Check your work
Retest the notes app after each fix. Verify each learner can explain the app’s structure and make a small directed change. Agree the pages, data, and one useful action for the personal project. Avoid adding payments, complex dashboards, or custom login to this first scope.

Practice and deliverable
Submit the improved app, a short change log, and your personal project brief with measurable completion checks.',3,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-3-3','ai-web-2026','daily-lesson-3-3','Friday · Show, test, and improve — practice','Submit the improved app, a short change log, and your personal project brief with measurable completion checks.',9);
UPDATE weeks SET title='Build your website’s main features',description='Organise your website, plan the visitor’s journey, and learn how information is saved.' WHERE id='week-4' AND course_id='ai-web-2026';
INSERT INTO modules(id,week_id,title,description,position) VALUES('daily-module-4','week-4','Build your website’s main features','Organise your website, plan the visitor’s journey, and learn how information is saved.',1);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-4-1','daily-module-4','Monday · Build with reusable sections','Organise your website using sections such as headers, menus, and cards that you can use again.','Explain why reusable components help and guide AI to organise a familiar page in React.','WEEK 4 · MONDAY
Build with reusable sections

Tools and concepts
Node.js/npm for development tooling; React components, JSX, and props; a Vite development server and production build; Git/GitHub.

In class
Revisit Node.js and npm installed in week one. Explain package.json, dependencies, the development server, and a build. Introduce React by rebuilding a familiar header, service card, or gallery section as a component. Map HTML/CSS/JavaScript concepts to React. The deployed backend will use Cloudflare Workers, not a separate Express server.

Direct the AI
Organise my existing page as a small React project. Start with one familiar component, explain its JSX and props, preserve the design, and show me how to run and build it. Keep dependencies minimal.

Check your work
Run the project, identify repeated components, change a prop, and confirm the production build succeeds. Review added packages and repository changes. Keep secrets out of browser code and source control.

Practice and deliverable
Submit your personal website’s React structure with a header, main content, and at least one reusable section. Explain what Node/npm and React each do.',1,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-4-1','ai-web-2026','daily-lesson-4-1','Monday · Build with reusable sections — practice','Submit your personal website’s React structure with a header, main content, and at least one reusable section. Explain what Node/npm and React each do.',10);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-4-2','daily-module-4','Wednesday · Create the visitor’s journey','Build the steps someone will follow, such as browsing your services and sending an enquiry.','Build a clear visitor journey with interactive React components and explain what happens while a request is pending or fails.','WEEK 4 · WEDNESDAY
Create the visitor’s journey

Tools and concepts
React state, events, controlled forms, list rendering, input feedback, and introduction to promises and async/await.

In class
Create the frontend for the chosen main workflow. Practise state and form handling using familiar JavaScript behaviour. Prepare loading, success, empty, and error states before connecting to a real backend. Introduce the idea of waiting for an asynchronous result. Avoid unnecessary routing libraries for small sites.

Direct the AI
Build the visitor journey from this project brief. Explain which state changes when the visitor acts. Include labelled inputs and clear loading, success, and error messages. Keep any temporary demonstration behaviour visibly labelled until the real backend is connected.

Check your work
Follow the journey on a phone and with a keyboard. Test missing and long inputs, repeated submission, and an example failure. Confirm a temporary message is not presented as evidence that information was saved.

Practice and deliverable
Submit the interactive frontend and a short diagram showing the information that must travel from the form to the backend.',2,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-4-2','ai-web-2026','daily-lesson-4-2','Wednesday · Create the visitor’s journey — practice','Submit the interactive frontend and a short diagram showing the information that must travel from the form to the backend.',11);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-4-3','daily-module-4','Friday · Understand what happens behind the scenes','Learn how a website receives, checks, and saves information. Create a place to store your website’s information.','Explain frontend, backend, and database roles and create a small data model for your website’s main workflow.','WEEK 4 · FRIDAY
Understand what happens behind the scenes

Tools and concepts
HTTP requests and JSON responses; a Cloudflare Worker API; D1 with SQLite SQL; tables, primary keys, CREATE TABLE, INSERT, and SELECT; bindings and migrations.

In class
Trace browser to API to database and back. Use a guided Worker endpoint and a local D1 database. Model one table such as enquiries or registrations. Practise creating it and inserting/selecting a sample record, then use a Worker binding to access D1. Introduce server validation, prepared SQL statements, and the difference between public form submission and private record access.

Direct the AI
Help me model this one workflow in D1 and create a small Worker API. Explain the table, fields, request, response, and binding. Validate inputs on the server and use prepared statements. Keep submitted personal information out of public list endpoints.

Check your work
Check the schema and expected fields, submit a valid sample locally, and inspect the stored record. Reject invalid input. Confirm credentials never appear in frontend files and that there is no public endpoint exposing private submissions.

Practice and deliverable
Submit your data model, migration, and a locally tested endpoint. Describe any protected access your idea would need before adding a dashboard.',3,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-4-3','ai-web-2026','daily-lesson-4-3','Friday · Understand what happens behind the scenes — practice','Submit your data model, migration, and a locally tested endpoint. Describe any protected access your idea would need before adding a dashboard.',12);
UPDATE weeks SET title='Complete and launch your website',description='Make the whole journey work, publish your website, and connect your chosen domain.' WHERE id='week-5' AND course_id='ai-web-2026';
INSERT INTO modules(id,week_id,title,description,position) VALUES('daily-module-5','week-5','Complete and launch your website','Make the whole journey work, publish your website, and connect your chosen domain.',1);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-5-1','daily-module-5','Monday · Make the whole journey work','Connect your pages to the system behind them so a visitor can submit an enquiry, register for an event, or complete another useful action.','Connect the real frontend and backend so one complete visitor action saves the intended record and returns clear feedback.','WEEK 5 · MONDAY
Make the whole journey work

Tools and concepts
fetch, promises and async/await, JSON, HTTP status codes, React form state, Cloudflare Workers, D1 prepared statements, and server validation.

In class
Connect the frontend form to its Worker API with fetch. Keep frontend and API on the same origin for a simple setup. Validate and store the request, return an appropriate response, and show success only after confirmed server success. Disable repeat submission while a request is pending. Remove temporary demonstrations and fake success paths.

Direct the AI
Connect this frontend to the real Worker endpoint and D1 table. Explain the request and response. Validate on the server, handle failed requests clearly, and show success only after storage succeeds. Do not expose a public list of private submissions.

Check your work
Submit valid and invalid information, inspect D1, test network failure and repeated clicks, and verify the frontend does not show a false success. Apply authentication and authorization before adding any private read or admin feature; keep that outside the initial scope when it is not ready.

Practice and deliverable
Submit evidence of the complete workflow with sample data and a checklist of the cases tested. Remove test personal information before launch.',1,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-5-1','ai-web-2026','daily-lesson-5-1','Monday · Make the whole journey work — practice','Submit evidence of the complete workflow with sample data and a checklist of the cases tested. Remove test personal information before launch.',13);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-5-2','daily-module-5','Wednesday · Put your website online','Set up hosting to make your website available on the internet, then connect your chosen domain name.','Publish the website, connect your chosen available domain, and verify the complete workflow at its public HTTPS address.','WEEK 5 · WEDNESDAY
Put your website online

Tools and concepts
Cloudflare Workers Static Assets, Workers API, D1 database bindings and migrations, production secrets, domain registration, DNS, Worker Custom Domains, and HTTPS.

In class
Build and preview the project, configure the production D1 binding and required secrets, apply its schema migrations, and deploy frontend and backend together. Choose an available domain, explain registration and renewal, and connect it using the registrar/Cloudflare DNS and Custom Domain instructions. Explain DNS propagation, HTTPS, and the difference between a domain and hosting. Keep a working hosted address while domain activation completes.

Direct the AI
Guide me through publishing this project on my Cloudflare account and connecting my chosen domain. Explain each configuration change, use the actual returned resource IDs and DNS instructions, keep secrets private, and give me a verification and rollback checklist.

Check your work
Open the deployed site on a second device, verify HTTPS and the intended host, and submit a sample form against the deployed database. Check redirects and broken links. Domain purchase/renewal, AI subscriptions, and any paid hosting usage are separate costs; explain these before purchase and do not assume domain availability.

Practice and deliverable
Submit the live URL, your connected domain or its documented activation status, and a short deployment guide identifying hosting, database, domain, and renewal responsibilities.',2,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-5-2','ai-web-2026','daily-lesson-5-2','Wednesday · Put your website online — practice','Submit the live URL, your connected domain or its documented activation status, and a short deployment guide identifying hosting, database, domain, and renewal responsibilities.',14);
INSERT INTO lessons(id,module_id,title,description,outcomes,content,position,published) VALUES('daily-lesson-5-3','daily-module-5','Friday · Test, present, and celebrate your launch','Check your website on phones and computers, fix problems, and share it. Review the steps so you can build another.','Present a working website, explain how its pieces fit together, and describe how you would repeat the process for another idea.','WEEK 5 · FRIDAY
Test, present, and celebrate your launch

Tools and concepts
Responsive/browser testing, keyboard accessibility, console and network checks, page titles and descriptions, public indexing basics, README documentation, Git history, and deployment verification.

In class
Test the final visitor journey on phone and desktop, fix the highest-impact issues, and add restrained CSS motion only where helpful. Check page metadata, useful public content, and private-data boundaries. Present the problem, design, backend, database, hosting, and domain. Create a small portfolio page linking to the notes app and final website. Review the full plan-build-check-improve-save-launch process.

Direct the AI
Review my site against the project brief and this launch checklist. Prioritise reproducible problems, explain each proposed change, and help me write a maintenance guide. Ask me to explain how I would build a second website from a new brief.

Check your work
Verify live links, form storage and failure feedback, mobile layout, keyboard access, HTTPS, and the chosen domain. Explain what AI built and what you personally verified. Record remaining work honestly and keep private pages out of search discovery. Search indexing is not guaranteed by publication.

Practice and deliverable
Submit the final website and repository links, a five-minute walkthrough, a maintenance/renewal checklist, and an outline for your next website.',3,1);
INSERT INTO assignments(id,course_id,lesson_id,title,description,position) VALUES('daily-assignment-5-3','ai-web-2026','daily-lesson-5-3','Friday · Test, present, and celebrate your launch — practice','Submit the final website and repository links, a five-minute walkthrough, a maintenance/renewal checklist, and an outline for your next website.',15);
UPDATE site_settings SET value=json_set(value,
  '$.faqs', json((SELECT json_group_array(json(
    CASE json_extract(item.value,'$.question')
      WHEN 'Are classes live?' THEN json_set(item.value,'$.answer','Yes. Classes are on Monday, Wednesday, and Friday, online using Google Meet or Zoom. Class times and joining links will be shared in the student portal once scheduled.')
      WHEN 'Will I need hosting or a domain?' THEN json_set(item.value,'$.answer','We guide you through hosting your website on Cloudflare and connecting your chosen domain name. Domain purchases, renewals, and any paid third-party usage are separate from the course fee.')
      ELSE item.value END)) FROM json_each(site_settings.value,'$.faqs') AS item))
), updated_at=CURRENT_TIMESTAMP WHERE key='website' AND json_type(value,'$.faqs')='array';
