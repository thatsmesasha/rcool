#!/usr/bin/python3
from gpiozero import Servo
from aiy.pins import PIN_A
from aiy.pins import PIN_B
import sys
from threading import Timer

steering = Servo(PIN_A)
speed = Servo(PIN_B)

DRIVE_FORWARD_SPEED = 0.05
DRIVE_BACK_SPEED = -0.05
STEERING_STRAIGHT = 0

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
  print('stopping')
    speed.value = 0
    steering.value = STEERING_STRAIGHT

def _drive(direction):
    if direction == 'forward':
        print('driving forward')
        drive_forward()
    elif direction == 'right':
        print('driving right')
        drive_right()
    elif direction == 'left':
        print('driving left')
        drive_left()
    elif direction == 'back':
        drive_back()
        Timer(0.05, stop).start()
        print('driving back')
        Timer(0.1, drive_back).start()

timer = None

def drive(direction):
    global timer

    if timer:
        timer.cancel()
    _drive(direction)
    timer = Timer(1, stop)
    timer.start()

if __name__ == '__main__':
    print('Waiting for input...')
    for direction in sys.stdin:
        direction = direction.replace('\n', '')
        drive(direction)
