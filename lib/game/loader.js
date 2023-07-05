import { noop } from "../../modules/utils/utils.mjs";


export let loading = 0;

const listeners = new Set();


export function onLoaded(fn)
{

    if (isFunction(fn))
    {
        listeners.add(fn);
        return () =>
        {
            listeners.delete(fn);
        };
    }
}


export default function createLoader(fn = noop)
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