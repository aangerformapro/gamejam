import { isInt } from "../utils/utils.mjs";

export const
    MILISECOND = 1,
    SECOND = 1000,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR,
    WEEK = 7 * DAY,
    MONTH = 30 * DAY,
    YEAR = 365 * DAY;


const DIVIDERS = {
    days: DAY,
    hours: HOUR,
    minutes: MINUTE,
    seconds: SECOND,
    miliseconds: MILISECOND
};

export class Chronometer
{
    #start;
    #running = false;
    #paused = false;
    #elapsed = 0;
    #laps;


    get startTime()
    {
        return this.#start;
    }

    get stopped()
    {
        return !this.start;
    }


    get running()
    {
        return this.#running;
    }

    get paused()
    {
        return this.#paused;
    }

    get elapsed()
    {

        if (this.#running)
        {
            return +new Date() - this.#start;
        }
        return this.#elapsed;
    }

    get laps()
    {
        return this.#laps;
    }



    start()
    {
        if (!this.#running && !this.#start)
        {
            this.#running = true;
            this.#laps = [];
            this.#elapsed = 0;
            this.#start = +new Date();
        }
    }


    stop()
    {
        if (!this.#running)
        {
            return this.#elapsed;
        }
        this.#running = false;
        this.#start = 0;
        return this.#elapsed = +new Date() - this.#start;
    }


    pause()
    {
        if (!this.#paused && this.#running)
        {
            this.#paused = true;
            this.#running = false;
            this.#elapsed = +new Date() - this.#start;
        }
        return this.#elapsed;
    }


    resume()
    {

        if (!this.#paused || this.stopped)
        {
            return;
        }

        this.#paused = false;
        this.#running = true;
        this.#start = +new Date() - this.#elapsed;
    }


    lap()
    {

        let prevLap = this.#laps[this.#laps.length - 1];

        if (!this.#running)
        {
            return prevLap ?? 0;
        }

        let
            prev = prevLap ?? this.#start,
            current = this.elapsed,
            time = current - prev;

        this.#laps.push(time);

        return time;
    }



    constructor(auto = true)
    {
        this.#laps = [];
        if (auto)
        {
            this.start();
        }
    }

}



export class TimeReader
{

    #timestamp;
    #data;

    get data()
    {
        return this.#data;
    }

    get days()
    {
        return '' + this.#data.days;
    }
    get hours()
    {
        return this.#data.hours < 10 ? `0${this.#data.hours}` : `${this.#data.hours}`;
    }

    get minutes()
    {
        return this.#data.minutes < 10 ? `0${this.#data.minutes}` : `${this.#data.minutes}`;
    }
    get seconds()
    {
        return this.#data.seconds < 10 ? `0${this.#data.seconds}` : `${this.#data.seconds}`;
    }
    get miliseconds()
    {
        return this.#data.miliseconds < 10 ? (this.#data.miliseconds < 100 ? '00' + this.#data.miliseconds : '0' + this.#data.miliseconds) : '' + this.#data.miliseconds;
    }

    get timestamp()
    {
        return this.#timestamp;
    }

    static of(timestamp)
    {
        return new TimeReader(timestamp);
    }

    constructor(timestamp)
    {
        if (!isInt(timestamp))
        {
            throw new TypeError('timestamp must be an integer');
        }

        this.#timestamp = timestamp;
        this.#data = {};


        for (let key in DIVIDERS)
        {

            let
                divider = DIVIDERS[key],
                value = Math.floor(timestamp / divider);
            timestamp -= value * divider;
            this.#data[key] = value;
        }
    }

    toString()
    {
        return `${this.days}d ${this.hours}:${this.minutes}:${this.seconds}.${this.miliseconds}s`;
    }


    export()
    {

        return Object.assign({ timestamp: this.#timestamp }, this.#data);
    }

}

