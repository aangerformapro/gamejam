import { BackedEnum, getClass, isFunction, isNull, isPlainObject, isUndef, noop, promisify } from "../utils/utils.mjs";




/**
 * Private properties
 */
const
    SEP = ':',
    _prefixes = new Map(),
    _hooks = new Map(),
    _queue = [];


export class DataStoreType extends BackedEnum
{
    static SYNC = new DataStoreType('sync');
    static ASYNC = new DataStoreType('async');
}


function safeNotEqual(value, newValue)
{
    return value != value ? newValue == newValue : value !== newValue || ((value && typeof value === 'object') || typeof value === 'function');
}


export function GetDataStoreHook(
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




export class DataStore
{

    get type()
    {
        return DataStoreType.SYNC;
    }

    constructor(prefix = '')
    {

        if (prefix && !prefix.endsWith(SEP))
        {
            prefix += SEP;
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


export default DataStore;



const
    // contains the hook
    Nested = new Map();


export class NestedStore extends DataStore
{

    get store()
    {
        return Nested.get(this);
    }


    get keys()
    {
        return Object.keys(this.hook);
    }


    constructor(/** @type {DataStore} */datastore, /** @type {String} */ key)
    {
        super();
        Nested.set(this, datastore.hook(key, {}));
    }


    getItem(/** @type {string} */name, defaultValue = null)
    {
        let obj = this.store.get();

        if (!isPlainObject(obj))
        {
            return super.getItem(name, defaultValue);
        }

        return super.getItem(name, obj[name] ?? defaultValue);
    }

    setItem(/** @type {string} */name, value)
    {

        this.store.update(obj =>
        {

            if (!isPlainObject(obj))
            {
                obj = {};
            }

            if (value === null)
            {
                delete obj[name];
            }
            else
            {
                obj[name] = value;
            }

            return obj;
        });

        return value;
    }




}



