-- claude-reels browser controller.
-- Usage: osascript control.applescript <browser> <action> [url]
--   browser : chrome | safari   (chromium forks like brave/arc behave like chrome)
--   action  : open | play | pause | front | is-reels-front | check
--   url     : reels url, only used by `open`
--
-- Pause/play work by injecting JS into the Instagram tab's <video> element, so
-- they do not require the browser to be focused. `play`/`front` also bring the
-- reels tab to the foreground. `is-reels-front` reports whether the user is
-- currently looking at the reels tab (used by the strict-mode focus lock).

on run argv
	if (count of argv) < 2 then return "usage"
	set theBrowser to item 1 of argv
	set theAction to item 2 of argv
	set theURL to ""
	if (count of argv) > 2 then set theURL to item 3 of argv

	-- Pause every <video> on the page.
	set pauseJS to "(function(){var v=document.querySelectorAll('video');for(var i=0;i<v.length;i++){try{v[i].pause();}catch(e){}}return v.length;})();"
	-- Play the <video> most visible in the viewport (the reel you are watching).
	set playJS to "(function(){var v=document.querySelectorAll('video');if(!v.length)return 'none';var h=window.innerHeight,best=v[0],bs=-1;for(var i=0;i<v.length;i++){var r=v[i].getBoundingClientRect();var vis=Math.max(0,Math.min(r.bottom,h)-Math.max(r.top,0));if(vis>bs){bs=vis;best=v[i];}}try{best.play();}catch(e){return 'blocked';}return 'play';})();"

	if theBrowser is "safari" then
		return safariControl(theAction, theURL, pauseJS, playJS)
	else
		return chromeControl(theBrowser, theAction, theURL, pauseJS, playJS)
	end if
end run

-- Map our short browser id to the macOS application name for Chromium browsers.
on chromeAppName(theBrowser)
	if theBrowser is "brave" then return "Brave Browser"
	if theBrowser is "edge" then return "Microsoft Edge"
	return "Google Chrome"
end chromeAppName

on chromeControl(theBrowser, theAction, theURL, pauseJS, playJS)
	set appName to chromeAppName(theBrowser)

	if theAction is "is-reels-front" then
		tell application "System Events"
			set frontApp to name of first application process whose frontmost is true
		end tell
		if frontApp is not appName then return "no"
		using terms from application "Google Chrome"
			tell application appName
				try
					set u to URL of active tab of front window
				on error
					return "no"
				end try
			end tell
		end using terms from
		if u contains "instagram.com" then return "yes"
		return "no"
	end if

	-- Everything below talks to the browser; bail if it is not open (open starts it).
	if not (application appName is running) and theAction is not "open" then return "notrunning"

	using terms from application "Google Chrome"
	tell application appName
		if theAction is "open" then
			activate
			if (count of windows) is 0 then
				make new window
			end if
			set hasIG to false
			repeat with w in windows
				repeat with t in tabs of w
					if (URL of t) contains "instagram.com" then set hasIG to true
				end repeat
			end repeat
			if not hasIG then
				tell window 1 to make new tab with properties {URL:theURL}
			end if
			return "open"

		else if theAction is "pause" then
			repeat with w in windows
				repeat with t in tabs of w
					try
						if (URL of t) contains "instagram.com" then execute javascript pauseJS in t
					end try
				end repeat
			end repeat
			return "pause"

		else if theAction is "play" or theAction is "front" then
			set didIt to "noig"
			repeat with wi from 1 to (count of windows)
				set w to item wi of windows
				set ti to 0
				repeat with t in tabs of w
					set ti to ti + 1
					if (URL of t) contains "instagram.com" then
						try
							set active tab index of w to ti
							set index of w to 1
						end try
						if theAction is "play" then
							try
								execute javascript playJS in t
							end try
						end if
						set didIt to "ok"
					end if
				end repeat
			end repeat
			activate
			return didIt

		else if theAction is "check" then
			set checkJS to "1+1"
			try
				set ft to active tab of front window
				set r to execute javascript checkJS in ft
				return "js-ok"
			on error errMsg
				return "js-blocked"
			end try
		end if
	end tell
	end using terms from
	return "noop"
end chromeControl

on safariControl(theAction, theURL, pauseJS, playJS)
	if theAction is "is-reels-front" then
		tell application "System Events"
			set frontApp to name of first application process whose frontmost is true
		end tell
		if frontApp is not "Safari" then return "no"
		tell application "Safari"
			try
				set u to URL of current tab of front window
			on error
				return "no"
			end try
		end tell
		if u contains "instagram.com" then return "yes"
		return "no"
	end if

	if not (application "Safari" is running) and theAction is not "open" then return "notrunning"

	tell application "Safari"
		if theAction is "open" then
			activate
			if (count of windows) is 0 then make new document
			set hasIG to false
			repeat with w in windows
				repeat with t in tabs of w
					if (URL of t) contains "instagram.com" then set hasIG to true
				end repeat
			end repeat
			if not hasIG then
				tell front window to set current tab to (make new tab with properties {URL:theURL})
			end if
			return "open"

		else if theAction is "pause" then
			repeat with w in windows
				repeat with t in tabs of w
					try
						if (URL of t) contains "instagram.com" then do JavaScript pauseJS in t
					end try
				end repeat
			end repeat
			return "pause"

		else if theAction is "play" or theAction is "front" then
			set didIt to "noig"
			repeat with w in windows
				repeat with t in tabs of w
					if (URL of t) contains "instagram.com" then
						try
							set current tab of w to t
							set index of w to 1
						end try
						if theAction is "play" then
							try
								do JavaScript playJS in t
							end try
						end if
						set didIt to "ok"
					end if
				end repeat
			end repeat
			activate
			return didIt

		else if theAction is "check" then
			set checkJS to "1+1"
			try
				set ft to current tab of front window
				do JavaScript checkJS in ft
				return "js-ok"
			on error
				return "js-blocked"
			end try
		end if
	end tell
	return "noop"
end safariControl
