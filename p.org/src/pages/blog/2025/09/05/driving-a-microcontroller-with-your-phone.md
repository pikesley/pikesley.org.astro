---
publish: true
layout: ../../../../../layouts/BlogPost.astro
title: Driving a microcontroller from your phone
description: With MicroPython and vanilla JavaScript

mastodon:
  toot: "115158647100055335"
---
_Using MicroPython and some (shonky) JavaScript_

> Disclaimer before we begin: the JavaScript stuff works on Chrome for OSX and Android. I'm led to understand that it won't work on an iPhone, and it definitely doesn't work on Chromium on Mint

I got some [ESP32-C3s](https://www.espressif.com/en/products/socs/esp32-c3) for a couple of [NeoPixel](https://thepihut.com/collections/adafruit-neopixels) projects, but once I'd got them doing what I needed with the LEDs, I started wondering if I might be able to do anything fun with the on-board [Bluetooth Low Energy](https://en.wikipedia.org/wiki/Bluetooth_Low_Energy) modules.

I found various tutorials and blogposts but nothing really comprehensive, so this is an attempt to present a complete, end-to-end prototype.

And it turns out it's all actually much easier than I expected.

## The microcontroller side

This is all done using [MicroPython](https://micropython.org/). I started with [this tutorial](https://randomnerdtutorials.com/micropython-esp32-bluetooth-low-energy-ble/) where I made futile attempts to understand GATTs and Characteristics and so on, and I was eventually able to feign enough knowledge to whittle the code down to this:

```python
import asyncio

import aioble
import bluetooth

bluetooth_uuids = {
    "service": "this-is-a-fake-uuid-and-it-wont-work",
    "parameter": "this-one-also-is-phony-and-wont-work",
}

ble_service_uuid = bluetooth.UUID(bluetooth_uuids["service"])
ble_parameter_uuid = bluetooth.UUID(bluetooth_uuids["parameter"])
device_name = "Dummy device"

adv_interval = 25_000

ble_service = aioble.Service(ble_service_uuid)
parameter_write_characteristic = aioble.Characteristic(
    ble_service, ble_parameter_uuid, read=True, write=True, notify=True, capture=True
)

async def await_connection():
    """Await connection."""
    print("Bluetooth commencing")

    while True:
        try:
            async with await aioble.advertise(
                adv_interval,
                name=device_name,
                services=[ble_service_uuid],
            ) as connection:
                print("Connection from", connection.device)
                await connection.disconnected()

        except asyncio.CancelledError:
            print("Peripheral task cancelled")

        except Exception as e:  # noqa: BLE001
            print("Error in peripheral_task:", e)

        finally:
            # Ensure the loop continues to the next iteration
            await asyncio.sleep_ms(100)


async def wait_for_write():
    """Receive data on the `parameter` characteristic."""
    while True:
        try:
            _, data = await parameter_write_characteristic.written()
            data = data.decode()
            do_something_with_this(data)

        except asyncio.CancelledError:
            print("Peripheral task cancelled")

        except Exception as e:  # noqa: BLE001
            print("Error in peripheral_task:", e)

        finally:
            # Ensure the loop continues to the next iteration
            await asyncio.sleep_ms(100)


def do_something_with_this(data):
    """Do something interesting here."""
    print(f"Received data: `{data}`. You can now do something with this")


async def main():
    """Run."""
    tasks = [
        asyncio.create_task(await_connection()),
        asyncio.create_task(wait_for_write()),
    ]
    await asyncio.gather(*tasks)


aioble.register_services(ble_service)
asyncio.run(main())
```

### What's going on here?

I'm not going to explain all of this here (because I don't really understand some of it), but I do have some notes (mostly derived from things that bit me along the way):

#### Use real UUIDs

I had (naively) assumed that I could use any old random strings for those identifiers, but no, it turns out we need real UUIDs. They're [readily available though](https://www.uuidgenerator.net/).

#### `asyncio`

We're using `aioble`, an ["asyncio-based wrapper for MicroPython's bluetooth API"](https://github.com/micropython/micropython-lib/blob/master/micropython/bluetooth/aioble/README.md), so we have do everything with `asyncio`, and pretend to understand `async` and `await` and all that. It's fine, it works.

#### Parameters

The naming around all this stuff is confusing (at least to me). I think _maybe_ the _parameter_ for which we're expecting data is actually a _Characteristic_ in this context, but these terms seem overloaded in bewildering ways.

The point here really, though, is that if we want to advertise multiple "parameters", we need a distinct `wait_for_write()` method (and a corresponding `task`) for each one. I think.

### Running it

You'll need [aioble](https://github.com/micropython/micropython-lib/tree/master/micropython/bluetooth/aioble) installed on your device. [Some MicroPython distributions](https://github.com/pimoroni/pimoroni-pico-rp2350) have it already bundled but if yours doesn't, you can easily get it with `mip`:

```
python -m mpremote mip install aioble
```

> This also presumes you have [`mpremote`](https://docs.micropython.org/en/latest/reference/mpremote.html) working but if you're reading this, I guess you probably do

If you can connect to your device and run:

```python
>>> import aioble
```

without any errors then you're good to go.

So save this code as `main.py`, then push it to your device:

```
python -m mpremote cp -r main.py :
```

Then connect:

```
python -m mpremote
```

And `ctrl-D`, and you should see something like this:

```python
MPY: soft reboot
Bluetooth commencing
```

and then... nothing. Next, we need a Client.

> Actually, to get this far, I was testing with [nRF Connect](https://www.nordicsemi.com/Products/Development-tools/nRF-Connect-for-mobile), which is a really handy tool, but this blogpost is here to get us past the need for that

## Pretending to be good at JavaScript

Chrome has [built-in Bluetooth support](https://support.google.com/chrome/answer/6362090), we just need to know the right JavaScript magic spells. I battled with this for a while (JavaScript isn't really my thing), and what I came up with can be reduced to something like this:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>Bluetooth Controller Demo</title>
  </head>

  <body>
    <h1>Bluetooth Controller Demo</h1>

    <div id="buttons">
      <button data-value="A">A</button>
      <button data-value="B">B</button>
      <button data-value="C">C</button>
    </div>

    <script>
      bluetooth_uuids = {
        "service": "this-is-a-fake-uuid-and-it-wont-work",
        "parameter": "this-one-also-is-phony-and-wont-work",
      }

      const buttons = document.getElementById("buttons");

      Array.from(buttons.children).forEach(function (button) {
        makeButton(button);
      });

      function makeButton(button) {
        const value = button.dataset.value;

        button.addEventListener("pointerup", function (event) {
          navigator.bluetooth
            .requestDevice({
              filters: [
                {
                  services: [bluetooth_uuids.service],
                },
              ],
            })
            .then(function (device) {
              return device.gatt.connect();
            })
            .then(function (server) {
              return server.getPrimaryService(bluetooth_uuids.service);
            })
            .then(function (service) {
              return service.getCharacteristic(bluetooth_uuids.parameter);
            })
            .then(function (characteristic) {
              console.log("Sending data: " + value);
              characteristic.writeValue(new TextEncoder().encode(value));
            })
            .catch((error) => {
              console.error(error);
            });
        });
      }
    </script>
  </body>
</html>
```

### How does this work then?

Again, just some notes:

#### UUIDs

In case it's not clear, the `bluetooth_uuids` need to be the same ones from the Python script. And they need to be real UUIDs.

#### Event types

The `EventListener` only works with [a specific list of event types](https://developer.chrome.com/docs/capabilities/bluetooth#user_gesture_required). I got bitten by this when attempting to add a listener to a [range slider](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/range) with an event-type of `change`, which gave me a very shitty message in the console.

### Running it

The easiest way to run this locally is to paste it as `index.html` somewhere, then in that directory do

```
python -m http.server
```

and then go to [http://localhost:8000](http://localhost:8000).

Now open the JavaScript console, and presuming your microcontroller is still running somewhere, click one of the buttons. You should get a "localhost:8000 wants to pair" popup, with a single-item list containing your device. Pair with the device, and you should see something like

```
Sending data: B
```

in the console.

And then the output from the controller should have something like:

```
Connection from Device(ADDR_PUBLIC, 00:00:00:00:00:00, CONNECTED)
Received data: `B`. You can now do something with this
```

Congratulations, you've just sent some data from your browser to your microcontroller over BLE. I hope this has just sparked a whole load of ideas.

### Actually running it

Running it off your laptop is all very well, but that doesn't really translate to the real world, where you probably want to drive this with your phone. Fortunately you can get free, SSL-enabled static hosting on [Netlify](https://www.netlify.com/). Just drag-and-drop a folder containing your HTML/CSS/JavaScript and you're all set.

## Notes

* I've had this same code running on various ESP32 boards, and some [BLE-equipped RasPi Pico boards](https://shop.pimoroni.com/products/pimoroni-pico-plus-2-w?variant=42182811942995). I imagine it'll work wherever you can run `aioble`.

* Beware of cheap ESP32s off of eBay, the wifi / bluetooth hardware seems to be very flaky.

* Absolutely *no* fucking AI hallucination theft bullshit was involved in any of this at any stage.
