import { BackedEnum, createElement, getClass, getUrl, isElement, isFunction, noop } from "../../modules/utils/utils.mjs";
import LocalStore from './../../modules/stores/webstore';
import { SOUNDS } from "./constants";





const listeners = new Set(), loaded = new Set();

let audioloading = 0;


export function onAudioLoaded(fn)
{

    if (isFunction(fn))
    {
        listeners.add(fn);
    }

    return () =>
    {
        listeners.delete(fn);
    };

}




function onLoaded(el, fn)
{
    if (isFunction(fn))
    {

        if (loaded.has(el))
        {
            fn(el);
        }
        else if (el.readyState >= 2)
        {
            loaded.add(el);
            fn(el);
        } else
        {
            el.addEventListener('canplay', () =>
            {
                loaded.add(el);
                fn(el);
            });
        }
    }
}

function createAudioLoader(fn = noop)
{

    let loading = 0;


    function decrement(value = 1)
    {
        increment(-1 * value);
    }

    function increment(value = 1)
    {
        loading += value;
        audioloading += value;
    }




    function check()
    {

        let complete;

        if (complete = (loading === 0))
        {
            fn();
        }

        return complete;
    }


    return (el, fn = noop) =>
    {

        increment();

        onLoaded(el, () =>
        {
            decrement();
            if (check())
            {
                fn();
                listeners.forEach(fn => fn());
            }
        });



    };

}



function playAudio(el, rewind = true)
{
    return new Promise((resolve, reject) =>
    {


        if (isElement(el))
        {

            onLoaded(el, () =>
            {
                if (rewind)
                {
                    el.currentTime = 0;
                }


                setTimeout(() =>
                {
                    resolve(el);
                }, (el.duration * 1000) + 20);

                if (el.paused && !el.muted)
                {
                    try
                    {
                        el.play();
                    } catch (err)
                    {

                    }
                }
            });

        } else
        {
            reject(new TypeError("not an element"));
        }


    });
}



export const muted = LocalStore.hook('muted', false);



const
    EXT = '.ogg',
    players = new Map(),
    target = document.querySelector('#audioplayers');




class AudioEnum extends BackedEnum
{
    constructor(value)
    {
        super(value);
        this.load();
    }

    static pauseAll()
    {
        this.cases().forEach(x => x.pause());
    }

    get url()
    {
        throw new Error(getClass(this) + '.url not implemented.');
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
        return playAudio(this.player);
    }


    resume()
    {
        return playAudio(this.player, false);
    }


    pause()
    {
        this.player?.pause();
    }

    destroy()
    {
        if (this.player)
        {
            this.pause();
            target.removeChild(this.player);
            players.delete(this);
        }

    }


    load()
    {

        if (!this.player)
        {

            const elem = createElement('audio', {
                src: this.url
            });


            target.appendChild(elem);
            this.player = elem;
        }
    }
}



export class SoundTrack extends AudioEnum
{

    static Stage1 = new SoundTrack(1);
    static Stage2 = new SoundTrack(2);
    static Stage3 = new SoundTrack(3);
    static Stage4 = new SoundTrack(4);
    static Stage5 = new SoundTrack(5);
    static Stage6 = new SoundTrack(6);
    static Stage7 = new SoundTrack(7);
    static Stage8 = new SoundTrack(8);



    get url()
    {
        return getUrl(SOUNDS + '/soundtrack/' + this.value + EXT);
    }


}


export class SoundEffect extends AudioEnum
{


    static DEATH = new SoundEffect('death');
    static DROP = new SoundEffect('drop');
    static HIT = new SoundEffect('hit');
    static JUMP = new SoundEffect('jump');
    static LEVEL = new SoundEffect('level');
    static SLASH = new SoundEffect('slash');
    static BEHEADING = new SoundEffect('beheading');


    get url()
    {
        return getUrl(SOUNDS + '/effects/' + this.value + EXT);
    }

}






