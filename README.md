*SearchAssist v1.02*
by Hugo Huurdeman, 2016-02-01

*description*
SearchAssist is an experimental search engine, which uses the Bing API to show a search user interface in the style of large search engines. It logs user interactions, and mouse movements, that can be easily combined with eye tracking data. It allows users to perform 'natural' search behavior, e.g. the ability to open results in multiple browser tabs. 
SearchAssist has been used for performing a lab-based user study for the paper "Active and Passive Utility of Search Interface Features in Different Information Seeking Stages", published at CHIIR 2016. It has not yet been utilized nor optimized for online user studies.

SearchAssist includes various features:

--left panel
-a feature to filter results (based on categories derived from DMOZ.org),
-a feature that shows a tag cloud, which allows user to add results
-a feature which shows search suggestions from the Bing Query suggestions API
--middle panel
-a feature to enter queries
-a feature to show query corrections suggested by the Bing API
-a feature to show results
-a feature to change the results page
--right panel
-a feature to show previous queries
-a feature to show and organize previously saved results
--bottom panel
-task related features: show the current task description, go back to the previous task (if applicable), finish the current task

*requirements*
-a license key from the Bing API (free up to 10,000 results per month)
-a local MySQL and PHP installation (e.g. via XAMPP)
-the Chrome/Chromium browser (the application may also work in other browsers, but those are untested)
-currently, the application is optimized for a 1280x1024 screen. By editing the associated CSS file this can be adapted to other screen sizes

*installation*
-add the files to a directory in your local webserver (e.g. XAMPP/htdocs)
-create a MySQL database called 'searchassist' and tables via the scripts available in the sql/ directory
-open the Chromium browser and browse to (e.g.) localhost/searchassist/search.php
-make sure the subdirectories of logging/ are writeable from php

*configuration*
-in settings/task.js:
--enter the number of tasks that you would like to use
var NUMBER_OF_TASKS=2;
--enter the task description for each user task, comma separated. This can e.g. be a URL to an offline or online text file (e.g. a Google Doc).
var TASK_DESCR_ARR=['https://docs.google.com/document/d/task1/edit','https://docs.google.com/document/d/task2/edit'];
-in settings/user.js:
--set the id of the current user (used in the logging)
var CURRENT_USER='TestUser';
-the post-task-screen/ directory contains the plain HTML pages users see after finishing their task. These can be customized to include e.g. (links to) questionnaires.

*logging*
The following files are cached and logged:
-query-suggestions: cached query suggestions in their original json format
-query-corrections: cached query corrections in their original json format
-query-results: cached results from queries in their original json format
-log4javascript: main system logging in the following format (tab-separated): 
[date]	[timestamp]	[timestamp(ms)]	[userId]	[task]	[action]		[value]
It is possible to integrate these logs with logs captured using PyTribe (an eye tracking framework). A customized version of this framework will be made available at a later stage.

*possible issues*
-this search system has only been tested on Mac OS X Yosemite 10.10.5, hence issues may arise on other systems.
-a very minor number of query suggestions may include single quotes (e.g. "Blackbeard's ship"). When clicking on those, the results do not appear.
-The [task] value in the system logs is 0 when uninitialized.