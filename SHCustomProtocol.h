#ifndef __SHCUSTOMPROTOCOL_H__
#define __SHCUSTOMPROTOCOL_H__

#include <Arduino.h>
#include <Tone.h>
class SHCustomProtocol
{
  private:
    Tone rpmtone;
    Tone speedtone;

  public:
    /*
      CUSTOM PROTOCOL CLASS
      SEE https://github.com/zegreatclan/SimHub/wiki/Custom-Arduino-hardware-support

      GENERAL RULES :
      - ALWAYS BACKUP THIS FILE, reinstalling/updating SimHub would overwrite it with the default version.
      - Read data AS FAST AS POSSIBLE in the read function
      - NEVER block the arduino (using delay for instance)
      - Make sure the data read in "read()" function READS ALL THE DATA from the serial port matching the custom protocol definition
      - Idle function is called hundreds of times per second, never use it for slow code, arduino performances would fall
      - If you use library suspending interrupts make sure to use it only in the "read" function when ALL data has been read from the serial port.
        It is the only interrupt safe place

      COMMON FUNCTIONS :
      - FlowSerialReadStringUntil('\n')
        Read the incoming data up to the end (\n) won't be included
      - FlowSerialReadStringUntil(';')
        Read the incoming data up to the separator (;) separator won't be included
      - FlowSerialDebugPrintLn(string)
        Send a debug message to simhub which will display in the log panel and log file (only use it when debugging, it would slow down arduino in run conditions)

    */
    // int lowbeam;
    // int highbeams;
    // int blinkerLeft;
    // int blinkerRight;
    // int frontAux; // FOG LIGHT
    // int battery;
    // int oilPressure;
    // int absActive;
    // int parkingBrake;

    // Set PINS
    // FROM SIMHUB
    // PIN 2 - Speed
    // PIN 4 - RPM0
    // PIN 5 - TEMP
    // PIN 6 - Fuel

    int speed_PIN = 3;
    int rpm_PIN = 6;
    int tmp_PIN = 5;
    int fuel_PIN = 2;

    
    void setup()
    {

      pinMode(speed_PIN, OUTPUT);
      pinMode(rpm_PIN, OUTPUT);

      rpmtone = Tone();
      speedtone = Tone();
      rpmtone.begin(rpm_PIN);
      speedtone.begin(speed_PIN);
    }

    // Called when new data is coming from computer
    void read()
    {
      byte parkingBrake = FlowSerialReadStringUntil(';').toInt();
      double speedKMH = FlowSerialReadStringUntil(';').toDouble();
      double wheel1spd = FlowSerialReadStringUntil(';').toDouble();
      double wheel2spd = FlowSerialReadStringUntil(';').toDouble();
      double wheel3spd = FlowSerialReadStringUntil(';').toDouble();
      double wheel4spd = FlowSerialReadStringUntil(';').toDouble();
      double maxRPMS = FlowSerialReadStringUntil(';').toDouble();
      double maxRPMS2 = FlowSerialReadStringUntil(';').toDouble();
      double rpms = FlowSerialReadStringUntil(';').toDouble();

      speedProcessing(speedKMH, wheel1spd, wheel2spd, wheel3spd, wheel4spd);
      rpmProcessing(maxRPMS, rpms);
    }


    int generateRPMFrequency(double rpms)
    {
      // Define the RPM frequency pairs
      int freqTable[] = {31, 31, 45, 79, 110, 141, 178, 206, 224, 255, 283};
      int rpmSteps[] = {1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000};

      // If RPM is out of range
      if (rpms <= 1000)  {
        return 0;
      }
      if (rpms >= 10000) {
        return freqTable[10];
      }

      // Find the correct range
      for (int i = 0; i < 11; i++)
      {
        if (rpms < rpmSteps[i + 1])
        {
          // Calculate frequency using integer math
          double diffRpm = rpms - rpmSteps[i];
          int diffFreq = freqTable[i + 1] - freqTable[i];
          int rpmGap = rpmSteps[i + 1] - rpmSteps[i];
          return freqTable[i] + (diffFreq * diffRpm) / rpmGap;
        }
      }

       return 200; // Fallback, though it should never reach here
    }
    void rpmProcessing(double maxRPMS, int rpms)
    {
      double ratio = 1;

      // USE RATIO TO KEEP SPEEDO ALIVE
      if (maxRPMS > 10000) {
        ratio = 10000 / maxRPMS;
      }

      double speedometerRpms = rpms * ratio;
      rpmtone.play(generateRPMFrequency(speedometerRpms), uint32_t(200));

    }



    int generateSpeedFrequency(int speed)
    {
      // Define the RPM frequency pairs
      int speedSteps[] = {22, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 460, 470, 480, 490, 500};
      int freqTable[] = {31, 39, 51, 64, 76, 87, 97, 112, 125, 138, 150, 162, 177, 192, 205, 219, 232, 246, 258, 271, 285, 295, 307, 320, 332, 345, 358, 370, 383, 395, 408, 421, 433, 446, 458, 471, 484, 496, 509, 521, 534, 547, 559, 572, 585, 597, 610, 622, 635};


      // If RPM is out of range
      if (speed <= 22)
      {
        return 0;
      }
      if (speed >= 500)
      {
        return 635;
      }

      // Find the correct range
      for (int i = 0; i < 51; i++)
      {
        if (speed < speedSteps[i + 1])
        {
          // Calculate frequency using integer math
          int diffSpd = speed - speedSteps[i];
          int diffFreq = freqTable[i + 1] - freqTable[i];
          int spdGap = speedSteps[i + 1] - speedSteps[i];
          return freqTable[i] + (diffFreq * diffSpd) / spdGap;
        }
      }

      // return 0; // Fallback, though it should never reach here
    }

    void speedProcessing(double speedKMH, double wheel1spd, double wheel2spd, double wheel3spd, double wheel4spd)
    {
      double maxSpd = speedKMH;
      if (maxSpd < wheel1spd) {
        maxSpd = wheel1spd;
      }
      if (maxSpd < wheel2spd) {
        maxSpd = wheel2spd;
      }
      if (maxSpd < wheel3spd) {
        maxSpd = wheel3spd;
      }
      if (maxSpd < wheel4spd) {
        maxSpd = wheel4spd;
      }
      speedtone.play(generateSpeedFrequency(maxSpd), uint32_t(200));
    }


    void dwPin(int PIN, bool ON_OFF) {
      digitalWrite(PIN, ON_OFF ? LOW : HIGH);
    }


    void loop()
    {
    }



    // Called once between each byte read on arduino,
    // THIS IS A CRITICAL PATH :
    // AVOID ANY TIME CONSUMING ROUTINES !!!
    // PREFER READ OR LOOP METHOS AS MUCH AS POSSIBLE
    // AVOID ANY INTERRUPTS DISABLE (serial data would be lost!!!)
    void idle()
    {
    }
};

#endif
