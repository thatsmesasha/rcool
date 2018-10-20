#!/usr/bin/env python3
from PIL import Image
from aiy.vision import inference
from aiy.vision.models import utils
import sys, os
import time

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

def main():
    model = inference.ModelDescriptor(
        name='mobilenet_160',
        input_shape=(1, 160, 160, 3),
        input_normalizer=(128.0, 128.0),
        compute_graph=utils.load_compute_graph('dumb.binaryproto'))
    print('Model loaded')
    with inference.ImageInference(model) as inf:
        print('Model ready')
        print('Waiting for input...')
        sys.stdout.flush()
        for _ in sys.stdin:
            now = time.time()
            img = Image.open('{}/current.jpg'.format(os.getcwd()))
            result = inf.run(img)
            label, probability = process(result)
            print('prediction: {} {} {}'.format(now, label, probability))
            sys.stdout.flush()

if __name__ == '__main__':
    main()
