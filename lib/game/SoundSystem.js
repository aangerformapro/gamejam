import { BackedEnum, createElement, getUrl, isElement } from "../../modules/utils/utils.mjs";
import LocalStore from './../../modules/stores/webstore';
import { SOUNDS } from "./constants";



export const muted = LocalStore.hook('muted', false);



const SOUNDTRACKS = [...Array(8)].map((_, n) => SOUNDS + '/soundtrack/' + (n + 1) + '.ogg');


const EXT = '.ogg', players = new Map(), target = document.querySelector('#audioplayers');

export class SoundTrack extends BackedEnum
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


export class SoundEffect extends BackedEnum
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

