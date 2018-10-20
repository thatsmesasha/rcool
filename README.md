## RCool

RCool is a website for interaction with the RC car that is connected to Google Vision Kit. Using this tool you can see the camera output, control the RC car, record images of camera to the raspberry pi for future model training and run already trained model for self-driving.

## Installation

Clone the repository on your Google Vision Kit. Follow instructions below inside this folder. You don't need to do anything on your local machine.

Put your model MODEL.binaryproto (or use dumb.binaryproto) to /opt/aiy/models. If you have different name of the model than dumb.binaryproto, modify the name in RCool_ml.py and RCool_self_driving.py. If you kept name dumb.binaryproto, you don't need to change anything.

Some cars are not well adjusted to drive straign, they drive a bit on the left/right. You will need to adjust value of STEERING_STRAIGHT in the RCool_drive.py script, so your car can drive straight. You can do this by running the website and controlling the car manually to drive forward and see if it drives actually straight or a bit on left/right. Modify the value of this variable until your car driving straight. The default value of this variable was based on my Edison RC car.

#### Self-driving mode

If you want to run just the self-driving mode without server, you don't need to install anything. Just run:
```
python3 RCool_self_driving.py
```

#### Web server

For web server you need to install node. The server was built on node v8.9.0 and npm v5.5.1.

Run:
```
npm install
```

To start the server run:
```
npm start
```

It will output url to access the website, or just go to http://YOUR-GOOGLE-VISION-KIT-IP:4200


#### Errors

If you're getting errors, check if no other demos are running on the Google Vision Kit. Other programs block access to the camera.
