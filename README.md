# Streamathon
A basic streamathon timer for use in a browser overlay

## How to use
1. Download the latest release from the [Releases Tab](https://github.com/NickParks/Streamathon/releases) (click `Source code (zip)`)
2. Extract the `Streamathon-x.x.zip` file to a location you will remember.
3. Open the `config.js` file in a text editor and modify the values to your liking
4. Save the file and exit
5. Open your streaming software and create a browser source with `index.html` from the folder selected.

## In chat commands
Channel Owners and Moderators have commands they can use to modify the timer live through chat.

##### !addtime [amount in seconds]
 This command will add the given amount of seconds to the current time.
 
 Example: `!addtime 60` for adding 60 seconds.
 
 
##### !settime [amount in seconds]
 This command will force set the amount of time on the timer.
 
 Example: `!settime 120` will set the current timer to 2 minutes.
 
 
## Config options
##### Channel name
Make sure to change this to your own channel

##### Seconds per sub
This includes resubscrptions, gifted subs, new subs, etc.

##### Seconds per ember
How many seconds to add *for each single ember*

##### Time format
This is how the time will display on the browser source. Your allowed variables are `%HOURS%`, `%MINUTES%`, and `%SECONDS%`.
