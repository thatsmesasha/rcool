#!/usr/bin/python3
from gpiozero import Servo
from aiy.pins import PIN_A
from aiy.pins import PIN_B
import sys
from threading import Timer

steering = Servo(PIN_A)
speed = Servo(PIN_B)

def drive_forward():
  speed.value = 0.2
  steering.mid()

def drive_right():
  speed.value = 0.2
  steering.min()

def drive_left():
  speed.value = 0.2
  steering.max()

def drive_back():
  speed.value = -0.3
  steering.mid()

def stop():
  speed.value = 0
  steering.mid()

def drive(direction):
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
    print('driving back')
    drive_back()
    Timer(0.05, stop).start()
    Timer(0.1, drive_back).start()

def stop():
  print('stopping')
  speed.value = 0
  steering.mid()

timer = None

print('Waiting for input...')
for direction in sys.stdin:
  direction = direction.replace('\n', '')
  if timer:
    timer.cancel()
  drive(direction)
  timer = Timer(1, stop)
  timer.start()
