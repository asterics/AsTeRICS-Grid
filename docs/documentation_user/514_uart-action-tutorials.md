# UART action tutorials

Subsequently, you will find tutorials of how to use the UART action.

## Remote control (Infrared)

The following tutorial explains, how to create a remote control for a TV by sending Infrared commands to the Open Source microcontroller [Puck.js](https://www.puck-js.com/), which supports emitting infrared light codes out of the box. The commands can be directly copied from [puckmote](https://asterics.github.io/puckmote/) (online remote control database).

![image](https://github.com/asterics/AsTeRICS-Grid/assets/4621810/ebfbca0d-6647-49e9-9f30-b898ca111659)

*Fig. 1: Pasting infrared command into action field and try out of command.*

1. Get a [Puck.js](https://www.puck-js.com) device (**not Puck.js Lite**) from the [official shop](https://shop.espruino.com/puckjs) or [another distributor](http://www.espruino.com/Order).
2. Follow the [Puck.js Getting Started Guide](https://www.espruino.com/Quick+Start+BLE#puckjs)
3. Enable Bluetooth on your host device
4. Check if your device is contained in the [puckmote database](https://asterics.github.io/puckmote/).
5. Test infrared command of choice, e.g. click on ```Power On``` or ```On```.
6. Copy the ```Puck.IR(....);\n``` command.
7. Turn on ```Editing mode```
8. Edit cell and got to ```Actions``` tab
9. Select ```UART action```
10. Paste copied ```Puck.IR(....);\n``` command into the field ```command string```.
11. Click on ```OK``` to save the action.
12. Turn off ```Editing mode```

::: tip
You can actually send any Javascript command supported by the Puck.js device, see [Puck.js API Documentation](https://www.espruino.com/Puck.js).
:::

## Accessible toy

The following tutorial explains, how to create an accessible battery-powered toy (e.g. disco light, soap bubble machine or duplo train). The [Puck.js](https://www.puck-js.com/) device contains an on-board FET (transistor) and allows you to control medium current devices (up to 200mA) directly from Puck.js, without external components (see [Puck.js+FET tutorial](https://www.espruino.com/Puck.js+FET)).

![AG-puckjs-accessible-toy-FET-action-small](https://github.com/asterics/AsTeRICS-Grid/assets/4621810/136c33c3-027f-40ad-b2b7-bad928901f34)

*Fig 2: Demo of accessible disco light toy.*

1. Get a [Puck.js](https://www.puck-js.com) device (**not Puck.js Lite**) from the [official shop](https://shop.espruino.com/puckjs) or [another distributor](http://www.espruino.com/Order).
2. Get a battery-powered toy. (**The battery voltage must be below 20V**).
3. [Create a battery-interruptor DIY](https://www.upstate.edu/specialneeds/pdf/inclusive/2021_family-fun-series_create-your-own-battery-interrupter.pdf) and insert it at the flat side of the battery (see Fig 3). For our example keep the wires open ended and don't solder the audio socket onto them. 
5. Connect the negative pole of the battery ```N1``` to the ```GND``` pin of the Puck.js device (see Fig. 4).
6. Connect the positive pole of the battery ```P1```to the ```FET```of the Puck.js device (see Fig. 4).
7. Turn on the on/off switch of the toy (if there is one).
8. Now the toy is ready to be switched by the transistor of the Puck.js device.
9. Open a grid and turn on ```Editing mode```
10. Edit cell and got to ```Actions``` tab
11. Select ```UART action```
12. Enter ```FET.set();\n``` into the field ```command string```.
13. Click on ```OK``` to save the action.
14. Turn off ```Editing mode```

![image](https://github.com/asterics/AsTeRICS-Grid/assets/4621810/b35856fc-3cbd-4747-a410-353e95bea12b)

*Fig 3: Battery interrupter*

![image](https://github.com/asterics/AsTeRICS-Grid/assets/4621810/31e9bafe-f2d1-401b-b601-df5c065ad394)

Fig 4: Wiring of battery interrupter and Puck.js

::: tip
* ```FET.set();\n```: will turn the toy on.
* ```FET.reset();\n```: will turn the toy off.
:::

::: tip
You can also buy already adapted toys e.g. from [enablingdevices](https://enablingdevices.com/product-category/adapted-toys-games/) or [Ariadne Inklusivshop](https://inklusiv-shop.ariadne.de/spiele/adaptiertes-spielzeug/?p=1).
In such a case the Puck.js pins must be soldered to an audio jack plug.
:::

::: warning
Electromagnetic devices (motors, solenoids, speakers, etc) let out big spikes of electricity when they are disconnected from power. While Puck.js's FET provides a certain level of protection (350mA) for this Back-EMF, if you're trying to power anything of any size with the FET pin we'd suggest you add your own diode across the pins of device that you're powering to help to protect your Puck.js.
:::

## FABI / FLipMouse

This tutorial explains, how to create a mouse movement using the button interface FABI or the mouth mouse FLipMouse. This currently only supports a wired serial connection to the device.

### Move mouse cursor to the right

1. Connect the device to a desktop/laptop computer using a USB cable.
2. Open a grid and turn on ```Editing mode```
3. Edit cell and got to ```Actions``` tab
4. Select ```UART action```
5. Enter ```AT MX 100;\n``` into the field ```command string```.
6. Click on ```OK``` to save the action.
7. Turn off ```Editing mode```

::: tip
You can send any [FABI AT command](https://github.com/asterics/FABI/blob/master/FabiWare/commands.h) or [FLipMouse AT](https://github.com/asterics/FLipMouse/blob/master/FLipWare/commands.h) command (e.g. mouse click, keyboard input, slot change to remote control a Smartphone via Bluetooth HID, ...) that is supported.
:::
