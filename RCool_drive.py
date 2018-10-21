#!/usr/bin/python3
from gpiozero import Servo
from aiy.pins import PIN_A
from aiy.pins import PIN_B
import sys
from threading import Timer

steering = Servo(PIN_A)
speed = Servo(PIN_B)

DRIVE_FORWARD_SPEED = 0.2
DRIVE_BACK_SPEED = -0.3
STEERING_STRAIGHT = -0.17

last_back = False

def drive_forward():
    speed.value = DRIVE_FORWARD_SPEED
    steering.value = STEERING_STRAIGHT

def drive_right():
    speed.value = DRIVE_FORWARD_SPEED
    steering.min()

def drive_left():
    speed.value = DRIVE_FORWARD_SPEED
    steering.max()

def drive_back():
    speed.value = DRIVE_BACK_SPEED
    steering.value = STEERING_STRAIGHT

def stop():
    speed.value = 0
    steering.value = STEERING_STRAIGHT

def _drive(direction):
    global last_back

    if direction == 'forward':
        last_back = False
        print('driving forward')
        drive_forward()
    elif direction == 'right':
        last_back = False
        print('driving right')
        drive_right()
    elif direction == 'left':
        last_back = False
        print('driving left')
        drive_left()
    elif direction == 'back':
        if last_back:
            print('driving back')
            drive_back()
        else:
            print('stopping')
            drive_back()
            Timer(0.05, stop).start()
        last_back = True
    elif direction == 'stop':
        print('stopping')
        stop()

timer = None

def drive(direction):
    global timer

    if timer:
        timer.cancel()
    _drive(direction)
    timer = Timer(0.5, lambda: _drive('stop'))
    timer.start()

if __name__ == '__main__':
    print('Waiting for input...')
    sys.stdout.flush()
    for direction in sys.stdin:
        direction = direction.replace('\n', '')
        drive(direction)
