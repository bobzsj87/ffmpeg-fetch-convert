This is a simple fetch and convert app using ffmpeg
## param
* from: the from url where the resource is
* inputformat, e.g. mp3
* outputformat, e.g. ogg
* param: additional ffmpeg args separated by ",". e.g. param=-ar,8000,-ac,1

## config
You should change the paths in the config file. 
* dataPath: where you save input and output file
* httpPath: if you use a static file server, you can rewrite the path in the return js

## install libs
make sure ffmpeg is install properly, such as libavcodec-extra-53, libmp3lame, etc...
