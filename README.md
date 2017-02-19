## Development Environment

Install [Node](https://nodejs.org/en/), which comes with the Node Package Manager (npm)

Then run:

```bash
$ npm install -g cordova ionic
```

If using a Mac, you may need to use sudo.  Read the ionic/cordova getting started docs for more info.

## Project Setup (in project directory)

```bash
$ npm install
$ bower install
```

## Issues/Bugs/Feature Requests

Please use the github issues tracker and tag your issue appropriately ('bug','feature request', etc.)

## Hardware Connection API

Look at flexvolt.js to see how this API is used in the FlexVolt App

For each control action

1.  Send control character (such as 'X' to clear, or 'Q' to turn data off)
2.  FlexVolt echoes the command, followed by the lower case version.

### Handshake Mode (to enter command mode)

1.  Send 'X' to clear states.  Wait for 'X', 'x'
2.  Send 'A' to start handshake.  Wait for 'A', 'a'
3.  Send '1' to finish handshake.  Wait for '1', 'b'  (overly complicated, I know).
4.  The FlexVolt sensor is now in normal command mode.
5.  Other values result in an error response: disallowedValue, 'e', CODE, disallowedValue, where CODE pertains to the current state when the disallowedValue was received.  

### Command Mode

1.  'V' - Get Version info.  Returns info related to the hardware model, version, and s/n.
1.  'M' - Capture and transmit a single measurement.  Good for testing, or for computer-based sample-time control.
2.  'G' - Turn data measurement on.  Starts measuring and transmitting data using current settings (nChannels, sampleRate)
3.  'Q' - Turn data measurement off.  Stop measuring and transmitting data.
4.  'X' - Clear State, Leave Command Mode.
5.  'S' - Enter Settings menu.

### Data Mode

When data measurement is on, FlexVolt hardware will capture and transmit measurements based on the current hardware settings.  This includes nChannels, bitDepth, raw/filtered, and sampling frequency.  Each data packet comes as a series of bytes as follows:

1.  Packet Descriptor
  * The packet descriptors can be used to stay synced, and to ensure data is not being dropped or mangled.
  * 8-bit
    * 1 Channel  = 67 ('C')
    * 2 Channels = 68 ('D')
    * 4 Channels = 69 ('E')
    * 8 Channels = 70 ('F')
  * 10-bit
    * 1 Channel  = 72 ('H')
    * 2 Channels = 73 ('I')
    * 4 Channels = 74 ('J')
    * 8 Channels = 75 ('K')
2.  N bytes of data.  
  * 8-bit
    * N = nChannels
    * Example: 4 channels
      * 69
      * dataFromChannel1
      * dataFromChannel2
      * dataFromChannel3
      * dataFromChannel4]
  * 10-bit
    * N = nChannels + (2 * ceiling(nChannels/4))
    * Example: 4 channels =>
      * 74
      * high8BitsFromChannel1
      * high8BitsFromChannel2
      * high8BitsFromChannel3
      * high8BitsFromChannel4
      * 0b11223344 where 11 is the lowest 2 bits from channel1, 22 is the lowest 2 bits from channel2, etc...

### Settings Menu

All settings registers must be written, in order.  

1.  Send 9 8-bit values for Registers 0-8.  Each value is echoed.
2.  Once all registers have been sent, hardware will return 'y'.
3.  If settings were correctly transmitted and echoed, send 'Y' - applies new values.  Returns 'z'.
4.  If settings were not correctly transmitted and echoed - send 'Q' - does not apply new values.  Returns 'q'.
5.  Either way, returns to command mode.

### Control Registers

REG0 Is most likely the only register to be adjusted.  The other registers can be left at their defaults, which aren't always 0!

* REG0 = main/basic user settings
  * REG0<7:6> = Channels, [DEFAULTS=current connected hardware nChannels].  
    * 11 = 8 Channels
    * 10 = 4 Channels
    * 01 = 2 Channels
    * 00 = 1 Channels
  * REG0<5:2> = FreqIndex, [DEFAULT=8] (1000Hz), FREQUENCY_LIST = [1, 10, 50, 100, 200, 300, 400, 500, 1000, 1500, 2000];
  * REG0<1> = DataMode [DEFAULT=0]
    * 1 = send filtered data, use Filter Shift Val
    * 0 = send raw data - ignore Filter Shift Val
  * REG0<0> = Data bit depth.  [DEFAULT=0].
    * 1 = 10-bits - stacking extra 2 bits for each channel in an additional byte (see flexvolt.js)
    * 0 = 8-bits

* REG1 = Filter Shift Val + Prescalar Settings
  * REG1<4:0> = filter shift val, 0:31, 5-bits [DEFAULT=5]
  * REG1<7:5> = PS setting. [DEFAULT = 2]
    * 000 = 2
    * 001 = 4
    * 010 = 8 [DEFAULT]
    * 011 = 16 // not likely to be used
    * 100 = 32 // not likely to be used
    * 101 = 64 // not likely to be used
    * 110 = 128// not likely to be used
    * 111 = off (just use 48MHz/4)

* REG2 = Manual Frequency, low byte (16 bits total).  [DEFAULT = 0]
* REG3 = Manual Frequency, high byte (16 bits total).  [DEFAULT = 0]

* REG4 = Time adjust val (8bits, use 0:255 to achieve -6:249) [DEFAULT = 2]

* REG5<7:0> = Timer Adjustment Partial Counter Val - Low Byte [DEFAULT = 0] (add Time Adjust to x out of N total counts to 250)
* REG6<7:0> = Timer Adjustment Partial Counter Val - HighByte [DEFAULT = 0] (add Time Adjust to x out of N total counts to 250)

* REG7<7:0> = down sampling value (mainly for smoothed data)   [DEFAULT = 0]

* REG8<7:0> = Plug Test Delay (ms).  [DEFAULT=0] If 0, no plug tests.  If greater than 0, returns result of plug test every delay ms.

#### Register Example

* REG0 = 157  (in binary 157 = 0b10011101)
  * 0b**10**011101 => 4 Channels
  * 0b10**0111**01 => Frequency Index = 7 => 500Hz
  * 0b100111**0**1 => Send Raw Data
  * 0b1001110**1** => Use 10-bit resolution
