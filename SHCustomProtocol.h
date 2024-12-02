#ifndef __SHCUSTOMPROTOCOL_H__
#define __SHCUSTOMPROTOCOL_H__

#include <Arduino.h>
#include <Tone.h>
class SHCustomProtocol
{
  private:
    Tone rpmTone;
    Tone speedTone;

  public:
    const int SPEED_PIN = 3; 
    const int RPM_PIN = 6;
  
    static const int RPM_SAMPLE_COUNT = 11;
    const int RPM_FREQS[RPM_SAMPLE_COUNT] = {31, 31, 45, 79, 110, 141, 178, 206, 224, 255, 283};
    const int RPM_VALUES[RPM_SAMPLE_COUNT] = {1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000};

    static const int SPEED_SAMPLE_COUNT = 30;
    const int SPEED_VALUES[SPEED_SAMPLE_COUNT] = {22, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 500};
    const int SPEED_FREQS[SPEED_SAMPLE_COUNT] = {31, 39, 51, 64, 76, 87, 97, 112, 125, 138, 150, 162, 177, 192, 205, 219, 232, 246, 258, 271, 285, 295, 307, 320, 332, 345, 358, 370, 383, 635};

    
    void setup() {
      pinMode(SPEED_PIN, OUTPUT);
      pinMode(RPM_PIN, OUTPUT);

      rpmTone = Tone();
      speedTone = Tone();
      rpmTone.begin(RPM_PIN);
      speedTone.begin(SPEED_PIN);
    }

    /**
     * Read function, called whenever SimHub sends new data to the arduino
     * 
     * After processing the sent values (Speed and Rpms, will generate the frequency to be sent to the pin)
     * Old Functions that where processed in here removed and added directly on SimHub Protocol message Binding
     * allowing the arduino to have the least amount of processing (keeping only the frequency data which can vary by cluster)
     */
    void read() {
      double spd = FlowSerialReadStringUntil(';').toDouble();
      double rpms = FlowSerialReadStringUntil(';').toDouble();  
      
      generateFrequency(speedTone, spd, SPEED_VALUES, SPEED_FREQS, SPEED_SAMPLE_COUNT);
      generateFrequency(rpmTone, rpms, RPM_VALUES, RPM_FREQS, RPM_SAMPLE_COUNT);
    }


  /**
   * Function that based on the value and values|frequencies relation will calculate the correct frequency and send to the pin
   * Receives:
   * pinTone - Tone of the pin to be used( Either speed or RPM)
   * value - to represent ( Either speed or RPM ), 
   * VALUES and FREQS array - Relation between the value and the frequency that corresponds to
   * SAMPLE_COUNT - instead of always calculating the sizeof VALUES or FREQS, this field saves that little bit of computing
   */
    void generateFrequency(Tone pinTone, double value, int VALUES[], int FREQS[], int SAMPLE_COUNT) {
      if (value <= VALUES[0])  {
        pinTone.stop();
      } else if (value >= VALUES[SAMPLE_COUNT - 1]) {
        pinTone.play(FREQS[SAMPLE_COUNT - 1], uint32_t(200));
      } else {
        for (int i = 0; i < SAMPLE_COUNT; i++) {
          if (value < VALUES[i + 1]) {
            double diffRpm = value - VALUES[i];
            int diffFreq = FREQS[i + 1] - FREQS[i];
            int valueGap = VALUES[i + 1] - VALUES[i];
            pinTone.play(FREQS[i] + (diffFreq * diffRpm) / valueGap, uint32_t(200));
          }
        }
      }
     
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
