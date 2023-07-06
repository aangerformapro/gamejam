/* global unsafeWindow, globalThis */



const IS_UNSAFE = typeof unsafeWindow !== 'undefined',
    noop = () => { },
    global = IS_UNSAFE ? unsafeWindow : globalThis ?? window,
    { JSON, document: document$1 } = global,
    isPlainObject = (param) => param instanceof Object && Object.getPrototypeOf(param) === Object.prototype,
    isUndef = (param) => typeof param === 'undefined',
    isString = (param) => typeof param === 'string',
    isNumber = (param) => typeof param === 'number',
    isInt = (param) => Number.isInteger(param),
    isFloat = (param) => isNumber(param) && parseFloat(param) === param,
    isNumeric = (param) => isInt(param) || isFloat(param) || /^-?(?:[\d]+\.)?\d+$/.test(param),
    isArray = (param) => Array.isArray(param),
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



function isValidSelector(selector)
{

    try
    {
        return isString(selector) && null === document$1.createElement('template').querySelector(selector);

    } catch (e)
    {
        return false;
    }

}


function uuidv4()
{
    let uuid = "", i, random;
    for (i = 0; i < 32; i++)
    {
        random = Math.random() * 16 | 0;
        if (i == 8 || i == 12 || i == 16 || i == 20)
        {
            uuid += "-";
        }
        uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16);
    }
    return uuid;
}


function isElement(elem)
{
    return elem instanceof Object && isFunction(elem.querySelector);
}


function toCamel(name = '')
{

    if (!isString(name))
    {
        throw new TypeError('name must be a String');
    }

    let index;
    while (-1 < (index = name.indexOf("-")))
    {
        name = name.slice(0, index) + name.slice(index + 1, 1).toUpperCase() + name.slice(index + 2);
    }
    return name;
}

function isHTML(param)
{
    return isString(param) && param.startsWith('<') && param.endsWith('>');
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


function parseAttributes(obj, /** @type {string|undefined} */ name)
{

    let result = [];

    for (let key in obj)
    {
        const value = obj[key];

        if (isPlainObject(value))
        {
            result = result.concat(parseAttributes(value)).map(
                item => [[key, item[0]].join('-'), item[1]]
            );

            continue;
        }
        result.push([key, encode(value)]);
    }
    return result.map(item => name ? [[name, item[0]].join('-'), item[1]] : item);
}





function validateHtml(html)
{
    return isString(html) || isElement(html) || isArray(html);
}

const RESERVED_KEYS = [
    'data', 'dataset',
    'html', 'tag',
    'callback'
];


/**
 * Shorthand to create element effortlessly
 * if no params are given a <div></div> will be generated
 * 
 * @param {String} [tag] tag name / html / emmet
 * @param {Object} [params] params to inject into element
 * @param {String|HTMLElement|String[]|HTMLElement[]} [html] 
 * @returns 
 */
function createElement(
    tag = 'div',
    params = {},
    html = null
)
{

    if (isPlainObject(tag))
    {
        params = tag;
        tag = params.tag ?? 'div';
    }

    if (typeof tag !== 'string')
    {
        throw new TypeError('tag must be a String');
    }

    if (validateHtml(params))
    {
        html = params;
        params = {};
    }

    const elem = isHTML(tag) ? html2element(tag) : document$1.createElement(tag);

    let callback;

    if (!isElement(elem))
    {
        throw new TypeError("Invalid tag supplied " + tag);
    }

    if (isPlainObject(params))
    {
        const data = [];

        callback = params.callback;

        if (!validateHtml(html))
        {
            html = params.html;
        }

        if (isPlainObject(params.data))
        {
            data.push(...parseAttributes(params.data, 'data'));
        }

        if (isPlainObject(params.dataset))
        {
            data.push(...parseAttributes(params.dataset, 'data'));
        }


        data.forEach(item => elem.setAttribute(...item));


        if (isArray(params.class))
        {
            params.class = params.class.join(" ");
        }

        for (let attr in params)
        {
            if (RESERVED_KEYS.includes(attr))
            {
                continue;
            }

            let value = params[attr];

            if (isString(value))
            {
                let current = elem.getAttribute(attr) ?? '';
                if (current.length > 0)
                {
                    value = current + ' ' + value;
                }

                elem.setAttribute(attr, value);
            }
            else if (isPlainObject(value))
            {
                parseAttributes(value, attr).forEach(item => elem.setAttribute(...item));
            }
            else
            {
                elem[attr] = value;
            }
        }


    }

    if (validateHtml(html))
    {
        if (!isArray(html))
        {
            html = [html];
        }

        for (let child of html)
        {
            if (isElement(child))
            {
                elem.appendChild(child);
            }
            else
            {
                elem.innerHTML += child;
            }
        }
    }

    if (isFunction(callback))
    {
        callback(elem);
    }

    return elem;

}

/**
 * Creates an HTMLElement from html code
 * @param {string} html
 * @returns {HTMLElement|Array|undefined}
 */
function html2element(html)
{
    if (isString(html) && html.length > 0)
    {
        let template = createElement('template', html),
            content = template.content;
        if (content.childNodes.length === 0)
        {
            return;
        }
        else if (content.childNodes.length > 1)
        {
            return [...content.childNodes];
        }
        return content.childNodes[0];
    }
}


/**
 * Resolves an URL
 * 
 * @param {URL|String} url 
 * @returns {URL|undefined}
 */
function getUrl(url)
{
    if (isString(url))
    {
        const a = getUrl.a ??= createElement("a");
        getUrl.a.href = url;
        url = new URL(a.href);
    }


    if (url instanceof URL)
    {
        return url;
    }

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
        let offsetW = Math.floor(width / 4), offsetH = Math.floor(height / 4);


        this.min.x = x + offsetW;
        this.max.x = x + width - offsetW;
        this.min.y = y + offsetH;
        this.max.y = y + height - offsetH;
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

    /**
     * @abstract
     */
    get x()
    {

        throw new Error(getClass(this) + '.x not implemented');

    }

    /**
     * @abstract
     */
    get y()
    {
        throw new Error(getClass(this) + '.y not implemented');

    }

    /**
     * @abstract
     */

    get width()
    {
        throw new Error(getClass(this) + '.width not implemented');

    }
    /**
     * @abstract
     */
    get height()
    {
        throw new Error(getClass(this) + '.height not implemented');

    }

    isEnemy = false;
    // gain score when intersecting non ennemy object || intersecting ennemy + attacking
    get scoreGain()
    {
        return 0;
    }



    get name()
    {
        return getClass(this);
    }

    get ctx()
    {
        return this.world.ctx;
    }


    get box()
    {
        return Box.of(this);

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


    destroy()
    {

        this.destroyed = true;

    }





}

const SOUNDS = './assets/sounds',
    PICTURES = './assets/pictures',
    WORLDS = PICTURES + '/worlds',
    HERO = PICTURES + '/hiro',
    ENEMY = PICTURES + '/enemy';

const SPRITES$1 = [...Array(3)].map((_, n) => ENEMY + '/loot/' + (n + 1) + '.png');




const animationMoving$1 = new Map();


class LootState extends BackedEnum
{
    static MOVING = new LootState('moving');


    get sprites()
    {
        return STATES.get(this.value)[0];
    }



    getAnimation(instance)
    {

        if (!animationMoving$1.has(instance))
        {
            animationMoving$1.set(instance, animate(SPRITES$1));
        }
        return animationMoving$1.get(instance);
    }
}


class Loot extends GameObject
{




    // implement gameObject
    width = 100;
    height = 100;

    y = 150;


    #x = null;
    get x()
    {
        return this.#x ??= this.world.width + Math.floor(Math.random() * this.world.width * Math.ceil(Math.random() * 3));

    }

    set x(value)
    {
        this.#x = value;
    }
    #points;
    get scoreGain()
    {
        return this.#points ??= Math.ceil(Math.random() * 250);
    }

    isEnemy = false;
    isDead = false;



    draw()
    {
        const { ctx } = this;

        this.move();


        // don't draw it out of the canvas
        if (this.x > this.world.width - this.width)
        {
            return;
        }



        ctx.drawImage(this.currentSprite,
            this.x, this.y,
            this.width, this.height
        );
    }


    move()
    {

        this.state = LootState.MOVING;


        // move with the stage
        if (!this.world.hero.isDead)
        {
            this.currentSprite = this.state.getAnimation(this)();
            this.x -= this.world.stage.speed;
        }



        if (this.x <= 0)
        {
            this.#x = null;
        }
    }



    destroy()
    {
        super.destroy();

        this.isDead = true;
    }



}

/**
 * Private properties
 */
const
    SEP$1 = ':',
    _prefixes = new Map(),
    _hooks = new Map(),
    _queue = [];


class DataStoreType extends BackedEnum
{
    static SYNC = new DataStoreType('sync');
    static ASYNC = new DataStoreType('async');
}


function safeNotEqual(value, newValue)
{
    return value != value ? newValue == newValue : value !== newValue || ((value && typeof value === 'object') || typeof value === 'function');
}


function GetDataStoreHook(
    /** @type {DataStore} */ store,
    /** @type {string} */ name,
    /** @type {function} */ init = noop
)
{

    let $that;

    if ($that = _hooks.get(store).get(name))
    {
        return $that;
    }

    let stop, value = null;

    const
        subscribers = new Set(),
        safeSet = (value) =>
        {
            if (!isUndef(value) && !isNull(value))
            {
                set(value);
            }
        },
        set = (newValue) =>
        {
            if (safeNotEqual(value, newValue))
            {
                value = newValue;

                const canRun = !_queue.length;

                for (let sub of subscribers)
                {
                    sub[1]();
                    _queue.push([sub[0], value]);
                }

                if (canRun)
                {
                    store.setItem(name, value);

                    for (let item of _queue)
                    {
                        item[0](item[1]);
                    }
                    _queue.length = 0;
                }
            }

        },
        update = (fn) =>
        {
            if (isFunction(fn))
            {
                set(fn(value));
            }
        },
        subscribe = (subscriber, notifier = noop) =>
        {
            if (isFunction(subscriber))
            {
                const obj = [subscriber, notifier];

                subscribers.add(obj);

                if (subscribers.size === 1)
                {
                    stop = init(set) ?? noop;
                }

                subscriber(value);

                return () =>
                {
                    subscribers.delete(obj);
                    if (0 === subscribers.size && stop)
                    {
                        stop();
                        stop = null;
                    }
                };

            }

        },
        get = (defaultValue = null) =>
        {
            let value = store.getItem(name);


            if (null === value)
            {
                if (isFunction(defaultValue))
                {
                    defaultValue = defaultValue();

                    if (defaultValue instanceof Promise)
                    {
                        defaultValue.then(newValue => safeSet(newValue));
                    }
                    else 
                    {
                        safeSet(defaultValue);
                    }
                }


                return defaultValue;

            }


            return value;

        };

    $that = {
        subscribe, set, update, get
    };
    Object.defineProperty($that, 'length', { configurable: true, get: () => subscribers.size });
    _hooks.get(store).set(name, $that);
    return $that;
}




class DataStore
{

    get type()
    {
        return DataStoreType.SYNC;
    }

    constructor(prefix = '')
    {

        if (prefix && !prefix.endsWith(SEP$1))
        {
            prefix += SEP$1;
        }

        _prefixes.set(this, prefix);
        _hooks.set(this, new Map());
    }


    // ---------------- Helper Methods ----------------


    static get type()
    {
        return this.prototype.type;
    }

    key(/** @type {string} */name)
    {
        return _prefixes.get(this) + name;
    }



    // ---------------- Subscriptions ----------------

    subscribe(/** @type {string} */name, /** @type {function} */subscriber, /** @type {function} */ notifier = noop)
    {
        return this.hook(name).subscribe(subscriber, notifier);
    }


    // ---------------- Common Methods ----------------


    hasItem(/** @type {string} */name)
    {
        return this.getItem(name) !== null;
    }

    removeItem(name)
    {
        this.setItem(name, null);
    }

    setMany(items = {})
    {
        const result = new Map();
        for (let name in items)
        {
            const value = items[name];
            result.set(name, this.setItem(name, value));
        }

        return result;
    }

    getMany(keys = [], defaultValue = null)
    {
        return keys.map(key => [key, this.getItem(key, defaultValue)]);
    }


    hook(/** @type {string} */name, defaultValue = null)
    {
        return GetDataStoreHook(this, name, set =>
        {
            set(this.getItem(name, defaultValue));

        });
    }


    clear()
    {

        const keys = this.keys;

        for (let key of keys)
        {
            this.removeItem(key);
        }

        return keys;
    }



    // ---------------- Abstract Methods ----------------


    get keys()
    {
        throw new Error(getClass(this) + '.keys not implemented.');
    }



    getItem(/** @type {string} */name, defaultValue = null)
    {

        if (isFunction(defaultValue))
        {

            defaultValue = defaultValue();
            if (defaultValue instanceof Promise)
            {
                defaultValue.then(value => this.setItem(name, value));
            }
            else
            {
                this.setItem(name, defaultValue);
            }

        }

        return defaultValue;
    }

    setItem(/** @type {string} */name, value)
    {
        throw new Error(getClass(this) + '.setItem() not implemented.');
    }
}

/**
 * LocalStorage Stubs for SSR
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Storage/key
 */


if (typeof Storage === "undefined")
{


    const Data = new Map();

    class Storage
    {
        get length()
        {
            return Data.size;
        }

        key(index)
        {
            return [...Data.keys()][index] ?? null;

        }

        clear()
        {
            Data.clear();
        }

        getItem(keyName)
        {
            return Data.get(keyName) ?? null;
        }
        setItem(keyName, keyValue)
        {
            Data.set(String(keyName), String(keyValue));
        }

        getItem(keyName)
        {
            return Data.get(keyName) ?? null;
        }

        removeItem(keyName)
        {
            Data.delete(keyName);
        }
    }

    globalThis.Storage ??= Storage;
    globalThis.localStorage ??= new Storage();
    globalThis.sessionStorage ??= new Storage();

    globalThis.addEventListener ??= () => { };
    globalThis.removeEventListener ??= () => { };
}

const VENDOR_KEY = 'NGSOFT:UUID', SEP = ':';


function getDefaultPrefix()
{

    let prefix = '';


    if (!IS_UNSAFE)
    {
        return prefix;
    }

    if (null === (prefix = localStorage.getItem(VENDOR_KEY)))
    {
        localStorage.setItem(VENDOR_KEY, prefix = uuidv4() + SEP);
    }

    return prefix;
}




class WebStore extends DataStore
{


    #store;

    get store()
    {
        return this.#store;
    }


    constructor( /** @type {Storage} */   storage, prefix = getDefaultPrefix())
    {

        storage ??= localStorage;
        if (storage instanceof Storage === false)
        {
            throw new TypeError('storage not an instance of Storage');
        }
        super(prefix);
        this.#store = storage;
    }

    get keys()
    {

        const result = [], prefix = this.key(''), { store } = this;

        for (let i = 0; i < store.length; i++)
        {

            let key = store.key(i);
            if (key.startsWith(prefix))
            {
                result.push(key.slice(prefix.length));
            }

        }

        return result;
    }



    getItem(/** @type {string} */name, defaultValue = null)
    {

        let value = this.store.getItem(this.key(name));

        if (!isString(value))
        {
            return super.getItem(name, defaultValue);
        }

        return super.getItem(name, decode(value));
    }

    setItem(/** @type {string} */name, value)
    {

        if (value === null)
        {
            this.store.removeItem(this.key(name));
        }
        else
        {
            this.store.setItem(this.key(name), encode(value));
        }

        return value;
    }



    hook(/** @type {string} */name, defaultValue = null)
    {
        return GetDataStoreHook(this, name, set =>
        {

            const listener = e =>
            {

                if (e.storageArea === this.store)
                {
                    if (e.key === this.key(name))
                    {
                        set(decode(e.newValue));
                    }
                }
            };


            addEventListener('storage', listener);

            set(this.getItem(name, defaultValue));

            return () =>
            {
                removeEventListener('storage', listener);

            };

        });

    }

}


const LocalStore = new WebStore(); new WebStore(sessionStorage);

const muted = LocalStore.hook('muted', false);



[...Array(8)].map((_, n) => SOUNDS + '/soundtrack/' + (n + 1) + '.ogg');


const EXT = '.ogg', players = new Map(), target = document.querySelector('#audioplayers');

class SoundTrack extends BackedEnum
{

    static Stage1 = new SoundTrack(1);
    static Stage2 = new SoundTrack(2);
    static Stage3 = new SoundTrack(3);
    static Stage4 = new SoundTrack(4);
    static Stage5 = new SoundTrack(5);
    static Stage6 = new SoundTrack(6);
    static Stage7 = new SoundTrack(7);
    static Stage8 = new SoundTrack(8);



    static pauseAll()
    {
        this.cases().forEach(x => x.pause());
    }

    get url()
    {
        return getUrl(SOUNDS + '/soundtrack/' + this.value + EXT);
    }

    set player(el)
    {
        players.set(this, el);
        muted.subscribe(value =>
        {
            el.muted = value ? value : null;
        });
    }


    get player()
    {
        return players.get(this);
    }


    play()
    {
        this.load();
        return playAudio(this.player);
    }

    pause()
    {
        this.player?.pause();
    }

    destroy()
    {
        this.pause();
        players.delete(this);
    }


    load()
    {
        if (!players.has(this))
        {

            const elem = createElement('audio', {
                src: this.url
            });

            target.appendChild(elem);
            this.player = elem;
        }
    }
}


class SoundEffect extends BackedEnum
{


    static DEATH = new SoundEffect('death');
    static DROP = new SoundEffect('drop');
    static HIT = new SoundEffect('hit');
    static JUMP = new SoundEffect('jump');
    static LEVEL = new SoundEffect('level');

    static pauseAll()
    {
        this.cases().forEach(x => x.pause());
    }

    get url()
    {
        return getUrl(SOUNDS + '/effects/' + this.value + EXT);
    }

    set player(el)
    {
        players.set(this, el);
        muted.subscribe(value =>
        {
            el.muted = value ? value : null;
        });
    }


    get player()
    {
        return players.get(this);
    }


    play()
    {
        this.load();
        return playAudio(this.player);
    }

    pause()
    {
        this.player?.pause();
    }

    destroy()
    {
        this.pause();
        players.delete(this);
    }


    load()
    {
        if (!players.has(this))
        {

            const elem = createElement('audio', {
                src: this.url
            });

            target.appendChild(elem);
            this.player = elem;
        }
    }
}





function playAudio(el)
{
    return new Promise((resolve, reject) =>
    {


        if (isElement(el))
        {
            el.currentTime = 0;

            setTimeout(() =>
            {
                resolve(el);
            }, (el.duration * 1000) + 200);

            if (el.paused && !el.muted)
            {
                // chrome 2018 forbade autoplay and throws error
                try
                {
                    el.play();
                } catch (err)
                {
                    console.warn(err);
                }
            }
        } else
        {
            reject(new TypeError("not an element"));
        }


    });
}

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




const STATES$2 = new Map([
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

    [
        'dead', [
            [...Array(10)].map((_, n) => HERO + '/dead/' + (n + 1) + '.png'),
            // cannot loop
            false
        ]
    ],
]);



class HiroStates extends BackedEnum
{
    static MOVING = new HiroStates('moving');
    static ATTACKING = new HiroStates('attacking');
    static DEAD = new HiroStates('dead');


    get sprites()
    {
        return STATES$2.get(this.value)[0];
    }

    #animation;

    getAnimation()
    {
        return this.#animation ??= animate(...STATES$2.get(this.value));
    }
}




class Hiro extends GameObject
{

    maxHP = 6;
    hp = 6; //à définir 

    killCount = 0;

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


    //state dead
    isDead = false;

    // points to the character state
    state = HiroStates.MOVING;


    // points to the current sprite (false sets state to moving)
    currentSprite = false;

    // hero can intercepts object one time
    intercepting = [];



    draw()
    {
        const { ctx } = this;


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

        if (this.isDead)
        {
            this.dead();
        }



        ctx.drawImage(this.currentSprite,
            this.x, this.y,
            this.width, this.height
        );
    }


    dead()
    {

        if (!this.isDead)
        {
            return;
        }
        this.state = HiroStates.DEAD;
        if (false === (this.currentSprite = this.state.getAnimation(this)()))
        {
            this.world.pause();

            this.world.trigger('dead', { item: this });
        }



    }



    move()
    {
        this.state = HiroStates.MOVING;
        this.currentSprite = this.state.getAnimation(this)();
    }

    attack()
    {

        if (this.isAttacking)
        {

            this.state = HiroStates.ATTACKING;
            if (false === (this.currentSprite = this.state.getAnimation(this)()))
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


        // clears unique intercepts
        this.intercepting = this.intercepting.filter(item =>
        {


            if (item.destroyed || !item.isIntersecting(this))
            {
                return false;
            }

            return true;
        });


        // copying as it can be destroyed
        for (let item of [...this.world.objects])
        {


            if (item.isIntersecting(this) && !this.intercepting.includes(item))
            {

                if (item.scoreGain > 0)
                {

                    this.intercepting.push(item);

                    if (!item.isEnemy || this.isAttacking)
                    {
                        this.world.score += item.scoreGain;

                        this.world.destroyObject(item);
                        if (item instanceof Loot)
                        {
                            SoundEffect.DROP.play();
                        }

                        // generate a new enemy
                        if (item.isEnemy)
                        {
                            this.killCount++;
                            this.world.stage.generateEnemy();
                        }


                        // do something to the item (animation and destroy)
                        this.world.trigger('scoregain', { item });


                    }
                    // lose hp
                    else if (item.isEnemy)
                    {

                        this.hp--;
                        this.world.trigger('hploss', { item });
                        if (this.hp <= 0)
                        {
                            // this.world.pause();
                            // alert('You are dead !!!');
                            // this.world.trigger('dead', { item: this });
                            SoundEffect.DEATH.play();

                            this.isDead = true;
                        } else
                        {
                            SoundEffect.HIT.play();
                        }

                    }
                }


            }



        }



    }



}

const SPRITES = [
    [...Array(9)].map((_, n) => ENEMY + '/cyclops/' + (n + 1) + '.png'),
    [...Array(9)].map((_, n) => ENEMY + '/minos/' + (n + 1) + '.png'),
    [...Array(9)].map((_, n) => ENEMY + '/wherewolf/' + (n + 1) + '.png'),
    [...Array(9)].map((_, n) => ENEMY + '/orc/' + (n + 1) + '.png'),

];


const STATES$1 = new Map([
    [
        'moving', [
            // sprites
            [...Array(9)].map((_, n) => ENEMY + '/demon/moving/' + (n + 1) + '.png'),

            //can loop
            true
        ]

    ]

]);


const animationMoving = new Map();


class DemonState extends BackedEnum
{
    static MOVING = new DemonState('moving');


    get sprites()
    {
        return STATES$1.get(this.value)[0];
    }



    getAnimation(instance)
    {

        if (!animationMoving.has(instance))
        {
            animationMoving.set(instance, animate(instance.sprites));
        }
        return animationMoving.get(instance);
    }
}



class Demon extends GameObject
{


    isEnemy = true;
    isDead = false;

    #points;
    // gain score when intersecting non ennemy object || intersecting ennemy + attacking
    get scoreGain()
    {
        return this.#points ??= Math.ceil(Math.random() * 500);
    }

    // GameObject implementation


    get width()
    {
        return this.world.hero.width;
    }

    get height()
    {
        return this.world.hero.height;
    }


    get y()
    {
        return this.world.hero.maxY;
    }

    set y(value)
    {
        //noop
    }

    // end of the map
    #x;
    get x()
    {
        return this.#x ??= this.world.width + Math.floor(Math.random() * this.world.width * Math.ceil(Math.random() * 3));
    }

    set x(value)
    {
        this.#x = value;
    }


    #sprites;

    get sprites()
    {
        return this.#sprites ??= SPRITES[Math.floor(Math.random() * SPRITES.length)];
    }

    // demon state
    state = DemonState.MOVING;


    // points to the current sprite (false sets state to moving)
    currentSprite = false;




    draw()
    {

        const { ctx } = this;

        this.move();


        // don't draw it out of the canvas
        if (this.x > this.world.width - this.width)
        {
            return;
        }



        ctx.drawImage(this.currentSprite,
            this.x, this.y,
            this.width, this.height
        );

    }



    move()
    {

        this.state = DemonState.MOVING;


        // move with the stage
        if (!this.world.hero.isDead)
        {
            this.currentSprite = this.state.getAnimation(this)();
            this.x -= this.world.stage.speed;
        }



        if (this.x <= 0)
        {
            this.#x = null;
        }

    }


    destroy()
    {

        super.destroy();

        this.isDead = true;
    }


}

const STAGES = [...Array(8)].map((_, n) => WORLDS + '/stage' + (n + 1) + '.png');





class Stage extends GameObject
{


    // STAGES[level]

    #level = 0;

    get level()
    {
        return this.#level;
    }
    set level(value)
    {
        this.#level = value;
        this.reset();
        this.world.trigger('levelchange');
    }

    enemies = 0;
    enemiesPerStageRatio = 5;


    get soundtrack()
    {
        return SoundTrack.cases()[this.level];
    }

    get maxEnemies()
    {
        return this.stage * this.enemiesPerStageRatio;
    }

    get stage()
    {
        return this.level + 1;
    }

    // number of loops n * (deltaX === width)
    loops = 0;

    loopIncreased = false;


    // max loops before clearing stage
    get maxLoops()
    {

        return this.world.loopsToClearStage;
    }


    speed = 10;
    deltaX = 0;


    // GameObject implementation

    x = 0;
    y = 0;

    get width()
    {
        return this.world.width;
    }

    get height()
    {
        return this.world.height;
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


    reset()
    {
        this.enemies = this.deltaX = this.loops = 0;
        this.loopIncreased = false;
        this.world.objects.length = 0;
    }

    draw()
    {

        this.generateEnemies();

        const { decor, ctx } = this;

        if (!this.world.hero.isDead)
        {
            this.deltaX += this.speed;
        }

        if (this.deltaX >= this.width)
        {
            this.deltaX = 0;
            this.loops++;
            this.loopIncreased = true;


            if (this.loops >= this.maxLoops)
            {
                SoundEffect.LEVEL.play();
                this.world.pause();
                this.world.trigger('stagecleared');
            }


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



    generateEnemy()
    {
        if (this.enemies < this.maxEnemies)
        {
            this.world.objects.push(new Demon(this.world));
            this.world.objects.push(new Loot(this.world));
        }

    }


    generateEnemies()
    {
        if (this.enemies === 0 || this.loopIncreased)
        {
            if (this.loopIncreased)
            {
                this.loopIncreased = false;
            }

            if (this.enemies < this.maxEnemies)
            {

                this.generateEnemy();
                this.enemies++;
            }
        }
    }


    constructor(world)
    {
        super(world);
        world
            .on('started resume', () =>
            {
                SoundTrack.pauseAll();
                this.soundtrack.play();
            })
            .on('paused stagecleared', () =>
            {
                this.soundtrack.pause();
            });
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

let api = {

    set(elem, attr, value)
    {
        if (nullUndef.includes(value))
        {
            this.remove(elem, attr);
        }

        getAttrs(attr).forEach(x =>
        {
            elem.dataset[x] = encode(value);
        });
    },
    get(elem, attr, fallback = null)
    {
        let result = getAttrs(attr).map(x => decode(elem.dataset[x])).map(x => !nullUndef.includes(x) ? x : fallback);

        if (result.length <= 1)
        {
            return result[0] ?? fallback;
        }

        return result;
    },
    remove(elem, attr)
    {
        getAttrs(attr).forEach(x => delete elem.dataset[x]);
    }


}, undef, nullUndef = [null, undef];



function getAttrs(attr)
{
    let result = [];

    if (isString(attr))
    {
        if (attr.startsWith('data-'))
        {
            attr = attr.slice(5);
        }
        result = [toCamel(attr)];
    }


    if (isArray(attr))
    {
        result = result.concat(...attr.map(x => getAttrs(x)));
    }

    return result;
}




function getElem(elem)
{
    if (hasDataset(elem))
    {
        return [elem];
    }

    if (elem instanceof NodeList)
    {
        return [...elem];
    }

    if (isArray(elem))
    {
        return elem.filter(x => hasDataset(x));
    }

    return isValidSelector(elem) ? [...document.querySelectorAll(elem)] : [];
}

function hasDataset(elem)
{
    return elem instanceof Object && elem.dataset instanceof DOMStringMap;
}





/**
 * data-attribute reader/setter
 * @param {Node|NodeList|String} elem 
 * @param {String} attr 
 * @param {Any} [value]
 */
function dataset(elem, attr, value)
{

    elem = getElem(elem);


    function get(attr, fallback = null)
    {

        let x = elem[0];
        if (hasDataset(x))
        {
            return api.get(x, attr, fallback);
        }

        return fallback;
    }


    function set(attr, value)
    {
        if (isPlainObject(attr))
        {

            for (let key in attr)
            {
                set(key, attr[key]);
            }
        }
        else
        {
            elem.forEach(x => api.set(x, attr, value));
        }

        return $this;

    }


    function remove(attr)
    {
        elem.forEach(x => api.remove(x, attr));
        return $this;
    }


    const $this = { get, set, remove };

    switch (arguments.length)
    {
        case 2:
            return get(attr);

        case 3:
            return set(attr, value);

    }

    return $this;

}

let init = false;


class GameWorld
{


    element;
    paused = true;
    timeout = null;

    score = 0;

    // ~30 secs
    loopsToClearStage = 10;

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

        EventManager.mixin(this, false);

        this.element = element;
        this.chrono = new Chronometer(false);
        this.displayScore = element.querySelector('#score');
        this.displayTime = element.querySelector('#time');
        this.displayHP = element.querySelector('#lives');
        this.canvas = element.querySelector('canvas');



    }


    destroy()
    {
        this.pause();
        init = false;

        this.objects.forEach(obj => obj.destroy());

        requestAnimationFrame(() => this.clearScreen());

    }


    /**
     * Destroy a game object and prevent it from being drawn
     */
    destroyObject(gameobject)
    {
        if (gameobject instanceof GameObject)
        {

            let index = this.objects.indexOf(gameobject);
            if (index > -1)
            {
                gameobject.destroy();
                this.objects.splice(index, 1);
            }

        }
    }


    init()
    {
        if (!init)
        {
            this.stage = new Stage(this);
            this.hero = new Hiro(this);
            this.objects.length = 0;
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


        const { displayScore, displayTime, displayHP } = this;





        this.clearScreen();



        // draw first
        this.stage.draw();

        // draw other objects (enemies)
        this.objects.forEach(obj => obj.draw());

        // draw last
        this.hero.draw();

        // this is generated after as score can change when drawing
        displayScore.innerHTML = this.score;
        displayTime.innerHTML = this.time;

        dataset(displayHP, 'lives', this.hero.hp);


        this.timeout = setTimeout(() =>
        {
            requestAnimationFrame(() => this.draw());
        }, 16); // ~60 fps
    }
}

/**
 * SCSS Style
 */

const
    menu = document.querySelector('.start-menu'),
    death = document.querySelector('.death-container'),
    levelup = document.querySelector('.level'),
    victory = document.querySelector('.victory'),
    pause = document.querySelector('.pause'),
    credits = document.querySelector('.credits');



// init game engine

let world;

// listen to keyboard events


addEventListener('keydown', e =>
{

    const { key } = e;

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
            SoundEffect.JUMP.play();
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

    if (!world)
    {
        return;
    }
    if (world.paused)
    {
        return;
    }

    if (target.closest('#game') && !world.hero.isAttacking)
    {
        world.hero.isAttacking = true;
    }


});





menu.addEventListener('click', e =>
{

    const { target } = e;
    if (target.closest('.start-menu-btn'))
    {
        world = new GameWorld({
            element: document.querySelector('#game')
        });


        world.on('paused', () =>
        {
            pause.hidden = null;
        }).on('resume started', () =>
        {
            pause.hidden = true;
        }).on('stagecleared', () =>
        {
            pause.hidden = true;
            if (world.stage.stage === 8)
            {
                victory.hidden = true;
            }
            else
            {
                levelup.hidden = null;
                levelup.addEventListener("click", () =>
                {
                    levelup.hidden = true;
                    world.stage.level++;
                }, { once: true });

                setTimeout(() =>
                {
                    levelup.click();
                }, 3000);

            }


        }).on('dead', () =>
        {

            death.querySelector('.score-span').innerHTML = document.querySelector('#score').innerHTML;
            death.querySelector('.time-span').innerHTML = document.querySelector('#time').innerHTML;
            pause.hidden = true;
            death.hidden = null;

        }).on('levelchange', () =>
        {


            const { hero, score } = world;

            while (hero.hp < hero.maxHP)
            {
                if (score >= 1000)
                {
                    world.score -= 1000;
                    hero.hp++;
                } else
                {
                    break;
                }
            }

            world.resume();


        });


        menu.hidden = true;

        world.init();



    } else if (target.closest('.start-menu-credit'))
    {
        credits.hidden = null;
    }

});


credits.addEventListener("click", () =>
{
    credits.hidden = true;
});


pause.addEventListener("click", ({ target }) =>
{
    if (target.closest('button'))
    {
        world.resume();

    }
});

death.addEventListener("click", ({ target }) =>
{
    if (target.closest(".retry"))
    {

        death.hidden = true;
        world.destroy();
        menu.hidden = null;


    }
});

victory.addEventListener("click", () =>
{
    victory.hidden = true;
    world?.destroy();
    menu.hidden = null;
});
//# sourceMappingURL=main.js.map
