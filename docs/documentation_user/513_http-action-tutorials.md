# HTTP action tutorials

In this document, you will find tutorials for the AsTeRICS Grid HTTP action.

## Turn on/off shelly plug

The shelly plug has a built-in wifi access point or can connect itself to a wifi access point. Furthermore, it runs a webserver and provides a REST API that can be used to turn the plug (electricity) on or off.

![Shelly plug](https://fr.alternate.be/p/1200x630/3/8/Shelly_Plug_S_smart_wifi__Prise_de_courant@@1826083_2.jpg)
![Shelly Plus Plug UK](https://www.shelly.com/_Resources/Persistent/8/2/b/e/82beea31e4b257307de29a5671e3738113348abb/Shelly_Plus_PlugUK_x1-625x625.png)

1. Get a shelly plus plug (see [UK model](https://www.shelly.com/en-de/products/product-overview/shelly-plus-plug-uk) or [Shelly Plug S](https://www.amazon.de/s?k=shelly+s+plug&adgrpid=71094184076&hvadid=352674859116&hvdev=c&hvlocphy=1000739&hvnetw=g&hvqmt=e&hvrand=3009423075800256500&hvtargid=kwd-910071249511&hydadcr=1608_1721139&tag=googhydr08-21&ref=pd_sl_2xiktl7icw_e)).
2. Plug it in and enable the shelly wifi access point according to the shelly plug manual.
3. Connect to the wifi access point of the shelly plug. 
4. Now the shally plug should be reachable through an ip address, e.g ```http://192.168.33.1```.
5. Turn on ```Editing mode```
6. Edit cell and got to ```Actions``` tab
7. Select ```HTTP action```
8. Enter ```http://192.168.33.1/relay/0?turn=toggle``` command into the field ```HTTP URL``` (see Fig 1).
9. Enter ```GET``` into the field ```HTTP method```.
10. Enter ```text/plain``` into the field ```HTTP Content-Type```.
9. Click on ```OK``` to save the action.
10. Turn off ```Editing mode```

![image](https://github.com/asterics/AsTeRICS-Grid/assets/4621810/56792e15-1162-43ff-a112-f95d0a29d0c0)

Fig 1: HTTP action to toggle Shelly plug.
 
::: tip
You can also use dedicated on/off commands:
```
http://192.168.33.1/relay/0?turn=on
```
```
http://192.168.33.1/relay/0?turn=on
```
:::
