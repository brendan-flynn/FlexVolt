## Development Environment

Install [Node](https://nodejs.org/en/), which comes with the Node Package Manager (npm)

Then run:

```bash
$ sudo npm install -g cordova ionic
```

## Project Setup (in project directory)

```bash
$ npm install
$ bower install
```

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

### Settings Menu

All settings registers must be written, in order.  

1.  Send 9 8-bit values for Registers 0-8.  Each value is echoed.
2.  Once all registers have been sent, hardware will return 'y'.
3.  If settings were correctly transmitted and echoed, send 'Y' - applies new values.  Returns 'z'.
4.  If settings were not correctly transmitted and echoed - send 'Q' - does not apply new values.  Returns 'q'.
5.  Either way, returns to command mode.

### Control Registers

REG0 Is most likely the only register to be adjusted

Example: REG0 = 157

in binary 157 = 0b10011101

0b**10**011101 => 4 Channels
0b10**0111**01 => Frequency Index = 7 => 500Hz
0b100111**0**1 => Send Raw Data
0b1001110**1** => Use 10-bit resolution

REG0 = main/basic user settings
REG0<7:6> = Channels, DEFAULTS to current connected hardware.  11=8, 10=4, 01=2, 00=1
REG0<5:2> = FreqIndex, DEFAULT=8 (1000Hz), FREQUENCY_LIST = [1, 10, 50, 100, 200, 300, 400, 500, 1000, 1500, 2000];
REG0<1> = DataMode DEFAULT=0, (1 = filtered, 0 = raw)
REG0<0> = Data bit depth.  DEFAULT = 0.  1 = 10-bits, 0 = 8-bits

Registers below most likely don't ever need to be changed.  They involve:
1. microprocessor fine timing adjustments
2. digital filter (prior to transmission)
3. custom sampling frequencies
4. downsampling
5. plugin-detection

REG1 = Filter Shift Val + Prescalar Settings
REG1<4:0> = filter shift val, 0:31, 5-bits [DEFAULT=5]
REG1<7:5> = PS setting. [DEFAULT = 2]
             000 = 2
             001 = 4
             010 = 8 [DEFAULT]
             011 = 16 // not likely to be used
             100 = 32 // not likely to be used
             101 = 64 // not likely to be used
             110 = 128// not likely to be used
             111 = off (just use 48MHz/4)

REG2 = Manual Frequency, low byte (16 bits total).  [DEFAULT = 0]
REG3 = Manual Frequency, high byte (16 bits total).  [DEFAULT = 0]

REG4 = Time adjust val (8bits, use 0:255 to achieve -6:249) [DEFAULT = 2]

REG5 & REG6 Timer Adjustment    [DEFAULT = 0]
(add Time Adjust to x out of N total counts to 250)
REG5<7:0> = partial counter val, low byte, 16 bits total
REG6<7:0> = partial counter val, high byte, 16 bits total

REG7<7:0> = down sampling value (mainly for smoothed data)   [DEFAULT = 0]

REG8<7:0> = Plug Test Delay (ms).  [DEFAULT=0] If 0, no plug tests.  If greater than 0, returns result of plug test every delay ms.


## Issues

Please use the github issues tracker.
