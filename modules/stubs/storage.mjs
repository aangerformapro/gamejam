

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