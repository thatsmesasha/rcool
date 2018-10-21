from picamera import PiCamera
from PIL import Image
import time
from io import BytesIO
from aiy.vision import inference
from aiy.vision.models import utils
import sys, os
import numpy as np
import threading

MODEL_NAME = 'dumb.binaryproto'

labels = ['back', 'forward', 'left', 'right']

on = False

def process(result):
    """Processes inference result and returns labels sorted by confidence."""
    assert len(result.tensors) == 1
    tensor = result.tensors['final_result']
    probs, shape = tensor.data, tensor.shape
    assert shape.depth == len(labels)
    #0.1 is a threshold, if the score is less then that confidence level is to low
    pairs = [pair for pair in enumerate(probs) if pair[1] > 0.1]
    pairs = sorted(pairs, key=lambda pair: pair[1], reverse=True)
    return labels[pairs[0][0]], pairs[0][1]

def capture(camera):
    while True:
        output = np.empty((160 * 160 * 3,), dtype=np.uint8)
        camera.capture(output, 'rgb')
        output = output.reshape((160, 160, 3))
        image = Image.fromarray(output)
        image.save('current.jpg')

def on_off():
    global on
    for line in sys.stdin:
        line = line.replace('\n', '')
        if line == 'on':
            on = True
        elif line == 'off':
            on = False

def start_self_driving():
    global on
    model = inference.ModelDescriptor(
        name='mobilenet_160',
        input_shape=(1, 160, 160, 3),
        input_normalizer=(128.0, 128.0),
        compute_graph=utils.load_compute_graph(MODEL_NAME))
    with PiCamera(sensor_mode=4, resolution=(160, 160), framerate=30) as camera:
        camera_thread = threading.Thread(target=capture, args=(camera,))
        camera_thread.daemon = True
        camera_thread.start()

        with inference.CameraInference(model) as inf:
            print('Model is ready. Type on/off to start/stop self-driving')
            sys.stdout.flush()

            on_off_thread = threading.Thread(target=on_off, args=())
            on_off_thread.daemon = True
            on_off_thread.start()
            for result in inf.run():
                if on:
                    direction, probability = process(result)
                    print('prediction: {:.2f} {} {:.2f}'.format(time.time(), direction, probability))
                    sys.stdout.flush()


if __name__ == '__main__':
    start_self_driving()
