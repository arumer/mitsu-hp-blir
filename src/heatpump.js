module.exports = class HeatPump {
  #bl_hdr = [0x26,0x00,0x4C,0x02,0x6D,0x38]
  #rpt_spc = [0x0D,0x00,0x01,0xA1];
  #end_spc = [0x0d,0x00,0x0d,0x05,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00];
  #heat_mode1 = 0b00001000;
  #heat_mode2 = 0b00110000;
  #cool_mode1 = 0b00011000;
  #cool_mode2 = 0b00110110;

  #autovane = 0b11000000;

  constructor(power, mode, temp) {
    this._header = [0x23,0xCB,0x26,0x01,0x00,0x00,0x00,0x00,0x30,
                    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]
    this._temperature = temp;
    this._mode = mode;
    this._power = power;
  }

  get temperature() {
    return this._temperature;
  }

  set temperature(value) {
    this._temperature = value;
  }

  get bl_command() {
    // Set power on or off
    if (this._power == 1) {
        this._header[5] |= 0b00100000;
    } else {
        this._header[5] &= ~(0b00100000);
    }

    // Set cool or heat mode
    if (this._mode == 1) {
        this._header[6] |= this.#heat_mode1;
        this._header[8] |= this.#heat_mode2;
    } else {
        this._header[6] &= ~(this.#cool_mode1);
        this._header[8] &= ~(this.#cool_mode2);
    }

    if (this._temperature < 16) {
        this._temperature = 16;
    } else if (this._temperature > 31) {
        this._temperature = 31;
    }
    this._header[7] = this._temperature - 16;
    this._header[9] = this.#autovane;
    
    this._header[17] = this._header.slice(0,17).reduce((a,b) => a+b, 0) & 0xFF;

    const data = [];
    for (let byte of this._header) {
        for (let i = 0; i <= 7; i++) {
            const bit = (byte >> i) & 1;
            if (bit === 1) {
                data.push(0x0D, 0x29);
            } else {
                data.push(0x0D, 0x0D);
            }
        }
    }

    const cmd = this.#bl_hdr.concat(data,this.#rpt_spc,data,this.#end_spc);   
    return cmd.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }
}