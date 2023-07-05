/* global unsafeWindow, globalThis */



const IS_UNSAFE = typeof unsafeWindow !== 'undefined',
    global = IS_UNSAFE ? unsafeWindow : globalThis ?? window,
    { JSON, document: document$1 } = global,
    isUndef = (param) => typeof param === 'undefined',
    isString = (param) => typeof param === 'string',
    isNumber = (param) => typeof param === 'number',
    isInt = (param) => Number.isInteger(param),
    isFloat = (param) => isNumber(param) && parseFloat(param) === param,
    isNumeric = (param) => isInt(param) || isFloat(param) || /^-?(?:[\d]+\.)?\d+$/.test(param),
    isNull = (param) => param === null,
    isCallable = (param) => typeof param === 'function',
    isFunction = isCallable;



function getClass(param)
{

    if (isFunction(param))
    {
        return param.name;
    }
    else if (param instanceof Object)
    {
        return Object.getPrototypeOf(param).constructor.name;
    }

}



function isJSON(param)
{

    if (!isString(param))
    {
        return false;
    }

    return (
        isNumeric(param) ||
        ['true', 'false', 'null'].includes(param) ||
        ['{', '[', '"'].includes(param.slice(0, 1)) ||
        ['}', ']', '"'].includes(param.slice(-1))
    );

}


function decode(value)
{

    if (isUndef(value) || isNull(value))
    {
        return null;
    }
    if (isJSON(value))
    {
        try
        {
            return JSON.parse(value);
        } catch (error)
        {
            // fallback for invalid json data
            return value;
        }

    }

    return value;
}


function encode(value)
{

    if (isFunction(value) || isUndef(value))
    {
        return value;
    }


    return isString(value) ? value : JSON.stringify(value);
}


/**
 * PHP BackedEnum like Api
 * Accepts more types than (str|int)
 */
class BackedEnum
{


    /**
     * This is the first defined case
     * Overrirde this to set your own default case
     */
    static get default()
    {
        return this.cases()[0];
    }


    /**
     * Get the enum from the value
     */
    static tryFrom(value)
    {

        if (getClass(value) === getClass(this) && !isFunction(value))
        {
            return value;
        }

        return this.cases().find(x => x.value === value);
    }

    /**
     * Throws if enum does not exists
     */
    static from(value)
    {

        const result = this.tryFrom(value);

        if (isUndef(result))
        {
            throw new TypeError("Cannot find matching enum to: " + encode(value));
        }
        return result;
    }


    /**
     * 
     * @returns {BackedEnum[]}
     */
    static cases()
    {
        return this.keys.map(x => this[x]);
    }


    /**
     * Gets names from the enums
     * they must be camel cased or uppercased
     */
    static get keys()
    {
        return Object.keys(this).filter(name => name[0] === name[0].toUpperCase() && this[name] instanceof BackedEnum);
    }

    /**
     * Get the number of values
     * length is buggy on static classes
     */
    static get size()
    {
        return this.keys.length;
    }


    //------------------- Instance implementation -------------------


    /**
     * Get current enum name
     * Only works if enum instanciated correctly
     * and after the constructor has been called
     */
    get name()
    {
        return Object.keys(this.constructor).find(
            key => this.constructor[key] === this
        ) ?? '';
    }


    constructor(value)
    {

        if (Object.getPrototypeOf(this) === BackedEnum.prototype)
        {
            throw new Error('Cannot instantiate BackedEnum directly, it must be extended.');
        }

        if (isUndef(value) || isFunction(value))
        {
            throw new TypeError('value is not valid');
        }

        Object.defineProperty(this, "value", {
            writable: false, configurable: false, enumerable: true,
            value
        });


    }
}

const MILISECOND = 1,
    SECOND = 1000,
    MINUTE = 60 * SECOND,
    HOUR = 60 * MINUTE,
    DAY = 24 * HOUR;


const DIVIDERS = {
    days: DAY,
    hours: HOUR,
    minutes: MINUTE,
    seconds: SECOND,
    miliseconds: MILISECOND
};

class Chronometer
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



class TimeReader
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

const
    PICTURES = './assets/pictures',
    WORLDS = PICTURES + '/worlds',
    HERO = PICTURES + '/hiro';

let loading = 0;

const listeners = new Set();


function createLoader(fn)
{

    let count = 0;

    return (elem) =>
    {
        count++;
        loading++;

        elem.onload = () =>
        {
            count--;
            loading--;
            if (count === 0)
            {
                fn();
                if (loading === 0)
                {
                    listeners.forEach(fn => fn());
                }
            }
        };
    };

}

const ANIMATIONS = {
    left: [...Array(9)].map((_, n) =>
        HERO + '/left/' + (n + 1) + '.png'
    ),
    right: [...Array(9)].map((_, n) =>
        HERO + '/right/' + (n + 1) + '.png'
    ),
};


const imageLoader = createLoader(() => console.debug('all loaded'));


function animate(sprites)
{
    let index = 0, counter = 0;
    const images = sprites.map(src =>
    {
        const img = new Image();
        imageLoader(img);
        img.src = src;
        return img;
    });


    return () =>
    {

        counter++;

        if ((counter % 4) === 0)
        {
            index++;
        }

        if (index >= images.length)
        {
            index = 0;
        }
        return images[index] ?? images[0];
    };

}



const
    animationLeft = animate(ANIMATIONS.left),
    animationRight = animate(ANIMATIONS.right);


class Direction extends BackedEnum
{
    static LEFT = new Direction('left');
    static RIGHT = new Direction('right');



    get method()
    {
        return this.value === 'left' ? animationLeft : animationRight;
    }
}




class Hiro
{

    element;
    hp = 3; //à définir 
    jumpHeight = 200; //basée sur des pixels
    gravity = 1; //Attraper des modificateurs ?
    jumpEventActive = true; // Désactiver la fonction de saut si le personnage est déjà en l'air => false
    x = 100;
    y = 350;

    minY = 150;
    maxY = 350;
    isJumping = false;
    deltaY = 0;

    direction = Direction.RIGHT;

    constructor(world)
    {


        this.world = world;
        addEventListener('keyup', ({ key }) =>
        {

            console.debug(key);

            if (/\s+/.test(key) && !this.isJumping)
            {
                this.isJumping = true;
            }

            if (key === 'ArrowLeft')
            {
                this.direction = Direction.LEFT;
            }

            if (key === 'ArrowRight')
            {
                this.direction = Direction.RIGHT;
            }

        });

    }


    draw()
    {
        const { ctx } = this.world;
        if (this.isJumping)
        {
            this.jump();
        }

        ctx.drawImage(this.direction.method(),
            this.x, this.y,
            150, 150
        );
    }


    jump()
    {

        if (!this.isJumping) { return; }
        if (this.deltaY === 0)
        {
            this.deltaY = -15;
        } else if (this.y <= this.minY)
        {
            this.deltaY = -1 * this.deltaY;
        } else if (this.y >= this.maxY)
        {
            this.deltaY = 0;
            this.isJumping = false;
        }

        this.y += this.deltaY;




    }





}

const STAGES = [...Array(8)].map((_, n) => WORLDS + '/stage' + (n + 1) + '.png');




class Stage
{



    level = 1;

    scrollSpeed = 10;
    deltaX = 0;

    get width()
    {
        return decode(this.world.canvas.width);


    }

    get height()
    {
        return decode(this.world.canvas.height);
    }

    #image;

    get decor()
    {

        this.#image ??= new Image();
        const src = STAGES[this.level] ?? STAGES[0];
        if (!this.#image.src.endsWith(src))
        {
            this.#image.src = src;
        }


        return this.#image;
    }

    constructor(world)
    {
        this.world = world;
    }



    draw()
    {
        const { ctx } = this.world;
        let { decor } = this;
        this.deltaX += this.scrollSpeed;
        if (this.deltaX >= this.width)
        {
            this.deltaX = 0;

        }


        ctx.drawImage(decor,
            this.deltaX, 0,
            this.width - this.deltaX, this.height,
            0, 0,
            this.width - this.deltaX, this.height
        );

        ctx.drawImage(decor,
            0, 0,
            this.deltaX, this.height,
            this.width - this.deltaX, 0,
            this.deltaX, this.height

        );



    }
}

class GameWorld
{



    get ctx()
    {
        return this.canvas.getContext('2d');
    }


    constructor({ element, chrono, timer } = {})
    {
        this.canvas = element.querySelector('canvas');

        this.chrono = chrono;
        this.timer = timer;
    }


    init()
    {




        this.chrono.start();
        this.stage = new Stage(this);
        this.hero = new Hiro(this);
        console.debug(this.ctx);


        requestAnimationFrame(() => this.draw());
    }


    draw()
    {

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let time = new TimeReader(this.chrono.elapsed), str = '';

        if (time.hours > 0)
        {
            str += time.hours + ':';
        }



        str += time.minutes + ':';

        str += time.seconds;

        this.timer.innerHTML = 'temps : ' + str;


        this.stage.draw();// tj en premier
        this.hero.draw();



        setTimeout(() =>
        {
            requestAnimationFrame(() => this.draw());
        }, 16);
    }
}

const timer = document.querySelector('.time'), chrono = new Chronometer();




// Variables de base pour le saut, la collision, le déplacement des images

const world = new GameWorld({
    element: document.querySelector('#game'),
    timer,
    chrono

});

world.init();







// addEventListener('keyup', ({ key }) =>
// {

//     console.debug(key === ' ');



// });
//# sourceMappingURL=main.js.map
