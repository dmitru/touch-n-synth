# Touch'n'Synth
A multitouch-friendly sound synthesizer that runs in your browser. You can play with it [here](http://dmitru.github.io/touch-n-synth/). 

> *The app needs a browser capable of real-time web audio.*

> *Among mobile devices, it works best on iPads (at the time of writing), since they offer both small delay and multitouch interface.*
> *On Android devices beware of the usually higher touch-to-play delay.*

> *On desktop, it works in any recent Chrome or Safari.*

## Build

To build the app for production, execute:
`npm run build`

## Under the hood

For generating sound, the project uses [Theresa's Sound World](http://theresassoundworld.com/). This library is a wrapper around HTML5 WebAudio API and implements many of the lower-level building blocks, such as envelope generators. Overall, it makes for a much better WebAudio development experience, at the same time not abstracting away the underlying basic technology.

For visualization, the project uses [Paper.js](http://paperjs.org/), a powerful vector graphics library.
