#!/usr/bin/python3
from gpiozero import Servo
from aiy.pins import PIN_A
from aiy.pins import PIN_B
import sys
from threading import Timer

steering = Servo(PIN_A)
speed = Servo(PIN_B)

def drive(direction):
  if direction == 'forward':
    print('driving forward')
    speed.value = 0.2
    steering.mid()
  elif direction == 'right':
    print('driving right')
    speed.value = 0.2
    steering.max()
  elif direction == 'left':
    print('driving left')
    speed.value = 0.2
    steering.min()
  elif direction == 'back':
    print('driving back')
    speed.value = -0.3
    steering.mid()

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
