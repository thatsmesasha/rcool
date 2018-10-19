## RCool

RCool is a website for interaction with the RC car that is connected to Google Vision Kit. Using this tool you can see the camera output, control the RC car, record images of camera to the raspberry pi for future model training and run already trained model for self-driving.

## Installation

You need to install node. The server was built on node v8.9.0 and npm v5.5.1

Clone the repository. Run:
```
npm install
```

To start the server run:
```
npm start
```

It will output url to access the website, or just go to http://YOUR-GOOGLE-VISION-KIT-IP:4200

If you're getting errors while starting the server, check if no other demos are running on the Google Vision Kit. Other programs may block access to the camera too.
