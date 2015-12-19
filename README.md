# touch-n-synth
A multitouch-friendly sound synthesizer that runs in your browser. You can play with it here (TODO: deploy and add the link).

> *Warning! The app needs a browser capable of real-time web audio. At the time of writing, recent versions of Chrome and Safari (both OSX and iOS > 8.X) were fast enough so that touch-to-play delay is practically unnoticable.*
>
> *For best experience, use the app on an iPad.*

## Build

To build the app for production, execute:
`npm run build`

## Under the hood

The project uses [Theresa's Sound World](http://theresassoundworld.com/) library for generating sound, which itself is a wrapper around HTML5 WebAudio API. 
