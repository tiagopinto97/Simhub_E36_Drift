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
    const int SPEED_PIN = 3; 
    const int RPM_PIN = 6;
  
    static const int RPM_SAMPLE_COUNT = 11;
    const int RPM_FREQS[RPM_SAMPLE_COUNT] = {31, 31, 45, 79, 110, 141, 178, 206, 224, 255, 283};
    const int RPM_VALUES[RPM_SAMPLE_COUNT] = {1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000};

    static const int SPEED_SAMPLE_COUNT = 49;
    const int SPEED_VALUES[SPEED_SAMPLE_COUNT] = {22, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 460, 470, 480, 490, 500};
    const int SPEED_FREQS[SPEED_SAMPLE_COUNT] = {31, 39, 51, 64, 76, 87, 97, 112, 125, 138, 150, 162, 177, 192, 205, 219, 232, 246, 258, 271, 285, 295, 307, 320, 332, 345, 358, 370, 383, 395, 408, 421, 433, 446, 458, 471, 484, 496, 509, 521, 534, 547, 559, 572, 585, 597, 610, 622, 635};


    
    void setup() {
      pinMode(SPEED_PIN, OUTPUT);
      pinMode(RPM_PIN, OUTPUT);

      rpmtone = Tone();
      speedtone = Tone();
      rpmtone.begin(RPM_PIN);
      speedtone.begin(SPEED_PIN);
    }

    /**
     * Read function, called whenever SimHub sends new data to the arduino
     * 
     * After processing the sent values, calls speedProcessing and rpmProcessing to generate the correct frequency for those pins
     */
    void read() {
      byte parkingBrake = FlowSerialReadStringUntil(';').toInt();
      double speedKMH = FlowSerialReadStringUntil(';').toDouble();
      double wheel1spd = FlowSerialReadStringUntil(';').toDouble();
      double wheel2spd = FlowSerialReadStringUntil(';').toDouble();
      double wheel3spd = FlowSerialReadStringUntil(';').toDouble();
      double wheel4spd = FlowSerialReadStringUntil(';').toDouble();
      double maxRPMS = FlowSerialReadStringUntil(';').toDouble();
      double maxRPMS2 = FlowSerialReadStringUntil(';').toDouble();
      double rpms = FlowSerialReadStringUntil(';').toDouble();

      speedProcessing(speedKMH, wheel1spd, wheel2spd, wheel3spd, wheel4spd, parkingBrake);
      rpmProcessing(maxRPMS, rpms);
    }


  /**
   * Function that based on the value will calculate the correct frequency
   * Receives:
   * value - to represent ( Either speed or RPM ), 
   * VALUES and FREQS array - Relation between the value and the frequency that corresponds to
   * SAMPLE_COUNT - instead of always calculating the sizeof VALUES or FREQS, this field saves that little bit of computing
   */
    int generateFrequency(double value, int VALUES[], int FREQS[], int SAMPLE_COUNT) {
      if (value <= VALUES[0])  {
        return 0;
      }
      if (value >= VALUES[SAMPLE_COUNT - 1]) {
        return FREQS[SAMPLE_COUNT - 1];
      }

      for (int i = 0; i < SAMPLE_COUNT; i++) {
        if (value < VALUES[i + 1]) {
          double diffRpm = value - VALUES[i];
          int diffFreq = FREQS[i + 1] - FREQS[i];
          int valueGap = VALUES[i + 1] - VALUES[i];
          return FREQS[i] + (diffFreq * diffRpm) / valueGap;
        }
      }

      return 0;
    }

  /**
   * Function that based on the reported maxRPMS and current rpms sets the value on the speedometer
   * It's limited to 10000 Rpm due to me only beign able to push my speedometer to that value (Stock it's 7000)
   * This limit is needed mostly because EV's on Forza and other games go well beyond (18000 for ex) and 
   * it does convert it so the speedometer won't receive a frequency for above 10000
   * 
   * maxRPMS - Maximum RPMs reported by SIMHUB
   * rpms - Current RPMs reported by SIMHUB
   */
    void rpmProcessing(double maxRPMS, double rpms) {
      double ratio = 1;

      // USE RATIO TO KEEP SPEEDO ALIVE
      if (maxRPMS > 10000) {
        ratio = 10000 / maxRPMS;
      }

      double speedometerRpms = rpms * ratio;
      rpmtone.play(generateFrequency(speedometerRpms, RPM_VALUES, RPM_FREQS, RPM_SAMPLE_COUNT), uint32_t(200));

    }



  /**
   * Function responsible for processing the speed signal.
   * It will show the value for the fastest spinning wheel, wich is the main reason behind this specific protocol.
   * That is the most realistic behaviour for when a car is doing a burnout or drifting, where usualy the game reports the 
   * vehicle speed (0 for burnout, less than wheelspeed for drifting) but I want always wheelspeed.
   * 
   * TODO - On RWD cars when parking brake is on return as speed is zero (for drifting purposes)
   * 
   * speedKMH - Fallback in case the game does not report per wheel speed
   * wheel1spd | wheel2spd | wheel3spd | wheel4spd - specific wheel speed, used calculate the speed value
   * parkingBrake - byte to indicate if parking brake is on
   */
    void speedProcessing(double speedKMH, double wheel1spd, double wheel2spd, double wheel3spd, double wheel4spd, byte parkingBrake) {
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
      speedtone.play(generateFrequency(maxSpd, SPEED_VALUES, SPEED_FREQS, SPEED_SAMPLE_COUNT), uint32_t(200));
    }

    /**
     * Function needed by SimHub, can be empty
     */
    void loop() {}

    /**
     * Function needed by SimHub, can be empty
     */
    void idle() {}
};

#endif
