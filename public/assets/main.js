/* global unsafeWindow, globalThis */



const IS_UNSAFE = typeof unsafeWindow !== 'undefined',
    noop = () => { },
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

function runAsync(callback, ...args)
{
    if (isFunction(callback))
    {
        setTimeout(callback, 0, ...args);
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
    #start = 0;
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
        return this.#start === 0;
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
        let start = this.#start;
        this.#start = 0;
        return this.#elapsed = +new Date() - start;
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

class Box
{


    static of(gameobj)
    {
        return new Box(gameobj);
    }


    min = {
        x: 0,
        y: 0,
    };

    max = {
        x: 0,
        y: 0,
    };


    constructor({ x, y, width, height })
    {
        this.min.x = x;
        this.max.x = x + width;
        this.min.y = y;
        this.max.y = y + height;
    }

    /**
     * @link https://github.com/mrdoob/three.js/blob/dev/src/math/Box2.js
     */
    intersects(box)
    {
        if (box instanceof Box === false)
        {
            return false;
        }

        return box.max.x < this.min.x || box.min.x > this.max.x ||
            box.max.y < this.min.y || box.min.y > this.max.y ? false : true;

    }
}



class GameObject
{


    world;

    x = 0;
    y = 0;
    width = 0;
    height = 0;
    isEnemy = false;
    // gain score when intersecting non ennemy object || intersecting ennemy + attacking
    scoreGain = 0;


    #box;
    get box()
    {
        return this.#box ??= Box.of(this);

    }


    isIntersecting(obj)
    {
        if (obj instanceof GameObject === false)
        {
            return false;
        }

        return this.box.intersects(obj.box);
    }


    /**
     * @abstract
     */
    draw()
    {
        throw new Error(getClass(this) + '.draw() is not implemented');
    }



    constructor(world)
    {
        if (world instanceof GameWorld === false)
        {
            throw new TypeError('Invalid world !!!');
        }

        this.world = world;
    }







}

const PICTURES = './assets/pictures',
    WORLDS = PICTURES + '/worlds',
    HERO = PICTURES + '/hiro';

let loading = 0;

const listeners = new Set();


function createLoader(fn = noop)
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

const imageLoader = createLoader();


function animate(sprites, loop = true)
{
    let
        index = 0,
        counter = 0;


    const images = sprites.map(src =>
    {
        const img = new Image();
        imageLoader(img);
        img.src = src;
        return img;
    });


    return () =>
    {

        // ends animation with a false
        let flag = true;

        counter++;

        if ((counter % 4) === 0)
        {
            index++;
        }


        if (index >= images.length)
        {
            index = 0;
            flag = loop;
        }


        return flag && images[index];
    };

}




const STATES = new Map([
    [
        'moving', [
            // sprites
            [...Array(9)].map((_, n) => HERO + '/moving/' + (n + 1) + '.png'),

            //can loop
            true
        ]

    ],
    [
        'attacking', [
            [...Array(6)].map((_, n) => HERO + '/attacking/' + (n + 1) + '.png'),
            // cannot loop
            false
        ]
    ],

]);



class HiroStates extends BackedEnum
{
    static MOVING = new HiroStates('moving');
    static ATTACKING = new HiroStates('attacking');



    get sprites()
    {
        return STATES.get(this.value)[0];
    }

    #animation;

    get animation()
    {
        return this.#animation ??= animate(...STATES.get(this.value));
    }
}




class Hiro extends GameObject
{


    hp = 3; //à définir 

    // box
    x = 100;
    y = 350;
    width = 150;
    height = 150;

    // jump limits
    minY = 150;
    maxY = 350;

    // jump strength (in px)
    gravity = 1;
    jumpStep = 15;
    deltaY = 0;

    // state jumping
    isJumping = false;

    // state attacking
    isAttacking = false;

    // points to the character state
    state = HiroStates.MOVING;


    // points to the current sprite (false sets state to moving)
    currentSprite = false;



    draw()
    {
        const { ctx } = this.world;


        if (this.isJumping)
        {
            this.jump();
        }

        if (this.isAttacking)
        {
            this.attack();
        }

        // no else as attacking state can be changed
        if (!this.isAttacking)
        {
            this.move();
        }

        // checks intersections

        this.intersections();



        ctx.drawImage(this.currentSprite,
            this.x, this.y,
            this.width, this.height
        );
    }



    move()
    {
        this.state = HiroStates.MOVING;
        this.currentSprite = this.state.animation();
    }

    attack()
    {

        if (this.isAttacking)
        {

            this.state = HiroStates.ATTACKING;
            if (false === (this.currentSprite = this.state.animation()))
            {
                this.isAttacking = false;
            }

        }

        // no else as it can be unset
        if (!this.isAttacking)
        {
            this.state = HiroStates.MOVING;
            this.move();
        }

    }



    jump()
    {

        if (!this.isJumping)
        {
            return;
        }
        // jumping up
        if (this.deltaY === 0)
        {
            this.deltaY = - (this.jumpStep * this.gravity);
        }
        // jump up => down
        else if (this.y <= this.minY)
        {
            this.deltaY = -1 * this.deltaY;
            this.y = this.minY;

        }
        // jumping down
        else if (this.y >= this.maxY)
        {
            this.deltaY = 0;
            this.isJumping = false;
            this.y = this.maxY;
            return;
        }

        this.y += this.deltaY;
    }


    intersections()
    {

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

function getListenersForEvent(listeners, type)
{
    return listeners.filter(item => item.type === type);
}


class EventManager
{

    #listeners;
    #useasync;

    get length()
    {
        return this.#listeners.length;
    }

    constructor(useasync = true)
    {
        this.#listeners = [];
        this.#useasync = useasync === true;
    }


    on(type, listener, once = false)
    {

        if (!isString(type))
        {
            throw new TypeError('Invalid event type, not a String.');
        }

        if (!isFunction(listener))
        {
            throw new TypeError('Invalid listener, not a function');
        }



        type.split(/\s+/).forEach(type =>
        {
            this.#listeners.push({
                type, listener, once: once === true,
            });
        });

        return this;
    }


    one(type, listener)
    {
        return this.on(type, listener, true);
    }


    off(type, listener)
    {

        if (!isString(type))
        {
            throw new TypeError('Invalid event type, not a String.');
        }

        type.split(/\s+/).forEach(type =>
        {

            this.#listeners = this.#listeners.filter(item =>
            {
                if (type === item.type)
                {
                    if (listener === item.listener || !listener)
                    {
                        return false;
                    }
                }
                return true;
            });
        });
        return this;
    }


    trigger(type, data = null, async = null)
    {

        let event;

        async ??= this.#useasync;

        if (type instanceof Event)
        {
            event = type;
            event.data ??= data;
            type = event.type;
        }

        if (!isString(type) && type instanceof Event === false)
        {
            throw new TypeError('Invalid event type, not a String|Event.');
        }


        const types = [];

        type.split(/\s+/).forEach(type =>
        {

            if (types.includes(type))
            {
                return;
            }

            types.push(type);

            for (let item of getListenersForEvent(this.#listeners, type))
            {

                if (item.type === type)
                {

                    if (async)
                    {
                        runAsync(item.listener, event ?? { type, data });

                    } else
                    {
                        item.listener(event ?? { type, data });
                    }

                    if (item.once)
                    {
                        this.off(type, item.listener);
                    }
                }
            }


        });

        return this;


    }


    mixin(binding)
    {

        if (binding instanceof Object)
        {
            ['on', 'off', 'one', 'trigger'].forEach(method =>
            {
                Object.defineProperty(binding, method, {
                    enumerable: false, configurable: true,
                    value: (...args) =>
                    {
                        this[method](...args);
                        return binding;
                    }
                });
            });

        }

        return this;
    }


    static mixin(binding, useasync = true)
    {
        return (new EventManager(useasync)).mixin(binding);
    }

    static on(type, listener, once = false)
    {

        return instance.on(type, listener, once);
    }

    static one(type, listener)
    {

        return instance.one(type, listener);
    }

    static off(type, listener)
    {

        return instance.off(type, listener);
    }

    static trigger(type, data = null, async = null)
    {

        return instance.trigger(type, data, async);
    }

}



const instance = new EventManager();

let init = false;


class GameWorld
{


    element;
    paused = true;
    timeout = null;

    score = 0;

    objects = [];

    get ctx()
    {
        return this.canvas.getContext('2d');
    }


    get width()
    {
        return decode(this.canvas.width);
    }


    get height()
    {
        return decode(this.canvas.height);
    }


    get time()
    {
        const reader = TimeReader.of(this.chrono.elapsed);
        return (reader.hours > 0 ? reader.hours + ':' : '') + reader.minutes + ':' + reader.seconds;
    }


    constructor({ element } = {})
    {
        this.element = element;
        this.chrono = new Chronometer(false);
        this.displayScore = element.querySelector('#score');
        this.displayTime = element.querySelector('#time');
        this.canvas = element.querySelector('canvas');

        EventManager.mixin(this, false);

    }


    destroy()
    {
        this.pause();
        init = false;

        requestAnimationFrame(() => this.clearScreen());

    }


    init()
    {
        if (!init)
        {
            this.stage = new Stage(this);
            this.hero = new Hiro(this);
            this.objects.length = 0;
            this.objects.push(this.stage, this.hero);
            this.resume();
        }

    }



    pause()
    {

        if (!this.paused)
        {
            this.paused = true;
            this.chrono.pause();
            if (this.timeout)
            {
                clearTimeout(this.timeout);
                this.timeout = null;
            }

            this.trigger('paused');
        }

    }


    resume()
    {

        if (this.paused)
        {
            this.paused = false;
            if (this.chrono.stopped)
            {
                this.chrono.start();
                this.trigger('started');
            } else
            {
                this.chrono.resume();
                this.trigger('resume');
            }
            requestAnimationFrame(() => this.draw());

        }


    }



    clearScreen()
    {
        // clears ouput before redrawing
        this.ctx.clearRect(0, 0, this.width, this.height);
    }


    draw()
    {

        if (this.paused)
        {
            return;
        }


        const { displayScore, displayTime } = this;





        this.clearScreen();


        // draw objects
        this.objects.forEach(obj => obj.draw());

        // this is generated after as score can change when drawing
        displayScore.innerHTML = this.score;
        displayTime.innerHTML = this.time;


        this.timeout = setTimeout(() =>
        {
            requestAnimationFrame(() => this.draw());
        }, 16); // ~60 fps
    }
}

/**
 * SCSS Style
 */





// init game engine

const world = new GameWorld({
    element: document.querySelector('#game')
});

// listen to keyboard events


addEventListener('keydown', e =>
{




    const { key } = e;

    console.debug(key);

    // space key
    if (key === ' ')
    {
        if (world.paused)
        {
            return;
        }

        e.preventDefault();
        if (!world.hero.isJumping)
        {
            world.hero.isJumping = true;
        }
    }
    // pause key
    else if (key === 'p')
    {
        e.preventDefault();
        if (!world.paused)
        {
            world.pause();
        } else
        {
            world.resume();
        }
    }

    // atttttackk !!!

    else if (key === "e")
    {
        if (world.paused)
        {
            return;
        }

        e.preventDefault();

        if (!world.hero.isAttacking)
        {
            world.hero.isAttacking = true;
        }

    }




});


addEventListener('click', ({ target }) =>
{
    if (world.paused)
    {
        return;
    }

    if (target.closest('#game') && !world.hero.isAttacking)
    {
        world.hero.isAttacking = true;
    }


});


// engage full warp !!!
world.init();
//# sourceMappingURL=main.js.map
