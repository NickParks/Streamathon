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
    var ca = new carina.Carina().open();
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
 */
async function connectToChat(endpoint) {
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
                "arguments": [774],
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
    var hours = Math.floor(date / 3600);
    var minutes = Math.floor(date % 3600 / 60);
    var seconds = Math.floor(date % 3600 % 60);

    var hourDisplay = hours <= 9 ? "0" + hours : hours;
    var minuteDisplay = minutes <= 9 ? "0" + minutes : minutes;
    var secondDisplay = seconds <= 9 ? "0" + seconds : seconds;

    return hourDisplay + ":" + minuteDisplay + ":" + secondDisplay;
}

start(config.CHANNEL_NAME);