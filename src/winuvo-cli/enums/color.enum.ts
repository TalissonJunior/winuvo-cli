export enum Color {
    Black = '\x1b[30m%s\x1b[0m',
    Red = '\x1b[31m%s\x1b[0m',
    Green = '\x1b[32m%s\x1b[0m',
    Yellow = '\x1b[33m%s\x1b[0m',
    Blue = '\x1b[34m%s\x1b[0m',
    Magenta = '\x1b[35m%s\x1b[0m',
    Cyan = '\x1b[36m%s\x1b[0m',
    White = '\x1b[37m%s\x1b[0m',

    BlackNoReset = '\x1b[30m',
    RedNoReset = '\x1b[31m',
    GreenNoReset = '\x1b[32m',
    YellowNoReset = '\x1b[33m',
    BlueNoReset = '\x1b[34m',
    MagentaNoReset = '\x1b[35m',
    CyanNoReset = '\x1b[36m',
    WhiteNoReset = '\x1b[37m',

    Reset = '\x1b[0m',
    Bright = '\x1b[1m',
    Dim = '\x1b[2m',
    Underscore = '\x1b[4m',
    Blink = '\x1b[5m',
    Reverse = '\x1b[7m',
    Hidden = '\x1b[8m',
}