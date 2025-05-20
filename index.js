/* *********************************************
 * Echobot: A Simple Bot Example for Slack
 *
 * Tomomi Imura (@girlie_mac)
 * Modified for Vercel deployment
 * *********************************************/

/* Slack App setup
 * Slash Command
 * Enable Bot user
 * Scopes: "commands" (slash command) & "users:read" (to get a user's name)
 *
 */

"use strict";

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/public"));

// Store tokens in memory (for demo purposes)
// In production, you should use a proper database
const tokenStorage = new Map();

let apiUrl = "https://slack.com/api";

/* *******************************
/* Slash Command
/* ***************************** */

app.post("/echo", (req, res) => {
  if (req.body.token !== process.env.SLACK_VERIFICATION_TOKEN) {
    res.sendStatus(401);
    return;
  } else {
    getReply(req.body).then((result) => {
      res.json(result);
    });
  }
});

// User info
const getUserFullname = async (team, user) => {
  try {
    const oauthToken = tokenStorage.get(team);
    if (!oauthToken) return "The user";

    const response = await axios.post(
      "https://slack.com/api/users.info",
      null,
      {
        params: { token: oauthToken, user: user },
      }
    );

    if (response.data && response.data.ok) {
      return response.data.user.real_name;
    }
    return "The user";
  } catch (error) {
    console.error("Error fetching user info:", error);
    return "The user";
  }
};

// Reply in JSON
const getReply = (body) =>
  new Promise((resolve, reject) => {
    let data = {};
    if (body.text) {
      getUserFullname(body.team_id, body.user_id)
        .then((result) => {
          data = {
            response_type: "in_channel", // public to the channle
            text: result + " said",
            attachments: [
              {
                text: body.text,
              },
            ],
          };
          return resolve(data);
        })
        .catch(console.error);
    } else {
      // no query entered
      data = {
        response_type: "ephemeral", // private message
        text: "How to use /echo command:",
        attachments: [
          {
            text: "Type some text after the command, e.g. `/echo hello`",
          },
        ],
      };
      return resolve(data);
    }
  });

/* *******************************
/* OAuth
/* implement when distributing the bot
/* ***************************** */

app.get("/auth", async function (req, res) {
  if (!req.query.code) {
    console.log("Access denied");
    return res.sendStatus(400);
  }

  try {
    const response = await axios.post(apiUrl + "/oauth.access", null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: req.query.code,
      },
    });

    if (response.data && response.data.ok) {
      // Store the token in memory
      tokenStorage.set(response.data.team_id, response.data.access_token);
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  } catch (error) {
    console.error("OAuth error:", error);
    res.sendStatus(500);
  }
});

/* Extra */

app.get("/team/:id", function (req, res) {
  try {
    const id = req.params.id;
    const token = tokenStorage.get(id);

    if (!token) {
      return res.sendStatus(404);
    }

    res.send({
      team_id: id,
      token: token,
    });
  } catch (e) {
    res.sendStatus(404);
  }
});

// Export the Express app for Vercel
module.exports = app;
