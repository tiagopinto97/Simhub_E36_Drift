# Simhub_E36_Drift

This custom protocol was created due to my need to have a more realistic speedometer when I drift, which is by far the biggest use case for my simulation needs and I needed to have wheelspeed on my speedometer and not the speed wich the game usually returns (which would be equivalent to a gps speed, works on most cases except when purposely one is driving in such manner that the driving wheels do not match the speed, a real car would show the wheel speed and a gps tracker wouldn't.

Also as a Bonus I updated the RPM calculation to show real RPM until 10000 rpm, above that it will convert the rpm value based on the maxRpm so for the speedometer will be as if the game is limited to 10000.

At a later date I will update the NCalc formula to support more games, for now works as expected on Assetto Corsa:

```
if([JoystickPlugin.handbrake_Slider0], '1', '0') + ';' +
[SpeedKmh] + ';' + 
[GameRawData.Physics.WheelAngularSpeed01] + ';' + 
[GameRawData.Physics.WheelAngularSpeed02] + ';' + 
[GameRawData.Physics.WheelAngularSpeed03] + ';' + 
[GameRawData.Physics.WheelAngularSpeed04] + ';' + 
[CarSettings_MaxRPM] + ';' + 
[MaxRpm] + ';' +
[Rpms] + ';'
```
