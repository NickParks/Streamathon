var storedTime = parseInt(0);
var isAnimation = false;

/**
 * Javascript sucks so I have to parseInt the world otherwise it keeps thinking
 *  "0" is a string and it makes me wanna cry
 */

async function start(channel) {
    //Check for saved time
    if (localStorage.getItem("savedTime") != undefined) {
        storedTime = parseInt(localStorage.getItem("savedTime"));
        console.log("Found time: " + parseInt(storedTime));
    }

    //If our query parameter is not the channel ID then query it
    if (isNaN(channel)) {
        let channelIdRequest = await fetch('https://mixer.com/api/v1/channels/' + channel + '?fields=id');
        if (channelIdRequest.status == 404) {
            document.getElementById("curTime").innerHTML = "ERROR: Channel not found";
            return; //Stop code execution
        }

        let channelJson = await channelIdRequest.json();
        console.log(channelJson);

        channel = channelJson.id;
    }

    let response = await fetch('https://mixer.com/api/v1/chats/' + channel);
    let myJson = await response.json();

    let chatEndpoint = myJson.endpoints[0];

    connectToChat(chatEndpoint);

    //Interval to count down timer
    setInterval(() => {
        if (storedTime >= 1) {
            storedTime--;
        }

        if (!isAnimation) {
            document.getElementById("curTime").innerHTML = formatTime(storedTime);
        }
    }, 1000);

    //Interval to auto save time
    setInterval(() => {
        localStorage.setItem("savedTime", storedTime);
    }, 1000 * 5);

    //Add Carina to handle our subscription events
    const ca = new carina.Carina().open();

    ca.subscribe(`channel:${channel}:subscribed`, () => {
        addTime(config.SECONDS_PER_SUB);
    });

    ca.subscribe(`channel:${channel}:resubShared`, () => {
        addTime(config.SECONDS_PER_SUB);
    });

    ca.subscribe(`channel:${channel}:subscriptionGifted`, () => {
        addTime(config.SECONDS_PER_SUB);
    });

    ca.subscribe(`channel:${channel}:skill`, (skill) => {
        if (skill.currencyType == "Embers") {
            let timeToAdd = skill.price * config.SECONDS_PER_EMBER;
            addTime(timeToAdd);
        }
    });
}

/**
 * Connects to the Mixer chat endpoint and begins to listen for chat message events
 *
 * @param {*} endpoint The endpoint
 * @param {*} channel The channel ID
 */
async function connectToChat(endpoint, channel) {
    const chatSocket = new WebSocket(endpoint);

    chatSocket.addEventListener('open', (event) => {
        console.log("Connected to chat socket");
    });

    chatSocket.addEventListener('message', (message) => {
        let parsedMessage = JSON.parse(message.data);

        if (parsedMessage.event == "WelcomeEvent") {
            chatSocket.send(JSON.stringify({
                "type": "method",
                "method": "auth",
                "arguments": [channel],
                "id": 0
            }));
        }

        if (parsedMessage.event == "ChatMessage") {
            //Moderator+ check
            if (parsedMessage.data.user_roles.indexOf('Owner') != -1 || parsedMessage.data.user_roles.indexOf('Moderator') != -1) {
                //Check if it's add command
                if (parsedMessage.data.message.message[0].text.startsWith("!addtime")) {
                    //Parse & add time if it's an int
                    let splitMsg = parsedMessage.data.message.message[0].text.split(" ");
                    let timeToAdd = splitMsg[1];
                    if (isNaN(timeToAdd) == false) {
                        addTime(timeToAdd);
                    }
                }

                //Check if it's set command
                if (parsedMessage.data.message.message[0].text.startsWith("!settime")) {
                    //Parse & set time if it's an int
                    let splitMsg = parsedMessage.data.message.message[0].text.split(" ");
                    let timeToSet = splitMsg[1];
                    if (isNaN(timeToSet) == false) {
                        storedTime = timeToSet;

                        if (isAnimation) {
                            isAnimation = false;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Adds seconds to the stored time variable
 *
 * @param {*} seconds The amount of seconds to add
 */
function addTime(seconds) {
    let prevTime = storedTime;

    storedTime = parseInt(storedTime) + parseInt(seconds);
    localStorage.setItem("savedTime", storedTime);

    //Performs an animation of an upwards "count"
    if (!isAnimation) {
        isAnimation = true;

        let interval = setInterval(() => {
            if (prevTime != storedTime && isAnimation) {
                prevTime++;
                document.getElementById("curTime").innerHTML = formatTime(prevTime);
            } else {
                isAnimation = false; //They're equal so end animation
                clearInterval(interval);
            }
        }, 50);
    }
}

/**
 * Formats seconds to a normal date format
 *
 * @param {*} givenSeconds The amount of seconds to format
 * @returns
 */
function formatTime(givenSeconds) {
    date = Number(givenSeconds);
    let hours = Math.floor(date / 3600);
    let minutes = Math.floor(date % 3600 / 60);
    let seconds = Math.floor(date % 3600 % 60);

    let hourDisplay = hours <= 9 ? "0" + hours : hours;
    let minuteDisplay = minutes <= 9 ? "0" + minutes : minutes;
    let secondDisplay = seconds <= 9 ? "0" + seconds : seconds;

    //Take our config format and replace variables

    let finalTime = config.TIME_FORMAT
        .replace("%HOURS%", hourDisplay)
        .replace("%MINUTES%", minuteDisplay)
        .replace("%SECONDS%", secondDisplay);

    return finalTime;
}

start(config.CHANNEL_NAME);