# End-to-end training of a neural network to deployment in a live application

## Background
Machine learning (ML) is an increasingly important field in software development and our everyday lives alike, something that is unlikely to change in the near future. However, the process of training models is often quite complex which is one thing this tutorial attempts to somewhat alleviate by making the process more accessible.

The process of deriving machine learning models of high quality usually goes through several steps such as data collection, data preprocessing, construction of model architecture, hyperparameter tuning, model training, and model evaluation, before being deployed in any production environment. To derive optimal (or at least sufficiently good) models different model architectures and different hyperparameters are often evaluated through performing a grid search (evaluating each combination of some set of parameters) or random search. This process is complex, time consuming, very heavy from a computational perspective, and prone to errors, and is often performed by data scientists. Consequently, when developing ML-based software teams of different expertise may have to cooperate.

Commonly, models are trained and evaluated on benchmark datasets in controlled environments. Real world performance and usage of a deployed model may differ significantly from expectations. Furthermore, as time passes new data that may be utilized for training purposes may be collected which require retraining the model (and potentially reevaluating optimal model architecture and hyperparameters). This, along with what is described in the previous paragraph concerning the multidisciplinary approach required, portray the benefits of having a simple way to launch jobs to train and evaluate models and easily rollback to other model versions when developing ML-based software.

Additionally, one may consider the different computation platforms on the market. Google colab is a common such platform, but its free service is time restricted and will arbitrarily cut one off without warning (the paid one does too - but allows greater computational resources). Another obvious alternative is running the process on cloud platforms. As these machines would often be equipped one or several GPUs they tend to be expensive to operate and one would not want them to sit idle given the pay-as-you-go billing. Jupyter Lab (or Jupyter Notebook) is a common software to use for machine learning matters and it is great from many perspective. However, it has one issue that makes it troublesome (still very usable) in this context. As the process is time consuming it is not uncommon to disconnect from the process and leave it running on a dedicated machine in the cloud, but user's cannot revive the Jupyter session after reconnecting and is thus operating in the blind (see: [[1](https://stackoverflow.com/questions/47969937/reconnecting-remote-jupyter-notebook-and-get-current-cell-output), [2](https://stackoverflow.com/questions/63305963/reconnecting-to-jupyter-notebook-loses-output)], etc.). One alternative could be to log to disk. There are some tools on the market that can help alleviate this situation, such as [Weights and Biases](https://wandb.ai/site). However, machine learning models can be sensitive intellectual property and it may not always desirable to trust a third-party cloud based service with the data.

## Motivation
Based on points covered in the background. The proposed solution:

- Provides a relatively easy to use interface for people that may lack familiarity with ML.
- Provides a consistent end-to-end where manual intervention is only required for more advanced use cases (altering dataset, data preprocessing, model architecture, etc.).
- Provides an easy way to rollback.
- Provides easy configuration of hyperparameters space to search through a standardized JSON format.
- Provides the ability to monitor multiple running notebooks and launch jobs remotely in cases where this is desirable.
- Can run locally.

## Limitations
As big parts of this are own scripts (WIP) written during the course time has imposed some restrictions:
- Only works for PyTorch models at the moment.
- The model class definition needs to be available both in the training environment and production environment (not really a limitation).
- Some corner cutting has been taken which may result in some smaller quirks, in particular, a bit less error handling with network connectivity than is desired.
- Relatively small file size for model parameters (10MB?).
- Assumptions are made: categorical classification task - for example, other evaluation criteria options than accuracy may have been reasonable.
- Many other nice-to-have features: queuing jobs, continuous updates during training, visualization of the training process and information such as parameter count per model.
- Plaintext protocols
- (I should not say this! Disregarded a potential race condition).

## Intended learning outcomes
The intended learning outcomes are as follows:
- Learn to utilize Google colab (or at least become familiar with).
- Learn to utilize Jupyter Notebook (or at least become familiar with).
- Understand the importance of MLOps.
- Learn how an image classification model can easily be deployed with the provided tools, and then continuously be kept up to date during its lifetime.
- Bonus: Basic familiarity with ML if that is not already the case.

## Tutorial
This tutorial takes you through the process of training a Convolutional Neural Network (CNN) from scratch including a demo application using it for an image classification task. While there are some ML details, the primary focus is on the DevOps aspect that automates the process from training to deployment.

The following flowchart describes the general process for the ML aspects and then all the way to the actual deployment. The parts colored red are not covered at all in this tutorial as a benchmark dataset is used. The yellow part is very briefly covered in that the data is normalized which is important for performance and stability reasons. The blue parts are the core parts of this tutorial, with the light blue being ML-related and has limited focus, and the dark blue ones being DevOps-related parts.

![image not available](http://35.192.8.77:3001/images/flow.png)

1. __Familiarity__ 

The first step is to familiarize ourselves with the different interfaces:
- [The colab notebook](https://colab.research.google.com/drive/1_Agbydqri4Zo8pbcEOT7-8GhbY1vPXXw?usp=sharing)
- [The model store interface](http://35.192.8.77:3001)
- [The demo web application](http://35.192.8.77:5000)

2. __Register the notebook__

From the colab runtime menu select "Run all" (or click ctrl + f9). After around 30 seconds the notebook will display in the model store interface in green. Click it, and in the jobs panel details about the training process you may launch are displayed (which were originally defined in the notebook just launched).

3. __Configure hyperparameters for the grid search__

See ``sample_conf.json`` of this repository:

```
{
    "EPOCHS": 1,
    "BATCH_SIZE": 10,
    "LEARNING_RATE": [0.001, 0.002],
    "KERNEL_SIZE": [3],
    "NUM_FILTERS": [20],
    "DENSE_WIDTH": [128]
}
```

``EPOCHS`` and ``BATCH_SIZE`` are given as integers. ``LEARNING_RATE``, ``KERNEL_SIZE``, ``NUM_FILTERS``, and ``DENSE_WIDTH`` are given as lists with one or more entries all of integer type except for learning rate which is of type float. The combination of these four properties makes up the hyperparameters space to evaluate. Any property may be omitted with the configuration assuming the previously defined value. Invalid properties are silently ignored.

To touch briefly upon the ML aspects in case the reader is not familiar with the terms. Epochs is the number of times to iterate over the dataset when training. In each epoch the model parameters are updated repeatedly. This is (normally) done by utilizing a small subset of data points and compute the gradient through backpropagation, and then update the model parameters so that the loss is minimized. This number of data points in this small subset of data points is the batch size. Learning rate is by what significance the model parameters should be updated by what was just learned. This is commonly a small number, a larger number would lead to the model learning faster, but also often results in an erratic training process. As this is a CNN it utilizes a kernel to step over the input data performing convolutional operations to learn feature representations. The kernel (filter) consists of learnable parameters. As this is 2d image data, 3 means a 3x3 "box" of learnable paramters (square shape is assumed). The number of filters (channels) for a convolutional layer must match the number of input channels. They are representations of different abstraction levels of the image that the network learns. The dense width is the number of neurons in the fully connected classifier layer. For simplicity (as this is not a ML project), in case there are multiple layers all assume the same configuration.

After you are happy with the configuration, simply drop the json file in the light brown box and see how the configuration updates.

4. __Launch the job__

Simply click the button below the grid-search configuration. If you have the notebook open you can see how it starts running the training process.

5. __Automatic deployment__

If the model achieves higher test accuracy than the currently deployed model it will automatically be deployed to the demo application. This can easily be verified by going to the demo application as the sha1 hash of the model parameters is also displayed there. The model is hot-reloaded, and the update is pushed to the client, but you may have to refresh the page in case the connection has dropped (the backend logic uses the updated parameters either way). Note, the automatic compares to the deployed model, so if there is a model with 40% test accuracy in the store, but one with 20% test accuracy has been rolled back to, and a new one with 30% test accuracy comes in, then it will deploy the 30% test accuracy model as it is better than the currently deployed model. The "best" model has previously been actively declined. If want to clear out the model store you can simply click the button in the panel that is there for demo purposes. Another alternative could be to select some low accuracy model and it will start automatically start to deploy better models again.

6. __Rollback__

Once there are multiple models in the model store there will be one or multiple jobs in the models panel. Click one of the jobs, click one of the models it contain, and simply click the deploy button. Again, this can be confirmed by simply going to the demo application viewing the the sha1 hashes matches (again, may have to refresh).

7. __Play around__

The demo application can be played around with by dropping images in the box. A couple of notes. There no spinner or similar saying the application is busy processing the image. Instead, once it is done the array of classes (cat, dog, ship, etc.) is substituted for a phrase suggesting the model output for a five seconds before showing the class array again, and is then ready to process other images. The machine running the applications is weak so while the model accepts images of arbitrary dimensions the processing may be slow as well as the fact that it is a simple model architecture that is only trained on 16x16 cifar10 dataset so the performance may not be great. It may be a good idea to just use some [original cifar10 images](https://github.com/YoongiKim/CIFAR-10-images).

### Technical details
To briefly describe the code of the colab notebook. The first cell is simply imports of modules. The second cell defines variables hostname, name, hyperparameters, and some helper variables. The number of hyperparameters (`CONF_OBJ`) could have been extended but the primary focus are DevOps aspects and not ML, and these are some common ones. `NOTEBOOK_ID` may be altered and is simply the name of the notebook in the model store interface. In case of name collisions a random integer (0-99) name is assigned. None of the other cells should for the demo sake be altered. The third cell handles data preprocessing and splits the dataset, the fourth cell is a helper network class, the fifth cell the neural network class definition, and the sixth cell the train/test loop function definitions. The seventh, eigth, and nineth cell establishes a network connection, registers the notebook and launches a worker thread.

On the backend the demo application is notified via sockets when a new model is to be hot-reloaded, but it could have been some other means of communication like REST api.

In case of some minor GUI quirk refreshing the browser probably solves it. In case of some connectivity issue from colab restarting the runtime and running the notebook book again likely solves the issue (from the runtime menu restart and run all, or ctrl + m then ctrl + f9).

## What's for breakfast?
Coffee? Bacon? Eggs? You tell me.