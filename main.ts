class BotnRoll {

    name : string;
    constructor(name: string) {
        this.name = name;
    }

    // key used in critical commands
    _KEY1 = 0xAA;
    // key used in critical commands
    _KEY2 = 0x55;

    // LED
    _COMMAND_LED = 0xFD;
    _COMMAND_LCD_L1 = 0xFA  // Write LCD line1
    _COMMAND_LCD_L2 = 0xF9  // Write LCD line2
    _LCD_CHARS_PER_LINE = 16

    // 20 MinStable:15 Crash:14
    _delay_TR = 20;
    // 20 Crash: No crash even with 0 (ZERO)
    _delay_SS = 20;

    __us_sleep(microseconds: number): void {
        basic.pause(microseconds / 1000);
    }

    __ms_sleep(millisseconds: number): void {
        basic.pause(millisseconds);
    }

    __high_byte(word: number): number {
        return (word >> 8) & 0xFF;
    }

    __low_byte(word: number): number {
        return word & 0xFF;
    }

    __open_spi(): void {
        pins.spiFrequency(488000);
        pins.spiFormat(8, 1);
        pins.spiPins(DigitalPin.P15, DigitalPin.P14, DigitalPin.P13);
        pins.digitalWritePin(DigitalPin.P16, 0);
    }

    __close_spi(): void {
        pins.digitalWritePin(DigitalPin.P16, 1);
    }

    openConnection(): void {
        this.__open_spi();
    }

    __request_byte(command: number): number {
        // this.__open_spi();
        pins.spiWrite(command);
        pins.spiWrite(this._KEY1);
        pins.spiWrite(this._KEY2);
        this.__us_sleep(this._delay_TR);
        const result = pins.spiWrite(0); // Dummy write to trigger read
        // this.__close_spi();
        return result;
    }

    __request_word(command: number): number {
        // this.__open_spi();
        pins.spiWrite(command);
        pins.spiWrite(this._KEY1);
        pins.spiWrite(this._KEY2);
        const result2 = pins.spiWrite(0); // Dummy write to trigger read
        // this.__close_spi();
        return result2;
    }

    __send_data(command: number, msg: number[] = []): void {
        // this.__open_spi();
        pins.spiWrite(command);
        pins.spiWrite(this._KEY1);
        pins.spiWrite(this._KEY2);
        if (msg.length > 0) {
            for (let i = 0; i < msg.length; i++) {
                pins.spiWrite(msg[i]);
            }
        }
        // this.__close_spi();
        this.__ms_sleep(2);
    }

    led(state: number): void {
        state = state % 2;
        const msg = [this.__low_byte(state)];
        this.__send_data(this._COMMAND_LED, msg);
    }

    __text_to_bytes(text: String, maxLength: number) {
        let result = '';

        // Truncate or pad the text to fit the maxLength
        if (text.length > maxLength) {
            result = text.slice(0, maxLength);
        } else {
            result = text + this.__repeat(' ', maxLength - text.length);
        }

        // Convert each character to its ASCII code
        const byteData = result.split('').map(char => char.charCodeAt(0));

        return byteData;
    }

    __repeat(char: String, count: number) {
        let result = '';
        for (let i = 0; i < count; i++) {
            result += char;
        }
        return result;
    }

    __join_and_trim_data(data1: String, data2:String = null, data3: String = null, data4: String  = null) {
        let trimmed_data;

        if (data2 === null) {
            trimmed_data = this.__text_to_bytes(data1, this._LCD_CHARS_PER_LINE);
        } else if (data3 === null) {
            trimmed_data = this.__text_to_bytes(
                `${data1} ${data2}`,
                this._LCD_CHARS_PER_LINE
            );
        } else if (data4 === null) {
            trimmed_data = this.__text_to_bytes(
                `${data1} ${data2} ${data3}`,
                this._LCD_CHARS_PER_LINE
            );
        } else {
            const trimLength = Math.floor(this._LCD_CHARS_PER_LINE / 4);
            const data1Trimmed = this.__text_to_bytes(data1, trimLength);
            const data2Trimmed = this.__text_to_bytes(data2, trimLength);
            const data3Trimmed = this.__text_to_bytes(data3, trimLength);
            const data4Trimmed = this.__text_to_bytes(data4, trimLength);
            trimmed_data = data1Trimmed.concat(data2Trimmed).concat(data3Trimmed).concat(data4Trimmed);
        }

        return trimmed_data;
    }

    lcd1(data1: String, data2: String, data3: String, data4: String) {
        const dataToSend = this.__join_and_trim_data(data1, data2, data3, data4);
        // Assuming __send_data and _COMMAND_LCD_L1 are defined elsewhere in your class
        this.__send_data(this._COMMAND_LCD_L1, dataToSend);
    }

    heart(): void {
        basic.showIcon(IconNames.SmallHeart);
    }

    clearScreen(): void {
        basic.clearScreen();
    }
}
const oneA = new BotnRoll('OneA');
oneA.openConnection();
oneA.lcd1("Hi m", "icro", "Bit", "");
basic.showIcon(IconNames.SmallHeart)
// Your on_forever logic goes here
basic.forever(function () {
    oneA.led(1);
    oneA.lcd1("Hi m", "icro", "Bit", "");
oneA.heart();
// basic.showIcon(IconNames.SmallHeart);
    basic.pause(1000)
    oneA.clearScreen();
oneA.led(0);
// basic.clearScreen();
    basic.pause(1000)
})
