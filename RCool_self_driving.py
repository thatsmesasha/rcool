rom picamera import PiCamera
from PIL import Image
import time
from io import BytesIO
from aiy.vision import inference
from aiy.vision.models import utils
import sys, os
import RCool_drive

MODEL_NAME = 'dumb.binaryproto'

labels = ['back', 'forward', 'left', 'right']

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

def start_self_driving():
    model = inference.ModelDescriptor(
        name='mobilenet_160',
        input_shape=(1, 160, 160, 3),
        input_normalizer=(128.0, 128.0),
        compute_graph=utils.load_compute_graph(MODEL_NAME))
    print('Model loaded')
    with PiCamera(sensor_mode=4, resolution=(160, 160), framerate=30) as camera:
        print('Connected to the Pi Camera')
        with inference.CameraInference(model) as inf:
            for result in inf.run():
                direction, probability = process(result)
                RCool_drive.drive(direction)

                print('{:.2f} {} {:.2f}'.format(time.time(), direction, probability))


if __name__ == '__main__':
    start_self_driving()
