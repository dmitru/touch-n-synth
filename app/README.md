# Touch'n'Synth
A multitouch-friendly sound synthesizer that runs in your browser. You can play with it here (TODO: deploy and add the link).

> *Warning! The app needs a browser capable of real-time web audio.*

> *At the time of writing, it works best on iPad devices, since they offer both small delay and multitouch interface.*
> *You can use it in recent versions of Chrome and Safari too, but you won't have the multitouch functionality.*

> *On Android devices the high touch-to-play delay makes the app virtually unusable.*

## Build

To build the app for production, execute:
`npm run build`

## Under the hood

For generating sound, the project uses [Theresa's Sound World](http://theresassoundworld.com/). This library is a wrapper around HTML5 WebAudio API and implements many of the lower-level building blocks, such as envelope generators. Overall, it makes for a much better WebAudio development experience, at the same time not abstracting away the underlying basic technology.

For visualization, the project uses [Paper.js](http://paperjs.org/), a powerful vector graphics library.